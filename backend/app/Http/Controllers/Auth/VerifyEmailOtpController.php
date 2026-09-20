<?php

namespace App\Http\Controllers\Auth;

use App\Enums\EmailOtpVerificationResult;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\VerifyEmailOtpRequest;
use App\Services\EmailVerificationOtpService;
use Illuminate\Http\JsonResponse;

class VerifyEmailOtpController extends Controller
{
    public function __invoke(
        VerifyEmailOtpRequest $request,
        EmailVerificationOtpService $otpService
    ): JsonResponse {
        $result = $otpService->verify(
            $request->user(),
            $request->validated('code')
        );

        return match ($result) {
            EmailOtpVerificationResult::VERIFIED => response()->json([
                'message' => 'Email verified successfully.',
            ]),

            EmailOtpVerificationResult::ALREADY_VERIFIED => response()->json([
                'message' => 'Email address is already verified.',
            ]),

            EmailOtpVerificationResult::INVALID => response()->json([
                'message' => 'Invalid verification code.',
            ], 422),

            EmailOtpVerificationResult::EXPIRED => response()->json([
                'message' => 'Verification code has expired.',
            ], 422),

            EmailOtpVerificationResult::NOT_FOUND => response()->json([
                'message' => 'No verification code was found. Please request a new one.',
            ], 422),

            EmailOtpVerificationResult::TOO_MANY_ATTEMPTS => response()->json([
                'message' => 'Too many incorrect attempts. Please request a new verification code.',
            ], 429),
        };
    }
}
