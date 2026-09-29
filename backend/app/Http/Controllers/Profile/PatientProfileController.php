<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdatePatientProfileRequest;
use App\Http\Resources\Profile\PatientProfileResource;
use App\Services\Profile\ProfileService;
use Illuminate\Http\JsonResponse;

class PatientProfileController extends Controller
{
    public function show(): PatientProfileResource
    {
        $user = request()
            ->user()
            ->load('patientProfile');

        return new PatientProfileResource($user);
    }

    public function update(
        UpdatePatientProfileRequest $request,
        ProfileService $profileService
    ): JsonResponse {
        $user = $profileService->updatePatientProfile(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'message' => 'Patient profile updated successfully.',
            'data' => new PatientProfileResource($user),
        ]);
    }
}