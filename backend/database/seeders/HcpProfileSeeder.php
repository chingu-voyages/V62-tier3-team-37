<?php

namespace Database\Seeders;

use App\Enums\ConsultationType;
use App\Enums\DayOfWeek;
use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\LivenessStatus;
use App\Enums\Specialty;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\Document;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HcpProfileSeeder extends Seeder
{
    public const DEMO_EMAIL = 'hcp.demo@example.com';

    public const DEMO_PASSWORD = 'Password1!';

    public function run(): void
    {
        $user = User::query()->where('email', self::DEMO_EMAIL)->first();

        $userData = [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'birth_date' => '1985-04-12',
            'gender' => UserGender::MALE,
            'email_verified_at' => now(),
            'password' => Hash::make(self::DEMO_PASSWORD),
            'phone' => '+212612345678',
            'country' => 'Morocco',
            'role' => UserRole::HCP,
            'status' => UserStatus::ACTIVE,
            'terms_accepted' => true,
        ];

        if ($user) {
            $user->update($userData);
        } else {
            $user = User::factory()->create([
                'email' => self::DEMO_EMAIL,
                ...$userData,
            ]);
        }

        $profileData = [
            'specialty' => Specialty::CARDIOLOGY,
            'years_of_experience' => 12,
            'medical_license_number' => 'ML-2026-004521',
            'license_issuing_authority' => 'Moroccan Medical Board',
            'sub_specialty' => 'Interventional Cardiology',
            'workplace_name' => 'Regional Medical Center',
            'workplace_address' => '123 Health Street',
            'city' => 'Casablanca',
            'bio' => 'Experienced cardiologist specializing in interventional cardiology and patient-centered care.',
            'languages' => ['Arabic', 'English', 'French'],
            'consultation_types' => [
                ConsultationType::IN_PERSON->value,
                ConsultationType::VIDEO->value,
                ConsultationType::PHONE->value,
            ],
        ];

        $profile = $user->hcpProfile;

        if ($profile) {
            $profile->update($profileData);
        } else {
            $profile = HcpProfile::factory()
                ->for($user)
                ->create($profileData);
        }

        $verificationData = [
            'liveness_status' => LivenessStatus::PASSED,
            'consent_accepted_at' => now()->subDays(2),
            'status' => VerificationStatus::VERIFIED,
            'submitted_at' => now()->subDays(2),
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ];

        $verification = $user->hcpVerification;

        if ($verification) {
            $verification->update($verificationData);
        } else {
            HcpVerification::factory()
                ->for($user)
                ->create($verificationData);
        }

        $this->seedAvailability($profile);
        $this->seedDocuments($user);
    }

    private function seedAvailability(HcpProfile $profile): void
    {
        $profile->availabilitySlots()->delete();

        $workingDays = [
            DayOfWeek::MONDAY,
            DayOfWeek::TUESDAY,
            DayOfWeek::WEDNESDAY,
            DayOfWeek::THURSDAY,
            DayOfWeek::FRIDAY,
        ];

        foreach ($workingDays as $day) {
            foreach ([['09:00', '12:00'], ['14:00', '17:00']] as [$start, $end]) {
                HcpAvailabilitySlot::factory()
                    ->for($profile)
                    ->create([
                        'day_of_week' => $day,
                        'start_time' => $start,
                        'end_time' => $end,
                    ]);
            }
        }
    }

    private function seedDocuments(User $user): void
    {
        $documents = [
            [
                'category' => DocumentCategory::KYC,
                'type' => DocumentType::GOVERNMENT_ID_FRONT,
                'file_name' => 'government-id-front.pdf',
            ],
            [
                'category' => DocumentCategory::KYC,
                'type' => DocumentType::GOVERNMENT_ID_BACK,
                'file_name' => 'government-id-back.pdf',
            ],
            [
                'category' => DocumentCategory::CREDENTIAL,
                'type' => DocumentType::MEDICAL_LICENSE,
                'file_name' => 'medical-license.pdf',
            ],
            [
                'category' => DocumentCategory::CREDENTIAL,
                'type' => DocumentType::QUALIFICATION,
                'file_name' => 'qualification.pdf',
            ],
        ];

        $user->documents()
            ->whereIn(
                'document_type',
                array_map(
                    fn (array $document): string => $document['type']->value,
                    $documents
                )
            )
            ->delete();

        foreach ($documents as $document) {
            Document::factory()
                ->for($user)
                ->create([
                    'category' => $document['category'],
                    'document_type' => $document['type'],
                    'original_file_name' => $document['file_name'],
                    'storage_path' => 'seeded/'.$document['file_name'],
                ]);
        }
    }
}
