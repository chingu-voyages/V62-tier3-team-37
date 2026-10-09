<?php

namespace App\Services\Hcp;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Writes clinician-editable profile fields.
 *
 * Both lists below are explicit allow-lists, never `fill()`. That is the second
 * line of defence behind `UpdateHcpProfileRequest`'s `prohibited` rules: even if a
 * request slipped past validation, `rating` and `review_count` are absent here
 * and so cannot be written. A clinician must never set their own rating.
 */
class HcpProfileService
{
    public function update(User $user, array $data): User
    {
        $this->ensureHcp($user);

        return DB::transaction(function () use ($user, $data): User {
            $userData = Arr::only($data, [
                'first_name',
                'last_name',
                'birth_date',
                'gender',
                'phone',
                'country',
            ]);

            if ($userData !== []) {
                $user->update($userData);
            }

            $profileData = Arr::only($data, [
                'sub_specialty',
                'workplace_name',
                'workplace_address',
                'city',
                'area',
                'fees',
                'currency',
                'waiting_time',
                'insurance_accepted',
                'bio',
                'languages',
                'consultation_types',
            ]);

            if ($profileData !== []) {
                $profile = $user->hcpProfile()->firstOrFail();

                $profile->update($profileData);
            }

            return $user->refresh();
        });
    }

    private function ensureHcp(User $user): void
    {
        if ($user->role !== UserRole::HCP) {
            throw new AuthorizationException(
                'Only healthcare Providers can update this profile.'
            );
        }
    }
}
