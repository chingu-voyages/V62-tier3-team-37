<?php

namespace App\Services\Profile;

use App\Enums\UserRole;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ProfileService
{
    public function updatePatientProfile(
        User $user,
        array $data
    ): User {
        $this->ensureRole(
            $user,
            UserRole::PATIENT
        );

        return DB::transaction(function () use ($user, $data) {
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

            $patientData = Arr::only($data, [
                'blood_type',
                'height_cm',
                'weight_kg',
                'allergies',
            ]);

            if ($patientData !== []) {
                PatientProfile::updateOrCreate(
                    [
                        'user_id' => $user->id,
                    ],
                    $patientData
                );
            }

            return $user
                ->refresh()
                ->load('patientProfile');
        });
    }

    private function ensureRole(
        User $user,
        UserRole $requiredRole
    ): void {
        $role = $user->role instanceof \BackedEnum
            ? $user->role->value
            : $user->role;

        if ($role !== $requiredRole->value) {
            throw new AuthorizationException(
                'You are not authorized to update this profile.'
            );
        }
    }
}