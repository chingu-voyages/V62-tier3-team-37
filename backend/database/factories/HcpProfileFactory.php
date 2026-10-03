<?php

namespace Database\Factories;

use App\Enums\ConsultationType;
use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Models\HcpProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HcpProfile>
 */
class HcpProfileFactory extends Factory
{
    protected $model = HcpProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state([
                'role' => UserRole::HCP,
            ]),
            'specialty' => fake()->randomElement(Specialty::cases()),
            'years_of_experience' => fake()->numberBetween(1, 30),
            'medical_license_number' => 'ML-'.fake()->unique()->numerify('######'),
            'license_issuing_authority' => fake()->company(),
            'sub_specialty' => fake()->optional()->randomElement([
                'Interventional Cardiology',
                'Clinical Cardiology',
                'Preventive Medicine',
            ]),
            'workplace_name' => fake()->company(),
            'workplace_address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'bio' => fake()->paragraph(),
            'languages' => ['Arabic', 'English'],
            'consultation_types' => [
                ConsultationType::IN_PERSON->value,
                ConsultationType::VIDEO->value,
            ],
        ];
    }
}
