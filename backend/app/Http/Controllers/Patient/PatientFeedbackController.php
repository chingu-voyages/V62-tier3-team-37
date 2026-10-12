<?php

namespace App\Http\Controllers\Patient;

use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\HcpReport;
use App\Models\HcpReview;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PatientFeedbackController extends Controller
{
    public function clinicians(Request $request): JsonResponse
    {
        $this->ensurePatient($request);

        $clinicians = User::query()
            ->where('role', UserRole::HCP)
            ->where('status', UserStatus::ACTIVE)
            ->whereHas('hcpVerification', function ($query) {
                $query->where('status', VerificationStatus::VERIFIED);
            })
            ->with('hcpProfile')
            ->orderBy('last_name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'specialty' => $user->hcpProfile?->specialty?->value,
            ])
            ->values();

        return response()->json(['data' => $clinicians]);
    }

    public function review(Request $request, User $user): JsonResponse
    {
        $patient = $this->ensurePatient($request);
        $this->ensureReviewableClinician($user);

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $review = HcpReview::query()->updateOrCreate(
            [
                'hcp_user_id' => $user->id,
                'patient_user_id' => $patient->id,
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ],
        );

        return response()->json([
            'message' => 'Your review was saved.',
            'data' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
            ],
        ]);
    }

    public function report(Request $request, User $user): JsonResponse
    {
        $patient = $this->ensurePatient($request);
        $this->ensureReviewableClinician($user);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:120'],
            'details' => ['nullable', 'string', 'max:1000'],
        ]);

        $report = HcpReport::query()->create([
            'hcp_user_id' => $user->id,
            'reporter_user_id' => $patient->id,
            'reason' => $validated['reason'],
            'details' => $validated['details'] ?? null,
            'status' => ReportStatus::OPEN,
        ]);

        return response()->json([
            'message' => 'Your report was sent to the admin team.',
            'data' => [
                'id' => $report->id,
                'reason' => $report->reason,
            ],
        ], 201);
    }

    private function ensurePatient(Request $request): User
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::PATIENT) {
            abort(403);
        }

        return $user;
    }

    private function ensureReviewableClinician(User $user): void
    {
        if ($user->role !== UserRole::HCP || $user->status !== UserStatus::ACTIVE) {
            throw ValidationException::withMessages([
                'clinician' => 'This clinician cannot receive feedback.',
            ]);
        }

        $verified = $user->hcpVerification?->status === VerificationStatus::VERIFIED;

        if (! $verified) {
            throw ValidationException::withMessages([
                'clinician' => 'This clinician cannot receive feedback.',
            ]);
        }
    }
}
