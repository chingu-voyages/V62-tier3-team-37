<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailVerificationOtp extends Model
{
    protected $fillable = [
        'user_id',
        'code',
        'attempts',
        'expires_at',
        'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'expires_at' => 'datetime',
            'last_sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
