<?php

namespace App\Models;

use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'reporter_user_id',
        'reported_hcp_user_id',
        'appointment_id',
        'message',
        'status',
        'resolved_by_user_id',
        'resolution_note',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReportStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function reportedHcp(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_hcp_user_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_user_id');
    }
}
