<?php

namespace App\Services\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\DayOfWeek;
use App\Enums\UserRole;
use App\Models\Appointment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class AppointmentAvailabilityService
{
    /**
     * @return list<string>
     */
    public function availableSlots(
        User $hcp,
        CarbonInterface $date,
        ?int $excludeAppointmentId = null
    ): array {
        $day = CarbonImmutable::instance($date)->startOfDay();
        $availability = $this->availableSlotsForRange(
            $hcp,
            $day,
            $day,
            $excludeAppointmentId
        );

        return $availability[$day->toDateString()];
    }

    /**
     * @return array<string, list<string>>
     */
    public function availableSlotsForRange(
        User $hcp,
        CarbonInterface $from,
        CarbonInterface $to,
        ?int $excludeAppointmentId = null
    ): array {
        $this->ensureHcp($hcp);

        $rangeStart = CarbonImmutable::instance($from)->startOfDay();
        $rangeEnd = CarbonImmutable::instance($to)
            ->setTimezone($rangeStart->getTimezone())
            ->startOfDay();

        if ($rangeEnd->lessThan($rangeStart)) {
            throw new InvalidArgumentException('The availability end date must not be before the start date.');
        }

        $profile = $hcp->hcpProfile;

        if ($profile === null) {
            return $this->emptyRange($rangeStart, $rangeEnd);
        }

        $availabilityRanges = $profile->availabilitySlots()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $bookedAppointments = $hcp->hcpAppointments()
            ->where('status', AppointmentStatus::CONFIRMED->value)
            ->when(
                $excludeAppointmentId !== null,
                fn ($query) => $query->where('id', '!=', $excludeAppointmentId)
            )
            ->where('scheduled_start_at', '<', $rangeEnd->addDay()->utc())
            ->where('scheduled_end_at', '>', $rangeStart->utc())
            ->get(['scheduled_start_at', 'scheduled_end_at']);

        $now = CarbonImmutable::now($rangeStart->getTimezone());
        $available = [];

        for ($day = $rangeStart; $day->lessThanOrEqualTo($rangeEnd); $day = $day->addDay()) {
            $dayOfWeek = DayOfWeek::from($day->dayOfWeek);
            $dayRanges = $availabilityRanges->filter(
                fn ($range): bool => $range->day_of_week === $dayOfWeek
            );

            $available[$day->toDateString()] = $this->slotsForDay(
                $day,
                $dayRanges,
                $bookedAppointments,
                $now
            );
        }

        return $available;
    }

    /**
     * @param  Collection<int, mixed>  $availabilityRanges
     * @param  Collection<int, Appointment>  $bookedAppointments
     * @return list<string>
     */
    private function slotsForDay(
        CarbonImmutable $day,
        Collection $availabilityRanges,
        Collection $bookedAppointments,
        CarbonImmutable $now
    ): array {
        $available = [];

        foreach ($availabilityRanges as $range) {
            $rangeStart = $day->setTimeFromTimeString((string) $range->start_time);
            $rangeEnd = $day->setTimeFromTimeString((string) $range->end_time);

            for (
                $slotStart = $rangeStart;
                $slotStart->addMinutes(Appointment::DURATION_MINUTES)->lessThanOrEqualTo($rangeEnd);
                $slotStart = $slotStart->addMinutes(Appointment::DURATION_MINUTES)
            ) {
                $slotEnd = $slotStart->addMinutes(Appointment::DURATION_MINUTES);

                if ($slotStart->lessThanOrEqualTo($now)) {
                    continue;
                }

                $overlapsConfirmedAppointment = $bookedAppointments->contains(
                    fn (Appointment $appointment): bool => $appointment->scheduled_start_at->lessThan($slotEnd)
                        && $appointment->scheduled_end_at->greaterThan($slotStart)
                );

                if (! $overlapsConfirmedAppointment) {
                    $available[$slotStart->format('H:i')] = true;
                }
            }
        }

        $slots = array_keys($available);
        sort($slots);

        return $slots;
    }

    /**
     * @return array<string, list<string>>
     */
    private function emptyRange(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $range = [];

        for ($day = $from; $day->lessThanOrEqualTo($to); $day = $day->addDay()) {
            $range[$day->toDateString()] = [];
        }

        return $range;
    }

    private function ensureHcp(User $user): void
    {
        if ($user->role !== UserRole::HCP) {
            throw new AuthorizationException(
                'Only healthcare providers can have appointment availability.'
            );
        }
    }
}
