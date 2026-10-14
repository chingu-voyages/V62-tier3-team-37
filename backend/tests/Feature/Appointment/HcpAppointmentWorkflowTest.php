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
    public function test_status_filter_scopes_the_list_to_one_workflow_stage(): void
    {
        [, $hcp, $booked] = $this->createAppointment();
        $arrived = $this->appointmentInStatus($booked, AppointmentStatus::ARRIVED);
        $completed = $this->appointmentInStatus($booked, AppointmentStatus::COMPLETED);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/appointments?status[]=ARRIVED')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $arrived->id);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/appointments?status[]=COMPLETED')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $completed->id);
    }

    /**
     * The filter renders on every load, so the counts have to arrive with it.
     *
     * Every stage is asserted, not just the obvious one: a group left out of
     * `STATUS_GROUPS` would silently report zero and hide its own tab.
     */
    public function test_facets_count_each_workflow_stage(): void
    {
        [, $hcp, $booked] = $this->createAppointment();
        $this->appointmentInStatus($booked, AppointmentStatus::ARRIVED);
        $this->appointmentInStatus($booked, AppointmentStatus::COMPLETED);
        $this->appointmentInStatus($booked, AppointmentStatus::NO_SHOW);
        $this->appointmentInStatus($booked, AppointmentStatus::CANCELLED);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/appointments')
            ->assertOk()
            ->assertJsonPath('facets.upcoming', 1)
            ->assertJsonPath('facets.in_progress', 1)
            ->assertJsonPath('facets.no_show', 1)
            // Cancelled is counted even though it is excluded from the default list.
            ->assertJsonPath('facets.history', 2);
    }

    /**
     * A cancelled visit has to be reachable, or "History" is permanently empty.
     *
     * The default list still hides cancelled appointments; only an explicit status
     * asks for them.
     */
    public function test_history_can_ask_for_cancelled_appointments(): void
    {
        [, $hcp, $booked] = $this->createAppointment();
        $cancelled = $this->appointmentInStatus($booked, AppointmentStatus::CANCELLED);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/appointments?status[]=COMPLETED&status[]=CANCELLED')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $cancelled->id);
    }

    /**
     * Visits outside today must still be listable.
     *
     * `date` used to default to today, which meant a clinician could never see a
     * visit from yesterday - so every COMPLETED and NO_SHOW row was unreachable.
     */
    public function test_list_is_not_scoped_to_today_by_default(): void
    {
        [, $hcp, $booked] = $this->createAppointment();
        $yesterday = $this->appointmentInStatus(
            $booked,
            AppointmentStatus::COMPLETED,
            ['scheduled_start_at' => '2030-01-06 10:00:00', 'scheduled_end_at' => '2030-01-06 10:30:00'],
        );

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/appointments?status[]=COMPLETED')
            ->assertOk()
            ->assertJsonPath('data.0.id', $yesterday->id);
    }

    /** A sibling appointment for the same clinician, optionally overridden. */
    private function appointmentInStatus(
        Appointment $source,
        AppointmentStatus $status,
        array $overrides = []
    ): Appointment {
        return Appointment::factory()
            ->for($source->patient, 'patient')
            ->for($source->hcp, 'hcp')
            ->create(array_merge([
                'scheduled_start_at' => '2030-01-07 11:00:00',
                'scheduled_end_at' => '2030-01-07 11:30:00',
                'status' => $status,
            ], $overrides));
    }

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
