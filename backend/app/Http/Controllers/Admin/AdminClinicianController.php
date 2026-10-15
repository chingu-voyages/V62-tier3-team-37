<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminClinicianController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'verification_status' => ['nullable', Rule::enum(VerificationStatus::class)],
            'account_status' => ['nullable', Rule::enum(UserStatus::class)],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $clinicians = User::query()
            ->where('role', UserRole::HCP->value)
            ->with(['hcpProfile', 'hcpVerification'])
            ->when($validated['account_status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['verification_status'] ?? null, fn ($query, $status) => $query
                ->whereHas('hcpVerification', fn ($verification) => $verification->where('status', $status)))
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($clinicians);
    }

    public function show(int $hcp): JsonResponse
    {
        $clinician = User::query()
            ->whereKey($hcp)
            ->where('role', UserRole::HCP->value)
            ->with(['hcpProfile', 'hcpVerification', 'documents'])
            ->withCount('hcpAppointments')
            ->firstOrFail();

        return response()->json(['data' => $clinician]);
    }

    public function verification(Request $request, int $hcp): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in([
                VerificationStatus::VERIFIED->value,
                VerificationStatus::REJECTED->value,
            ])],
            'reason' => [
                Rule::requiredIf($request->input('status') === VerificationStatus::REJECTED->value),
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $clinician = $this->clinician($hcp);
        $verification = $clinician->hcpVerification()->firstOrFail();
        $verification->update([
            'status' => $validated['status'],
            'reviewed_at' => now(),
            'rejection_reason' => $validated['status'] === VerificationStatus::REJECTED->value
                ? $validated['reason']
                : null,
        ]);

        return response()->json([
            'message' => 'Clinician verification updated successfully.',
            'data' => $clinician->load(['hcpProfile', 'hcpVerification']),
        ]);
    }

    public function status(Request $request, int $hcp): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(UserStatus::class)],
        ]);
        $clinician = $this->clinician($hcp);
        $clinician->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Clinician account status updated successfully.',
            'data' => $clinician->fresh(),
        ]);
    }

    private function clinician(int $hcp): User
    {
        return User::query()
            ->whereKey($hcp)
            ->where('role', UserRole::HCP->value)
            ->firstOrFail();
    }
}
