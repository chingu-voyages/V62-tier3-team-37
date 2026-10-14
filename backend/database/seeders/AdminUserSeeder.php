<?php

namespace Database\Seeders;

use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds the administrator account used to reach the admin desk.
 *
 * There is no way to self-serve into this role: `/admin/access-requests` exists so
 * somebody already inside can promote an existing account, which means a fresh
 * database has nobody who can approve the first request. This seeder breaks that
 * bootstrap deadlock by creating the initial admin directly.
 *
 * Access to `/admin/*` is decided by `AdminDeskController::requireAdmin`, which
 * checks only that the user is `ADMIN`, so an account is usable as soon as it is
 * ACTIVE and email-verified - no AdminAccessRequest row is required, and creating
 * one would be misleading.
 *
 * Re-running is safe: accounts are matched on email and updated in place, so the
 * seeder can be re-applied over an existing database without duplicating users.
 * `password` is only written when the account is created, so a re-seed cannot
 * silently reset a password that has since been changed by hand. Use
 * `php artisan db:seed --class=AdminUserSeeder --force` if the password really
 * does need resetting, and see ADMIN_PASSWORD below.
 *
 * The default password is deliberately obvious and is only safe on a local or
 * throwaway database. Set ADMIN_PASSWORD in the environment to override it.
 */
class AdminUserSeeder extends Seeder
{
    /**
     * Fallback password when ADMIN_PASSWORD is not set.
     *
     * Shared with the other demo seeders so a seeded login is predictable. Local
     * and CI databases only - anything reachable from a network needs its own.
     */
    public const PASSWORD = 'Password1!';

    /**
     * @var list<array<string, mixed>>
     */
    private const ADMINS = [
        [
            'email' => 'admin@example.com',
            'first_name' => 'Site',
            'last_name' => 'Administrator',
            'birth_date' => '1990-01-01',
            'gender' => UserGender::MALE,
            'phone' => '+201000000001',
        ],
    ];

    public function run(): void
    {
        foreach (self::ADMINS as $admin) {
            $this->seedAdmin($admin);
        }
    }

    /**
     * @param  array<string, mixed>  $admin
     */
    private function seedAdmin(array $admin): void
    {
        $email = (string) $admin['email'];

        $userData = [
            'first_name' => $admin['first_name'],
            'last_name' => $admin['last_name'],
            'birth_date' => $admin['birth_date'],
            'gender' => $admin['gender'],
            'phone' => $admin['phone'],
            'role' => UserRole::ADMIN,
            'status' => UserStatus::ACTIVE,
            'terms_accepted' => true,

            // Verified up front. Admin routes sit behind `EnsureEmailIsVerified`,
            // so an unverified seed could not actually sign in to use the desk it
            // exists to open.
            'email_verified_at' => now(),
        ];

        $user = User::query()->where('email', $email)->first();

        if ($user) {
            // Deliberately no password here: re-seeding must not undo a password
            // that was changed after the account was first created.
            $user->forceFill($userData)->save();

            return;
        }

        User::factory()->create([
            'email' => $email,
            ...$userData,
            'password' => Hash::make($this->password()),
        ]);
    }

    /**
     * The seeder's password, overridable from the environment.
     *
     * Read from config rather than `env()` directly so a cached config build
     * (`php artisan config:cache`) still picks up the intended value, and so the
     * override is visible in one place if the default is ever changed.
     */
    private function password(): string
    {
        return (string) config('app.admin_seed_password', self::PASSWORD);
    }
}
