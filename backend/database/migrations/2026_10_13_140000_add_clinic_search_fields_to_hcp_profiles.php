<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->string('clinic_area', 100)->nullable()->after('city');
            $table->json('accepted_insurances')->nullable()->after('clinic_area');
        });
    }

    public function down(): void
    {
        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->dropColumn(['clinic_area', 'accepted_insurances']);
        });
    }
};
