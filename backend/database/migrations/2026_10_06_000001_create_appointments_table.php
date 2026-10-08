<?php

use App\Enums\AppointmentStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('patient_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('hcp_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamp('scheduled_start_at');
            $table->timestamp('scheduled_end_at');

            $table->string('status', 20)
                ->default(AppointmentStatus::CONFIRMED->value);

            $table->string('booking_for', 20);

            $table->string('attendee_first_name');
            $table->string('attendee_last_name');
            $table->string('attendee_email');
            $table->date('attendee_birth_date');
            $table->string('attendee_gender', 20);

            $table->text('notes')->nullable();

            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->text('cancellation_reason')->nullable();

            $table->timestamp('rescheduled_at')->nullable();
            $table->foreignId('rescheduled_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(
                ['hcp_user_id', 'scheduled_start_at'],
                'appointments_hcp_start_index'
            );
            $table->index(
                ['patient_user_id', 'scheduled_start_at'],
                'appointments_patient_start_index'
            );
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
