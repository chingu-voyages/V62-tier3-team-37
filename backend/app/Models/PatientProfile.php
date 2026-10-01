<?php

namespace App\Models;

use App\Enums\BloodType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'blood_type',
        'height_cm',
        'weight_kg',
        'allergies',
    ];

    protected function casts(): array
    {
        return [
            'blood_type' => BloodType::class,
            'height_cm' => 'integer',
            'weight_kg' => 'decimal:2',
            'allergies' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}