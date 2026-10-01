<?php

namespace App\Services\Hcp;

use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\LivenessStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Models\Document;
use App\Models\User;
use App\Services\Document\DocumentService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class HcpOnboardingService
{
    public function __construct(
        private readonly DocumentService $documentService
    ) {
    }

    public function submit(User $user, array $data): User
    {
        $this->ensureEligibleForSubmission($user);

        $storedDocuments = [];

        try {
           DB::transaction(function () use (
                $user,
                $data,
                &$storedDocuments
            ) {
                $this->createHcpProfile($user, $data);

                $this->storeDocuments(
                    $user,
                    $data,
                    $storedDocuments
                );

                $this->createVerification(
                    $user,
                    $data
                );
            });
        } catch (Throwable $exception) {
            $this->cleanupFiles($storedDocuments);

            throw $exception;
        }

        return $user->refresh()->load([
            'hcpProfile',
            'hcpVerification',
            'documents',
        ]);
    }

    private function createHcpProfile(
        User $user,
        array $data
    ): void {
        $user->hcpProfile()->create([
            'specialty' =>
                $data['specialty'],

            'years_of_experience' =>
                $data['years_of_experience'],

            'medical_license_number' =>
                $data['medical_license_number'],

            'license_issuing_authority' =>
                $data['license_issuing_authority'],
        ]);
    }

    /**
     * @return Document[]
     */
    private function storeDocuments(
    User $user,
    array $data,
    array &$storedDocuments
): void {
    $storedDocuments[] = $this->documentService->store(
        $user,
        $data['government_id_front'],
        DocumentCategory::KYC,
        DocumentType::GOVERNMENT_ID_FRONT
    );

    $storedDocuments[] = $this->documentService->store(
        $user,
        $data['government_id_back'],
        DocumentCategory::KYC,
        DocumentType::GOVERNMENT_ID_BACK
    );

    $storedDocuments[] = $this->documentService->store(
        $user,
        $data['medical_license'],
        DocumentCategory::CREDENTIAL,
        DocumentType::MEDICAL_LICENSE
    );

    $storedDocuments[] = $this->documentService->store(
        $user,
        $data['qualification'],
        DocumentCategory::CREDENTIAL,
        DocumentType::QUALIFICATION
    );
}
    private function createVerification(
        User $user,
        array $data
    ): void {
        $livenessStatus = LivenessStatus::from(
            $data['liveness_status']
        );

        if ($livenessStatus !== LivenessStatus::PASSED) {
            throw ValidationException::withMessages([
                'liveness_status' =>
                    'The liveness check must be passed before submitting.',
            ]);
        }

        $user->hcpVerification()->create([
            'liveness_status' =>
                $livenessStatus,

            'consent_accepted_at' =>
                now(),

            'status' =>
                VerificationStatus::UNDER_REVIEW,

            'submitted_at' =>
                now(),
        ]);
    }

    private function ensureEligibleForSubmission(
        User $user
    ): void {
        $role = $user->role instanceof \BackedEnum
            ? $user->role->value
            : $user->role;

        if ($role !== UserRole::HCP->value) {
            throw new AuthorizationException(
                'Only healthcare professionals can submit this application.'
            );
        }

        if ($user->email_verified_at === null) {
            throw new AuthorizationException(
                'Email verification is required before submitting.'
            );
        }

        if ($user->hcpVerification()->exists()) {
            throw ValidationException::withMessages([
                'application' =>
                    'The HCP application has already been submitted.',
            ]);
        }
    }

    /**
     * @param Document[] $documents
     */
    private function cleanupFiles(
        array $documents
    ): void {
        foreach ($documents as $document) {
            if (! $document instanceof Document) {
                continue;
            }

            Storage::disk('local')
                ->delete($document->storage_path);
        }
    }
}