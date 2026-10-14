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
 * Seeds four verified clinicians for manual booking tests.
 *
 * The listing endpoint only returns HCPs whose verification is VERIFIED, so every
 * record here is created in that state. Re-running is safe: users are matched on
 * email and updated in place, and the availability rows are rebuilt.
 *
 * Each clinician is given a deliberately *different* working week so a booking
 * test proves something specific:
 *
 *  - Lina    Mon-Fri, two windows  -> the common case, 8 slots a day
 *  - Omar    Sun/Tue/Thu, morning -> non-consecutive days, 4 slots
 *  - Nadia   Mon/Wed/Sat/Sun, eve -> evening-only hours
 *  - Mariam  Tue-Sat, 08:00-20:00 -> a long day, 12 slots
 *
 * Slots are derived by the backend from these windows in fixed 60-minute steps,
 * with the last slot only offered when it fits entirely before `end_time`. So
 * 09:00-13:00 yields 09:00, 10:00, 11:00 and 12:00.
 *
 * Note: the backend interprets these windows in `APP_TIMEZONE` (UTC), and the
 * frontend must submit the picked slot in that same zone.
 */
class VerifiedHcpSeeder extends Seeder
{
    public const PASSWORD = 'Password1!';

    /**
     * @var list<array<string, mixed>>
     */
    private const CLINICIANS = [
        [
            'email' => 'lina.hassan@example.com',
            'first_name' => 'Lina',
            'last_name' => 'Hassan',
            'birth_date' => '1990-03-14',
            'gender' => UserGender::FEMALE,
            'phone' => '+201000000101',
            'specialty' => Specialty::CARDIOLOGY,
            'sub_specialty' => 'Interventional Cardiology',
            'city' => 'Cairo',
            'area' => 'Maadi',
            'workplace_name' => 'Al-Nahdi Heart Center',
            'workplace_address' => '15 Clinic Street, Maadi',
            'years_of_experience' => 14,
            'fees' => 500,
            'currency' => 'EGP',
            'waiting_time' => '20 min',
            'rating' => 4.8,
            'review_count' => 126,
            'insurance_accepted' => ['AXA', 'Allianz', 'BUPA'],
            'languages' => ['Arabic', 'English', 'French'],
            // Two windows on five consecutive days: 8 slots a day.
            'availability' => [
                [DayOfWeek::MONDAY, '09:00', '13:00'],
                [DayOfWeek::MONDAY, '16:00', '20:00'],
                [DayOfWeek::TUESDAY, '09:00', '13:00'],
                [DayOfWeek::TUESDAY, '16:00', '20:00'],
                [DayOfWeek::WEDNESDAY, '09:00', '13:00'],
                [DayOfWeek::WEDNESDAY, '16:00', '20:00'],
                [DayOfWeek::THURSDAY, '09:00', '13:00'],
                [DayOfWeek::THURSDAY, '16:00', '20:00'],
                [DayOfWeek::FRIDAY, '09:00', '13:00'],
                [DayOfWeek::FRIDAY, '16:00', '20:00'],
            ],
        ],
        [
            'email' => 'omar.farid@example.com',
            'first_name' => 'Omar',
            'last_name' => 'Farid',
            'birth_date' => '1986-11-02',
            'gender' => UserGender::MALE,
            'phone' => '+201000000102',
            'specialty' => Specialty::DERMATOLOGY,
            'sub_specialty' => 'Cosmetic Dermatology',
            'city' => 'Cairo',
            'area' => 'Zamalek',
            'workplace_name' => 'Zamalek Skin Clinic',
            'workplace_address' => '4 Nile Corniche, Zamalek',
            'years_of_experience' => 8,
            'fees' => 400,
            'currency' => 'EGP',
            'waiting_time' => '15 min',
            'rating' => 4.6,
            'review_count' => 89,
            'insurance_accepted' => ['BUPA', 'Cigna'],
            'languages' => ['Arabic', 'English'],
            // Non-consecutive days, morning only: 4 slots.
            'availability' => [
                [DayOfWeek::SUNDAY, '09:00', '13:00'],
                [DayOfWeek::TUESDAY, '09:00', '13:00'],
                [DayOfWeek::THURSDAY, '09:00', '13:00'],
            ],
        ],
        [
            'email' => 'nadia.karim@example.com',
            'first_name' => 'Nadia',
            'last_name' => 'Karim',
            'birth_date' => '1994-06-21',
            'gender' => UserGender::FEMALE,
            'phone' => '+201000000103',
            'specialty' => Specialty::GENERAL_MEDICINE,
            'sub_specialty' => 'Family Medicine',
            'city' => 'Giza',
            'area' => 'Mohandeseen',
            'workplace_name' => 'Mohandeseen Family Clinic',
            'workplace_address' => '22 Pyramids Road, Mohandeseen',
            'years_of_experience' => 6,
            'fees' => 300,
            'currency' => 'EGP',
            'waiting_time' => '10 min',
            'rating' => 4.7,
            'review_count' => 210,
            'insurance_accepted' => ['Medicare', 'AXA'],
            'languages' => ['Arabic', 'English'],
            // Evening-only hours, four scattered days: 4 slots.
            'availability' => [
                [DayOfWeek::MONDAY, '18:00', '22:00'],
                [DayOfWeek::WEDNESDAY, '18:00', '22:00'],
                [DayOfWeek::SATURDAY, '18:00', '22:00'],
                [DayOfWeek::SUNDAY, '18:00', '22:00'],
            ],
        ],
        [
            'email' => 'mariam.sayed@example.com',
            'first_name' => 'Mariam',
            'last_name' => 'Sayed',
            'birth_date' => '1988-01-30',
            'gender' => UserGender::FEMALE,
            'phone' => '+201000000104',
            'specialty' => Specialty::NEUROLOGY,
            'sub_specialty' => 'Epileptology',
            'city' => 'Cairo',
            'area' => 'Heliopolis',
            'workplace_name' => 'Heliopolis Neuro Center',
            'workplace_address' => '9 Cleopatra Street, Heliopolis',
            'years_of_experience' => 11,
            'fees' => 600,
            'currency' => 'EGP',
            'waiting_time' => '30 min',
            'rating' => 4.7,
            'review_count' => 143,
            'insurance_accepted' => ['AXA', 'BUPA', 'Cigna'],
            'languages' => ['Arabic', 'English', 'French'],
            // One long window across five days: 12 slots.
            'availability' => [
                [DayOfWeek::TUESDAY, '08:00', '20:00'],
                [DayOfWeek::WEDNESDAY, '08:00', '20:00'],
                [DayOfWeek::THURSDAY, '08:00', '20:00'],
                [DayOfWeek::FRIDAY, '08:00', '20:00'],
                [DayOfWeek::SATURDAY, '08:00', '20:00'],
            ],
        ],
    ];

    public function run(): void
    {
        foreach (self::CLINICIANS as $index => $clinician) {
            $this->seedClinician($index, $clinician);
        }
    }

    /**
     * @param  array<string, mixed>  $clinician
     */
    private function seedClinician(int $index, array $clinician): void
    {
        $email = (string) $clinician['email'];

        $userData = [
            'first_name' => $clinician['first_name'],
            'last_name' => $clinician['last_name'],
            'birth_date' => $clinician['birth_date'],
            'gender' => $clinician['gender'],
            'email_verified_at' => now(),
            'password' => Hash::make(self::PASSWORD),
            'phone' => $clinician['phone'],
            'role' => UserRole::HCP,
            'status' => UserStatus::ACTIVE,
            'terms_accepted' => true,
        ];

        $user = User::query()->where('email', $email)->first();

        if ($user) {
            $user->update($userData);
        } else {
            $user = User::factory()->create(['email' => $email, ...$userData]);
        }

        $profileData = [
            'specialty' => $clinician['specialty'],
            'years_of_experience' => $clinician['years_of_experience'],
            'medical_license_number' => 'ML-2026-'.str_pad((string) (100100 + $index), 6, '0', STR_PAD_LEFT),
            'license_issuing_authority' => 'Egyptian Medical Syndicate',
            'sub_specialty' => $clinician['sub_specialty'],
            'workplace_name' => $clinician['workplace_name'],
            'workplace_address' => $clinician['workplace_address'],
            'city' => $clinician['city'],
            'area' => $clinician['area'],
            'fees' => $clinician['fees'],
            'currency' => $clinician['currency'],
            'waiting_time' => $clinician['waiting_time'],
            'rating' => $clinician['rating'],
            'review_count' => $clinician['review_count'],
            'insurance_accepted' => $clinician['insurance_accepted'],
            'bio' => $clinician['sub_specialty'].' at '.$clinician['workplace_name'].'.',
            'languages' => $clinician['languages'],
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

        $this->seedAvailability($profile, $clinician['availability']);
    }

    /**
     * @param  list<array{0: DayOfWeek, 1: string, 2: string}>  $windows
     */
    private function seedAvailability(HcpProfile $profile, array $windows): void
    {
        $profile->availabilitySlots()->delete();

        foreach ($windows as [$day, $start, $end]) {
            HcpAvailabilitySlot::factory()->for($profile)->create([
                'day_of_week' => $day,
                'start_time' => $start,
                'end_time' => $end,
            ]);
        }
    }
}
