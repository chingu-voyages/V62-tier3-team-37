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

    public function test_a_verified_authenticated_user_can_get_availability_for_a_date_range(): void
    {
        $monday = CarbonImmutable::parse('2030-01-07');
        [$hcp, $profile] = $this->createVerifiedHcp();
        $user = User::factory()->create();

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '12:00',
        ]);
        Appointment::factory()->for($hcp, 'hcp')->create([
            'scheduled_start_at' => $monday->setTime(10, 0),
            'scheduled_end_at' => $monday->setTime(11, 0),
            'status' => AppointmentStatus::BOOKED,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/hcps/{$hcp->id}/availability?from=2030-01-07&to=2030-01-08")
            ->assertOk()
            ->assertJsonPath('data.hcp_id', $hcp->id)
            ->assertJsonPath('data.duration_minutes', 30)
            ->assertJsonPath('data.dates.0.date', '2030-01-07')
            ->assertJsonPath('data.dates.0.slots', ['09:00', '09:30', '11:00', '11:30'])
            ->assertJsonPath('data.dates.1.date', '2030-01-08')
            ->assertJsonPath('data.dates.1.slots', []);
    }

    public function test_the_availability_range_may_not_exceed_thirty_one_days(): void
    {
        [$hcp] = $this->createVerifiedHcp();
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/hcps/{$hcp->id}/availability?from=2030-01-01&to=2030-02-01")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('to');
    }

    public function test_an_unverified_hcp_is_not_exposed(): void
    {
        [$hcp] = $this->createVerifiedHcp(VerificationStatus::UNDER_REVIEW);
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/hcps/{$hcp->id}/availability?from=2030-01-07&to=2030-01-07")
            ->assertNotFound();
    }

    public function test_an_authenticated_non_patient_can_get_availability(): void
    {
        $hcpUser = User::factory()->create([
            'role' => UserRole::HCP,
        ]);
        [$provider] = $this->createVerifiedHcp();

        $this->actingAs($hcpUser, 'sanctum')
            ->getJson("/api/hcps/{$provider->id}/availability?from=2030-01-07&to=2030-01-07")
            ->assertOk();
    }

    public function test_availability_requires_authentication(): void
    {
        [$hcp] = $this->createVerifiedHcp();

        $this->getJson("/api/hcps/{$hcp->id}/availability?from=2030-01-07&to=2030-01-07")
            ->assertUnauthorized();
    }

    public function test_availability_requires_a_verified_email(): void
    {
        $user = User::factory()->unverified()->create();
        [$hcp] = $this->createVerifiedHcp();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/hcps/{$hcp->id}/availability?from=2030-01-07&to=2030-01-07")
            ->assertStatus(409)
            ->assertJsonPath('message', 'Your email address is not verified.');
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
