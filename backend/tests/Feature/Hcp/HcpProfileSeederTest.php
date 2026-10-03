<?php

namespace Tests\Feature\Hcp;

use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\HcpProfile;
use App\Models\User;
use Database\Seeders\HcpProfileSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class HcpProfileSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_a_complete_reusable_hcp_profile(): void
    {
        $this->seed(HcpProfileSeeder::class);
        $this->seed(HcpProfileSeeder::class);

        $this->assertDatabaseCount('users', 1);

        $user = User::query()
            ->where('email', HcpProfileSeeder::DEMO_EMAIL)
            ->firstOrFail();

        /** @var HcpProfile $profile */
        $profile = $user->hcpProfile()->firstOrFail();

        $this->assertSame(UserRole::HCP, $user->role);
        $this->assertTrue(Hash::check(HcpProfileSeeder::DEMO_PASSWORD, $user->password));
        $this->assertSame(VerificationStatus::VERIFIED, $user->hcpVerification?->status);
        $this->assertSame(10, $profile->availabilitySlots()->count());
        $this->assertSame(4, $user->documents()->count());

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/hcp/profile')
            ->assertOk()
            ->assertJsonPath('data.personal_information.full_name', 'John Doe')
            ->assertJsonPath('data.is_verified', true)
            ->assertJsonCount(10, 'data.availability')
            ->assertJsonPath('data.verification.documents.government_id_front', true)
            ->assertJsonPath('data.verification.documents.government_id_back', true)
            ->assertJsonPath('data.verification.documents.medical_license', true)
            ->assertJsonPath('data.verification.documents.qualification', true);
    }
}
