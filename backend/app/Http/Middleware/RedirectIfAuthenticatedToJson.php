<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RedirectIfAuthenticatedToJson extends RedirectIfAuthenticated
{
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        $guards = $guards ?: [null];

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                return $this->authenticated($request);
            }
        }

        return $next($request);
    }

    protected function authenticated(Request $request): Response
    {
        return response()->json([
            'message' => 'You are already authenticated. Please log out before registering a new account.',
        ], Response::HTTP_CONFLICT);
    }
}
