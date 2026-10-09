<?php

namespace App\Http\Resources\Patient;

use App\Enums\VerificationStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HcpListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            // The listing query already restricts to verified HCPs, but the
            // frontend should not have to re-derive that from an endpoint's
            // existence to know whether to show the verified badge.
            'verified' => $this->hcpVerification?->status === VerificationStatus::VERIFIED,

            'name' => trim(
                "{$this->first_name} {$this->last_name}"
            ),

            'profile_photo' => $this->profile_photo_path,

            'specialty' => $this->hcpProfile?->specialty?->value,

            // The list item shows this as the doctor's headline, so the enum
            // value is not enough: "CARDIOLOGY" is a database value, not copy.
            'specialty_label' => $this->hcpProfile?->specialty?->label(),

            'years_of_experience' => $this->hcpProfile?->years_of_experience,

            'sub_specialty' => $this->hcpProfile?->sub_specialty,

            'workplace_name' => $this->hcpProfile?->workplace_name,

            'workplace_address' => $this->hcpProfile?->workplace_address,

            'city' => $this->hcpProfile?->city,

            'area' => $this->hcpProfile?->area,

            'fees' => $this->hcpProfile?->fees,

            'currency' => $this->hcpProfile?->currency,

            'waiting_time' => $this->hcpProfile?->waiting_time,

            'rating' => $this->hcpProfile?->rating,

            'review_count' => $this->hcpProfile?->review_count,

            'insurance_accepted' => $this->hcpProfile?->insurance_accepted ?? [],
        ];
    }
}
