<?php

namespace Tests\Feature\Visit;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\Appointment;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The clinician side of records: after a visit is finished, the clinician writes a
 * summary and may attach a result, and that result then reaches the patient's
 * records page.
 */
class VisitResultTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_clinician_attaches_a_result_to_a_finished_visit(): void
    {
        Storage::fake('local');

        [$patient, $clinician] = $this->pair();

        $appointment = $this->arrivedAppointment($patient, $clinician);

        $this->actingAs($clinician, 'sanctum')
            ->post("/api/hcp/appointments/{$appointment->id}/summary", [
                'summary' => 'Skin settled after two weeks of topical steroid.',
            ])
            ->assertOk()
            ->assertJsonPath('data.summary', 'Skin settled after two weeks of topical steroid.')
            ->assertJsonPath('data.status', AppointmentStatus::COMPLETED->value);

        $this->actingAs($clinician, 'sanctum')
            ->post("/api/hcp/appointments/{$appointment->id}/results", [
                'file' => UploadedFile::fake()->create('after.jpg', 40, 'image/jpeg'),
                'title' => 'Progress photos',
            ])
            ->assertOk()
            ->assertJsonPath('data.results.0.title', 'Progress photos');

        // And the patient can see it on their records page.
        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/records')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.hcp.full_name', 'Rana Khoury')
            ->assertJsonPath('data.0.documents.0.title', 'Progress photos');
    }

    public function test_a_result_cannot_be_attached_before_the_patient_is_seen(): void
    {
        Storage::fake('local');

        [$patient, $clinician] = $this->pair();
        $appointment = $this->bookedAppointment($patient, $clinician);

        $this->actingAs($clinician, 'sanctum')
            ->post("/api/hcp/appointments/{$appointment->id}/results", [
                'file' => UploadedFile::fake()->create('early.jpg', 10, 'image/jpeg'),
            ], $this->wantsJson())
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');
    }

    public function test_a_summary_cannot_be_written_before_the_patient_is_seen(): void
    {
        [$patient, $clinician] = $this->pair();
        $appointment = $this->bookedAppointment($patient, $clinician);

        $this->actingAs($clinician, 'sanctum')
            ->post("/api/hcp/appointments/{$appointment->id}/summary", [
                'summary' => 'Too early.',
            ], $this->wantsJson())
            ->assertStatus(422)
            ->assertJsonValidationErrors('summary');
    }

    public function test_a_clinician_cannot_read_another_clinicians_patient_result(): void
    {
        Storage::fake('local');

        [$patient, $clinician] = $this->pair();
        [, $stranger] = $this->pair();

        $appointment = $this->arrivedAppointment($patient, $clinician);

        $this->actingAs($clinician, 'sanctum')
            ->post("/api/hcp/appointments/{$appointment->id}/results", [
                'file' => UploadedFile::fake()->create('private.jpg', 10, 'image/jpeg'),
            ])
            ->assertOk();

        $documentId = $this->resultId($patient);

        $this->actingAs($stranger, 'sanctum')
            ->get("/api/hcp/appointments/{$appointment->id}/results/{$documentId}")
            ->assertForbidden();
    }

    public function test_the_patient_can_download_the_result_shared_with_them(): void
    {
        Storage::fake('local');

        [$patient, $clinician] = $this->pair();
        $appointment = $this->arrivedAppointment($patient, $clinician);

        $this->actingAs($clinician, 'sanctum')
            ->post("/api/hcp/appointments/{$appointment->id}/results", [
                'file' => UploadedFile::fake()->create('shared.pdf', 20, 'application/pdf'),
            ])
            ->assertOk();

        $this->actingAs($patient, 'sanctum')
            ->get("/api/patient/appointments/{$appointment->id}/results/{$this->resultId($patient)}")
            ->assertOk();
    }

    /**
     * File uploads must be posted as multipart, but a multipart request does not
     * announce itself as wanting JSON. Without this header a rejected upload
     * redirects (302) instead of returning the validation errors the API would
     * send a real client, so the guard would look like it passed.
     *
     * @return array<string, string>
     */
    private function wantsJson(): array
    {
        return ['Accept' => 'application/json'];
    }

    private function resultId(User $patient): int
    {
        return (int) $patient->documents()->where('document_type', 'VISIT_RESULT')->value('id');
    }

    private function arrivedAppointment(User $patient, User $clinician): Appointment
    {
        return $this->appointment($patient, $clinician, AppointmentStatus::ARRIVED);
    }

    private function bookedAppointment(User $patient, User $clinician): Appointment
    {
        return $this->appointment($patient, $clinician, AppointmentStatus::BOOKED);
    }

    private function appointment(User $patient, User $clinician, AppointmentStatus $status): Appointment
    {
        return Appointment::factory()->create([
            'patient_user_id' => $patient->id,
            'hcp_user_id' => $clinician->id,
            'status' => $status,
        ]);
    }

    /**
     * @return array{0: User, 1: User}
     */
    private function pair(): array
    {
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);
        $clinician = User::factory()->create([
            'role' => UserRole::HCP,
            'first_name' => 'Rana',
            'last_name' => 'Khoury',
        ]);

        HcpProfile::factory()->create(['user_id' => $clinician->id]);
        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::VERIFIED,
        ]);

        return [$patient, $clinician];
    }
}
