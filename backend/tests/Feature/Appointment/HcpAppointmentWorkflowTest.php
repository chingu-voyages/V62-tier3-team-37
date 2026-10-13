<?php

namespace Tests\Feature\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\DayOfWeek;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HcpAppointmentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        CarbonImmutable::setTestNow('2030-01-01 00:00:00');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        parent::tearDown();
    }

    public function test_hcp_can_mark_no_show_without_extra_fields(): void
    {
        [, $hcp, $appointment] = $this->createAppointment();

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/status", [
                'status' => AppointmentStatus::NO_SHOW->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::NO_SHOW->value);

        $this->assertNotNull($appointment->refresh()->no_show_at);
    }

    public function test_cancellation_requires_a_reason(): void
    {
        [$patient, $hcp, $appointment] = $this->createAppointment();

        $this->actingAs($patient, 'sanctum')
            ->patchJson("/api/patient/appointments/{$appointment->id}/cancel")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reason');

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/cancel")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reason');
    }

    public function test_hcp_can_attach_a_result_after_arrival_and_patient_can_download_it(): void
    {
        Storage::fake('local');
        [$patient, $hcp, $appointment] = $this->createAppointment();
        $appointment->update(['status' => AppointmentStatus::ARRIVED]);

        $response = $this->actingAs($hcp, 'sanctum')
            ->post("/api/hcp/appointments/{$appointment->id}/results", [
                'file' => UploadedFile::fake()->create('scan.pdf', 100, 'application/pdf'),
                'title' => 'MRI scan',
            ])
            ->assertCreated()
            ->assertJsonPath('data.appointment_id', $appointment->id);

        $documentId = $response->json('data.id');

        $this->actingAs($patient, 'sanctum')
            ->get("/api/patient/appointments/{$appointment->id}/results/{$documentId}")
            ->assertOk();
    }

    public function test_hcp_can_create_a_follow_up_only_from_a_completed_appointment(): void
    {
        [, $hcp, $appointment] = $this->createAppointment();

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/follow-up", [
                'scheduled_start_at' => '2030-01-14T10:00:00Z',
            ])
            ->assertConflict();

        $appointment->update(['status' => AppointmentStatus::COMPLETED]);

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/follow-up", [
                'scheduled_start_at' => '2030-01-14T10:00:00Z',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', AppointmentStatus::BOOKED->value)
            ->assertJsonPath('data.parent_appointment_id', $appointment->id);
    }

    public function test_day_desk_excludes_cancelled_appointments(): void
    {
        [, $hcp, $appointment] = $this->createAppointment();
        Appointment::factory()->for($appointment->patient, 'patient')->for($hcp, 'hcp')->create([
            'scheduled_start_at' => '2030-01-07 11:00:00',
            'scheduled_end_at' => '2030-01-07 11:30:00',
            'status' => AppointmentStatus::CANCELLED,
        ]);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/appointments?date=2030-01-07')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $appointment->id);
    }

    /** @return array{User, User, Appointment} */
    private function createAppointment(): array
    {
        $patient = User::factory()->create();
        $hcp = User::factory()->create(['role' => UserRole::HCP]);
        $profile = HcpProfile::factory()->for($hcp, 'user')->create();
        HcpVerification::factory()->for($hcp, 'user')->create();
        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        $appointment = Appointment::factory()
            ->for($patient, 'patient')
            ->for($hcp, 'hcp')
            ->create([
                'scheduled_start_at' => '2030-01-07 10:00:00',
                'scheduled_end_at' => '2030-01-07 10:30:00',
                'status' => AppointmentStatus::BOOKED,
            ]);

        return [$patient, $hcp, $appointment];
    }
}
