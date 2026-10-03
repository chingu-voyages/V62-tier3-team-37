<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hcp_availability_slots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('hcp_profile_id')
                ->constrained('hcp_profiles')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('day_of_week');

            $table->time('start_time');
            $table->time('end_time');

            $table->timestamps();

            $table->unique(
                [
                    'hcp_profile_id',
                    'day_of_week',
                    'start_time',
                    'end_time',
                ],
                'hcp_availability_slot_unique'
            );

            $table->index([
                'hcp_profile_id',
                'day_of_week',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hcp_availability_slots');
    }
};
