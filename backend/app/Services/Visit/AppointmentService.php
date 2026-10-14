<?php

namespace App\Services\Visit;

use App\Enums\AppointmentStatus;
use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\HcpAvailabilitySlot;
use App\Models\User;
use App\Services\Document\DocumentService;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public const SLOT_MINUTES = 30;

    public function __construct(private DocumentService $documents) {}

    /**
     * @return array<string, list<string>>
     */
    public function openSlots(User $clinician, Carbon $from, Carbon $to): array
    {
        $this->assertBookableClinician($clinician);

        $windows = $clinician->hcpProfile?->availabilitySlots ?? collect();
        $taken = Appointment::query()
            ->where('hcp_user_id', $clinician->id)
            ->whereBetween('appointment_date', [$from->toDateString(), $to->toDateString()])
            ->get()
            ->filter(fn (Appointment $appointment) => $appointment->status->occupiesSlot())
            ->map(fn (Appointment $appointment) => $appointment->appointment_date->toDateString().' '.$this->clock($appointment->start_time))
            ->all();

        $slots = [];
        for ($day = $from->copy()->startOfDay(); $day->lte($to); $day->addDay()) {
            if ($day->lt(now()->startOfDay())) {
                continue;
            }

            $times = [];
            foreach ($windows as $window) {
                if ($window->day_of_week->value !== $day->dayOfWeek) {
                    continue;
                }
                foreach ($this->sliceWindow($window) as $time) {
                    $moment = Carbon::parse($day->toDateString().' '.$time);
                    if ($moment->lte(now())) {
                        continue;
                    }
                    if (in_array($day->toDateString().' '.$time, $taken, true)) {
                        continue;
                    }
                    $times[] = $time;
                }
            }

            if ($times !== []) {
                $slots[$day->toDateString()] = $times;
            }
        }

        return $slots;
    }

    public function book(User $patient, User $clinician, string $date, string $time, ?string $reason, ?int $followUpOf = null): Appointment
    {
        if (! is_string($patient->phone) || trim($patient->phone) === '') {
            throw ValidationException::withMessages([
                'phone' => 'Add a phone number so the clinic can reach you.',
            ]);
        }

        $this->assertBookableClinician($clinician);
        $this->assertOpen($clinician, $date, $time);

        return DB::transaction(function () use ($patient, $clinician, $date, $time, $reason, $followUpOf) {
            $this->assertOpen($clinician, $date, $time);

            return Appointment::query()->create([
                'patient_user_id' => $patient->id,
                'hcp_user_id' => $clinician->id,
                'follow_up_of_id' => $followUpOf,
                'appointment_date' => $date,
                'start_time' => $time,
                'reason' => $reason,
                'status' => AppointmentStatus::BOOKED,
            ]);
        });
    }

    public function move(Appointment $appointment, string $date, string $time, bool $byClinician): Appointment
    {
        if (! $appointment->status->canMove()) {
            throw ValidationException::withMessages([
                'appointment' => 'This visit can no longer be moved.',
            ]);
        }

        $clinician = $appointment->clinician;
        $this->assertOpen($clinician, $date, $time, $appointment->id);

        $appointment->update([
            'appointment_date' => $date,
            'start_time' => $time,
            'status' => $byClinician ? AppointmentStatus::POSTPONED : AppointmentStatus::BOOKED,
        ]);

        return $appointment->fresh();
    }

    public function cancel(Appointment $appointment, ?string $reason = null): Appointment
    {
        if (! $appointment->status->canMove()) {
            throw ValidationException::withMessages([
                'appointment' => 'This visit can no longer be cancelled.',
            ]);
        }

        $appointment->update([
            'status' => AppointmentStatus::CANCELLED,
            'cancellation_reason' => $reason,
        ]);

        return $appointment;
    }

    public function setStatus(Appointment $appointment, AppointmentStatus $status): Appointment
    {
        $allowed = match ($status) {
            AppointmentStatus::ARRIVED, AppointmentStatus::NO_SHOW => $appointment->status->canMove(),
            AppointmentStatus::COMPLETED => in_array($appointment->status, [
                AppointmentStatus::BOOKED,
                AppointmentStatus::ARRIVED,
                AppointmentStatus::POSTPONED,
            ], true),
            AppointmentStatus::BOOKED => in_array($appointment->status, [
                AppointmentStatus::ARRIVED,
                AppointmentStatus::NO_SHOW,
            ], true),
            default => false,
        };

        if (! $allowed) {
            throw ValidationException::withMessages([
                'status' => 'That status does not fit this visit.',
            ]);
        }

        if ($status === AppointmentStatus::BOOKED && $appointment->status === AppointmentStatus::NO_SHOW) {
            $this->assertSlotFree($appointment);
        }

        $appointment->update(['status' => $status]);

        return $appointment;
    }

    public function summarize(Appointment $appointment, string $summary): Appointment
    {
        if (! in_array($appointment->status, [AppointmentStatus::ARRIVED, AppointmentStatus::COMPLETED], true)) {
            throw ValidationException::withMessages([
                'summary' => 'Write the summary after the patient has been seen.',
            ]);
        }

        $appointment->update([
            'summary' => $summary,
            'status' => AppointmentStatus::COMPLETED,
        ]);

        return $appointment;
    }

    public function attachResult(Appointment $appointment, UploadedFile $file, ?string $title): Document
    {
        if (! in_array($appointment->status, [AppointmentStatus::ARRIVED, AppointmentStatus::COMPLETED], true)) {
            throw ValidationException::withMessages([
                'file' => 'Results can be sent after the patient has been seen.',
            ]);
        }

        $patient = $appointment->patient;
        $document = $this->documents->store(
            $patient,
            $file,
            DocumentCategory::MEDICAL,
            DocumentType::VISIT_RESULT,
            $title ?: 'Visit result',
        );
        $document->update(['appointment_id' => $appointment->id]);

        return $document;
    }

    public function followUp(Appointment $appointment, string $date, string $time, ?string $reason): Appointment
    {
        if ($appointment->status !== AppointmentStatus::COMPLETED) {
            throw ValidationException::withMessages([
                'appointment' => 'A follow-up can be offered after the visit is complete.',
            ]);
        }

        return $this->book(
            $appointment->patient,
            $appointment->clinician,
            $date,
            $time,
            $reason ?: 'Follow-up visit',
            $appointment->id,
        );
    }

    private function assertSlotFree(Appointment $appointment): void
    {
        $clock = $this->clock($appointment->start_time);
        $taken = Appointment::query()
            ->where('hcp_user_id', $appointment->hcp_user_id)
            ->whereDate('appointment_date', $appointment->appointment_date)
            ->whereKeyNot($appointment->id)
            ->get()
            ->contains(function (Appointment $other) use ($clock) {
                return $other->status->occupiesSlot() && $this->clock($other->start_time) === $clock;
            });

        if ($taken) {
            throw ValidationException::withMessages([
                'status' => 'That time was booked by someone else, so this visit cannot go back.',
            ]);
        }
    }

    public function assertOpen(User $clinician, string $date, string $time, ?int $ignoreId = null): void
    {
        $day = Carbon::parse($date);
        $clock = $this->clock($time);
        $allowed = false;

        foreach ($clinician->hcpProfile?->availabilitySlots ?? [] as $window) {
            if ($window->day_of_week->value !== $day->dayOfWeek) {
                continue;
            }
            if (in_array($clock, $this->sliceWindow($window), true)) {
                $allowed = true;
            }
        }

        if (! $allowed || Carbon::parse($date.' '.$clock)->lte(now())) {
            throw ValidationException::withMessages([
                'time' => 'That time is not open.',
            ]);
        }

        $taken = Appointment::query()
            ->where('hcp_user_id', $clinician->id)
            ->whereDate('appointment_date', $date)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->get()
            ->contains(function (Appointment $appointment) use ($clock) {
                return $appointment->status->occupiesSlot() && $this->clock($appointment->start_time) === $clock;
            });

        if ($taken) {
            throw ValidationException::withMessages([
                'time' => 'That time was just taken.',
            ]);
        }
    }

    private function assertBookableClinician(User $clinician): void
    {
        $verified = $clinician->role === UserRole::HCP
            && $clinician->status === UserStatus::ACTIVE
            && $clinician->hcpVerification?->status === VerificationStatus::VERIFIED
            && $clinician->hcpProfile !== null;

        if (! $verified) {
            throw ValidationException::withMessages([
                'clinician' => 'This clinician is not available for booking.',
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function sliceWindow(HcpAvailabilitySlot $window): array
    {
        $cursor = Carbon::parse($this->clock($window->start_time));
        $end = Carbon::parse($this->clock($window->end_time));
        $times = [];

        while ($cursor->copy()->addMinutes(self::SLOT_MINUTES)->lte($end)) {
            $times[] = $cursor->format('H:i');
            $cursor->addMinutes(self::SLOT_MINUTES);
        }

        return $times;
    }

    private function clock(mixed $time): string
    {
        return substr((string) $time, 0, 5);
    }
}
