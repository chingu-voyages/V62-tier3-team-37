<?php

namespace App\Http\Controllers\Admin;

use App\Enums\DocumentCategory;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminDocumentController extends Controller
{
    public function show(Request $request, Document $document): StreamedResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::ADMIN) {
            abort(403);
        }

        if ($document->category === DocumentCategory::MEDICAL) {
            abort(403);
        }

        $owner = $document->user;

        if (! $owner || $owner->role !== UserRole::HCP) {
            abort(404);
        }

        $disk = Storage::disk('local');

        if (! $disk->exists($document->storage_path)) {
            abort(404);
        }

        return $disk->response(
            $document->storage_path,
            $document->original_file_name ?: 'document',
            ['Content-Type' => $document->mime_type ?: 'application/octet-stream'],
            'inline',
        );
    }
}
