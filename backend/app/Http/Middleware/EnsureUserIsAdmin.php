<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        abort_unless(
            $user?->role === UserRole::ADMIN && $user->status === UserStatus::ACTIVE,
            403,
            'Only active administrators can access this resource.'
        );

        return $next($request);
    }
}
