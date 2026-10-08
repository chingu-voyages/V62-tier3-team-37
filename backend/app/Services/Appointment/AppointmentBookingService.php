<?php

namespace App\Services\Appointment;

use App\Enums\AppointmentStatus;
use App\Enums\BookingFor;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Exceptions\AppointmentSlotUnavailableException;
use App\Models\Appointment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AppointmentBookingService
{
    public function __construct(
        private readonly AppointmentAvailabilityService $availabilityService
    ) {}

    /**
     * @param  array{
     *     first_name?: string,
     *     last_name?: string,
     *     email?: string,
     *     birth_date?: string,
     *     gender?: UserGender|string
     * }  $attendee
     */
    public function book(
        User $patient,
        User $hcp,
        CarbonInterface $start,
        BookingFor $bookingFor,
        array $attendee = [],
        ?string $notes = null,
    ): Appointment {
        $startAt = CarbonImmutable::instance($start);

        if ($startAt->second !== 0 || $startAt->micro !== 0) {
            throw new AppointmentSlotUnavailableException;
        }

        return DB::transaction(function () use (
            $patient,
            $hcp,
            $startAt,
            $bookingFor,
            $attendee,
            $notes
        ): Appointment {
            [$lockedPatient, $lockedHcp] = $this->lockParticipants($patient, $hcp);

            $this->ensurePatientCanBook($lockedPatient);
            $this->ensureHcpCanBeBooked($lockedHcp);

            $availableSlots = $this->availabilityService->availableSlots($lockedHcp, $startAt);

            if (! in_array($startAt->format('H:i'), $availableSlots, true)) {
                throw new AppointmentSlotUnavailableException;
            }

            $endAt = $startAt->addMinutes(Appointment::DURATION_MINUTES);
            $startAtUtc = $startAt->utc();
            $endAtUtc = $endAt->utc();

            $patientHasConflict = $lockedPatient->patientAppointments()
                ->where('status', AppointmentStatus::CONFIRMED->value)
                ->where('scheduled_start_at', '<', $endAtUtc)
                ->where('scheduled_end_at', '>', $startAtUtc)
                ->exists();

            if ($patientHasConflict) {
                throw new AppointmentSlotUnavailableException;
            }

            $attendeeData = $this->attendeeData($lockedPatient, $bookingFor, $attendee);

            return Appointment::query()->create([
                'patient_user_id' => $lockedPatient->id,
                'hcp_user_id' => $lockedHcp->id,
                'scheduled_start_at' => $startAtUtc,
                'scheduled_end_at' => $endAtUtc,
                'status' => AppointmentStatus::CONFIRMED,
                'booking_for' => $bookingFor,
                ...$attendeeData,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * @return array{User, User}
     */
    private function lockParticipants(User $patient, User $hcp): array
    {
        $users = User::query()
            ->whereKey([$patient->id, $hcp->id])
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $lockedPatient = $users->get($patient->id);
        $lockedHcp = $users->get($hcp->id);

        if (! $lockedPatient instanceof User || ! $lockedHcp instanceof User) {
            throw (new ModelNotFoundException)->setModel(User::class);
        }

        return [$lockedPatient, $lockedHcp];
    }

    private function ensurePatientCanBook(User $patient): void
    {
        if ($patient->role !== UserRole::PATIENT || $patient->status !== UserStatus::ACTIVE) {
            throw new AuthorizationException('Only active patients can book appointments.');
        }
    }

    private function ensureHcpCanBeBooked(User $hcp): void
    {
        if (
            $hcp->role !== UserRole::HCP
            || $hcp->status !== UserStatus::ACTIVE
            || $hcp->hcpVerification?->status !== VerificationStatus::VERIFIED
        ) {
            throw new AuthorizationException('The healthcare provider cannot be booked.');
        }
    }

    /**
     * @param  array{
     *     first_name?: string,
     *     last_name?: string,
     *     email?: string,
     *     birth_date?: string,
     *     gender?: UserGender|string
     * }  $attendee
     * @return array{
     *     attendee_first_name: string,
     *     attendee_last_name: string,
     *     attendee_email: string,
     *     attendee_birth_date: mixed,
     *     attendee_gender: UserGender
     * }
     */
    private function attendeeData(User $patient, BookingFor $bookingFor, array $attendee): array
    {
        if ($bookingFor === BookingFor::SELF) {
            return [
                'attendee_first_name' => $patient->first_name,
                'attendee_last_name' => $patient->last_name,
                'attendee_email' => $patient->email,
                'attendee_birth_date' => $patient->birth_date,
                'attendee_gender' => $patient->gender,
            ];
        }

        $requiredFields = ['first_name', 'last_name', 'email', 'birth_date', 'gender'];

        foreach ($requiredFields as $field) {
            if (! array_key_exists($field, $attendee)) {
                throw new InvalidArgumentException("The attendee {$field} field is required.");
            }
        }

        $gender = $attendee['gender'] instanceof UserGender
            ? $attendee['gender']
            : UserGender::from($attendee['gender']);

        return [
            'attendee_first_name' => $attendee['first_name'],
            'attendee_last_name' => $attendee['last_name'],
            'attendee_email' => $attendee['email'],
            'attendee_birth_date' => $attendee['birth_date'],
            'attendee_gender' => $gender,
        ];
    }
}
