<?php

namespace App\Http\Controllers\Hcp;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\HcpOnboardingRequest;
use App\Services\Hcp\HcpOnboardingService;
use Illuminate\Http\JsonResponse;

class HcpOnboardingController extends Controller
{
    public function store(
        HcpOnboardingRequest $request,
        HcpOnboardingService $onboardingService
    ): JsonResponse {
        $user = $onboardingService->submit(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'message' => 'HCP application submitted successfully.',

            'data' => [
                'verification_status' =>
                    $user->hcpVerification->status->value,

                'submitted_at' =>
                    $user->hcpVerification
                        ->submitted_at
                        ?->toISOString(),
            ],
        ], 201);
    }
}
