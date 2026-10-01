<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Enums\Specialty;

class HcpProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialty',
        'years_of_experience',
        'medical_license_number',
        'license_issuing_authority',
    ];

    protected function casts(): array
    {
        return [
            'specialty' => Specialty::class,

            'years_of_experience' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}