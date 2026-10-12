<?php

namespace App\Services\Admin;

use App\Enums\AdminAccessStatus;
use App\Enums\UserRole;
use App\Models\AdminAccessRequest;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class AdminAccessRequestService
{
    /**
     * @param  array{first_name: string, last_name: string, email: string, message?: string|null}  $input
     */
    public function store(?User $user, array $input): AdminAccessRequest
    {
        if ($user?->role === UserRole::ADMIN) {
            throw ValidationException::withMessages([
                'email' => 'This account is already an admin.',
            ]);
        }

        $email = strtolower($user?->email ?? $input['email']);

        $alreadyWaiting = AdminAccessRequest::query()
            ->where('email', $email)
            ->where('status', AdminAccessStatus::PENDING)
            ->exists();

        if ($alreadyWaiting) {
            throw ValidationException::withMessages([
                'email' => 'A request for this email is already waiting.',
            ]);
        }

        return AdminAccessRequest::query()->create([
            'user_id' => $user?->id,
            'first_name' => $user?->first_name ?? $input['first_name'],
            'last_name' => $user?->last_name ?? $input['last_name'],
            'email' => $email,
            'message' => $input['message'] ?? null,
            'status' => AdminAccessStatus::PENDING,
        ]);
    }

    public function latestForEmail(string $email): ?AdminAccessRequest
    {
        return AdminAccessRequest::query()
            ->where('email', strtolower($email))
            ->latest()
            ->first();
    }

    /**
     * @return Collection<int, AdminAccessRequest>
     */
    public function pending(): Collection
    {
        return AdminAccessRequest::query()
            ->where('status', AdminAccessStatus::PENDING)
            ->latest()
            ->get();
    }

    public function approve(AdminAccessRequest $request): AdminAccessRequest
    {
        $this->ensurePending($request);

        $account = $request->user
            ?? User::query()->where('email', $request->email)->first();

        if (! $account) {
            throw ValidationException::withMessages([
                'request' => 'This person needs a HealthHub account before they can be an admin.',
            ]);
        }

        if ($account->role !== UserRole::ADMIN) {
            $account->forceFill(['role' => UserRole::ADMIN])->save();
        }

        $request->forceFill([
            'user_id' => $account->id,
            'status' => AdminAccessStatus::APPROVED,
        ])->save();

        return $request->refresh();
    }

    public function decline(AdminAccessRequest $request): AdminAccessRequest
    {
        $this->ensurePending($request);

        $request->forceFill(['status' => AdminAccessStatus::REJECTED])->save();

        return $request->refresh();
    }

    private function ensurePending(AdminAccessRequest $request): void
    {
        if ($request->status !== AdminAccessStatus::PENDING) {
            throw ValidationException::withMessages([
                'request' => 'This request has already been decided.',
            ]);
        }
    }
}
