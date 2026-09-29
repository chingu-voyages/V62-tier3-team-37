<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Profile\PatientProfileController;
use App\Http\Controllers\Profile\ProfilePhotoController;
use App\Http\Controllers\Profile\PatientMedicalDocumentController;
use App\Http\Controllers\Profile\HcpOnboardingController;
// Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
//     return $request->user();
// });


Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
/**************************PATIENT************************************** */
    Route::get('/patient/profile',[PatientProfileController::class, 'show']);

    Route::patch('/patient/profile',[PatientProfileController::class, 'update']);

    Route::get('/patient/medical-examinations',[PatientMedicalDocumentController::class, 'index']);

    Route::post('/patient/medical-examinations',[PatientMedicalDocumentController::class, 'store']);

    Route::get('/patient/medical-examinations/{document}',[PatientMedicalDocumentController::class, 'show']);

    Route::delete('/patient/medical-examinations/{document}',[PatientMedicalDocumentController::class, 'destroy']);

    /**************************HCP************************************** */

    Route::post('/hcp/onboarding',[HcpOnboardingController::class, 'store']);


    /**************************PROFILE PHOTO************************************** */
    Route::post('/profile/photo',[ProfilePhotoController::class, 'update']);

    Route::delete('/profile/photo',[ProfilePhotoController::class, 'destroy']);



});
