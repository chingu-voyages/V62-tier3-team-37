<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('admin:create {email} {--first-name=} {--last-name=}', function () {
    $email = strtolower(trim((string) $this->argument('email')));
    $firstName = trim((string) ($this->option('first-name') ?: $this->ask('First name')));
    $lastName = trim((string) ($this->option('last-name') ?: $this->ask('Last name')));
    $password = (string) $this->secret('Password');
    $confirmation = (string) $this->secret('Confirm password');

    $validator = Validator::make([
        'email' => $email,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'password' => $password,
        'password_confirmation' => $confirmation,
    ], [
        'email' => ['required', 'email:rfc', 'max:255', 'unique:users,email'],
        'first_name' => ['required', 'string', 'max:255'],
        'last_name' => ['required', 'string', 'max:255'],
        'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
    ]);

    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    User::query()->create([
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'email_verified_at' => now(),
        'password' => Hash::make($password),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
        'terms_accepted' => true,
    ]);

    $this->info("Admin account created for {$email}.");

    return 0;
})->purpose('Create the first administrator account securely');
