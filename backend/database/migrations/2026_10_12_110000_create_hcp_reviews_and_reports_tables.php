<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hcp_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hcp_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('patient_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['hcp_user_id', 'patient_user_id']);
        });

        Schema::create('hcp_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hcp_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reporter_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reason', 120);
            $table->text('details')->nullable();
            $table->timestamps();

            $table->index('hcp_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hcp_reports');
        Schema::dropIfExists('hcp_reviews');
    }
};
