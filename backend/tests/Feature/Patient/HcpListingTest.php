<?php

namespace Tests\Feature\Patient;

use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HcpListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_patient_can_list_active_verified_hcps(): void
    {
        $patient = User::factory()->create();
        $visibleHcp = $this->createHcp();
        $this->createHcp(VerificationStatus::UNDER_REVIEW);
        $this->createHcp(VerificationStatus::VERIFIED, UserStatus::DISABLED);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/hcps')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visibleHcp->id)
            ->assertJsonPath(
                'data.0.name',
                trim("{$visibleHcp->first_name} {$visibleHcp->last_name}")
            )
            ->assertJsonPath('data.0.specialty', Specialty::CARDIOLOGY->value)
            ->assertJsonPath('meta.per_page', 10);
    }

    public function test_a_guest_cannot_list_hcps(): void
    {
        $this->getJson('/api/patient/hcps')
            ->assertUnauthorized();
    }

    public function test_a_patient_can_filter_hcps_by_name_specialty_location_and_insurance(): void
    {
        $patient = User::factory()->create();
        $matchingHcp = $this->createHcp();
        $matchingHcp->update(['first_name' => 'Mona', 'last_name' => 'Sayed']);
        $matchingHcp->hcpProfile->update([
            'clinic_city' => 'Cairo',
            'clinic_area' => 'Heliopolis',
            'clinic_street' => 'Health Street',
            'accepted_insurances' => ['AXA', 'MetLife'],
        ]);
        $this->createHcp();

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/patient/hcps?name=Mona%20Sayed&specialty=CARDIOLOGY&city=Cairo&area=Heliopolis&insurance=AXA')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $matchingHcp->id)
            ->assertJsonPath('data.0.clinic.city', 'Cairo')
            ->assertJsonPath('data.0.clinic.area', 'Heliopolis')
            ->assertJsonPath('data.0.accepted_insurances.0', 'AXA');
    }

    private function createHcp(
        VerificationStatus $verificationStatus = VerificationStatus::VERIFIED,
        UserStatus $userStatus = UserStatus::ACTIVE
    ): User {
        $hcp = User::factory()->create([
            'role' => UserRole::HCP,
            'status' => $userStatus,
        ]);

        HcpProfile::factory()->for($hcp, 'user')->create([
            'specialty' => Specialty::CARDIOLOGY,
        ]);
        HcpVerification::factory()->for($hcp, 'user')->create([
            'status' => $verificationStatus,
        ]);

        return $hcp;
    }
}
