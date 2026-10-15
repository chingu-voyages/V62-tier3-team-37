<?php

namespace Tests\Feature\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\DayOfWeek;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\Appointment;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManageAppointmentTest extends TestCase
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

    public function test_a_patient_only_lists_and_views_their_own_appointments(): void
    {
        [$patient, $hcp, $appointment] = $this->createAppointment();
        $otherPatient = User::factory()->create();
        $otherAppointment = Appointment::factory()
            ->for($otherPatient, 'patient')
            ->for($hcp, 'hcp')
            ->create([
                'scheduled_start_at' => '2030-01-07 12:00:00',
                'scheduled_end_at' => '2030-01-07 13:00:00',
            ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/appointments')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $appointment->id);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/patient/appointments/{$appointment->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $appointment->id);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/patient/appointments/{$otherAppointment->id}")
            ->assertNotFound();
    }

    public function test_a_verified_hcp_only_lists_and_views_their_own_appointments(): void
    {
        [, $hcp, $appointment] = $this->createAppointment();
        [, , $otherAppointment] = $this->createAppointment('2030-01-08 10:00:00');

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/appointments?date=2030-01-07')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $appointment->id);

        $this->actingAs($hcp, 'sanctum')
            ->getJson("/api/hcp/appointments/{$appointment->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $appointment->id);

        $this->actingAs($hcp, 'sanctum')
            ->getJson("/api/hcp/appointments/{$otherAppointment->id}")
            ->assertNotFound();
    }

    public function test_a_patient_can_reschedule_a_booked_appointment(): void
    {
        [$patient, , $appointment] = $this->createAppointment();

        $this->actingAs($patient, 'sanctum')
            ->patchJson("/api/patient/appointments/{$appointment->id}/reschedule", [
                'scheduled_start_at' => '2030-01-07T11:00:00Z',
            ])
            ->assertOk()
            ->assertJsonPath('data.scheduled_start_at', '2030-01-07T11:00:00.000000Z')
            ->assertJsonPath('data.scheduled_end_at', '2030-01-07T11:30:00.000000Z')
            ->assertJsonPath('data.rescheduled_by_user_id', $patient->id);

        $appointment->refresh();
        $this->assertSame($patient->id, $appointment->rescheduled_by_user_id);
        $this->assertNotNull($appointment->rescheduled_at);
        $this->assertSame(AppointmentStatus::RESCHEDULED, $appointment->status);
    }

    public function test_a_verified_hcp_can_reschedule_a_booked_appointment(): void
    {
        [, $hcp, $appointment] = $this->createAppointment();

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/reschedule", [
                'scheduled_start_at' => '2030-01-07T11:00:00Z',
            ])
            ->assertOk()
            ->assertJsonPath('data.rescheduled_by_user_id', $hcp->id);
    }

    public function test_the_patient_and_hcp_can_each_cancel_their_appointment(): void
    {
        [$patient, , $patientAppointment] = $this->createAppointment();
        [, $hcp, $hcpAppointment] = $this->createAppointment('2030-01-08 10:00:00');

        $this->actingAs($patient, 'sanctum')
            ->patchJson("/api/patient/appointments/{$patientAppointment->id}/cancel", [
                'reason' => 'Plans changed',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::CANCELLED->value)
            ->assertJsonPath('data.cancelled_by_user_id', $patient->id)
            ->assertJsonPath('data.cancellation_reason', 'Plans changed');

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$hcpAppointment->id}/cancel", [
                'reason' => 'Clinic emergency',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::CANCELLED->value)
            ->assertJsonPath('data.cancelled_by_user_id', $hcp->id)
            ->assertJsonPath('data.cancellation_reason', 'Clinic emergency');
    }

    public function test_a_verified_hcp_can_mark_arrived_and_save_a_summary(): void
    {
        [, $hcp, $appointment] = $this->createAppointment(
            '2030-01-01 10:00:00',
            createAvailability: false
        );

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/status", [
                'status' => AppointmentStatus::ARRIVED->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::ARRIVED->value);

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/summary", [
                'summary' => 'Patient is improving.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::COMPLETED->value)
            ->assertJsonPath('data.medical_summary', 'Patient is improving.');
    }

    public function test_a_verified_hcp_can_undo_any_status_to_booked(): void
    {
        [, $hcp, $appointment] = $this->createAppointment();

        foreach ([
            AppointmentStatus::ARRIVED,
            AppointmentStatus::RESCHEDULED,
            AppointmentStatus::NO_SHOW,
            AppointmentStatus::COMPLETED,
            AppointmentStatus::CANCELLED,
        ] as $status) {
            $appointment->update([
                'status' => $status,
                'arrived_at' => now(),
                'no_show_at' => now(),
                'completed_at' => now(),
                'cancelled_at' => now(),
                'cancelled_by_user_id' => $hcp->id,
                'cancellation_reason' => 'Status reset test.',
                'rescheduled_at' => now(),
                'rescheduled_by_user_id' => $hcp->id,
            ]);

            $this->actingAs($hcp, 'sanctum')
                ->deleteJson("/api/hcp/appointments/{$appointment->id}/status")
                ->assertOk()
                ->assertJsonPath('data.status', AppointmentStatus::BOOKED->value);

            $appointment->refresh();
            $this->assertSame(AppointmentStatus::BOOKED, $appointment->status);
            $this->assertNull($appointment->arrived_at);
            $this->assertNull($appointment->no_show_at);
            $this->assertNull($appointment->completed_at);
            $this->assertNull($appointment->cancelled_at);
            $this->assertNull($appointment->cancelled_by_user_id);
            $this->assertNull($appointment->cancellation_reason);
            $this->assertNull($appointment->rescheduled_at);
            $this->assertNull($appointment->rescheduled_by_user_id);
        }
    }

    public function test_a_summary_requires_an_arrived_appointment_and_cancelled_cannot_be_rescheduled(): void
    {
        [$patient, $hcp, $appointment] = $this->createAppointment();

        $this->actingAs($hcp, 'sanctum')
            ->postJson("/api/hcp/appointments/{$appointment->id}/summary", [
                'summary' => 'Not allowed yet.',
            ])
            ->assertConflict()
            ->assertJsonPath('message', 'A summary can only be saved after the patient arrives.');

        $appointment->update(['status' => AppointmentStatus::CANCELLED]);

        $this->actingAs($patient, 'sanctum')
            ->patchJson("/api/patient/appointments/{$appointment->id}/reschedule", [
                'scheduled_start_at' => '2030-01-07T11:00:00Z',
            ])
            ->assertConflict()
            ->assertJsonPath('message', 'Only booked or rescheduled appointments can be rescheduled.');
    }

    public function test_the_hcp_routes_require_an_active_verified_hcp(): void
    {
        $unverifiedHcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        HcpVerification::factory()->for($unverifiedHcp, 'user')->create([
            'status' => VerificationStatus::UNDER_REVIEW,
        ]);

        $this->actingAs($unverifiedHcp, 'sanctum')
            ->getJson('/api/hcp/appointments')
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Only verified healthcare providers can access this resource.'
            );

        $patient = User::factory()->create();

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/hcp/appointments')
            ->assertForbidden();

        [, $verifiedHcp] = $this->createAppointment();

        $this->actingAs($verifiedHcp, 'sanctum')
            ->getJson('/api/patient/appointments')
            ->assertForbidden();
    }

    public function test_an_appointment_cannot_be_rescheduled_or_cancelled_after_it_starts(): void
    {
        [$patient, , $appointment] = $this->createAppointment(
            '2029-12-31 23:30:00',
            createAvailability: false
        );

        $this->actingAs($patient, 'sanctum')
            ->patchJson("/api/patient/appointments/{$appointment->id}/reschedule", [
                'scheduled_start_at' => '2030-01-07T11:00:00Z',
            ])
            ->assertConflict()
            ->assertJsonPath('message', 'An appointment cannot be rescheduled after it starts.');

        $this->actingAs($patient, 'sanctum')
            ->patchJson("/api/patient/appointments/{$appointment->id}/cancel", [
                'reason' => 'Cannot attend',
            ])
            ->assertConflict()
            ->assertJsonPath('message', 'An appointment cannot be cancelled after it starts.');
    }

    /**
     * @return array{User, User, Appointment}
     */
    private function createAppointment(
        string $start = '2030-01-07 10:00:00',
        bool $createAvailability = true
    ): array {
        $patient = User::factory()->create();
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        $profile = HcpProfile::factory()->for($hcp, 'user')->create();

        HcpVerification::factory()->for($hcp, 'user')->create();

        $startAt = CarbonImmutable::parse($start);

        if ($createAvailability) {
            HcpAvailabilitySlot::factory()->for($profile)->create([
                'day_of_week' => DayOfWeek::from($startAt->dayOfWeek),
                'start_time' => '09:00',
                'end_time' => '14:00',
            ]);
        }

        $appointment = Appointment::factory()
            ->for($patient, 'patient')
            ->for($hcp, 'hcp')
            ->create([
                'scheduled_start_at' => $startAt,
                'scheduled_end_at' => $startAt->addMinutes(Appointment::DURATION_MINUTES),
                'status' => AppointmentStatus::BOOKED,
            ]);

        return [$patient, $hcp, $appointment];
    }
}
