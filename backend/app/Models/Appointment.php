<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use App\Enums\BookingFor;
use App\Enums\UserGender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    public const DURATION_MINUTES = 60;

    protected $fillable = [
        'patient_user_id',
        'hcp_user_id',
        'scheduled_start_at',
        'scheduled_end_at',
        'status',
        'booking_for',
        'attendee_first_name',
        'attendee_last_name',
        'attendee_email',
        'attendee_birth_date',
        'attendee_gender',
        'notes',
        'cancelled_at',
        'cancelled_by_user_id',
        'cancellation_reason',
        'rescheduled_at',
        'rescheduled_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_start_at' => 'datetime',
            'scheduled_end_at' => 'datetime',
            'status' => AppointmentStatus::class,
            'booking_for' => BookingFor::class,
            'attendee_birth_date' => 'date',
            'attendee_gender' => UserGender::class,
            'cancelled_at' => 'datetime',
            'rescheduled_at' => 'datetime',
        ];
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_user_id');
    }

    public function hcp(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hcp_user_id');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by_user_id');
    }

    public function rescheduledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rescheduled_by_user_id');
    }
}
