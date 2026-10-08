<?php

namespace Tests\Unit\Services\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\DayOfWeek;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\User;
use App\Services\Appointment\AppointmentAvailabilityService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentAvailabilityServiceTest extends TestCase
{
    use RefreshDatabase;

    private AppointmentAvailabilityService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new AppointmentAvailabilityService;
        CarbonImmutable::setTestNow('2030-01-01 00:00:00');
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_it_generates_only_complete_one_hour_slots(): void
    {
        [$hcp, $profile] = $this->createHcp();
        $date = CarbonImmutable::parse('2030-01-07');

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::from($date->dayOfWeek),
            'start_time' => '09:30',
            'end_time' => '12:00',
        ]);

        $this->assertSame(
            ['09:30', '10:30'],
            $this->service->availableSlots($hcp, $date)
        );
    }

    public function test_it_supports_multiple_availability_ranges_on_the_same_day(): void
    {
        [$hcp, $profile] = $this->createHcp();
        $date = CarbonImmutable::parse('2030-01-07');
        $dayOfWeek = DayOfWeek::from($date->dayOfWeek);

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => $dayOfWeek,
            'start_time' => '09:00',
            'end_time' => '11:00',
        ]);
        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => $dayOfWeek,
            'start_time' => '14:00',
            'end_time' => '16:00',
        ]);

        $this->assertSame(
            ['09:00', '10:00', '14:00', '15:00'],
            $this->service->availableSlots($hcp, $date)
        );
    }

    public function test_it_excludes_confirmed_appointments_but_ignores_cancelled_appointments(): void
    {
        [$hcp, $profile] = $this->createHcp();
        $date = CarbonImmutable::parse('2030-01-07');

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::from($date->dayOfWeek),
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);
        Appointment::factory()->for($hcp, 'hcp')->create([
            'scheduled_start_at' => $date->setTime(10, 0),
            'scheduled_end_at' => $date->setTime(11, 0),
            'status' => AppointmentStatus::CONFIRMED,
        ]);
        Appointment::factory()->for($hcp, 'hcp')->create([
            'scheduled_start_at' => $date->setTime(11, 0),
            'scheduled_end_at' => $date->setTime(12, 0),
            'status' => AppointmentStatus::CANCELLED,
        ]);

        $this->assertSame(
            ['09:00', '11:00', '12:00'],
            $this->service->availableSlots($hcp, $date)
        );
    }

    public function test_it_excludes_slots_that_have_already_started(): void
    {
        CarbonImmutable::setTestNow('2030-01-07 10:30:00');
        [$hcp, $profile] = $this->createHcp();
        $date = CarbonImmutable::parse('2030-01-07');

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::from($date->dayOfWeek),
            'start_time' => '09:00',
            'end_time' => '13:00',
        ]);

        $this->assertSame(
            ['11:00', '12:00'],
            $this->service->availableSlots($hcp, $date)
        );
    }

    public function test_it_returns_no_slots_when_the_hcp_has_no_availability_for_the_day(): void
    {
        [$hcp] = $this->createHcp();

        $this->assertSame(
            [],
            $this->service->availableSlots($hcp, CarbonImmutable::parse('2030-01-07'))
        );
    }

    public function test_it_rejects_a_user_who_is_not_an_hcp(): void
    {
        $patient = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        $this->expectException(AuthorizationException::class);

        $this->service->availableSlots($patient, CarbonImmutable::parse('2030-01-07'));
    }

    /**
     * @return array{User, HcpProfile}
     */
    private function createHcp(): array
    {
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        $profile = HcpProfile::factory()->for($hcp, 'user')->create();

        return [$hcp, $profile];
    }
}
