<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // First: the admin desk is what approves access requests, so the
            // account that opens it should exist before anything else is seeded.
            AdminUserSeeder::class,
            DemoPatientSeeder::class,
            HcpProfileSeeder::class,
            VerifiedHcpSeeder::class,
        ]);
    }
}
