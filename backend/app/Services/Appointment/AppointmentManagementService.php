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
        private readonly AppointmentAvailabilityService $availabilityService
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
            $this->ensureConfirmed($lockedAppointment, 'Only confirmed appointments can be rescheduled.');
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
                ->where('status', AppointmentStatus::CONFIRMED->value)
                ->where('scheduled_start_at', '<', $endAtUtc)
                ->where('scheduled_end_at', '>', $startAtUtc)
                ->exists();

            if ($patientHasConflict) {
                throw new AppointmentSlotUnavailableException;
            }

            $lockedAppointment->update([
                'scheduled_start_at' => $startAtUtc,
                'scheduled_end_at' => $endAtUtc,
                'rescheduled_at' => now(),
                'rescheduled_by_user_id' => $actor->id,
            ]);

            return $lockedAppointment->refresh();
        });
    }

    public function cancel(
        User $actor,
        Appointment $appointment,
        ?string $reason = null
    ): Appointment {
        return DB::transaction(function () use ($actor, $appointment, $reason): Appointment {
            $lockedAppointment = Appointment::query()
                ->whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensureParticipant($actor, $lockedAppointment);
            $this->ensureConfirmed($lockedAppointment, 'Only confirmed appointments can be cancelled.');
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

    public function complete(User $hcp, Appointment $appointment): Appointment
    {
        return DB::transaction(function () use ($hcp, $appointment): Appointment {
            $lockedAppointment = Appointment::query()
                ->whereKey($appointment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($hcp->role !== UserRole::HCP || $lockedAppointment->hcp_user_id !== $hcp->id) {
                throw new AuthorizationException('You are not authorized to complete this appointment.');
            }

            $this->ensureConfirmed($lockedAppointment, 'Only confirmed appointments can be completed.');

            if ($lockedAppointment->scheduled_end_at->isFuture()) {
                throw new AppointmentStateException('An appointment cannot be completed before it ends.');
            }

            $lockedAppointment->update([
                'status' => AppointmentStatus::COMPLETED,
            ]);

            return $lockedAppointment->refresh();
        });
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

    private function ensureConfirmed(Appointment $appointment, string $message): void
    {
        if ($appointment->status !== AppointmentStatus::CONFIRMED) {
            throw new AppointmentStateException($message);
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
