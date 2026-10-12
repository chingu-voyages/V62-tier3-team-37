<?php

namespace Tests\Feature\Admin;

use App\Enums\AdminAccessStatus;
use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\AdminAccessRequest;
use App\Models\Document;
use App\Models\HcpReport;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminDeskTest extends TestCase
{
    use RefreshDatabase;

    public function test_approving_a_request_makes_that_account_an_admin(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $applicant = User::factory()->create([
            'role' => UserRole::PATIENT,
            'email' => 'future-admin@example.com',
        ]);
        $request = AdminAccessRequest::query()->create([
            'user_id' => $applicant->id,
            'first_name' => $applicant->first_name,
            'last_name' => $applicant->last_name,
            'email' => $applicant->email,
            'status' => AdminAccessStatus::PENDING,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/access-requests/{$request->id}/approve")
            ->assertOk()
            ->assertJsonPath('data.status', AdminAccessStatus::APPROVED->value);

        $this->assertSame(UserRole::ADMIN, $applicant->fresh()->role);
    }

    public function test_a_request_without_an_account_cannot_be_approved(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $request = AdminAccessRequest::query()->create([
            'first_name' => 'No',
            'last_name' => 'Account',
            'email' => 'missing@example.com',
            'status' => AdminAccessStatus::PENDING,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/access-requests/{$request->id}/approve")
            ->assertUnprocessable();
    }

    public function test_an_admin_can_block_a_patient(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/patients/{$patient->id}/block")
            ->assertOk()
            ->assertJsonPath('data.status', UserStatus::DISABLED->value);

        $this->actingAs($patient->fresh(), 'sanctum')
            ->getJson('/api/user')
            ->assertForbidden();
    }

    public function test_an_admin_can_resolve_an_open_report(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $clinician = User::factory()->create(['role' => UserRole::HCP]);
        $report = HcpReport::query()->create([
            'hcp_user_id' => $clinician->id,
            'reason' => 'Late visit',
            'status' => ReportStatus::OPEN,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/reports/{$report->id}/resolve")
            ->assertOk()
            ->assertJsonPath('data.status', ReportStatus::RESOLVED->value);
    }

    public function test_an_admin_cannot_open_a_patient_medical_file(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);
        $document = Document::factory()->create([
            'user_id' => $patient->id,
            'category' => DocumentCategory::MEDICAL,
            'document_type' => DocumentType::MEDICAL_EXAMINATION,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->get("/api/admin/documents/{$document->id}")
            ->assertForbidden();
    }

    public function test_an_admin_can_open_a_clinician_credential(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('credentials/license.pdf', 'license');

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $clinician = User::factory()->create(['role' => UserRole::HCP]);
        $document = Document::factory()->create([
            'user_id' => $clinician->id,
            'category' => DocumentCategory::CREDENTIAL,
            'document_type' => DocumentType::MEDICAL_LICENSE,
            'storage_path' => 'credentials/license.pdf',
            'mime_type' => 'application/pdf',
            'original_file_name' => 'license.pdf',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->get("/api/admin/documents/{$document->id}")
            ->assertOk();
    }

    public function test_a_patient_can_review_an_accepted_clinician(): void
    {
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);
        $clinician = User::factory()->create(['role' => UserRole::HCP]);
        HcpVerification::factory()->create([
            'user_id' => $clinician->id,
            'status' => VerificationStatus::VERIFIED,
        ]);

        $this->actingAs($patient, 'sanctum')
            ->postJson("/api/patient/clinicians/{$clinician->id}/reviews", [
                'rating' => 5,
                'comment' => 'Clear and kind.',
            ])
            ->assertOk()
            ->assertJsonPath('data.rating', 5);
    }
}
