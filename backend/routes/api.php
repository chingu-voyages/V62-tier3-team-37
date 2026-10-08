<?php

use App\Http\Controllers\Hcp\HcpAppointmentController;
use App\Http\Controllers\Hcp\HcpOnboardingController;
use App\Http\Controllers\Hcp\HcpProfileController;
use App\Http\Controllers\Patient\HcpListingController;
use App\Http\Controllers\Patient\PatientAppointmentController;
use App\Http\Controllers\Patient\PatientHcpAvailabilityController;
use App\Http\Controllers\Patient\PatientMedicalDocumentController;
use App\Http\Controllers\Patient\PatientProfileController;
use App\Http\Controllers\Profile\ProfilePhotoController;
use App\Http\Middleware\EnsureEmailIsVerified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::middleware(['auth:sanctum', EnsureEmailIsVerified::class])->group(function () {

    /**************************PATIENT************************************** */
    Route::get('/patient/profile', [PatientProfileController::class, 'show']);

    Route::patch('/patient/profile', [PatientProfileController::class, 'update']);

    Route::post('/patient/appointments', [PatientAppointmentController::class, 'store']);

    Route::get('/patient/appointments', [PatientAppointmentController::class, 'index']);

    Route::get('/patient/appointments/{appointment}', [PatientAppointmentController::class, 'show']);

    Route::patch('/patient/appointments/{appointment}/reschedule', [PatientAppointmentController::class, 'reschedule']);

    Route::patch('/patient/appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel']);

    Route::get('/patient/hcps/{hcp}/availability', [PatientHcpAvailabilityController::class, 'index']);

    Route::get('/patient/hcps', [HcpListingController::class, 'index']);

    Route::get('/patient/medical-examinations', [PatientMedicalDocumentController::class, 'index']);

    Route::post('/patient/medical-examinations', [PatientMedicalDocumentController::class, 'store']);

    Route::get('/patient/medical-examinations/{document}', [PatientMedicalDocumentController::class, 'show']);

    Route::delete('/patient/medical-examinations/{document}', [PatientMedicalDocumentController::class, 'destroy']);

    /**************************HCP************************************** */

    Route::post('/hcp/onboarding', [HcpOnboardingController::class, 'store']);

    Route::get('/hcp/profile', [HcpProfileController::class, 'show']);

    Route::patch('/hcp/profile', [HcpProfileController::class, 'update']);

    Route::put('/hcp/profile/availability', [HcpProfileController::class, 'updateAvailability']);

    Route::delete('/hcp/profile/availability/{availabilitySlot}', [HcpProfileController::class, 'destroyAvailability']);

    Route::middleware('hcp.verified')->prefix('hcp')->group(function () {
        Route::get('/appointments', [HcpAppointmentController::class, 'index']);

        Route::get('/appointments/{appointment}', [HcpAppointmentController::class, 'show']);

        Route::patch('/appointments/{appointment}/reschedule', [HcpAppointmentController::class, 'reschedule']);

        Route::patch('/appointments/{appointment}/cancel', [HcpAppointmentController::class, 'cancel']);

        Route::patch('/appointments/{appointment}/complete', [HcpAppointmentController::class, 'complete']);
    });

    /**************************PROFILE PHOTO************************************** */
    Route::post('/profile/photo', [ProfilePhotoController::class, 'update']);

    Route::delete('/profile/photo', [ProfilePhotoController::class, 'destroy']);

});
