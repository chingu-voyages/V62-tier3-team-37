<?php

namespace Database\Factories;

use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'category' => DocumentCategory::CREDENTIAL,
            'document_type' => DocumentType::MEDICAL_LICENSE,
            'title' => null,
            'original_file_name' => 'sample-document.pdf',
            'storage_path' => 'seeded/sample-document.pdf',
            'mime_type' => 'application/pdf',
            'file_size_bytes' => 1024,
            'uploaded_at' => now(),
        ];
    }
}
