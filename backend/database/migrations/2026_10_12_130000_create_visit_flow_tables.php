<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->string('clinic_photo_path')->nullable();
        });

        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('hcp_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('follow_up_of_id')->nullable()->constrained('appointments')->nullOnDelete();
            $table->date('appointment_date');
            $table->time('start_time');
            $table->string('reason')->nullable();
            $table->string('status')->default('BOOKED');
            $table->text('summary')->nullable();
            $table->timestamps();

            $table->index(['hcp_user_id', 'appointment_date', 'start_time'], 'appointments_slot_index');
            $table->index(['patient_user_id', 'appointment_date']);
        });

        Schema::create('conversation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index(['sender_id', 'recipient_id']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('appointment_id');
        });

        Schema::dropIfExists('conversation_messages');
        Schema::dropIfExists('appointments');

        Schema::table('hcp_profiles', function (Blueprint $table) {
            $table->dropColumn('clinic_photo_path');
        });
    }
};
