<?php

namespace App\Http\Requests\Profile;

use App\Enums\LivenessStatus;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Enums\Specialty;

class HcpOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        $role = $user->role instanceof \BackedEnum
            ? $user->role->value
            : $user->role;

        return $role === UserRole::HCP->value
            && $user->email_verified_at !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('liveness_status')) {
            $this->merge([
                'liveness_status' => strtoupper(
                    (string) $this->input('liveness_status')
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            // Identity verification
            'government_id_front' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:10240',
            ],

            'government_id_back' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:10240',
            ],

            'liveness_status' => [
                'required',
                Rule::in([
                    LivenessStatus::PASSED->value,
                ]),
            ],

            // Professional credentials
            'medical_license' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:10240',
            ],

            'qualification' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:10240',
            ],

            // Professional information
            'medical_license_number' => [
                'required',
                'string',
                'max:100',
            ],

            'license_issuing_authority' => [
                'required',
                'string',
                'max:255',
            ],

            'specialty' => [
                'required',
                Rule::enum(Specialty::class)
            ],

            'years_of_experience' => [
                'required',
                'integer',
                'min:0',
                'max:80',
            ],

            // Consent
            'consent' => [
                'required',
                'accepted',
            ],
        ];
    }
}