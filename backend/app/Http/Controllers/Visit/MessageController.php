<?php

namespace App\Http\Controllers\Visit;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ConversationMessage;
use App\Models\Document;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class MessageController extends Controller
{
    public function threads(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role === UserRole::HCP) {
            return response()->json(['data' => $this->bookedThreads($user, 'hcp_user_id', 'patient_user_id', 'patient')]);
        }

        if ($user->role === UserRole::PATIENT) {
            return response()->json(['data' => $this->bookedThreads($user, 'patient_user_id', 'hcp_user_id', 'clinician')]);
        }

        $userId = $user->id;
        $messages = ConversationMessage::query()
            ->where('sender_id', $userId)
            ->orWhere('recipient_id', $userId)
            ->latest()
            ->get();

        $partnerIds = $messages
            ->flatMap(fn (ConversationMessage $message) => [$message->sender_id, $message->recipient_id])
            ->reject(fn (int $id) => $id === $userId)
            ->unique()
            ->values();

        $partners = User::query()->whereIn('id', $partnerIds)->get()->keyBy('id');

        $threads = $partnerIds->map(function (int $partnerId) use ($messages, $partners) {
            $latest = $messages->first(
                fn (ConversationMessage $message) => $message->sender_id === $partnerId || $message->recipient_id === $partnerId,
            );
            $partner = $partners->get($partnerId);

            return [
                'user_id' => $partnerId,
                'name' => trim(($partner->first_name ?? '').' '.($partner->last_name ?? '')),
                'preview' => $latest?->body,
                'sent_at' => $latest?->created_at?->toIso8601String(),
            ];
        })->values();

        return response()->json(['data' => $threads]);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->assertCanMessage($request->user(), $user);

        $messages = ConversationMessage::query()
            ->where(function ($query) use ($request, $user) {
                $query->where('sender_id', $request->user()->id)->where('recipient_id', $user->id);
            })
            ->orWhere(function ($query) use ($request, $user) {
                $query->where('sender_id', $user->id)->where('recipient_id', $request->user()->id);
            })
            ->orderBy('id')
            ->get();

        $visits = Appointment::query()
            ->with('results')
            ->where(function ($query) use ($request, $user) {
                $query->where(function ($pair) use ($request, $user) {
                    $pair->where('patient_user_id', $user->id)->where('hcp_user_id', $request->user()->id);
                })->orWhere(function ($pair) use ($request, $user) {
                    $pair->where('patient_user_id', $request->user()->id)->where('hcp_user_id', $user->id);
                });
            })
            ->where('status', '!=', AppointmentStatus::CANCELLED->value)
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => trim("{$user->first_name} {$user->last_name}"),
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
                'visits' => $visits->map(fn (Appointment $visit) => $this->visitPayload($visit))->values(),
                'messages' => $messages->map(fn (ConversationMessage $message) => [
                    'id' => $message->id,
                    'body' => $message->body,
                    'mine' => $message->sender_id === $request->user()->id,
                    'sent_at' => $message->created_at?->toIso8601String(),
                ])->values(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $recipient = User::query()->findOrFail($data['recipient_id']);
        $this->assertCanMessage($request->user(), $recipient);

        $message = ConversationMessage::query()->create([
            'sender_id' => $request->user()->id,
            'recipient_id' => $recipient->id,
            'body' => trim($data['body']),
        ]);

        return response()->json([
            'data' => [
                'id' => $message->id,
                'body' => $message->body,
                'mine' => true,
                'sent_at' => $message->created_at?->toIso8601String(),
            ],
        ], 201);
    }

    private function assertCanMessage(User $sender, User $recipient): void
    {
        abort_if($sender->id === $recipient->id, 422, 'Choose someone else.');

        $shared = Appointment::query()
            ->where(function ($query) use ($sender, $recipient) {
                $query->where('patient_user_id', $sender->id)->where('hcp_user_id', $recipient->id);
            })
            ->orWhere(function ($query) use ($sender, $recipient) {
                $query->where('patient_user_id', $recipient->id)->where('hcp_user_id', $sender->id);
            })
            ->exists();

        abort_unless($shared, 403, 'Messages stay between a patient and a clinician who share a visit.');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function bookedThreads(User $user, string $ownColumn, string $partnerColumn, string $partnerRelation): array
    {
        $appointments = Appointment::query()
            ->with($partnerRelation)
            ->where($ownColumn, $user->id)
            ->where('status', '!=', AppointmentStatus::CANCELLED->value)
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get()
            ->groupBy($partnerColumn);

        return $appointments
            ->map(function (Collection $visits) use ($partnerRelation): ?array {
                /** @var Appointment|null $first */
                $first = $visits->sortBy('created_at')->first();
                $partner = $first?->{$partnerRelation};
                if (! $first instanceof Appointment || ! $partner instanceof User) {
                    return null;
                }
                $next = $this->upcoming($visits);

                return [
                    'user_id' => $partner->id,
                    'name' => trim("{$partner->first_name} {$partner->last_name}"),
                    'email' => $partner->email,
                    'phone' => $partner->phone,
                    'preview' => $next?->reason ?: $first->reason,
                    'sent_at' => $first->created_at?->toIso8601String(),
                    'first' => $this->visitPayload($first),
                    'next' => $next ? $this->visitPayload($next) : null,
                ];
            })
            ->filter()
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Appointment>  $visits
     */
    private function upcoming(Collection $visits): ?Appointment
    {
        $start = now()->startOfDay();

        return $visits->first(function (Appointment $visit) use ($start): bool {
            if (! in_array($visit->status, [AppointmentStatus::BOOKED, AppointmentStatus::POSTPONED], true)) {
                return false;
            }

            return $this->moment($visit)->greaterThanOrEqualTo($start);
        });
    }

    private function moment(Appointment $visit): Carbon
    {
        return Carbon::parse($visit->appointment_date->toDateString().' '.$this->clock($visit->start_time));
    }

    private function clock(mixed $time): string
    {
        return substr((string) $time, 0, 5);
    }

    /**
     * @return array<string, mixed>
     */
    private function visitPayload(Appointment $visit): array
    {
        return [
            'id' => $visit->id,
            'date' => $visit->appointment_date->toDateString(),
            'time' => $this->clock($visit->start_time),
            'reason' => $visit->reason,
            'status' => $visit->status->value,
            'summary' => $visit->summary,
            'created_at' => $visit->created_at?->toIso8601String(),
            'results' => $visit->relationLoaded('results')
                ? $visit->results->map(fn (Document $document) => [
                    'id' => $document->id,
                    'title' => $document->title,
                    'file_name' => $document->original_file_name,
                ])->values()
                : [],
        ];
    }
}
