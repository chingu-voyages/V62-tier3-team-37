<?php

namespace App\Http\Resources\Profile;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'first_name' => $this->first_name,
            'last_name' => $this->last_name,

            'birth_date' => $this->birth_date?->toDateString(),
            'age' => $this->birth_date?->age,

            'gender' => $this->gender,
            'email' => $this->email,

            'phone' => $this->phone,
            'country_code' => $this->country_code,

            'profile_photo_path' => $this->profile_photo_path,

            'patient_profile' => [
                'blood_type' => $this->patientProfile?->blood_type,
                'bio' => $this->patientProfile?->bio,
                'height_cm' => $this->patientProfile?->height_cm,
                'weight_kg' => $this->patientProfile?->weight_kg,
                'allergies' => $this->patientProfile?->allergies,
            ],
        ];
    }
}