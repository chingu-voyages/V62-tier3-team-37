<?php

namespace App\Models;

use App\Enums\Specialty;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HcpProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialty',
        'years_of_experience',
        'medical_license_number',
        'license_issuing_authority',
        'sub_specialty',
        'workplace_name',
        'workplace_address',
        'city',
        'bio',
        'languages',
        'consultation_types',
    ];

    protected function casts(): array
    {
        return [
            'specialty' => Specialty::class,
            'years_of_experience' => 'integer',
            'languages' => 'array',
            'consultation_types' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function availabilitySlots(): HasMany
    {
        return $this->hasMany(HcpAvailabilitySlot::class);
    }
}
