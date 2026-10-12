<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $patients = User::query()
            ->where('role', UserRole::PATIENT)
            ->latest()
            ->get()
            ->map(fn (User $user) => $this->summary($user))
            ->values();

        return response()->json(['data' => $patients]);
    }

    public function block(Request $request, User $user): JsonResponse
    {
        $this->requireAdmin($request);
        $this->ensurePatient($user);
        $user->forceFill(['status' => UserStatus::DISABLED])->save();

        return response()->json([
            'message' => 'This patient is blocked.',
            'data' => $this->summary($user),
        ]);
    }

    public function unblock(Request $request, User $user): JsonResponse
    {
        $this->requireAdmin($request);
        $this->ensurePatient($user);
        $user->forceFill(['status' => UserStatus::ACTIVE])->save();

        return response()->json([
            'message' => 'This patient can sign in again.',
            'data' => $this->summary($user),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(User $user): array
    {
        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status?->value ?? UserStatus::ACTIVE->value,
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }

    private function ensurePatient(User $user): void
    {
        if ($user->role !== UserRole::PATIENT) {
            abort(404);
        }
    }

    private function requireAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::ADMIN) {
            abort(403);
        }
    }
}
