<?php

namespace App\Models;

use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'email',
        'password',
        'phone',
        'role',
        'terms_accepted',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'email_verified_at' => 'datetime',
            'gender' => UserGender::class,
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'terms_accepted' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function emailVerificationOtp(): HasOne
    {
        return $this->hasOne(EmailVerificationOtp::class);
    }
}
