<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPatientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(UserStatus::class)],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $patients = User::query()
            ->where('role', UserRole::PATIENT->value)
            ->with('patientProfile')
            ->withCount('patientAppointments')
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($validated['search'] ?? null, function ($query, $search) {
                $query->where(function ($nested) use ($search) {
                    $nested->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($patients);
    }

    public function show(int $patient): JsonResponse
    {
        return response()->json(['data' => User::query()
            ->whereKey($patient)
            ->where('role', UserRole::PATIENT->value)
            ->with('patientProfile')
            ->withCount('patientAppointments')
            ->firstOrFail()]);
    }

    public function status(Request $request, int $patient): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(UserStatus::class)],
        ]);
        $user = User::query()
            ->whereKey($patient)
            ->where('role', UserRole::PATIENT->value)
            ->firstOrFail();
        $user->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Patient account status updated successfully.',
            'data' => $user->fresh(),
        ]);
    }
}
