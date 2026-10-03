<?php

namespace Database\Factories;

use App\Enums\LivenessStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\HcpVerification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HcpVerification>
 */
class HcpVerificationFactory extends Factory
{
    protected $model = HcpVerification::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state([
                'role' => UserRole::HCP,
            ]),
            'liveness_status' => LivenessStatus::PASSED,
            'consent_accepted_at' => now()->subDays(2),
            'status' => VerificationStatus::VERIFIED,
            'submitted_at' => now()->subDays(2),
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ];
    }
}
