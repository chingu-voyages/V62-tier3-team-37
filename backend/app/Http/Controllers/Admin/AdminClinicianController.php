<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Admin\AdminClinicianService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminClinicianController extends Controller
{
    public function index(Request $request, AdminClinicianService $clinicians): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json([
            'data' => $clinicians->list()
                ->map(fn (User $user) => $clinicians->summary($user))
                ->values(),
        ]);
    }

    public function show(Request $request, User $user, AdminClinicianService $clinicians): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json([
            'data' => $clinicians->detail($clinicians->find($user)),
        ]);
    }

    public function block(Request $request, User $user, AdminClinicianService $clinicians): JsonResponse
    {
        $this->requireAdmin($request);
        $updated = $clinicians->block($user);

        return response()->json([
            'message' => 'This clinician is blocked.',
            'data' => $clinicians->detail($updated),
        ]);
    }

    public function unblock(Request $request, User $user, AdminClinicianService $clinicians): JsonResponse
    {
        $this->requireAdmin($request);
        $updated = $clinicians->unblock($user);

        return response()->json([
            'message' => 'This clinician can sign in again.',
            'data' => $clinicians->detail($updated),
        ]);
    }

    public function decide(Request $request, User $user, AdminClinicianService $clinicians): JsonResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'decision' => ['required', Rule::in([
                VerificationStatus::VERIFIED->value,
                VerificationStatus::REJECTED->value,
            ])],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = $clinicians->decide(
            $user,
            $validated['decision'],
            $validated['reason'] ?? null,
        );

        return response()->json([
            'message' => $validated['decision'] === VerificationStatus::VERIFIED->value
                ? 'This clinician is confirmed.'
                : 'This clinician was rejected.',
            'data' => $clinicians->detail($updated),
        ]);
    }

    private function requireAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::ADMIN) {
            abort(403);
        }
    }
}
