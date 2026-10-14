<?php

use App\Http\Controllers\Admin\AdminAccessRequestController;
use App\Http\Controllers\Admin\AdminClinicianController;
use App\Http\Controllers\Admin\AdminDeskController;
use App\Http\Controllers\Admin\AdminDocumentController;
use App\Http\Controllers\Admin\AdminPatientController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Hcp\HcpAppointmentController;
use App\Http\Controllers\Hcp\HcpClinicPhotoController;
use App\Http\Controllers\Hcp\HcpOnboardingController;
use App\Http\Controllers\Hcp\HcpProfileController;
use App\Http\Controllers\Patient\PatientAppointmentController;
use App\Http\Controllers\Patient\PatientDirectoryController;
use App\Http\Controllers\Patient\PatientFeedbackController;
use App\Http\Controllers\Patient\PatientMedicalRecordController;
use App\Http\Controllers\Patient\PatientProfileController;
use App\Http\Controllers\Profile\ProfilePhotoController;
use App\Http\Controllers\Visit\MessageController;
use App\Http\Middleware\EnsureAccountIsActive;
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
    Route::get('/patient/directory', [PatientDirectoryController::class, 'index']);
    Route::get('/patient/directory/places', [PatientDirectoryController::class, 'places']);
    Route::get('/patient/clinicians/{user}/slots', [PatientDirectoryController::class, 'slots']);
    Route::get('/patient/appointments', [PatientAppointmentController::class, 'index']);
    Route::post('/patient/appointments', [PatientAppointmentController::class, 'store']);
    Route::post('/patient/appointments/{appointment}/postpone', [PatientAppointmentController::class, 'postpone']);
    Route::post('/patient/appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel']);
    Route::get('/patient/appointments/{appointment}/results/{document}', [PatientAppointmentController::class, 'result']);

    Route::get('/patient/clinicians', [PatientFeedbackController::class, 'clinicians']);
    Route::post('/patient/clinicians/{user}/reviews', [PatientFeedbackController::class, 'review']);
    Route::post('/patient/clinicians/{user}/reports', [PatientFeedbackController::class, 'report']);

    Route::get('/patient/profile', [PatientProfileController::class, 'show']);

    Route::patch('/patient/profile', [PatientProfileController::class, 'update']);

    // Records a patient receives. A patient never uploads files here: every
    // document listed was attached by a clinician to a visit they finished.
    Route::get('/patient/records', [PatientMedicalRecordController::class, 'index']);

    /**************************HCP************************************** */

    Route::post('/hcp/onboarding', [HcpOnboardingController::class, 'store']);

    Route::get('/hcp/profile', [HcpProfileController::class, 'show']);

    Route::patch('/hcp/profile', [HcpProfileController::class, 'update']);

    Route::put('/hcp/profile/availability', [HcpProfileController::class, 'updateAvailability']);

    Route::delete('/hcp/profile/availability/{availabilitySlot}', [HcpProfileController::class, 'destroyAvailability']);

    Route::post('/hcp/profile/clinic-photo', [HcpClinicPhotoController::class, 'update']);
    Route::delete('/hcp/profile/clinic-photo', [HcpClinicPhotoController::class, 'destroy']);

    Route::get('/hcp/appointments', [HcpAppointmentController::class, 'index']);
    Route::get('/hcp/appointments/slots', [HcpAppointmentController::class, 'slots']);
    Route::get('/hcp/patients', [HcpAppointmentController::class, 'patients']);
    Route::post('/hcp/appointments/{appointment}/status', [HcpAppointmentController::class, 'status']);
    Route::post('/hcp/appointments/{appointment}/postpone', [HcpAppointmentController::class, 'postpone']);
    Route::post('/hcp/appointments/{appointment}/cancel', [HcpAppointmentController::class, 'cancel']);
    Route::post('/hcp/appointments/{appointment}/summary', [HcpAppointmentController::class, 'summary']);
    Route::post('/hcp/appointments/{appointment}/results', [HcpAppointmentController::class, 'result']);
    Route::post('/hcp/appointments/{appointment}/follow-up', [HcpAppointmentController::class, 'followUp']);
    Route::get('/hcp/appointments/{appointment}/results/{document}', [HcpAppointmentController::class, 'download']);

    Route::get('/messages', [MessageController::class, 'threads']);
    Route::get('/messages/{user}', [MessageController::class, 'show']);
    Route::post('/messages', [MessageController::class, 'store']);

    /**************************PROFILE PHOTO************************************** */
    Route::post('/profile/photo', [ProfilePhotoController::class, 'update']);

    Route::delete('/profile/photo', [ProfilePhotoController::class, 'destroy']);

});
