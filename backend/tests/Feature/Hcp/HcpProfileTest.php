<?php

namespace Tests\Feature\Hcp;

use App\Enums\ConsultationType;
use App\Enums\DayOfWeek;
use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\LivenessStatus;
use App\Enums\Specialty;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\Document;
use App\Models\HcpProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class HcpProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_view_hcp_profile(): void
    {
        $this->getJson('/api/hcp/profile')
            ->assertUnauthorized();
    }

    public function test_patient_cannot_view_hcp_profile(): void
    {
        $patient = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/hcp/profile')
            ->assertForbidden();
    }

    public function test_hcp_can_view_complete_profile(): void
    {
        $this->travelTo(Carbon::parse('2026-10-03 12:00:00'));

        $hcp = User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'birth_date' => '1985-04-12',
            'role' => UserRole::HCP,
            'phone' => '+212612345678',
            'country' => 'Morocco',
        ]);

        $profile = $hcp->hcpProfile()->create([
            'specialty' => Specialty::CARDIOLOGY,
            'years_of_experience' => 12,
            'medical_license_number' => 'ML-2026-004521',
            'license_issuing_authority' => 'Medical Board',
            'sub_specialty' => 'Interventional Cardiology',
            'workplace_name' => 'Regional Medical Center',
            'workplace_address' => '123 Health Street',
            'city' => 'Casablanca',
            'bio' => 'Experienced cardiologist.',
            'languages' => ['Arabic', 'English'],
            'consultation_types' => [
                ConsultationType::IN_PERSON->value,
                ConsultationType::VIDEO->value,
                ConsultationType::PHONE->value,
            ],
        ]);

        $profile->availabilitySlots()->createMany([
            [
                'day_of_week' => DayOfWeek::TUESDAY,
                'start_time' => '14:00',
                'end_time' => '17:00',
            ],
            [
                'day_of_week' => DayOfWeek::MONDAY,
                'start_time' => '09:00',
                'end_time' => '12:00',
            ],
        ]);

        $hcp->hcpVerification()->create([
            'liveness_status' => LivenessStatus::PASSED,
            'consent_accepted_at' => now(),
            'status' => VerificationStatus::VERIFIED,
            'submitted_at' => now()->subDay(),
            'reviewed_at' => now(),
        ]);

        $this->createRequiredDocuments($hcp);

        $response = $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/profile');

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $hcp->id)
            ->assertJsonPath('data.is_verified', true)
            ->assertJsonPath('data.personal_information.full_name', 'John Doe')
            ->assertJsonPath('data.personal_information.birth_date', '1985-04-12')
            ->assertJsonPath('data.personal_information.age', 41)
            ->assertJsonPath(
                'data.professional_information.specialty',
                Specialty::CARDIOLOGY->value
            )
            ->assertJsonPath(
                'data.professional_information.medical_license_number',
                'ML-2026-004521'
            )
            ->assertJsonPath('data.preferences.languages.0', 'Arabic')
            ->assertJsonPath(
                'data.preferences.consultation_types.2',
                ConsultationType::PHONE->value
            )
            ->assertJsonCount(2, 'data.availability')
            ->assertJsonPath('data.availability.0.day', 'MON')
            ->assertJsonPath('data.availability.0.start_time', '09:00')
            ->assertJsonPath('data.availability.1.day', 'TUE')
            ->assertJsonPath('data.verification.status', VerificationStatus::VERIFIED->value)
            ->assertJsonPath('data.verification.documents.government_id_front', true)
            ->assertJsonPath('data.verification.documents.government_id_back', true)
            ->assertJsonPath('data.verification.documents.medical_license', true)
            ->assertJsonPath('data.verification.documents.qualification', true)
            ->assertJsonMissing([
                'storage_path' => 'private/credential.pdf',
            ]);
    }

    public function test_hcp_can_update_allowed_profile_fields(): void
    {
        $hcp = $this->createHcpWithProfile();

        $response = $this->actingAs($hcp, 'sanctum')
            ->patchJson('/api/hcp/profile', [
                'first_name' => ' Jane ',
                'last_name' => 'Smith',
                'birth_date' => '1990-06-15',
                'gender' => UserGender::FEMALE->value,
                'phone' => '+212600000001',
                'country' => 'Morocco',
                'sub_specialty' => 'Clinical Cardiology',
                'workplace_name' => 'City Hospital',
                'workplace_address' => '45 Main Street',
                'city' => 'Rabat',
                'bio' => 'Updated professional biography.',
                'languages' => ['Arabic', 'English'],
                'consultation_types' => [
                    ConsultationType::IN_PERSON->value,
                    ConsultationType::PHONE->value,
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'HCP profile updated successfully.')
            ->assertJsonPath('data.personal_information.first_name', 'Jane')
            ->assertJsonPath('data.personal_information.gender', UserGender::FEMALE->value)
            ->assertJsonPath('data.professional_information.city', 'Rabat')
            ->assertJsonPath('data.preferences.languages.1', 'English')
            ->assertJsonPath(
                'data.preferences.consultation_types.1',
                ConsultationType::PHONE->value
            );

        $hcp->refresh()->load('hcpProfile');

        $this->assertSame('Jane', $hcp->first_name);
        $this->assertSame('+212600000001', $hcp->phone);
        $this->assertSame('Clinical Cardiology', $hcp->hcpProfile->sub_specialty);
        $this->assertSame(['Arabic', 'English'], $hcp->hcpProfile->languages);
    }

    public function test_hcp_cannot_update_email_or_onboarding_fields(): void
    {
        $hcp = $this->createHcpWithProfile();

        $response = $this->actingAs($hcp, 'sanctum')
            ->patchJson('/api/hcp/profile', [
                'email' => 'changed@example.com',
                'specialty' => Specialty::NEUROLOGY->value,
                'years_of_experience' => 30,
                'medical_license_number' => 'CHANGED-LICENSE',
                'license_issuing_authority' => 'Changed Authority',
                'government_id_front' => 'changed-id',
                'government_id_back' => 'changed-id',
                'medical_license' => 'changed-license',
                'qualification' => 'changed-qualification',
                'liveness_status' => LivenessStatus::FAILED->value,
                'consent' => false,
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'email',
                'specialty',
                'years_of_experience',
                'medical_license_number',
                'license_issuing_authority',
                'government_id_front',
                'government_id_back',
                'medical_license',
                'qualification',
                'liveness_status',
                'consent',
            ]);

        $hcp->refresh()->load('hcpProfile');

        $this->assertNotSame('changed@example.com', $hcp->email);
        $this->assertSame(Specialty::CARDIOLOGY, $hcp->hcpProfile->specialty);
        $this->assertSame(12, $hcp->hcpProfile->years_of_experience);
        $this->assertSame('ML-2026-004521', $hcp->hcpProfile->medical_license_number);
    }

    public function test_hcp_profile_update_validates_preferences(): void
    {
        $hcp = $this->createHcpWithProfile();

        $this->actingAs($hcp, 'sanctum')
            ->patchJson('/api/hcp/profile', [
                'languages' => ['Arabic', 'arabic'],
                'consultation_types' => [
                    ConsultationType::VIDEO->value,
                    'CHAT',
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'languages.1',
                'consultation_types.1',
            ]);
    }

    public function test_hcp_can_replace_availability(): void
    {
        $hcp = $this->createHcpWithProfile();
        $profile = $this->profileFor($hcp);

        $profile->availabilitySlots()->create([
            'day_of_week' => DayOfWeek::FRIDAY,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

        $response = $this->actingAs($hcp, 'sanctum')
            ->putJson('/api/hcp/profile/availability', [
                'slots' => [
                    [
                        'day' => 'TUE',
                        'start_time' => '14:00',
                        'end_time' => '17:00',
                    ],
                    [
                        'day' => 'MON',
                        'start_time' => '12:00',
                        'end_time' => '15:00',
                    ],
                    [
                        'day' => 'MON',
                        'start_time' => '09:00',
                        'end_time' => '12:00',
                    ],
                ],
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'HCP availability updated successfully.')
            ->assertJsonCount(3, 'data.availability')
            ->assertJsonPath('data.availability.0.day', 'MON')
            ->assertJsonPath('data.availability.0.start_time', '09:00')
            ->assertJsonPath('data.availability.1.day', 'MON')
            ->assertJsonPath('data.availability.1.start_time', '12:00')
            ->assertJsonPath('data.availability.2.day', 'TUE');

        $this->assertDatabaseCount('hcp_availability_slots', 3);
        $this->assertDatabaseMissing('hcp_availability_slots', [
            'day_of_week' => DayOfWeek::FRIDAY->value,
            'start_time' => '08:00',
        ]);
    }

    public function test_hcp_cannot_save_overlapping_availability(): void
    {
        $hcp = $this->createHcpWithProfile();
        $profile = $this->profileFor($hcp);

        $existingSlot = $profile->availabilitySlots()->create([
            'day_of_week' => DayOfWeek::FRIDAY,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);

        $this->actingAs($hcp, 'sanctum')
            ->putJson('/api/hcp/profile/availability', [
                'slots' => [
                    [
                        'day' => 'MON',
                        'start_time' => '09:00',
                        'end_time' => '12:00',
                    ],
                    [
                        'day' => 'MON',
                        'start_time' => '11:00',
                        'end_time' => '14:00',
                    ],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'slots.1.start_time',
            ]);

        $this->assertDatabaseCount('hcp_availability_slots', 1);
        $this->assertDatabaseHas('hcp_availability_slots', [
            'id' => $existingSlot->id,
            'day_of_week' => DayOfWeek::FRIDAY->value,
        ]);
    }

    public function test_hcp_can_clear_availability(): void
    {
        $hcp = $this->createHcpWithProfile();
        $profile = $this->profileFor($hcp);

        $profile->availabilitySlots()->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '12:00',
        ]);

        $this->actingAs($hcp, 'sanctum')
            ->putJson('/api/hcp/profile/availability', [
                'slots' => [],
            ])
            ->assertOk()
            ->assertJsonCount(0, 'data.availability');

        $this->assertDatabaseCount('hcp_availability_slots', 0);
    }

    public function test_hcp_can_delete_one_owned_availability_slot(): void
    {
        $hcp = $this->createHcpWithProfile();
        $profile = $this->profileFor($hcp);

        $slotToDelete = $profile->availabilitySlots()->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '12:00',
        ]);

        $slotToKeep = $profile->availabilitySlots()->create([
            'day_of_week' => DayOfWeek::TUESDAY,
            'start_time' => '14:00',
            'end_time' => '17:00',
        ]);

        $this->actingAs($hcp, 'sanctum')
            ->deleteJson("/api/hcp/profile/availability/{$slotToDelete->id}")
            ->assertOk()
            ->assertJsonPath(
                'message',
                'HCP availability slot deleted successfully.'
            )
            ->assertJsonCount(1, 'data.availability')
            ->assertJsonPath('data.availability.0.id', $slotToKeep->id);

        $this->assertDatabaseMissing('hcp_availability_slots', [
            'id' => $slotToDelete->id,
        ]);
        $this->assertDatabaseHas('hcp_availability_slots', [
            'id' => $slotToKeep->id,
        ]);
    }

    public function test_hcp_cannot_delete_another_hcps_availability_slot(): void
    {
        $hcp = $this->createHcpWithProfile();
        $otherHcp = $this->createHcpWithProfile();
        $otherProfile = $this->profileFor($otherHcp);

        $otherSlot = $otherProfile->availabilitySlots()->create([
            'day_of_week' => DayOfWeek::WEDNESDAY,
            'start_time' => '10:00',
            'end_time' => '13:00',
        ]);

        $this->actingAs($hcp, 'sanctum')
            ->deleteJson("/api/hcp/profile/availability/{$otherSlot->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('hcp_availability_slots', [
            'id' => $otherSlot->id,
        ]);
    }

    private function createHcpWithProfile(): User
    {
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);

        $hcp->hcpProfile()->create([
            'specialty' => Specialty::CARDIOLOGY,
            'years_of_experience' => 12,
            'medical_license_number' => 'ML-2026-004521',
            'license_issuing_authority' => 'Medical Board',
        ]);

        return $hcp;
    }

    private function profileFor(User $hcp): HcpProfile
    {
        /** @var HcpProfile $profile */
        $profile = $hcp->hcpProfile()->firstOrFail();

        return $profile;
    }

    private function createRequiredDocuments(User $hcp): void
    {
        $documents = [
            [DocumentType::GOVERNMENT_ID_FRONT, DocumentCategory::KYC],
            [DocumentType::GOVERNMENT_ID_BACK, DocumentCategory::KYC],
            [DocumentType::MEDICAL_LICENSE, DocumentCategory::CREDENTIAL],
            [DocumentType::QUALIFICATION, DocumentCategory::CREDENTIAL],
        ];

        foreach ($documents as [$type, $category]) {
            Document::create([
                'user_id' => $hcp->id,
                'category' => $category,
                'document_type' => $type,
                'original_file_name' => strtolower($type->value).'.pdf',
                'storage_path' => 'private/credential.pdf',
                'mime_type' => 'application/pdf',
                'file_size_bytes' => 1024,
                'uploaded_at' => now(),
            ]);
        }
    }
}
