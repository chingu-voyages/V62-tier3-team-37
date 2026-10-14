<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHcpIsVerified
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $user = $request->user();

        if (
            $user?->role !== UserRole::HCP
            || $user->status !== UserStatus::ACTIVE
            || $user->hcpVerification?->status !== VerificationStatus::VERIFIED
        ) {
            return response()->json([
                'message' => 'Only verified healthcare providers can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
