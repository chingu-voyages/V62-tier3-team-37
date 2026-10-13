<?php

namespace Tests\Feature\Hcp;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HcpConnectedPatientTest extends TestCase
{
    use RefreshDatabase;

    public function test_hcp_lists_unique_patients_from_non_cancelled_appointments(): void
    {
        $hcp = User::factory()->create(['role' => UserRole::HCP]);
        HcpProfile::factory()->for($hcp, 'user')->create();
        HcpVerification::factory()->for($hcp, 'user')->create();
        $connectedPatient = User::factory()->create();
        $cancelledOnlyPatient = User::factory()->create();

        Appointment::factory()->count(2)
            ->for($connectedPatient, 'patient')
            ->for($hcp, 'hcp')
            ->create();
        Appointment::factory()
            ->for($cancelledOnlyPatient, 'patient')
            ->for($hcp, 'hcp')
            ->create(['status' => AppointmentStatus::CANCELLED]);

        $this->actingAs($hcp, 'sanctum')
            ->getJson('/api/hcp/patients')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $connectedPatient->id);
    }
}
