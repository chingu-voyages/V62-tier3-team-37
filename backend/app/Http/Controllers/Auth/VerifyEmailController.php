<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VerifyEmailController extends Controller
{
    /**
     * Verify the user's email address.
     */
    public function __invoke(Request $request): RedirectResponse|JsonResponse
    {
        $user = User::findOrFail($request->route('id'));

        if (! hash_equals(
            (string) $request->route('hash'),
            sha1($user->getEmailForVerification())
        )) {
            abort(403, 'Invalid verification link.');
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email is already verified.',
            ]);
        }

        if ($user->markEmailAsVerified()) {
            event(new Verified($user));
        }

        return redirect(
            config('app.frontend_url').'/email-verified'
        );
        // return response()->json([
        //     'message' => 'Email verified successfully.',
        // ]);
        
    }
}