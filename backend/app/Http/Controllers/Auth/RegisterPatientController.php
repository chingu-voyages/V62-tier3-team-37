<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class RegisterPatientController extends Controller
{
    public function store(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'birth_date' => $validated['birth_date'],
            'gender' => $validated['gender'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => UserRole::PATIENT,
            'terms_accepted' => true,
        ]);

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Account created successfully. Please verify your email address.',
        ], 201);
    }
}