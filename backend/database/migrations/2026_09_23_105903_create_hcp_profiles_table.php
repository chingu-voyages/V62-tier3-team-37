<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hcp_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('specialty', 100);

            $table->unsignedTinyInteger('years_of_experience');

            $table->string('medical_license_number', 100);

            $table->string('license_issuing_authority', 255);

            $table->timestamps();

            $table->index('medical_license_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hcp_profiles');
    }
};