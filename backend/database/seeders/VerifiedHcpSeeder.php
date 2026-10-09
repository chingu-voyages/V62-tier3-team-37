<?php

namespace Database\Seeders;

use App\Enums\ConsultationType;
use App\Enums\DayOfWeek;
use App\Enums\LivenessStatus;
use App\Enums\Specialty;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds the patient-facing doctor directory with verified clinicians.
 *
 * The listing endpoint only returns HCPs whose verification is VERIFIED, so every
 * record here is created in that state. Re-running is safe: users are matched on
 * email and updated in place, and the related rows are rebuilt.
 *
 * The data is deliberately varied across specialty, city, area and insurance so
 * that every combination in the directory filters actually returns rows.
 */
class VerifiedHcpSeeder extends Seeder
{
    private const PASSWORD = 'Password1!';

    /**
     * One row per clinician. Kept as literal data rather than generated so the
     * seeded directory is reproducible and reviewable in a diff.
     */
    private const CLINICIANS = [
        ['Lina', 'Hassan', Specialty::CARDIOLOGY, 'Interventional Cardiology', 'Cairo', 'Maadi', 'Al-Nahdi Heart Center', 14, 500, '20 min', 4.8, 126, ['AXA', 'Allianz'], UserGender::FEMALE, ['Arabic', 'English', 'French']],
        ['Omar', 'Farid', Specialty::DERMATOLOGY, 'Cosmetic Dermatology', 'Cairo', 'Zamalek', 'Zamalek Skin Clinic', 8, 400, '15 min', 4.6, 89, ['BUPA', 'Cigna'], UserGender::MALE, ['Arabic', 'English']],
        ['Nadia', 'Karim', Specialty::GENERAL_MEDICINE, 'Family Medicine', 'Giza', 'Mohandeseen', 'Mohandeseen Family Clinic', 6, 300, '10 min', 4.7, 210, ['Medicare', 'AXA'], UserGender::FEMALE, ['Arabic', 'English']],
        ['Youssef', 'Adel', Specialty::PEDIATRICS, 'Neonatal Care', 'Alexandria', 'Downtown', 'Alexandria Children Hospital', 18, 350, '25 min', 4.5, 64, ['Allianz'], UserGender::MALE, ['Arabic', 'English', 'Italian']],
        ['Mariam', 'Sayed', Specialty::NEUROLOGY, 'Epileptology', 'Cairo', 'Heliopolis', 'Heliopolis Neuro Center', 11, 600, '30 min', 4.7, 143, ['AXA', 'BUPA', 'Cigna'], UserGender::FEMALE, ['Arabic', 'English', 'French']],
        ['Ahmed', 'Nabil', Specialty::ORTHOPEDICS, 'Joint Replacement', 'Cairo', 'Downtown', 'Downtown Orthopedic Institute', 16, 700, '40 min', 4.6, 98, ['Medicare', 'Allianz'], UserGender::MALE, ['Arabic', 'English']],
        ['Hala', 'Mostafa', Specialty::DERMATOLOGY, 'Dermatologic Surgery', 'Alexandria', 'Downtown', 'Alexandria Dermatology Center', 9, 420, '20 min', 4.4, 77, ['Cigna'], UserGender::FEMALE, ['Arabic', 'English']],
        ['Karim', 'Shawky', Specialty::CARDIOLOGY, 'Echocardiography', 'Cairo', 'Zamalek', 'Nile Cardiology Clinic', 12, 550, '25 min', 4.9, 187, ['AXA', 'Allianz', 'BUPA'], UserGender::MALE, ['Arabic', 'English', 'German']],
        ['Dalia', 'Fouad', Specialty::PSYCHIATRY, 'Child Psychiatry', 'Giza', 'Mohandeseen', 'Mohandeseen Mind Clinic', 7, 450, '35 min', 4.5, 61, ['Medicare'], UserGender::FEMALE, ['Arabic', 'English']],
        ['Amr', 'Salem', Specialty::GENERAL_MEDICINE, 'Emergency Medicine', 'Cairo', 'Heliopolis', 'Heliopolis Polyclinic', 4, 250, '10 min', 4.3, 305, ['Medicare', 'AXA', 'Allianz'], UserGender::MALE, ['Arabic', 'English']],
        ['Sara', 'Ibrahim', Specialty::PEDIATRICS, 'Pediatric Pulmonology', 'Cairo', 'Maadi', 'Maadi Kids Clinic', 10, 380, '20 min', 4.7, 132, ['BUPA', 'Cigna'], UserGender::FEMALE, ['Arabic', 'English', 'Spanish']],
        ['Tarek', 'Mansour', Specialty::NEUROLOGY, 'Stroke Medicine', 'Alexandria', 'Downtown', 'Alexandria Brain Center', 20, 750, '45 min', 4.8, 156, ['AXA', 'Allianz'], UserGender::MALE, ['Arabic', 'English']],
        ['Mona', 'Eid', Specialty::OPHTHALMOLOGY, 'Retina and Vitreous', 'Cairo', 'Downtown', 'Downtown Eye Institute', 13, 550, '25 min', 4.7, 118, ['Medicare', 'Cigna', 'BUPA'], UserGender::FEMALE, ['Arabic', 'English', 'French']],
        ['Mostafa', 'Hegazy', Specialty::RADIOLOGY, 'Interventional Radiology', 'Cairo', 'Heliopolis', 'Heliopolis Imaging Center', 15, 600, '30 min', 4.6, 94, ['AXA', 'Allianz'], UserGender::MALE, ['Arabic', 'English']],
        ['Aya', 'Ramzy', Specialty::ORTHOPEDICS, 'Sports Medicine', 'Giza', 'Mohandeseen', 'Mohandeseen Sports Clinic', 8, 500, '30 min', 4.5, 83, ['BUPA'], UserGender::FEMALE, ['Arabic', 'English']],
        ['Hussein', 'Barakat', Specialty::GENERAL_MEDICINE, 'Internal Medicine', 'Luxor', 'Downtown', 'Luxor Medical Center', 22, 400, '20 min', 4.9, 241, ['Medicare', 'AXA'], UserGender::MALE, ['Arabic', 'English']],
        ['Farida', 'Nasr', Specialty::PSYCHIATRY, 'General Psychiatry', 'Cairo', 'Maadi', 'Maadi Wellbeing Clinic', 5, 450, '40 min', 4.4, 52, ['Cigna', 'AXA'], UserGender::FEMALE, ['Arabic', 'English']],
        ['Sherif', 'Attia', Specialty::CARDIOLOGY, 'Preventive Cardiology', 'Aswan', 'Downtown', 'Aswan Heart Clinic', 17, 350, '15 min', 4.6, 73, ['Allianz'], UserGender::MALE, ['Arabic', 'English']],
        ['Nour', 'Halim', Specialty::DERMATOLOGY, 'Trichology', 'Cairo', 'Heliopolis', 'Heliopolis Hair Clinic', 6, 380, '20 min', 4.3, 47, ['AXA', 'Cigna'], UserGender::FEMALE, ['Arabic', 'English']],
        ['Walid', 'Zaki', Specialty::PEDIATRICS, 'Developmental Pediatrics', 'Alexandria', 'Heliopolis', 'Alexandria Growth Clinic', 11, 400, '25 min', 4.8, 108, ['Medicare', 'BUPA'], UserGender::MALE, ['Arabic', 'English', 'French']],
    ];

    public function run(): void
    {
        foreach (self::CLINICIANS as $index => $row) {
            $this->seedClinician($index, $row);
        }
    }

    /**
     * @param  array<int, mixed>  $row
     */
    private function seedClinician(int $index, array $row): void
    {
        [
            $firstName,
            $lastName,
            $specialty,
            $subSpecialty,
            $city,
            $area,
            $workplace,
            $years,
            $fees,
            $waitingTime,
            $rating,
            $reviewCount,
            $insurance,
            $gender,
            $languages,
        ] = $row;

        $email = 'hcp'.$index.'@example.com';

        $user = User::query()->where('email', $email)->first();

        $userData = [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'birth_date' => now()->subYears(28 + ($index * 2))->toDateString(),
            'gender' => $gender,
            'email_verified_at' => now(),
            'password' => Hash::make(self::PASSWORD),
            'phone' => '+2010'.str_pad((string) (10000000 + $index), 8, '0', STR_PAD_LEFT),
            'role' => UserRole::HCP,
            'status' => UserStatus::ACTIVE,
            'terms_accepted' => true,
        ];

        if ($user) {
            $user->update($userData);
        } else {
            $user = User::factory()->create(['email' => $email, ...$userData]);
        }

        $profileData = [
            'specialty' => $specialty,
            'years_of_experience' => $years,
            'medical_license_number' => 'ML-2026-'.str_pad((string) (100000 + $index), 6, '0', STR_PAD_LEFT),
            'license_issuing_authority' => 'Egyptian Medical Syndicate',
            'sub_specialty' => $subSpecialty,
            'workplace_name' => $workplace,
            'workplace_address' => (10 + $index).' Clinic Street, '.$area,
            'city' => $city,
            'area' => $area,
            'fees' => $fees,
            'currency' => 'EGP',
            'waiting_time' => $waitingTime,
            'rating' => $rating,
            'review_count' => $reviewCount,
            'insurance_accepted' => $insurance,
            'bio' => $subSpecialty.' at '.$workplace.', with '.$years.' years of practice in '.$city.'.',
            'languages' => $languages,
            'consultation_types' => [
                ConsultationType::IN_PERSON->value,
                ConsultationType::VIDEO->value,
            ],
        ];

        $profile = $user->hcpProfile;

        if ($profile) {
            $profile->update($profileData);
        } else {
            $profile = HcpProfile::factory()->for($user)->create($profileData);
        }

        $verificationData = [
            'liveness_status' => LivenessStatus::PASSED,
            'consent_accepted_at' => now()->subDays(30),
            'status' => VerificationStatus::VERIFIED,
            'submitted_at' => now()->subDays(30),
            'reviewed_at' => now()->subDays(28),
            'rejection_reason' => null,
        ];

        if ($user->hcpVerification) {
            $user->hcpVerification->update($verificationData);
        } else {
            HcpVerification::factory()->for($user)->create($verificationData);
        }

        $this->seedAvailability($profile, $index);
    }

    private function seedAvailability(HcpProfile $profile, int $index): void
    {
        $profile->availabilitySlots()->delete();

        // Two different working-week shapes so the calendar is not uniform.
        $morningOnly = $index % 4 === 0;
        $days = $morningOnly
            ? [DayOfWeek::SUNDAY, DayOfWeek::TUESDAY, DayOfWeek::THURSDAY]
            : [DayOfWeek::MONDAY, DayOfWeek::TUESDAY, DayOfWeek::WEDNESDAY, DayOfWeek::THURSDAY, DayOfWeek::FRIDAY];

        $windows = $morningOnly ? [['09:00', '13:00']] : [['09:00', '13:00'], ['16:00', '20:00']];

        foreach ($days as $day) {
            foreach ($windows as [$start, $end]) {
                HcpAvailabilitySlot::factory()->for($profile)->create([
                    'day_of_week' => $day,
                    'start_time' => $start,
                    'end_time' => $end,
                ]);
            }
        }
    }
}
