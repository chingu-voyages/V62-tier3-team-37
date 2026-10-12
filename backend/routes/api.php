<?php

use App\Http\Controllers\Admin\AdminAccessRequestController;
use App\Http\Controllers\Admin\AdminClinicianController;
use App\Http\Controllers\Admin\AdminDeskController;
use App\Http\Controllers\Admin\AdminDocumentController;
use App\Http\Controllers\Admin\AdminPatientController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Middleware\EnsureAccountIsActive;
use App\Http\Controllers\Hcp\HcpOnboardingController;
use App\Http\Controllers\Hcp\HcpProfileController;
use App\Http\Controllers\Patient\PatientFeedbackController;
use App\Http\Controllers\Patient\PatientMedicalDocumentController;
use App\Http\Controllers\Patient\PatientProfileController;
use App\Http\Controllers\Profile\ProfilePhotoController;
use App\Http\Middleware\EnsureEmailIsVerified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', EnsureAccountIsActive::class])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/admin/summary', [AdminDeskController::class, 'summary']);

    Route::get('/admin/access-requests', [AdminAccessRequestController::class, 'index']);
    Route::get('/admin/access-requests/mine', [AdminAccessRequestController::class, 'mine']);
    Route::post('/admin/access-requests/{accessRequest}/approve', [AdminAccessRequestController::class, 'approve']);
    Route::post('/admin/access-requests/{accessRequest}/decline', [AdminAccessRequestController::class, 'decline']);

    Route::get('/admin/patients', [AdminPatientController::class, 'index']);
    Route::post('/admin/patients/{user}/block', [AdminPatientController::class, 'block']);
    Route::post('/admin/patients/{user}/unblock', [AdminPatientController::class, 'unblock']);

    Route::get('/admin/reports', [AdminReportController::class, 'index']);
    Route::post('/admin/reports/{report}/resolve', [AdminReportController::class, 'resolve']);
    Route::post('/admin/reports/{report}/dismiss', [AdminReportController::class, 'dismiss']);

    Route::get('/admin/documents/{document}', [AdminDocumentController::class, 'show']);

    Route::get('/admin/clinicians', [AdminClinicianController::class, 'index']);
    Route::get('/admin/clinicians/{user}', [AdminClinicianController::class, 'show']);
    Route::post('/admin/clinicians/{user}/block', [AdminClinicianController::class, 'block']);
    Route::post('/admin/clinicians/{user}/unblock', [AdminClinicianController::class, 'unblock']);
    Route::post('/admin/clinicians/{user}/decision', [AdminClinicianController::class, 'decide']);
});

Route::post('/admin/access-requests', [AdminAccessRequestController::class, 'store'])
    ->middleware('throttle:6,1');

Route::middleware(['auth:sanctum', EnsureAccountIsActive::class, EnsureEmailIsVerified::class])->group(function () {

    /**************************PATIENT************************************** */
    Route::get('/patient/clinicians', [PatientFeedbackController::class, 'clinicians']);
    Route::post('/patient/clinicians/{user}/reviews', [PatientFeedbackController::class, 'review']);
    Route::post('/patient/clinicians/{user}/reports', [PatientFeedbackController::class, 'report']);

    Route::get('/patient/profile', [PatientProfileController::class, 'show']);

    Route::patch('/patient/profile', [PatientProfileController::class, 'update']);

    Route::get('/patient/medical-examinations', [PatientMedicalDocumentController::class, 'index']);

    Route::post('/patient/medical-examinations', [PatientMedicalDocumentController::class, 'store']);

    Route::get('/patient/medical-examinations/{document}', [PatientMedicalDocumentController::class, 'show']);

    Route::delete('/patient/medical-examinations/{document}', [PatientMedicalDocumentController::class, 'destroy']);

    /**************************HCP************************************** */

    Route::post('/hcp/onboarding',[HcpOnboardingController::class, 'store']);

    Route::get('/hcp/profile', [HcpProfileController::class, 'show']);

    Route::patch('/hcp/profile',[HcpProfileController::class, 'update']);

    Route::put('/hcp/profile/availability', [HcpProfileController::class, 'updateAvailability']);

    Route::delete('/hcp/profile/availability/{availabilitySlot}', [HcpProfileController::class, 'destroyAvailability']);

    /**************************PROFILE PHOTO************************************** */
    Route::post('/profile/photo', [ProfilePhotoController::class, 'update']);

    Route::delete('/profile/photo', [ProfilePhotoController::class, 'destroy']);

});
