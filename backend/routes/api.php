<?php

use App\Http\Controllers\Admin\AdminAccessRequestController as AdminAccessRequestReviewController;
use App\Http\Controllers\Admin\AdminClinicianController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminPatientController;
use App\Http\Controllers\Admin\AdminReportController;
use App\Http\Controllers\Hcp\HcpAppointmentController;
use App\Http\Controllers\Hcp\HcpClinicPhotoController;
use App\Http\Controllers\Hcp\HcpOnboardingController;
use App\Http\Controllers\Hcp\HcpPatientController;
use App\Http\Controllers\Hcp\HcpProfileController;
use App\Http\Controllers\Patient\HcpListingController;
use App\Http\Controllers\Patient\PatientAppointmentController;
use App\Http\Controllers\Patient\PatientMedicalDocumentController;
use App\Http\Controllers\Patient\PatientProfileController;
use App\Http\Controllers\Profile\ProfilePhotoController;
use App\Http\Controllers\PublicApi\AdminAccessRequestController;
use App\Http\Controllers\PublicApi\HcpAvailabilityController;
use App\Http\Middleware\EnsureEmailIsVerified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/admin/access-requests', [AdminAccessRequestController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

Route::middleware(['auth:sanctum', EnsureEmailIsVerified::class])->group(function () {

    Route::get('/hcps/{hcp}/availability', [HcpAvailabilityController::class, 'index'])
        ->middleware('throttle:60,1');

    /**************************PATIENT************************************** */
    Route::middleware('patient')->prefix('patient')->group(function () {
        Route::get('/profile', [PatientProfileController::class, 'show']);

        Route::patch('/profile', [PatientProfileController::class, 'update']);

        Route::post('/appointments', [PatientAppointmentController::class, 'store']);

        Route::get('/appointments', [PatientAppointmentController::class, 'index']);

        Route::get('/appointments/{appointment}', [PatientAppointmentController::class, 'show']);

        Route::patch('/appointments/{appointment}/reschedule', [PatientAppointmentController::class, 'reschedule']);

        Route::patch('/appointments/{appointment}/cancel', [PatientAppointmentController::class, 'cancel']);

        Route::get('/appointments/{appointment}/results/{document}', [PatientAppointmentController::class, 'downloadResult']);

        Route::post('/appointments/{appointment}/reports', [PatientAppointmentController::class, 'report']);

        Route::get('/hcps', [HcpListingController::class, 'index']);

        Route::get('/medical-examinations', [PatientMedicalDocumentController::class, 'index']);

        Route::post('/medical-examinations', [PatientMedicalDocumentController::class, 'store']);

        Route::get('/medical-examinations/{document}', [PatientMedicalDocumentController::class, 'show']);

        Route::delete('/medical-examinations/{document}', [PatientMedicalDocumentController::class, 'destroy']);
    });

    /**************************HCP************************************** */

    Route::post('/hcp/onboarding', [HcpOnboardingController::class, 'store']);

    Route::get('/hcp/profile', [HcpProfileController::class, 'show']);

    Route::patch('/hcp/profile', [HcpProfileController::class, 'update']);

    Route::put('/hcp/profile/availability', [HcpProfileController::class, 'updateAvailability']);

    Route::delete('/hcp/profile/availability/{availabilitySlot}', [HcpProfileController::class, 'destroyAvailability']);

    Route::post('/hcp/profile/clinic-photo', [HcpClinicPhotoController::class, 'store']);

    Route::delete('/hcp/profile/clinic-photo', [HcpClinicPhotoController::class, 'destroy']);

    Route::middleware('hcp.verified')->prefix('hcp')->group(function () {
        Route::get('/appointments', [HcpAppointmentController::class, 'index']);

        Route::get('/appointments/{appointment}', [HcpAppointmentController::class, 'show']);

        Route::post('/appointments/{appointment}/reschedule', [HcpAppointmentController::class, 'reschedule']);

        Route::post('/appointments/{appointment}/cancel', [HcpAppointmentController::class, 'cancel']);

        Route::post('/appointments/{appointment}/status', [HcpAppointmentController::class, 'status']);

        Route::delete('/appointments/{appointment}/status', [HcpAppointmentController::class, 'undoStatus']);

        Route::post('/appointments/{appointment}/summary', [HcpAppointmentController::class, 'summary']);

        Route::post('/appointments/{appointment}/results', [HcpAppointmentController::class, 'storeResult']);

        Route::get('/appointments/{appointment}/results/{document}', [HcpAppointmentController::class, 'downloadResult']);

        Route::post('/appointments/{appointment}/follow-up', [HcpAppointmentController::class, 'followUp']);

        Route::get('/patients', [HcpPatientController::class, 'index']);
    });

    /**************************PROFILE PHOTO************************************** */
    Route::post('/profile/photo', [ProfilePhotoController::class, 'update']);

    Route::delete('/profile/photo', [ProfilePhotoController::class, 'destroy']);

    /**************************ADMIN************************************** */
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', AdminDashboardController::class);

        Route::get('/clinicians', [AdminClinicianController::class, 'index']);
        Route::get('/clinicians/{hcp}', [AdminClinicianController::class, 'show']);
        Route::patch('/clinicians/{hcp}/verification', [AdminClinicianController::class, 'verification']);
        Route::patch('/clinicians/{hcp}/status', [AdminClinicianController::class, 'status']);

        Route::get('/patients', [AdminPatientController::class, 'index']);
        Route::get('/patients/{patient}', [AdminPatientController::class, 'show']);
        Route::patch('/patients/{patient}/status', [AdminPatientController::class, 'status']);

        Route::get('/reports', [AdminReportController::class, 'index']);
        Route::get('/reports/{report}', [AdminReportController::class, 'show']);
        Route::patch('/reports/{report}', [AdminReportController::class, 'decide']);

        Route::get('/access-requests', [AdminAccessRequestReviewController::class, 'index']);
        Route::patch('/access-requests/{accessRequest}', [AdminAccessRequestReviewController::class, 'decide']);

    });

});
