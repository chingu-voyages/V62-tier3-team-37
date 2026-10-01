<?php

namespace App\Models;

use App\Enums\LivenessStatus;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HcpVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'liveness_status',
        'consent_accepted_at',
        'status',
        'submitted_at',
        'reviewed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'liveness_status' => LivenessStatus::class,
            'status' => VerificationStatus::class,

            'consent_accepted_at' => 'datetime',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}