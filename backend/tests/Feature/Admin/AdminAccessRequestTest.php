<?php

namespace Tests\Feature\Admin;

use App\Enums\AdminAccessStatus;
use App\Enums\UserRole;
use App\Models\AdminAccessRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_can_request_admin_access(): void
    {
        $response = $this->postJson('/api/admin/access-requests', [
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
            'message' => 'I look after the directory.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', AdminAccessStatus::PENDING->value)
            ->assertJsonPath('data.email', 'ada@example.com');

        $this->assertDatabaseHas('admin_access_requests', [
            'email' => 'ada@example.com',
            'status' => AdminAccessStatus::PENDING->value,
        ]);
    }

    public function test_a_second_pending_request_for_the_same_email_is_rejected(): void
    {
        AdminAccessRequest::query()->create([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
            'status' => AdminAccessStatus::PENDING,
        ]);

        $this->postJson('/api/admin/access-requests', [
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_a_signed_in_account_requests_access_for_itself(): void
    {
        $user = User::factory()->create([
            'email' => 'patient@example.com',
            'role' => UserRole::PATIENT,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/admin/access-requests', [
                'first_name' => 'Someone',
                'last_name' => 'Else',
                'email' => 'other@example.com',
            ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'patient@example.com');

        $this->assertDatabaseHas('admin_access_requests', [
            'user_id' => $user->id,
            'email' => 'patient@example.com',
            'first_name' => $user->first_name,
        ]);
    }

    public function test_only_an_admin_can_list_requests(): void
    {
        $patient = User::factory()->create(['role' => UserRole::PATIENT]);

        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/admin/access-requests')
            ->assertForbidden();

        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        AdminAccessRequest::query()->create([
            'first_name' => 'Ada',
            'last_name' => 'Lovelace',
            'email' => 'ada@example.com',
            'status' => AdminAccessStatus::PENDING,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/access-requests')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
