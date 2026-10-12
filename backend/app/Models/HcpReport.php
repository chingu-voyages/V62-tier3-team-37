<?php

namespace App\Models;

use App\Enums\ReportStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HcpReport extends Model
{
    protected $fillable = [
        'hcp_user_id',
        'reporter_user_id',
        'reason',
        'details',
        'status',
    ];

    protected $attributes = [
        'status' => 'OPEN',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReportStatus::class,
        ];
    }

    public function clinician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hcp_user_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_user_id');
    }
}
