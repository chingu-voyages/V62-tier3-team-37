<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\EmailVerificationOtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResendEmailOtpController extends Controller
{
    public function __invoke(
        Request $request,
        EmailVerificationOtpService $otpService
    ): JsonResponse {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email address is already verified.',
            ], 409);
        }

        $secondsRemaining = $otpService->resend($user);

        if ($secondsRemaining > 0) {
            return response()->json([
                'message' => 'Please wait before requesting another verification code.',
                'retry_after' => $secondsRemaining,
            ], 429);
        }

        return response()->json([
            'message' => 'A new verification code has been sent.',
        ]);
    }
}
