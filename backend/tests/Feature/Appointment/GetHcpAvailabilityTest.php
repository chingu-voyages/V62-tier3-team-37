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

class GetHcpAvailabilityTest extends TestCase
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

    public function test_a_patient_can_get_availability_for_a_date_range(): void
    {
        $patient = User::factory()->create();
        $monday = CarbonImmutable::parse('2030-01-07');
        [$hcp, $profile] = $this->createVerifiedHcp();

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '12:00',
        ]);
        Appointment::factory()->for($hcp, 'hcp')->create([
            'scheduled_start_at' => $monday->setTime(10, 0),
            'scheduled_end_at' => $monday->setTime(11, 0),
            'status' => AppointmentStatus::CONFIRMED,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/patient/hcps/{$hcp->id}/availability?from=2030-01-07&to=2030-01-08")
            ->assertOk()
            ->assertJsonPath('data.hcp_id', $hcp->id)
            ->assertJsonPath('data.duration_minutes', 60)
            ->assertJsonPath('data.dates.0.date', '2030-01-07')
            ->assertJsonPath('data.dates.0.slots', ['09:00', '11:00'])
            ->assertJsonPath('data.dates.1.date', '2030-01-08')
            ->assertJsonPath('data.dates.1.slots', []);
    }

    public function test_the_availability_range_may_not_exceed_thirty_one_days(): void
    {
        $patient = User::factory()->create();
        [$hcp] = $this->createVerifiedHcp();

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/patient/hcps/{$hcp->id}/availability?from=2030-01-01&to=2030-02-01")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');
    }

    public function test_an_unverified_hcp_is_not_exposed_to_patients(): void
    {
        $patient = User::factory()->create();
        [$hcp] = $this->createVerifiedHcp(VerificationStatus::UNDER_REVIEW);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/patient/hcps/{$hcp->id}/availability?from=2030-01-07&to=2030-01-07")
            ->assertNotFound();
    }

    public function test_a_non_patient_cannot_get_patient_facing_availability(): void
    {
        $hcpUser = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        [$provider] = $this->createVerifiedHcp();

        $this->actingAs($hcpUser, 'sanctum')
            ->getJson("/api/patient/hcps/{$provider->id}/availability?from=2030-01-07&to=2030-01-07")
            ->assertForbidden();
    }

    public function test_a_guest_cannot_get_availability(): void
    {
        $this->getJson('/api/patient/hcps/1/availability?from=2030-01-07&to=2030-01-07')
            ->assertUnauthorized();
    }

    /**
     * @return array{User, HcpProfile}
     */
    private function createVerifiedHcp(
        VerificationStatus $status = VerificationStatus::VERIFIED
    ): array {
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        $profile = HcpProfile::factory()->for($hcp, 'user')->create();

        HcpVerification::factory()->for($hcp, 'user')->create([
            'status' => $status,
        ]);

        return [$hcp, $profile];
    }
}
