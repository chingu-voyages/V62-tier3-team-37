<?php

namespace Tests\Feature\Auth;

use App\Models\EmailVerificationOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function seedOtp(User $user, string $code = '123456'): void
    {
        EmailVerificationOtp::create([
            'user_id' => $user->id,
            'code' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
            'last_sent_at' => now(),
        ]);
    }

    public function test_email_can_be_verified_with_valid_otp(): void
    {
        $user = User::factory()->unverified()->create();

        $this->seedOtp($user);

        $this->actingAs($user, 'sanctum');

        $response = $this->post('/email/otp/verify', ['code' => '123456']);

        $response->assertStatus(200);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_is_not_verified_with_invalid_otp(): void
    {
        $user = User::factory()->unverified()->create();

        $this->seedOtp($user);

        $this->actingAs($user, 'sanctum');

        $response = $this->post('/email/otp/verify', ['code' => '000000']);

        $response->assertStatus(422);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_email_is_not_verified_with_expired_otp(): void
    {
        $user = User::factory()->unverified()->create();

        EmailVerificationOtp::create([
            'user_id' => $user->id,
            'code' => Hash::make('123456'),
            'attempts' => 0,
            'expires_at' => now()->subMinute(),
            'last_sent_at' => now(),
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->post('/email/otp/verify', ['code' => '123456']);

        $response->assertStatus(422);
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }
}
