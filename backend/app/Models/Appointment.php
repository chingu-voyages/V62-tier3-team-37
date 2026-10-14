<?php

namespace App\Models;

use App\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
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
