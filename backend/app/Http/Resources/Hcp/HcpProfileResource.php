<?php

namespace App\Http\Resources\Hcp;

use App\Enums\DocumentType;
use App\Enums\VerificationStatus;
use App\Models\Document;
use App\Models\HcpAvailabilitySlot;
use App\Models\HcpProfile;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class HcpProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'profile_photo_url' => $this->profilePhotoUrl($user),
            'is_verified' => $this->isVerified($user),
            'personal_information' => $this->personalInformation($user),
            'professional_information' => $this->professionalInformation($user->hcpProfile),
            'preferences' => $this->preferences($user->hcpProfile),
            'availability' => $this->availability($user->hcpProfile),
            'verification' => $this->verificationInformation($user),
        ];
    }

    private function profilePhotoUrl(User $user): ?string
    {
        if (! $user->profile_photo_path) {
            return null;
        }

        /** @var FilesystemAdapter $publicDisk */
        $publicDisk = Storage::disk('public');

        return $publicDisk->url($user->profile_photo_path);
    }

    private function isVerified(User $user): bool
    {
        return $user->hcpVerification?->status === VerificationStatus::VERIFIED;
    }

    private function personalInformation(User $user): array
    {
        $birthDate = $user->birth_date
            ? Carbon::parse($user->birth_date)
            : null;

        return [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => trim("{$user->first_name} {$user->last_name}"),
            'birth_date' => $birthDate?->toDateString(),
            'age' => $birthDate?->age,
            'gender' => $user->gender?->value,
            'email' => $user->email,
            'phone' => $user->phone,
            'country' => $user->country,
        ];
    }

    private function professionalInformation(?HcpProfile $profile): array
    {
        return [
            'specialty' => $profile?->specialty?->value,
            'years_of_experience' => $profile?->years_of_experience,
            'medical_license_number' => $profile?->medical_license_number,
            'license_issuing_authority' => $profile?->license_issuing_authority,
            'sub_specialty' => $profile?->sub_specialty,
            'workplace_name' => $profile?->workplace_name,
            'workplace_address' => $profile?->workplace_address,
            'city' => $profile?->city,
            'area' => $profile?->area,
            'fees' => $profile?->fees,
            'currency' => $profile?->currency,
            'waiting_time' => $profile?->waiting_time,
            'insurance_accepted' => $profile?->insurance_accepted ?? [],
            // Aggregate of patient reviews, not clinician-set. Returned so the
            // profile can show it, but never accepted on write.
            'rating' => $profile?->rating,
            'review_count' => $profile?->review_count,
        ];
    }

    private function preferences(?HcpProfile $profile): array
    {
        return [
            'bio' => $profile?->bio,
            'languages' => $profile?->languages ?? [],
            'consultation_types' => $profile?->consultation_types ?? [],
        ];
    }

    private function availability(?HcpProfile $profile): array
    {
        if (! $profile) {
            return [];
        }

        return $profile->availabilitySlots
            ->map(fn (HcpAvailabilitySlot $slot): array => [
                'id' => $slot->id,
                'day' => $slot->day_of_week->shortName(),
                'start_time' => substr((string) $slot->start_time, 0, 5),
                'end_time' => substr((string) $slot->end_time, 0, 5),
            ])
            ->values()
            ->all();
    }

    private function verificationInformation(User $user): array
    {
        $verification = $user->hcpVerification;

        return [
            'status' => $verification?->status?->value,
            'liveness_status' => $verification?->liveness_status?->value,
            'submitted_at' => $verification?->submitted_at?->toISOString(),
            'reviewed_at' => $verification?->reviewed_at?->toISOString(),
            'rejection_reason' => $verification?->rejection_reason,
            'documents' => [
                'government_id_front' => $this->hasDocument(
                    $user,
                    DocumentType::GOVERNMENT_ID_FRONT
                ),
                'government_id_back' => $this->hasDocument(
                    $user,
                    DocumentType::GOVERNMENT_ID_BACK
                ),
                'medical_license' => $this->hasDocument(
                    $user,
                    DocumentType::MEDICAL_LICENSE
                ),
                'qualification' => $this->hasDocument(
                    $user,
                    DocumentType::QUALIFICATION
                ),
            ],
        ];
    }

    private function hasDocument(User $user, DocumentType $type): bool
    {
        return $user->documents->contains(
            fn (Document $document): bool => $document->document_type === $type
        );
    }
}
