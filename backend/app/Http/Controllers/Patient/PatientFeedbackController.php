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
    /**
     * Clinicians this patient is allowed to leave feedback for.
     *
     * Only verified, active HCPs. The same filter is re-applied in
     * `ensureReviewableClinician` when a review or report is posted: a clinician
     * who is rejected between the page render and the submit must not stay
     * reviewable, and the list alone is not a guard.
     */
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

    /**
     * Save this patient's review of a clinician.
     *
     * `updateOrCreate` on the (clinician, patient) pair, so a second review
     * replaces the first rather than stacking up: the unique index on those two
     * columns means a plain `create` would fail on the repeat.
     */
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

    /**
     * Report a clinician to the admin team.
     *
     * Reports are not idempotent - a patient may report the same clinician more
     * than once, with a different problem each time - so this creates a row
     * rather than updating one.
     */
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

    /**
     * The signed-in user must be a patient.
     *
     * The routes already sit behind `auth:sanctum`, so this is a role check
     * rather than an authentication one - an HCP posting to `/patient/...` is
     * authenticated but still in the wrong place.
     */
    private function ensurePatient(Request $request): User
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::PATIENT) {
            abort(403);
        }

        return $user;
    }

    /**
     * The clinician must still be an active, verified HCP at submit time.
     */
    private function ensureReviewableClinician(User $user): void
    {
        $reviewable = $user->role === UserRole::HCP
            && $user->status === UserStatus::ACTIVE
            && $user->hcpVerification?->status === VerificationStatus::VERIFIED;

        if (! $reviewable) {
            throw ValidationException::withMessages([
                'clinician' => 'This clinician cannot receive feedback.',
            ]);
        }
    }
}
