<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class HcpListingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'name' => trim(
                "{$this->first_name} {$this->last_name}"
            ),

            'profile_photo' => $this->profile_photo_path,

            'specialty' => $this->hcpProfile?->specialty?->value,

            'years_of_experience' => $this->hcpProfile?->years_of_experience,

            'clinic' => [
                'name' => $this->hcpProfile?->workplace_name,
                'street' => $this->hcpProfile?->clinic_street,
                'area' => $this->hcpProfile?->clinic_area,
                'city' => $this->hcpProfile?->clinic_city,
                'photo_url' => $this->hcpProfile?->clinic_photo_path
                    ? Storage::disk('public')->url($this->hcpProfile->clinic_photo_path)
                    : null,
            ],

            'accepted_insurances' => $this->hcpProfile?->accepted_insurances ?? [],
        ];
    }
}
