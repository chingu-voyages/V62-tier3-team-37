<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hcp_verifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('liveness_status', 20);

            $table->timestamp('consent_accepted_at');

            $table->string('status', 30);

            $table->timestamp('submitted_at');

            $table->timestamp('reviewed_at')
                ->nullable();

            $table->text('rejection_reason')
                ->nullable();

            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hcp_verifications');
    }
};