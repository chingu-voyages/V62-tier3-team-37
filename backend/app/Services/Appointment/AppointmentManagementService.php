<?php

namespace App\Services\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Exceptions\AppointmentSlotUnavailableException;
use App\Exceptions\AppointmentStateException;
use App\Models\Appointment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class AppointmentManagementService
{
    public function __construct(
        private readonly AppointmentAvailabilityService $availabilityService,
        private readonly AppointmentBookingService $bookingService
    ) {}

    public function reschedule(
        User $actor,
        Appointment $appointment,
        CarbonInterface $start
    ): Appointment {
        $startAt = CarbonImmutable::instance($start);

        if ($startAt->second !== 0 || $startAt->micro !== 0) {
            throw new AppointmentSlotUnavailableException;
        }

        return DB::transaction(function () use ($actor, $appointment, $startAt): Appointment {
            [$patient, $hcp] = $this->lockParticipants($appointment);

            $lockedAppointment = Appointment::query()
                ->whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureParticipant($actor, $lockedAppointment);
            $this->ensureOneOf(
                $lockedAppointment,
                [AppointmentStatus::BOOKED, AppointmentStatus::RESCHEDULED],
                'Only booked or rescheduled appointments can be rescheduled.'
            );
            $this->ensureNotStarted($lockedAppointment, 'An appointment cannot be rescheduled after it starts.');

            $availableSlots = $this->availabilityService->availableSlots(
                $hcp,
                $startAt,
                $lockedAppointment->id
            );

            if (! in_array($startAt->format('H:i'), $availableSlots, true)) {
                throw new AppointmentSlotUnavailableException;
            }

            $endAt = $startAt->addMinutes(Appointment::DURATION_MINUTES);
            $startAtUtc = $startAt->utc();
            $endAtUtc = $endAt->utc();

            $patientHasConflict = $patient->patientAppointments()
                ->whereKeyNot($lockedAppointment->id)
                ->whereIn('status', [
                    AppointmentStatus::BOOKED->value,
                    AppointmentStatus::RESCHEDULED->value,
                    AppointmentStatus::ARRIVED->value,
                ])
                ->where('scheduled_start_at', '<', $endAtUtc)
                ->where('scheduled_end_at', '>', $startAtUtc)
                ->exists();

            if ($patientHasConflict) {
                throw new AppointmentSlotUnavailableException;
            }

            $lockedAppointment->update([
                'scheduled_start_at' => $startAtUtc,
                'scheduled_end_at' => $endAtUtc,
                'status' => AppointmentStatus::RESCHEDULED,
                'rescheduled_at' => now(),
                'rescheduled_by_user_id' => $actor->id,
            ]);

            return $lockedAppointment->refresh();
        });
    }

    public function cancel(
        User $actor,
        Appointment $appointment,
        string $reason
    ): Appointment {
        return DB::transaction(function () use ($actor, $appointment, $reason): Appointment {
            $lockedAppointment = Appointment::query()
                ->whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureParticipant($actor, $lockedAppointment);
            $this->ensureOneOf(
                $lockedAppointment,
                [AppointmentStatus::BOOKED, AppointmentStatus::RESCHEDULED],
                'Only booked or rescheduled appointments can be cancelled.'
            );
            $this->ensureNotStarted($lockedAppointment, 'An appointment cannot be cancelled after it starts.');

            $lockedAppointment->update([
                'status' => AppointmentStatus::CANCELLED,
                'cancelled_at' => now(),
                'cancelled_by_user_id' => $actor->id,
                'cancellation_reason' => $reason,
            ]);

            return $lockedAppointment->refresh();
        });
    }

    public function updateAttendanceStatus(
        User $hcp,
        Appointment $appointment,
        AppointmentStatus $status
    ): Appointment {
        return DB::transaction(function () use ($hcp, $appointment, $status): Appointment {
            $lockedAppointment = Appointment::query()
                ->whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureOwningHcp($hcp, $lockedAppointment);
            $this->ensureOneOf(
                $lockedAppointment,
                [AppointmentStatus::BOOKED, AppointmentStatus::RESCHEDULED],
                'Only booked or rescheduled appointments can have attendance recorded.'
            );

            if (! in_array($status, [AppointmentStatus::ARRIVED, AppointmentStatus::NO_SHOW], true)) {
                throw new AppointmentStateException('Status must be ARRIVED or NO_SHOW.');
            }

            $lockedAppointment->update([
                'status' => $status,
                'arrived_at' => $status === AppointmentStatus::ARRIVED ? now() : null,
                'no_show_at' => $status === AppointmentStatus::NO_SHOW ? now() : null,
            ]);

            return $lockedAppointment->refresh();
        });
    }

    public function saveSummary(User $hcp, Appointment $appointment, string $summary): Appointment
    {
        return DB::transaction(function () use ($hcp, $appointment, $summary): Appointment {
            $lockedAppointment = Appointment::query()
                ->whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureOwningHcp($hcp, $lockedAppointment);
            $this->ensureOneOf(
                $lockedAppointment,
                [AppointmentStatus::ARRIVED],
                'A summary can only be saved after the patient arrives.'
            );

            $lockedAppointment->update([
                'medical_summary' => $summary,
                'status' => AppointmentStatus::COMPLETED,
                'completed_at' => now(),
            ]);

            return $lockedAppointment->refresh();
        });
    }

    public function createFollowUp(
        User $hcp,
        Appointment $appointment,
        CarbonInterface $start
    ): Appointment {
        $this->ensureOwningHcp($hcp, $appointment);

        if ($appointment->status !== AppointmentStatus::COMPLETED) {
            throw new AppointmentStateException('A follow-up can only be booked after a completed appointment.');
        }

        $patient = $appointment->patient()->firstOrFail();
        $attendee = [
            'first_name' => $appointment->attendee_first_name,
            'last_name' => $appointment->attendee_last_name,
            'email' => $appointment->attendee_email,
            'birth_date' => $appointment->attendee_birth_date->toDateString(),
            'gender' => $appointment->attendee_gender,
        ];

        $followUp = $this->bookingService->book(
            $patient,
            $hcp,
            $start,
            $appointment->booking_for,
            $attendee
        );

        $followUp->update(['parent_appointment_id' => $appointment->id]);

        return $followUp->refresh();
    }

    private function ensureParticipant(User $actor, Appointment $appointment): void
    {
        if (
            $appointment->patient_user_id !== $actor->id
            && $appointment->hcp_user_id !== $actor->id
        ) {
            throw new AuthorizationException('You are not authorized to manage this appointment.');
        }
    }

    /**
     * @param  list<AppointmentStatus>  $statuses
     */
    private function ensureOneOf(Appointment $appointment, array $statuses, string $message): void
    {
        if (! in_array($appointment->status, $statuses, true)) {
            throw new AppointmentStateException($message);
        }
    }

    private function ensureOwningHcp(User $hcp, Appointment $appointment): void
    {
        if ($hcp->role !== UserRole::HCP || $appointment->hcp_user_id !== $hcp->id) {
            throw new AuthorizationException('You are not authorized to manage this appointment.');
        }
    }

    private function ensureNotStarted(Appointment $appointment, string $message): void
    {
        if ($appointment->scheduled_start_at->lessThanOrEqualTo(now())) {
            throw new AppointmentStateException($message);
        }
    }

    /**
     * @return array{User, User}
     */
    private function lockParticipants(Appointment $appointment): array
    {
        $users = User::query()
            ->whereKey([$appointment->patient_user_id, $appointment->hcp_user_id])
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $patient = $users->get($appointment->patient_user_id);
        $hcp = $users->get($appointment->hcp_user_id);

        if (! $patient instanceof User || ! $hcp instanceof User) {
            throw (new ModelNotFoundException)->setModel(User::class);
        }

        return [$patient, $hcp];
    }
}
