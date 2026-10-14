<?php

namespace Database\Factories;

use App\Enums\AppointmentStatus;
use App\Enums\BookingFor;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    protected $model = Appointment::class;

    public function definition(): array
    {
        $start = now()->addDays(2)->startOfHour();

        return [
            'patient_user_id' => User::factory()->state([
                'role' => UserRole::PATIENT,
            ]),
            'hcp_user_id' => User::factory()->state([
                'role' => UserRole::HCP,
            ]),
            'scheduled_start_at' => $start,
            'scheduled_end_at' => $start->copy()->addMinutes(Appointment::DURATION_MINUTES),
            'status' => AppointmentStatus::CONFIRMED,
            'booking_for' => BookingFor::SELF,
            'attendee_first_name' => fake()->firstName(),
            'attendee_last_name' => fake()->lastName(),
            'attendee_email' => fake()->safeEmail(),
            'attendee_birth_date' => fake()->date(),
            'attendee_gender' => UserGender::MALE,
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
