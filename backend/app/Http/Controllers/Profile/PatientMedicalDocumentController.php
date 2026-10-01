<?php

namespace App\Http\Controllers\Profile;

use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\StorePatientMedicalExaminationRequest;
use App\Models\Document;
use App\Models\User;
use App\Services\Document\DocumentService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientMedicalDocumentController extends Controller
{
    public function index(DocumentService $documentService): JsonResponse 
    {
        /** @var User $user */
        $user = request()->user();

        $this->ensurePatient($user);

        $documents = $documentService->getByType(
            $user,
            DocumentCategory::MEDICAL,
            DocumentType::MEDICAL_EXAMINATION
        );

        return response()->json([
            'data' => $documents,
        ]);
    }

    public function store(
        StorePatientMedicalExaminationRequest $request,
        DocumentService $documentService
    ): JsonResponse {
        $documents = $documentService->storeMany(
            $request->user(),
            $request->file('files'),
            DocumentCategory::MEDICAL,
            DocumentType::MEDICAL_EXAMINATION,
            $request->validated('title')
        );

        return response()->json([
            'message' => 'Medical examination uploaded successfully.',
            'data' => $documents,
        ], 201);
    }

    public function show(Document $document,DocumentService $documentService): StreamedResponse 
    {
        /** @var User $user */
        $user = request()->user();

        $this->ensurePatient($user);

        $document = $documentService->getOwnedDocument(
            $user,
            $document
        );

        $this->ensureMedicalExamination($document);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        return $disk->response(
            $document->storage_path,
            $document->original_file_name,
            [
                'Content-Type' => $document->mime_type,
            ],
            'inline'
        );
    }

    public function destroy(Document $document,DocumentService $documentService): JsonResponse 
    {
        /** @var User $user */
        $user = request()->user();

        $this->ensurePatient($user);

        $document = $documentService->getOwnedDocument(
            $user,
            $document
        );

        $this->ensureMedicalExamination($document);

        $documentService->delete(
            $user,
            $document
        );

        return response()->json([
            'message' => 'Medical examination deleted successfully.',
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    private function ensurePatient(User $user): void
    {
        $role = $user->role instanceof \BackedEnum
            ? $user->role->value
            : $user->role;

        if ($role !== UserRole::PATIENT->value) {
            throw new AuthorizationException(
                'Only patients can manage medical examinations.'
            );
        }
    }

    /**
     * @throws AuthorizationException
     */
    private function ensureMedicalExamination(Document $document): void 
    {
        if (
            $document->category !== DocumentCategory::MEDICAL
            || $document->document_type
                !== DocumentType::MEDICAL_EXAMINATION
        ) {
            throw new AuthorizationException(
                'This document is not a medical examination.'
            );
        }
    }
}