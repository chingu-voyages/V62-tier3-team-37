<?php

namespace Tests\Feature\Admin;

use App\Enums\AdminAccessRequestStatus;
use App\Enums\AppointmentStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\AdminAccessRequest;
use App\Models\Appointment;
use App\Models\HcpProfile;
use App\Models\HcpVerification;
use App\Models\Report;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_routes_are_protected_by_role(): void
    {
        $patient = User::factory()->create();

        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertForbidden();
    }

    public function test_public_access_request_can_be_approved_and_creates_an_admin(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/admin/access-requests', [
            'first_name' => 'Portal',
            'last_name' => 'Admin',
            'email' => 'PORTAL.ADMIN@example.com',
            'reason' => 'Operations team',
        ])->assertCreated()
            ->assertJsonPath('data.status', AdminAccessRequestStatus::PENDING->value);

        $requestId = $response->json('data.id');
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/access-requests/{$requestId}", [
                'status' => AdminAccessRequestStatus::APPROVED->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AdminAccessRequestStatus::APPROVED->value);

        $approvedAdmin = User::query()->where('email', 'portal.admin@example.com')->firstOrFail();
        $this->assertSame(UserRole::ADMIN, $approvedAdmin->role);
        $this->assertSame(UserStatus::ACTIVE, $approvedAdmin->status);
        Notification::assertSentTo($approvedAdmin, ResetPassword::class);
    }

    public function test_admin_can_review_and_block_a_clinician(): void
    {
        $admin = $this->admin();
        $hcp = User::factory()->create(['role' => UserRole::HCP]);
        HcpProfile::factory()->for($hcp, 'user')->create();
        HcpVerification::factory()->for($hcp, 'user')->create([
            'status' => VerificationStatus::UNDER_REVIEW,
            'reviewed_at' => null,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/clinicians/{$hcp->id}/verification", [
                'status' => VerificationStatus::VERIFIED->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.hcp_verification.status', VerificationStatus::VERIFIED->value);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/clinicians/{$hcp->id}/status", [
                'status' => UserStatus::DISABLED->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', UserStatus::DISABLED->value);
    }

    public function test_admin_can_disable_and_restore_a_patient_account(): void
    {
        $admin = $this->admin();
        $patient = User::factory()->create();

        foreach ([UserStatus::DISABLED, UserStatus::ACTIVE] as $status) {
            $this->actingAs($admin, 'sanctum')
                ->patchJson("/api/admin/patients/{$patient->id}/status", [
                    'status' => $status->value,
                ])
                ->assertOk()
                ->assertJsonPath('data.status', $status->value);
        }
    }

    public function test_patient_report_can_be_resolved_by_admin(): void
    {
        $admin = $this->admin();
        $patient = User::factory()->create();
        $hcp = User::factory()->create(['role' => UserRole::HCP]);
        $appointment = Appointment::factory()
            ->for($patient, 'patient')
            ->for($hcp, 'hcp')
            ->create(['status' => AppointmentStatus::COMPLETED]);

        $response = $this->actingAs($patient, 'sanctum')
            ->postJson("/api/patient/appointments/{$appointment->id}/reports", [
                'message' => 'The visit needs review.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', ReportStatus::OPEN->value);

        $reportId = $response->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/reports/{$reportId}", [
                'status' => ReportStatus::RESOLVED->value,
                'resolution_note' => 'Reviewed with the clinician.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', ReportStatus::RESOLVED->value);
    }

    public function test_patient_cannot_create_two_open_reports_for_the_same_appointment(): void
    {
        $patient = User::factory()->create();
        $hcp = User::factory()->create(['role' => UserRole::HCP]);
        $appointment = Appointment::factory()
            ->for($patient, 'patient')
            ->for($hcp, 'hcp')
            ->create();

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/patient/appointments/{$appointment->id}/reports", [
                'message' => 'First report.',
            ])
            ->assertCreated();

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/patient/appointments/{$appointment->id}/reports", [
                'message' => 'Duplicate report.',
            ])
            ->assertConflict()
            ->assertJsonPath('message', 'An open report already exists for this appointment.');

        $this->assertDatabaseCount('reports', 1);
    }

    public function test_patient_can_report_the_same_appointment_after_the_previous_report_is_closed(): void
    {
        $admin = $this->admin();
        $patient = User::factory()->create();
        $hcp = User::factory()->create(['role' => UserRole::HCP]);
        $appointment = Appointment::factory()
            ->for($patient, 'patient')
            ->for($hcp, 'hcp')
            ->create();

        $firstReportId = $this->actingAs($patient, 'sanctum')
            ->postJson("/api/patient/appointments/{$appointment->id}/reports", [
                'message' => 'First report.',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/reports/{$firstReportId}", [
                'status' => ReportStatus::DISMISSED->value,
                'resolution_note' => 'Closed after review.',
            ])
            ->assertOk();

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/patient/appointments/{$appointment->id}/reports", [
                'message' => 'New report after the first was closed.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', ReportStatus::OPEN->value);

        $this->assertDatabaseCount('reports', 2);
    }

    public function test_dashboard_returns_the_expected_queue_counts(): void
    {
        $admin = $this->admin();
        User::factory()->count(2)->create();
        AdminAccessRequest::query()->create([
            'first_name' => 'New',
            'last_name' => 'Admin',
            'email' => 'new-admin@example.com',
            'status' => AdminAccessRequestStatus::PENDING,
        ]);
        $reporter = User::factory()->create();
        $hcp = User::factory()->create(['role' => UserRole::HCP]);
        Report::query()->create([
            'reporter_user_id' => $reporter->id,
            'reported_hcp_user_id' => $hcp->id,
            'message' => 'Review this clinician.',
            'status' => ReportStatus::OPEN,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.access_requests', 1)
            ->assertJsonPath('data.open_reports', 1)
            ->assertJsonPath('data.patients', 3);
    }

    private function admin(): User
    {
        return User::factory()->create([
            'role' => UserRole::ADMIN,
            'status' => UserStatus::ACTIVE,
        ]);
    }
}
