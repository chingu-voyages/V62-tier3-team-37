<?php

namespace Database\Seeders;

use App\Enums\BloodType;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\PatientProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds the signed-in patient used for manual booking tests.
 *
 * Booking endpoints sit behind `auth:sanctum` with a role and email-verification
 * gate, so a real test needs an existing patient - the freshly migrated database has
 * none. This account is already verified and active, which skips the OTP round trip
 * entirely and lands the tester straight on the booking screen.
 *
 * Two patients are seeded: the second one exists so the double-booking conflict (409)
 * can be reproduced without logging out and back in.
 */
class DemoPatientSeeder extends Seeder
{
    public const PASSWORD = 'Password1!';

    /**
     * @var list<array<string, mixed>>
     */
    private const PATIENTS = [
        [
            'email' => 'patient@example.com',
            'first_name' => 'Sara',
            'last_name' => 'Mansour',
            'birth_date' => '1997-05-18',
            'gender' => UserGender::FEMALE,
            'phone' => '+201000000201',
            'blood_type' => BloodType::O_POSITIVE,
            'height_cm' => 166,
            'weight_kg' => 61.5,
            'allergies' => ['Penicillin'],
        ],
        [
            'email' => 'patient2@example.com',
            'first_name' => 'Ahmed',
            'last_name' => 'Nabil',
            'birth_date' => '1993-09-27',
            'gender' => UserGender::MALE,
            'phone' => '+201000000202',
            'blood_type' => BloodType::A_POSITIVE,
            'height_cm' => 178,
            'weight_kg' => 84,
            'allergies' => [],
        ],
    ];

    public function run(): void
    {
        foreach (self::PATIENTS as $patient) {
            $this->seedPatient($patient);
        }
    }

    /**
     * @param  array<string, mixed>  $patient
     */
    private function seedPatient(array $patient): void
    {
        $email = (string) $patient['email'];

        $userData = [
            'first_name' => $patient['first_name'],
            'last_name' => $patient['last_name'],
            'birth_date' => $patient['birth_date'],
            'gender' => $patient['gender'],
            'email_verified_at' => now(),
            'password' => Hash::make(self::PASSWORD),
            'phone' => $patient['phone'],
            'role' => UserRole::PATIENT,
            'status' => UserStatus::ACTIVE,
            'terms_accepted' => true,
        ];

        $user = User::query()->where('email', $email)->first();

        if ($user) {
            $user->update($userData);
        } else {
            $user = User::factory()->create(['email' => $email, ...$userData]);
        }

        // There is no PatientProfileFactory in this codebase, so the same
        // `updateOrCreate` the profile service uses is reused here.
        PatientProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'blood_type' => $patient['blood_type'],
                'height_cm' => $patient['height_cm'],
                'weight_kg' => $patient['weight_kg'],
                'allergies' => $patient['allergies'],
            ]
        );
    }
}
