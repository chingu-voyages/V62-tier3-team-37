<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminAccessRequestStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\AdminAccessRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminAccessRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(AdminAccessRequestStatus::class)],
        ]);

        $requests = AdminAccessRequest::query()
            ->with(['reviewedBy:id,first_name,last_name,email', 'approvedUser:id,first_name,last_name,email'])
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($requests);
    }

    public function decide(
        Request $request,
        AdminAccessRequest $accessRequest
    ): JsonResponse {
        $validated = $request->validate([
            'status' => ['required', Rule::in([
                AdminAccessRequestStatus::APPROVED->value,
                AdminAccessRequestStatus::DECLINED->value,
            ])],
            'reason' => [
                Rule::requiredIf($request->input('status') === AdminAccessRequestStatus::DECLINED->value),
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        abort_if($accessRequest->status !== AdminAccessRequestStatus::PENDING, 409, 'This request was already reviewed.');

        $approvedUser = null;
        DB::transaction(function () use ($request, $accessRequest, $validated, &$approvedUser): void {
            if ($validated['status'] === AdminAccessRequestStatus::APPROVED->value) {
                $existingUser = User::query()->where('email', $accessRequest->email)->lockForUpdate()->first();
                abort_if($existingUser !== null && $existingUser->role !== UserRole::ADMIN, 409,
                    'This email already belongs to a non-admin account.');

                $approvedUser = $existingUser ?? User::query()->create([
                    'first_name' => $accessRequest->first_name,
                    'last_name' => $accessRequest->last_name,
                    'email' => $accessRequest->email,
                    'email_verified_at' => now(),
                    'password' => Hash::make(Str::random(64)),
                    'role' => UserRole::ADMIN,
                    'status' => UserStatus::ACTIVE,
                    'terms_accepted' => true,
                ]);
            }

            $accessRequest->update([
                'status' => $validated['status'],
                'reviewed_by_user_id' => $request->user()->id,
                'approved_user_id' => $approvedUser?->id,
                'decision_reason' => $validated['reason'] ?? null,
                'reviewed_at' => now(),
            ]);
        });

        $resetStatus = null;
        if ($approvedUser !== null) {
            $resetStatus = Password::sendResetLink(['email' => $approvedUser->email]);
        }

        return response()->json([
            'message' => 'Admin access request reviewed successfully.',
            'password_reset_status' => $resetStatus,
            'data' => $accessRequest->fresh(['reviewedBy', 'approvedUser']),
        ]);
    }
}
