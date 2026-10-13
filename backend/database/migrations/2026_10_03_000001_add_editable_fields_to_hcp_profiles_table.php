<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->string('sub_specialty', 150)
                ->nullable()
                ->after('specialty');

            $table->string('workplace_name', 255)
                ->nullable()
                ->after('license_issuing_authority');

            $table->string('clinic_street', 255)
                ->nullable()
                ->after('workplace_name');

            $table->string('clinic_area', 100)
                ->nullable()
                ->after('clinic_street');

            $table->string('clinic_city', 100)
                ->nullable()
                ->after('clinic_area');

            $table->json('accepted_insurances')
                ->nullable()
                ->after('clinic_city');

            $table->string('clinic_photo_path', 500)
                ->nullable()
                ->after('accepted_insurances');

            $table->text('bio')
                ->nullable()
                ->after('clinic_photo_path');

            $table->json('languages')
                ->nullable()
                ->after('bio');

            $table->json('consultation_types')
                ->nullable()
                ->after('languages');
        });
    }

    public function down(): void
    {
        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'sub_specialty',
                'workplace_name',
                'clinic_street',
                'clinic_area',
                'clinic_city',
                'accepted_insurances',
                'clinic_photo_path',
                'bio',
                'languages',
                'consultation_types',
            ]);
        });
    }
};
