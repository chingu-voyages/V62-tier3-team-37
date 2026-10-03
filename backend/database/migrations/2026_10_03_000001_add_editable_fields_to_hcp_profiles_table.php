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

            $table->string('workplace_address', 500)
                ->nullable()
                ->after('workplace_name');

            $table->string('city', 100)
                ->nullable()
                ->after('workplace_address');

            $table->text('bio')
                ->nullable()
                ->after('city');

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
                'workplace_address',
                'city',
                'bio',
                'languages',
                'consultation_types',
            ]);
        });
    }
};
