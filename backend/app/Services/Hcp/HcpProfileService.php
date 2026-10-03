<?php

namespace App\Services\Hcp;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

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
