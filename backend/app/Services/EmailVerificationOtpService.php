<?php

namespace App\Services;

use App\Enums\EmailOtpVerificationResult;
use App\Models\EmailVerificationOtp;
use App\Models\User;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Auth\Events\Verified;
use Illuminate\Support\Facades\Hash;

class EmailVerificationOtpService
{
    private const OTP_EXPIRATION_MINUTES = 10;

    private const MAX_ATTEMPTS = 5;

    private const RESEND_COOLDOWN_SECONDS = 60;

    public function issue(User $user): void
    {
        $otp = $this->generateOtp();

        EmailVerificationOtp::updateOrCreate(
            [
                'user_id' => $user->id,
            ],
            [
                'code' => Hash::make($otp),
                'attempts' => 0,
                'expires_at' => now()->addMinutes(
                    self::OTP_EXPIRATION_MINUTES
                ),
                'last_sent_at' => now(),
            ]
        );

        $user->notify(
            new EmailVerificationOtpNotification($otp)
        );
    }

    public function verify(
        User $user,
        string $code
    ): EmailOtpVerificationResult {
        if ($user->hasVerifiedEmail()) {
            return EmailOtpVerificationResult::ALREADY_VERIFIED;
        }

        $otp = EmailVerificationOtp::where('user_id', $user->id)
            ->first();

        if (! $otp) {
            return EmailOtpVerificationResult::NOT_FOUND;
        }

        if ($otp->expires_at->isPast()) {
            $otp->delete();

            return EmailOtpVerificationResult::EXPIRED;
        }

        if ($otp->attempts >= self::MAX_ATTEMPTS) {
            return EmailOtpVerificationResult::TOO_MANY_ATTEMPTS;
        }

        if (! Hash::check($code, $otp->code)) {
            $otp->increment('attempts');
            $otp->refresh();

            if ($otp->attempts >= self::MAX_ATTEMPTS) {
                return EmailOtpVerificationResult::TOO_MANY_ATTEMPTS;
            }

            return EmailOtpVerificationResult::INVALID;
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        $otp->delete();

        return EmailOtpVerificationResult::VERIFIED;
    }

    public function resend(User $user): int
    {
        $currentOtp = EmailVerificationOtp::where(
            'user_id',
            $user->id
        )->first();

        if ($currentOtp) {
            $nextAllowedAt = $currentOtp->last_sent_at
                ->copy()
                ->addSeconds(self::RESEND_COOLDOWN_SECONDS);

            if (now()->lt($nextAllowedAt)) {
                return (int) ceil(
                    now()->diffInSeconds($nextAllowedAt)
                );
            }
        }

        $this->issue($user);

        return 0;
    }

    private function generateOtp(): string
    {
        return sprintf(
            '%06d',
            random_int(0, 999999)
        );
    }
}