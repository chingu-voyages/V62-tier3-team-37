<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    use HasFactory;

    /**
     * Length of a booked visit, and the step availability is sliced on.
     *
     * This is the single source of truth for visit length. Every slot generator
     * (`AppointmentAvailabilityService`), every booking/reschedule calculation
     * (`AppointmentBookingService`, `AppointmentManagementService`) and the
     * `duration_minutes` field on both API resources read it, so changing it here
     * moves the schedule everywhere at once instead of leaving the three copies
     * free to disagree.
     *
     * Kept in step with `AppointmentService::SLOT_MINUTES`, which serves the live
     * booking flow. The two were 30 and drifted apart once before.
     */
    public const DURATION_MINUTES = 30;

    protected $fillable = [
        'patient_user_id',
        'hcp_user_id',
        'follow_up_of_id',
        'appointment_date',
        'start_time',
        'reason',
        'status',
        'cancellation_reason',
        'summary',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
            'status' => AppointmentStatus::class,
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_user_id');
    }

    public function clinician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hcp_user_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function followUp(): BelongsTo
    {
        return $this->belongsTo(self::class, 'follow_up_of_id');
    }
}
