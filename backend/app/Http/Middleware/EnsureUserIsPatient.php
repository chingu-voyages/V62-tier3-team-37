<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsPatient
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $user = $request->user();

        if ($user?->role !== UserRole::PATIENT || $user->status !== UserStatus::ACTIVE) {
            return response()->json([
                'message' => 'Only active patients can access this resource.',
            ], 403);
        }

        return $next($request);
    }
}
