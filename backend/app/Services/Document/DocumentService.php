<?php

namespace App\Services\Document;

use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Models\Document;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class DocumentService
{
    private const DISK = 'local';




    public function store(
    User $user,
    UploadedFile $file,
    DocumentCategory $category,
    DocumentType $documentType,
    ?string $title = null): Document 
    {
        $documents = $this->storeMany(
            $user,
            [$file],
            $category,
            $documentType,
            $title
        );

        return $documents->first();
    }

    /**
     * @param UploadedFile[] $files
     */
    public function storeMany(
        User $user,
        array $files,
        DocumentCategory $category,
        DocumentType $documentType,
        ?string $title = null
    ): Collection {
        $storedPaths = [];

        try {
            return DB::transaction(
                function () use (
                    $user,
                    $files,
                    $category,
                    $documentType,
                    $title,
                    &$storedPaths
                ) {
                    $documents = collect();

                    foreach ($files as $file) {
                        $path = $this->storeFile(
                            $user,
                            $file,
                            $category
                        );

                        $storedPaths[] = $path;

                        $document = $user
                            ->documents()
                            ->create([
                                'category' => $category,
                                'document_type' => $documentType,
                                'title' => $title,

                                'original_file_name' =>
                                    $file->getClientOriginalName(),

                                'storage_path' => $path,

                                'mime_type' =>
                                    $file->getMimeType(),

                                'file_size_bytes' =>
                                    $file->getSize(),

                                'uploaded_at' => now(),
                            ]);

                        $documents->push($document);
                    }

                    return $documents;
                }
            );
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk(self::DISK)
                    ->delete($path);
            }

            throw $exception;
        }
    }

    public function getByType(User $user,DocumentCategory $category,DocumentType $documentType): Collection {
        return $user
            ->documents()
            ->where('category', $category->value)
            ->where('document_type', $documentType->value)
            ->latest('uploaded_at')
            ->get();
    }

    /**
     * @throws AuthorizationException
     */
    public function getOwnedDocument(User $user,Document $document): Document 
    {
        $this->ensureOwnership(
            $user,
            $document
        );

        return $document;
    }

    /**
     * @throws AuthorizationException
     */
    public function delete(User $user,Document $document): void 
    {
        $this->ensureOwnership(
            $user,
            $document
        );

        $path = $document->storage_path;

        $document->delete();

        Storage::disk(self::DISK)
            ->delete($path);
    }

    private function storeFile(User $user,UploadedFile $file,DocumentCategory $category): string 
    {
        $directory = sprintf(
            'documents/%s/%d',
            strtolower($category->value),
            $user->id
        );

        $path = $file->store(
            $directory,
            self::DISK
        );

        if (! $path) {
            throw new RuntimeException(
                'Failed to store document.'
            );
        }

        return $path;
    }

    /**
     * @throws AuthorizationException
     */
    private function ensureOwnership(User $user,Document $document): void 
    {
        if ($document->user_id !== $user->id) {
            throw new AuthorizationException(
                'You are not authorized to access this document.'
            );
        }
    }
}