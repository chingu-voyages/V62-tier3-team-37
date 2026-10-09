<?php

namespace Tests\Feature\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\BookingFor;
use App\Enums\DayOfWeek;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Exceptions\AppointmentSlotUnavailableException;
use App\Models\Appointment;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use App\Services\Appointment\AppointmentAvailabilityService;
use App\Services\Appointment\AppointmentBookingService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class AppointmentBookingServiceTest extends TestCase
{
    use RefreshDatabase;

    private AppointmentBookingService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AppointmentBookingService(
            new AppointmentAvailabilityService
        );
        CarbonImmutable::setTestNow('2030-01-01 00:00:00');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_it_books_a_one_hour_appointment_for_the_patient(): void
    {
        $patient = User::factory()->create([
            'first_name' => 'Ahmad',
            'last_name' => 'Ameen',
            'birth_date' => '1998-12-12',
            'gender' => UserGender::MALE,
            'email' => 'ahmad@example.com',
        ]);
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $appointment = $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::SELF,
            attendee: [
                'first_name' => 'Ignored',
                'last_name' => 'Ignored',
                'email' => 'ignored@example.com',
                'birth_date' => '2000-01-01',
                'gender' => UserGender::FEMALE,
            ],
            notes: 'First consultation',
        )->refresh();

        $this->assertSame(AppointmentStatus::CONFIRMED, $appointment->status);
        $this->assertSame(BookingFor::SELF, $appointment->booking_for);
        $this->assertSame('Ahmad', $appointment->attendee_first_name);
        $this->assertSame('Ameen', $appointment->attendee_last_name);
        $this->assertSame('ahmad@example.com', $appointment->attendee_email);
        $this->assertSame(UserGender::MALE, $appointment->attendee_gender);
        $this->assertSame('First consultation', $appointment->notes);
        $this->assertEquals(
            Appointment::DURATION_MINUTES,
            $appointment->scheduled_start_at->diffInMinutes($appointment->scheduled_end_at)
        );
    }

    public function test_it_books_for_another_attendee(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $appointment = $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::OTHER,
            attendee: [
                'first_name' => 'Mona',
                'last_name' => 'Ali',
                'email' => 'mona@example.com',
                'birth_date' => '2001-02-03',
                'gender' => UserGender::FEMALE,
            ],
        )->refresh();

        $this->assertSame(BookingFor::OTHER, $appointment->booking_for);
        $this->assertSame('Mona', $appointment->attendee_first_name);
        $this->assertSame('Ali', $appointment->attendee_last_name);
        $this->assertSame('mona@example.com', $appointment->attendee_email);
        $this->assertSame('2001-02-03', $appointment->attendee_birth_date->toDateString());
        $this->assertSame(UserGender::FEMALE, $appointment->attendee_gender);
    }

    public function test_it_requires_attendee_data_when_booking_for_someone_else(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $this->expectException(InvalidArgumentException::class);

        $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::OTHER,
        );
    }

    public function test_it_rejects_an_unavailable_slot(): void
    {
        $patient = User::factory()->create();
        $availableStart = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($availableStart);

        $this->expectException(AppointmentSlotUnavailableException::class);

        $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $availableStart->setTime(15, 0),
            bookingFor: BookingFor::SELF,
        );
    }

    public function test_it_rejects_a_slot_already_booked_with_the_hcp(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);
        Appointment::factory()->for($hcp, 'hcp')->create([
            'scheduled_start_at' => $start,
            'scheduled_end_at' => $start->addHour(),
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $this->expectException(AppointmentSlotUnavailableException::class);

        $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::SELF,
        );
    }

    public function test_it_rejects_an_overlapping_appointment_for_the_patient(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);
        $otherHcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        Appointment::factory()->for($patient, 'patient')->for($otherHcp, 'hcp')->create([
            'scheduled_start_at' => $start->subMinutes(30),
            'scheduled_end_at' => $start->addMinutes(30),
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $this->expectException(AppointmentSlotUnavailableException::class);

        $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::SELF,
        );
    }

    public function test_a_cancelled_patient_appointment_does_not_block_booking(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);
        $otherHcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        Appointment::factory()->for($patient, 'patient')->for($otherHcp, 'hcp')->create([
            'scheduled_start_at' => $start,
            'scheduled_end_at' => $start->addHour(),
            'status' => AppointmentStatus::CANCELLED,
        ]);

        $appointment = $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::SELF,
        );

        $this->assertSame(AppointmentStatus::CONFIRMED, $appointment->status);
        $this->assertDatabaseCount('appointments', 2);
    }

    public function test_it_rejects_a_user_who_is_not_an_active_patient(): void
    {
        $patient = User::factory()->create([
            'status' => UserStatus::DISABLED,
        ]);
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start);

        $this->expectException(AuthorizationException::class);

        $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::SELF,
        );
    }

    public function test_it_rejects_an_unverified_hcp(): void
    {
        $patient = User::factory()->create();
        $start = CarbonImmutable::parse('2030-01-07 10:00:00');
        $hcp = $this->createBookableHcp($start, VerificationStatus::UNDER_REVIEW);

        $this->expectException(AuthorizationException::class);

        $this->service->book(
            patient: $patient,
            hcp: $hcp,
            start: $start,
            bookingFor: BookingFor::SELF,
        );
    }

    private function createBookableHcp(
        CarbonImmutable $date,
        VerificationStatus $verificationStatus = VerificationStatus::VERIFIED,
    ): User {
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        $profile = HcpProfile::factory()->for($hcp, 'user')->create();

        HcpVerification::factory()->for($hcp, 'user')->create([
            'status' => $verificationStatus,
        ]);
        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::from($date->dayOfWeek),
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        return $hcp;
    }
}
