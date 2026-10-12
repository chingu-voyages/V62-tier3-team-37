<?php

namespace App\Http\Controllers\Patient;

use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\HcpProfile;
use App\Models\User;
use App\Services\Visit\AppointmentService;
use Carbon\Carbon;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PatientDirectoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::PATIENT, 403);

        $specialty = $request->string('specialty')->toString();
        $city = $request->string('city')->toString();
        $area = $request->string('area')->toString();
        $search = $request->string('search')->toString();

        $clinicians = User::query()
            ->where('role', UserRole::HCP)
            ->where('status', UserStatus::ACTIVE)
            ->whereHas('hcpVerification', fn ($query) => $query->where('status', VerificationStatus::VERIFIED))
            ->whereHas('hcpProfile')
            ->with(['hcpProfile.availabilitySlots', 'hcpVerification'])
            ->when($specialty !== '', fn ($query) => $query->whereHas(
                'hcpProfile',
                fn ($profile) => $profile->where('specialty', $specialty),
            ))
            ->when($city !== '', fn ($query) => $query->whereHas(
                'hcpProfile',
                fn ($profile) => $profile->where('city', 'like', '%'.$city.'%'),
            ))
            ->when($area !== '', fn ($query) => $query->whereHas(
                'hcpProfile',
                fn ($profile) => $profile->where('workplace_address', 'like', '%'.$area.'%'),
            ))
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('first_name', 'like', '%'.$search.'%')
                        ->orWhere('last_name', 'like', '%'.$search.'%');
                });
            })
            ->orderBy('last_name')
            ->limit(50)
            ->get();

        return response()->json([
            'data' => $clinicians->map(fn (User $clinician) => $this->card($clinician))->values(),
        ]);
    }

    public function places(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::PATIENT, 403);

        $profiles = HcpProfile::query()
            ->whereHas('user', function ($user) {
                $user->where('role', UserRole::HCP)
                    ->where('status', UserStatus::ACTIVE)
                    ->whereHas('hcpVerification', fn ($verification) => $verification->where('status', VerificationStatus::VERIFIED));
            })
            ->get(['city', 'workplace_address']);

        return response()->json([
            'data' => [
                'cities' => $profiles->pluck('city')->filter()->unique()->sort()->values(),
                'areas' => $profiles->pluck('workplace_address')->filter()->unique()->sort()->values(),
            ],
        ]);
    }

    public function featured(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::PATIENT, 403);

        $clinicians = User::query()
            ->where('role', UserRole::HCP)
            ->where('status', UserStatus::ACTIVE)
            ->whereHas('hcpVerification', fn ($query) => $query->where('status', VerificationStatus::VERIFIED))
            ->whereHas('hcpProfile')
            ->with(['hcpProfile.availabilitySlots', 'hcpVerification'])
            ->withAvg('reviewsReceived as rating', 'rating')
            ->withCount('reviewsReceived as review_count')
            ->orderBy('last_name')
            ->get();

        $wellRated = $clinicians
            ->filter(fn (User $clinician) => (int) $clinician->review_count >= 1 && (float) $clinician->rating >= 4)
            ->sortBy([
                fn (User $clinician) => -1 * (float) $clinician->rating,
                fn (User $clinician) => -1 * (int) $clinician->review_count,
            ])
            ->values();

        $clinicians = ($wellRated->isNotEmpty() ? $wellRated : $clinicians)->take(6)->values();

        return response()->json([
            'data' => $clinicians->map(fn (User $clinician) => $this->card($clinician))->values(),
        ]);
    }

    public function slots(Request $request, User $user, AppointmentService $appointments): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::PATIENT, 403);

        $from = Carbon::parse($request->input('from', now()->toDateString()))->startOfDay();
        $to = Carbon::parse($request->input('to', now()->addDays(28)->toDateString()))->startOfDay();

        return response()->json([
            'data' => $appointments->openSlots($user, $from, $to),
        ]);
    }

    private function card(User $clinician): array
    {
        $profile = $clinician->hcpProfile;
        $specialty = $profile?->specialty;

        return [
            'id' => $clinician->id,
            'full_name' => trim("{$clinician->first_name} {$clinician->last_name}"),
            'gender' => $clinician->gender?->value,
            'specialty' => $specialty?->value,
            'specialty_label' => $specialty ? $this->label($specialty) : null,
            'years_of_experience' => $profile?->years_of_experience,
            'city' => $profile?->city,
            'workplace_name' => $profile?->workplace_name,
            'workplace_address' => $profile?->workplace_address,
            'bio' => $profile?->bio,
            'languages' => $profile?->languages ?? [],
            'consultation_types' => $profile?->consultation_types ?? [],
            'profile_photo_url' => $this->publicUrl($clinician->profile_photo_path),
            'clinic_photo_url' => $this->publicUrl($profile?->clinic_photo_path),
            'open_days' => $profile?->availabilitySlots
                ->map(fn ($slot) => $slot->day_of_week->value)
                ->unique()
                ->values(),
            'rating' => $clinician->rating !== null ? round((float) $clinician->rating, 1) : null,
            'review_count' => (int) ($clinician->review_count ?? 0),
        ];
    }

    private function label(Specialty $specialty): string
    {
        return ucwords(strtolower(str_replace('_', ' ', $specialty->value)));
    }

    private function publicUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($path);
    }
}
