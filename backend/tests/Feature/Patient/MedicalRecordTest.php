<?php

namespace Tests\Feature\Patient;

use App\Enums\AppointmentStatus;
use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The records page: a patient sees documents grouped by the clinician who
 * produced them, and never sees another patient's.
 */
class MedicalRecordTest extends TestCase
{
    use RefreshDatabase;

    public function test_records_group_documents_by_the_clinician_who_wrote_them(): void
    {
        [$patient, $first] = $this->clinician('Rana', 'Khoury', Specialty::DERMATOLOGY);
        [, $second] = $this->clinician('Omar', 'Farid', Specialty::CARDIOLOGY);

        $this->resultFor($patient, $first, 'Skin biopsy');
        $this->resultFor($patient, $first, 'Prescription');
        $this->resultFor($patient, $second, 'ECG report');

        $response = $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/records')
            ->assertOk();

        // Two clinicians have filed results, so two cards.
        $response->assertJsonCount(2, 'data');

        $byName = collect($response->json('data'))
            ->keyBy(fn (array $record) => $record['hcp']['full_name']);

        $this->assertCount(2, $byName);
        $this->assertCount(2, $byName['Rana Khoury']['documents']);
        $this->assertCount(1, $byName['Omar Farid']['documents']);

        // The card carries enough identity to be recognisable.
        $this->assertSame('Dermatology', $byName['Rana Khoury']['hcp']['specialty_label']);
        $this->assertNotNull($byName['Rana Khoury']['hcp']['email']);
    }

    public function test_newest_result_is_listed_first(): void
    {
        [$patient, $clinician] = $this->clinician('Rana', 'Khoury', Specialty::DERMATOLOGY);

        $older = $this->resultFor($patient, $clinician, 'Older note', now()->subDay());
        $newer = $this->resultFor($patient, $clinician, 'Newer note', now());

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/records')
            ->assertOk()
            ->assertJsonPath('data.0.documents.0.id', $newer->id)
            ->assertJsonPath('data.0.documents.1.id', $older->id);
    }

    public function test_a_patient_does_not_see_another_patients_records(): void
    {
        [$mine, $clinician] = $this->clinician('Rana', 'Khoury', Specialty::DERMATOLOGY);
        [$theirs] = $this->clinician('Omar', 'Farid', Specialty::CARDIOLOGY);

        $this->resultFor($mine, $clinician, 'Mine');

        // Same clinician, different patient: must not leak.
        $this->resultFor($theirs, $clinician, 'Not mine');

        $this->actingAs($mine, 'sanctum')
            ->getJson('/api/patient/records')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.documents.0.title', 'Mine');
    }

    public function test_only_visit_results_appear(): void
    {
        [$patient, $clinician] = $this->clinician('Rana', 'Khoury', Specialty::DERMATOLOGY);

        $appointment = $this->appointment($patient, $clinician);

        $this->resultFor($patient, $clinician, 'A real result');

        // A credential on the same account is not a patient-facing record.
        Document::factory()->create([
            'user_id' => $patient->id,
            'category' => DocumentCategory::CREDENTIAL,
            'document_type' => DocumentType::MEDICAL_LICENSE,
            'appointment_id' => $appointment->id,
            'title' => 'Should not appear',
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/records')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.documents.0.title', 'A real result');
    }

    public function test_each_document_carries_a_working_download_url(): void
    {
        [$patient, $clinician] = $this->clinician('Rana', 'Khoury', Specialty::DERMATOLOGY);
        $document = $this->resultFor($patient, $clinician, 'Blood panel');

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/records')
            ->assertOk()
            ->assertJsonPath(
                'data.0.documents.0.download_url',
                "/api/patient/appointments/{$document->appointment_id}/results/{$document->id}"
            );
    }

    public function test_a_guest_cannot_read_records(): void
    {
        $this->getJson('/api/patient/records')->assertUnauthorized();
    }

    /**
     * @return array{0: User, 1: User}
     */
    private function clinician(string $first, string $last, Specialty $specialty): array
    {
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);
        $clinician = User::factory()->create([
            'role' => UserRole::HCP,
            'first_name' => $first,
            'last_name' => $last,
        ]);

        HcpProfile::factory()->create([
            'user_id' => $clinician->id,
            'specialty' => $specialty,
        ]);
        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::VERIFIED,
        ]);

        return [$patient, $clinician];
    }

    private function appointment(User $patient, User $clinician): Appointment
    {
        return Appointment::factory()->create([
            'patient_user_id' => $patient->id,
            'hcp_user_id' => $clinician->id,
            'status' => AppointmentStatus::COMPLETED,
        ]);
    }

    private function resultFor(
        User $patient,
        User $clinician,
        string $title,
        ?\DateTimeInterface $uploadedAt = null
    ): Document {
        $appointment = $this->appointment($patient, $clinician);

        return Document::factory()->create([
            'user_id' => $patient->id,
            'category' => DocumentCategory::MEDICAL,
            'document_type' => DocumentType::VISIT_RESULT,
            'appointment_id' => $appointment->id,
            'title' => $title,
            'uploaded_at' => $uploadedAt ?? now(),
        ]);
    }
}
