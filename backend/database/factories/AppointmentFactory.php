<?php

namespace Database\Factories;

use App\Enums\AppointmentStatus;
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

    /**
     * Fields here must match the `appointments` table as it exists on this branch.
     *
     * This factory previously described a different visit model - a
     * `CONFIRMED` status, `scheduled_start_at`/`scheduled_end_at` timestamps, and a
     * `booking_for` attendee block - none of which are columns or enum cases here.
     * Nothing referenced it, so the drift went unnoticed and every call would have
     * failed on an unknown enum constant.
     */
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
            'appointment_date' => $start->toDateString(),
            'start_time' => $start->format('H:i:s'),
            'reason' => fake()->optional()->sentence(),
            'status' => AppointmentStatus::BOOKED,
            'summary' => null,
        ];
    }

    /** A visit that has already happened, so results may be attached to it. */
    public function completed(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::COMPLETED]);
    }

    /** A visit the patient has been seen for but not yet closed off. */
    public function arrived(): static
    {
        return $this->state(fn () => ['status' => AppointmentStatus::ARRIVED]);
    }
}
