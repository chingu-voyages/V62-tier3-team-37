<?php

namespace Database\Factories;

use App\Enums\DayOfWeek;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<HcpAvailabilitySlot>
 */
class HcpAvailabilitySlotFactory extends Factory
{
    protected $model = HcpAvailabilitySlot::class;

    public function definition(): array
    {
        return [
            'hcp_profile_id' => HcpProfile::factory(),
            'day_of_week' => fake()->randomElement(DayOfWeek::cases()),
            'start_time' => '09:00',
            'end_time' => '12:00',
        ];
    }
}
