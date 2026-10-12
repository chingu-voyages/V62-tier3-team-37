<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\HcpProfile;
use App\Models\HcpReport;
use App\Models\HcpReview;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminClinicianTest extends TestCase
{
    use RefreshDatabase;

    public function test_an_admin_sees_a_clinician_who_signed_up(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $clinician = User::factory()->create([
            'role' => UserRole::HCP,
            'first_name' => 'Lina',
            'last_name' => 'Hassan',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/clinicians')
            ->assertOk()
            ->assertJsonPath('data.0.first_name', 'Lina')
            ->assertJsonPath('data.0.last_name', 'Hassan')
            ->assertJsonPath('data.0.id', $clinician->id);
    }

    public function test_a_patient_cannot_open_the_clinician_list(): void
    {
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/admin/clinicians')
            ->assertForbidden();
    }

    public function test_an_admin_can_block_and_unblock_a_clinician(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $clinician = HcpProfile::factory()->create()->user;

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/clinicians/{$clinician->id}/block")
            ->assertOk()
            ->assertJsonPath('data.status', UserStatus::DISABLED->value);

        $this->assertSame(UserStatus::DISABLED, $clinician->fresh()->status);

        $this->actingAs($clinician->fresh(), 'sanctum')
            ->getJson('/api/user')
            ->assertForbidden();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/clinicians/{$clinician->id}/unblock")
            ->assertOk()
            ->assertJsonPath('data.status', UserStatus::ACTIVE->value);
    }

    public function test_detail_includes_reviews_and_reports(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $clinician = User::factory()->create(['role' => UserRole::HCP]);
        $patient = User::factory()->create([
            'role' => UserRole::PATIENT,
            'first_name' => 'Nora',
            'last_name' => 'Adel',
        ]);

        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::UNDER_REVIEW,
        ]);

        HcpReview::query()->create([
            'hcp_user_id' => $clinician->id,
            'patient_user_id' => $patient->id,
            'rating' => 2,
            'comment' => 'The visit felt rushed.',
        ]);

        HcpReport::query()->create([
            'hcp_user_id' => $clinician->id,
            'reporter_user_id' => $patient->id,
            'reason' => 'Unsafe advice',
            'details' => 'Asked to ignore the prescription.',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/admin/clinicians/{$clinician->id}")
            ->assertOk()
            ->assertJsonPath('data.reviews_count', 1)
            ->assertJsonPath('data.reports_count', 1)
            ->assertJsonPath('data.reviews.0.comment', 'The visit felt rushed.')
            ->assertJsonPath('data.reports.0.reason', 'Unsafe advice');
    }
}
