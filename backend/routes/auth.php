<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerification\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\Password\NewPasswordController;
use App\Http\Controllers\Auth\Password\PasswordResetLinkController;
use App\Http\Controllers\Auth\Registration\RegisterHCPController;
use App\Http\Controllers\Auth\Registration\RegisterPatientController;
use App\Http\Controllers\Auth\EmailVerification\ResendEmailOtpController;
use App\Http\Controllers\Auth\EmailVerification\VerifyEmailController;
use App\Http\Controllers\Auth\EmailVerification\VerifyEmailOtpController;
use Illuminate\Support\Facades\Route;

Route::post('/register/patient', [RegisterPatientController::class, 'store'])
    ->middleware('guest')
    ->name('register.patient');

Route::post('/register/hcp', [RegisterHCPController::class, 'store'])
    ->middleware('guest')
    ->name('register.hcp');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('guest')
    ->name('login');

Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
    ->middleware('guest')
    ->name('password.email');

Route::post('/reset-password', [NewPasswordController::class, 'store'])
    ->middleware('guest')
    ->name('password.store');

// Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
//     ->middleware(['signed', 'throttle:6,1'])
//     ->name('verification.verify');

// Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
//     ->middleware(['auth:sanctum', 'throttle:6,1'])
//     ->name('verification.send');

Route::post('/email/otp/verify', VerifyEmailOtpController::class)
    ->middleware([
        'auth:sanctum',
        'throttle:10,1',
    ])
    ->name('verification.otp.verify');

Route::post('/email/otp/resend', ResendEmailOtpController::class)
    ->middleware([
        'auth:sanctum',
        'throttle:3,5',
    ])
    ->name('verification.otp.resend');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');
