<?php

namespace Tests\Feature\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\BookingFor;
use App\Enums\DayOfWeek;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreAppointmentTest extends TestCase
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

    public function test_a_patient_can_book_an_appointment_for_themself(): void
    {
        $patient = User::factory()->create([
            'first_name' => 'Ahmad',
            'last_name' => 'Ameen',
            'email' => 'ahmad@example.com',
        ]);
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'hcp_id' => $hcp->id,
                'scheduled_start_at' => '2030-01-07T10:00:00+00:00',
                'booking_for' => 'self',
                'attendee_phone' => '+96170123456',
                'notes' => 'First consultation',
            ])
            ->assertCreated()
            ->assertJsonPath('message', 'Appointment booked successfully.')
            ->assertJsonPath('data.hcp.id', $hcp->id)
            ->assertJsonPath('data.scheduled_start_at', '2030-01-07T10:00:00.000000Z')
            ->assertJsonPath('data.scheduled_end_at', '2030-01-07T10:30:00.000000Z')
            ->assertJsonPath('data.duration_minutes', 30)
            ->assertJsonPath('data.status', AppointmentStatus::BOOKED->value)
            ->assertJsonPath('data.booking_for', BookingFor::SELF->value)
            ->assertJsonPath('data.attendee.first_name', 'Ahmad')
            ->assertJsonPath('data.attendee.last_name', 'Ameen')
            ->assertJsonPath('data.attendee.email', 'ahmad@example.com')
            ->assertJsonPath('data.attendee.phone', '+96170123456')
            ->assertJsonPath('data.notes', 'First consultation');

        $this->assertDatabaseHas('appointments', [
            'patient_user_id' => $patient->id,
            'hcp_user_id' => $hcp->id,
            'status' => AppointmentStatus::BOOKED->value,
            'booking_for' => BookingFor::SELF->value,
            'attendee_first_name' => 'Ahmad',
            'attendee_last_name' => 'Ameen',
            'attendee_phone' => '+96170123456',
        ]);
    }

    public function test_a_patient_can_book_for_someone_else(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'hcp_id' => $hcp->id,
                'scheduled_start_at' => '2030-01-07T10:00:00Z',
                'booking_for' => 'OTHER',
                'attendee' => [
                    'first_name' => 'Mona',
                    'last_name' => 'Ali',
                    'email' => 'mona@example.com',
                    'phone' => '+96170987654',
                    'birth_date' => '2001-02-03',
                    'gender' => 'female',
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.booking_for', BookingFor::OTHER->value)
            ->assertJsonPath('data.attendee.first_name', 'Mona')
            ->assertJsonPath('data.attendee.phone', '+96170987654')
            ->assertJsonPath('data.attendee.gender', UserGender::FEMALE->value);
    }

    public function test_booking_for_someone_else_requires_valid_attendee_data(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'hcp_id' => $hcp->id,
                'scheduled_start_at' => '2030-01-07T10:00:00Z',
                'booking_for' => 'OTHER',
                'attendee' => [
                    'email' => 'not-an-email',
                    'birth_date' => '2099-01-01',
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'attendee.first_name',
                'attendee.last_name',
                'attendee.email',
                'attendee.birth_date',
                'attendee.gender',
                'attendee.phone',
            ]);
    }

    public function test_a_phone_number_is_required_for_every_booking(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'hcp_id' => $hcp->id,
                'scheduled_start_at' => '2030-01-07T10:00:00Z',
                'booking_for' => 'SELF',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('attendee_phone');
    }

    public function test_the_start_time_must_include_a_timezone(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'hcp_id' => $hcp->id,
                'scheduled_start_at' => '2030-01-07 10:00:00',
                'booking_for' => 'SELF',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('scheduled_start_at');
    }

    public function test_an_unavailable_slot_returns_conflict(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);
        Appointment::factory()->for($hcp, 'hcp')->create([
            'scheduled_start_at' => $start,
            'scheduled_end_at' => $start->addHour(),
            'status' => AppointmentStatus::BOOKED,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'hcp_id' => $hcp->id,
                'scheduled_start_at' => '2030-01-07T10:00:00Z',
                'booking_for' => 'SELF',
                'attendee_phone' => '+96170123456',
            ])
            ->assertConflict()
            ->assertJsonPath(
                'message',
                'The selected appointment slot is no longer available.'
            );
    }

    public function test_a_non_patient_cannot_book_an_appointment(): void
    {
        $hcpUser = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $bookableHcp = $this->createBookableHcp($start);

        $this->actingAs($hcpUser, 'sanctum')
            ->postJson('/api/patient/appointments', [
                'hcp_id' => $bookableHcp->id,
                'scheduled_start_at' => '2030-01-07T10:00:00Z',
                'booking_for' => 'SELF',
            ])
            ->assertForbidden();
    }

    public function test_a_guest_cannot_book_an_appointment(): void
    {
        $this->postJson('/api/patient/appointments', [])
            ->assertUnauthorized();
    }

    private function createBookableHcp(CarbonImmutable $date): User
    {
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        $profile = HcpProfile::factory()->for($hcp, 'user')->create();

        HcpVerification::factory()->for($hcp, 'user')->create();
        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::from($date->dayOfWeek),
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        return $hcp;
    }
}
