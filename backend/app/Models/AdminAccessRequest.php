<?php

namespace App\Models;

use App\Enums\AdminAccessRequestStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAccessRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'reason',
        'status',
        'reviewed_by_user_id',
        'approved_user_id',
        'decision_reason',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AdminAccessRequestStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by_user_id');
    }

    public function approvedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_user_id');
    }
}
