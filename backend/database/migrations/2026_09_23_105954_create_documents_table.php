<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('category', 30);
            $table->string('document_type', 50);

            $table->string('title', 255)->nullable();

            $table->string('original_file_name', 255);
            $table->string('storage_path', 500);

            $table->string('mime_type', 100)->nullable();

            $table->unsignedBigInteger('file_size_bytes')
                ->nullable();

            $table->timestamp('uploaded_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'user_id',
                'category',
                'document_type',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};