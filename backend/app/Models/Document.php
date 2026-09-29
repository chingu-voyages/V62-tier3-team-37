<?php

namespace App\Models;

use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category',
        'document_type',
        'title',
        'original_file_name',
        'storage_path',
        'mime_type',
        'file_size_bytes',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'category' => DocumentCategory::class,
            'document_type' => DocumentType::class,
            'file_size_bytes' => 'integer',
            'uploaded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}