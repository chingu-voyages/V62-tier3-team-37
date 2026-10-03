<?php

namespace App\Services\Hcp;

use App\Enums\DayOfWeek;
use App\Enums\UserRole;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class HcpAvailabilityService
{
    public function replace(User $user, array $slots): User
    {
        $this->ensureHcp($user);

        return DB::transaction(function () use ($user, $slots): User {
            /** @var HcpProfile $profile */
            $profile = $user->hcpProfile()->firstOrFail();

            $profile->availabilitySlots()->delete();

            if ($slots !== []) {
                $profile->availabilitySlots()->createMany(
                    array_map(
                        fn (array $slot): array => [
                            'day_of_week' => DayOfWeek::fromShortName($slot['day']),
                            'start_time' => $slot['start_time'],
                            'end_time' => $slot['end_time'],
                        ],
                        $slots
                    )
                );
            }

            return $user->refresh();
        });
    }

    public function delete(User $user, HcpAvailabilitySlot $slot): User
    {
        $this->ensureHcp($user);

        /** @var HcpProfile $profile */
        $profile = $user->hcpProfile()->firstOrFail();

        if ($slot->hcp_profile_id !== $profile->id) {
            throw new AuthorizationException(
                'You are not authorized to delete this availability slot.'
            );
        }

        return DB::transaction(function () use ($user, $slot): User {
            $slot->delete();

            return $user->refresh();
        });
    }

    private function ensureHcp(User $user): void
    {
        if ($user->role !== UserRole::HCP) {
            throw new AuthorizationException(
                'Only healthcare Providers can update availability.'
            );
        }
    }
}
