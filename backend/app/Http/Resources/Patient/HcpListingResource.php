<?php

namespace App\Http\Resources\Patient;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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

            'years_of_experience' =>
                $this->hcpProfile?->years_of_experience,
        ];
    }
}