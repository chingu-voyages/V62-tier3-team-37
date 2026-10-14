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
            'status' => AppointmentStatus::BOOKED,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->getJson("/api/patient/hcps/{$hcp->id}/availability?from=2030-01-07&to=2030-01-08")
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
     * The clinician's own diary, for rescheduling.
     *
     * This is the endpoint that answers a 403 on the patient one: that check is
     * `role === PATIENT`, which is correct there and wrong here, because the
     * reschedule dialog is opened by the clinician.
     */
    public function test_a_clinician_can_read_their_own_availability(): void
    {
        [$hcp, $profile] = $this->createVerifiedHcp();
        $monday = CarbonImmutable::parse('2030-01-07');

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '12:00',
        ]);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/profile/availability?from=2030-01-07&to=2030-01-08')
            ->assertOk()
            ->assertJsonPath('data.hcp_id', $hcp->id)
            ->assertJsonPath('data.dates.0.date', '2030-01-07')
            ->assertJsonPath('data.dates.0.slots', ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
    }

    /**
     * The id comes from the session, so the answer is always the caller's diary.
     *
     * Two clinicians with different diaries: the caller must get its own and never
     * the other's, which is the whole reason this is a separate endpoint.
     */
    public function test_the_clinician_availability_response_is_scoped_to_the_caller(): void
    {
        [$hcp, $hcpProfile] = $this->createVerifiedHcp();
        [$other, $otherProfile] = $this->createVerifiedHcp();
        $monday = CarbonImmutable::parse('2030-01-07');

        HcpAvailabilitySlot::factory()->for($hcpProfile)->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '10:00',
        ]);

        HcpAvailabilitySlot::factory()->for($otherProfile)->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '14:00',
            'end_time' => '15:00',
        ]);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/profile/availability?from=2030-01-07&to=2030-01-07')
            ->assertOk()
            ->assertJsonPath('data.hcp_id', $hcp->id)
            ->assertJsonPath('data.dates.0.slots', ['09:00', '09:30']);
    }

    /**
     * Excluding the visit being moved must release the slot it currently holds,
     * otherwise the one time the clinician would plausibly pick is missing.
     */
    public function test_excluding_an_appointment_frees_the_slot_it_occupies(): void
    {
        $patient = User::factory()->create();
        [$hcp, $profile] = $this->createVerifiedHcp();
        $monday = CarbonImmutable::parse('2030-01-07');

        HcpAvailabilitySlot::factory()->for($profile)->create([
            'day_of_week' => DayOfWeek::MONDAY,
            'start_time' => '09:00',
            'end_time' => '11:00',
        ]);

        $appointment = Appointment::factory()->for($hcp, 'hcp')->for($patient, 'patient')->create([
            'scheduled_start_at' => $monday->setTime(10, 0),
            'scheduled_end_at' => $monday->setTime(10, 30),
            'status' => AppointmentStatus::BOOKED,
        ]);

        // 10:00 is taken by the visit itself, so it is the one missing slot.
        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/profile/availability?from=2030-01-07&to=2030-01-07')
            ->assertOk()
            ->assertJsonPath('data.dates.0.slots', ['09:00', '09:30', '10:30']);

        // Excluding it puts that slot back, which is what makes this usable for
        // a reschedule rather than a list that hides the time being moved from.
        $this->actingAs($hcp, 'sanctum')
            ->getJson("/api/hcp/profile/availability?from=2030-01-07&to=2030-01-07&exclude_appointment={$appointment->id}")
            ->assertOk()
            ->assertJsonPath('data.dates.0.slots', ['09:00', '09:30', '10:00', '10:30']);
    }

    /**
     * Another clinician's visit id must not be silently ignored: that would point
     * the reschedule at the wrong slot.
     */
    public function test_a_clinician_cannot_exclude_another_clinicians_appointment(): void
    {
        [$hcp] = $this->createVerifiedHcp();
        [$other] = $this->createVerifiedHcp();

        $foreign = Appointment::factory()
            ->for($other, 'hcp')
            ->for(User::factory(), 'patient')
            ->create([
                'scheduled_start_at' => '2030-01-07 10:00:00',
                'scheduled_end_at' => '2030-01-07 10:30:00',
                'status' => AppointmentStatus::BOOKED,
            ]);

        $this->actingAs($hcp, 'sanctum')
            ->getJson("/api/hcp/profile/availability?from=2030-01-07&to=2030-01-07&exclude_appointment={$foreign->id}")
            ->assertNotFound();
    }

    /**
     * Same ceiling as the patient endpoint, so the two cannot drift.
     */
    public function test_the_clinician_availability_range_is_capped(): void
    {
        [$hcp] = $this->createVerifiedHcp();

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/profile/availability?from=2030-01-01&to=2030-02-01')
            ->assertUnprocessable();
    }

    /**
     * Reading your own diary is not gated on verification, matching the write side.
     *
     * `PUT` and `DELETE /hcp/profile/availability` are not behind `hcp.verified`
     * either, and a clinician sets up availability while onboarding. What matters
     * is that the answer is only ever their own - asserted by the scoping test
     * above - not that the account has been approved.
     */
    public function test_an_unverified_clinician_only_sees_their_own_availability(): void
    {
        [$hcp] = $this->createVerifiedHcp(VerificationStatus::UNDER_REVIEW);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/profile/availability?from=2030-01-07&to=2030-01-07')
            ->assertOk()
            ->assertJsonPath('data.hcp_id', $hcp->id);
    }

    public function test_a_guest_cannot_read_clinician_availability(): void
    {
        $this->getJson('/api/hcp/profile/availability?from=2030-01-07&to=2030-01-07')
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
