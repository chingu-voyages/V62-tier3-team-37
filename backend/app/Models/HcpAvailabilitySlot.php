<?php

namespace App\Models;

use App\Enums\DayOfWeek;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HcpAvailabilitySlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'hcp_profile_id',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => DayOfWeek::class,
        ];
    }

    public function hcpProfile(): BelongsTo
    {
        return $this->belongsTo(HcpProfile::class);
    }
}
