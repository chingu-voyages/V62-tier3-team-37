<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('blood_type', 5)
                ->nullable();

            $table->text('bio')
                ->nullable();

            $table->unsignedSmallInteger('height_cm')
                ->nullable();

            $table->decimal('weight_kg', 5, 2)
                ->nullable();

            $table->jsonb('allergies')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_profiles');
    }
};