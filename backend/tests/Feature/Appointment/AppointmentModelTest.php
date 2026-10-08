<?php

namespace Tests\Feature\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\BookingFor;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_appointment_casts_its_values_and_belongs_to_a_patient_and_hcp(): void
    {
        $patient = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        $start = now()->addDay()->startOfHour();

        $appointment = Appointment::query()->create([
            'patient_user_id' => $patient->id,
            'hcp_user_id' => $hcp->id,
            'scheduled_start_at' => $start,
            'scheduled_end_at' => $start->copy()->addMinutes(Appointment::DURATION_MINUTES),
            'booking_for' => BookingFor::SELF,
            'attendee_first_name' => $patient->first_name,
            'attendee_last_name' => $patient->last_name,
            'attendee_email' => $patient->email,
            'attendee_birth_date' => $patient->birth_date,
            'attendee_gender' => $patient->gender,
        ])->refresh();

        $this->assertSame(AppointmentStatus::CONFIRMED, $appointment->status);
        $this->assertSame(BookingFor::SELF, $appointment->booking_for);
        $this->assertSame(UserGender::MALE, $appointment->attendee_gender);
        $this->assertEquals(
            Appointment::DURATION_MINUTES,
            $appointment->scheduled_start_at->diffInMinutes($appointment->scheduled_end_at)
        );
        $this->assertTrue($appointment->patient->is($patient));
        $this->assertTrue($appointment->hcp->is($hcp));
        $this->assertTrue($patient->patientAppointments->contains($appointment));
        $this->assertTrue($hcp->hcpAppointments->contains($appointment));
    }

    public function test_a_cancelled_appointment_does_not_block_reusing_its_start_time(): void
    {
        $cancelledAppointment = Appointment::factory()->create([
            'status' => AppointmentStatus::CANCELLED,
        ]);

        Appointment::factory()->create([
            'hcp_user_id' => $cancelledAppointment->hcp_user_id,
            'scheduled_start_at' => $cancelledAppointment->scheduled_start_at,
        ]);

        $this->assertDatabaseCount('appointments', 2);
    }
}
