<?php

namespace App\Http\Requests\Profile\Hcp;

use App\Enums\ConsultationType;
use App\Enums\UserGender;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHcpProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::HCP;
    }

    protected function prepareForValidation(): void
    {
        $fields = [
            'first_name',
            'last_name',
            'phone',
            'country',
            'sub_specialty',
            'workplace_name',
            'workplace_address',
            'city',
            'clinic_area',
            'bio',
        ];

        $normalized = [];

        foreach ($fields as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $normalized[$field] = trim($this->input($field));
            }
        }

        if ($this->has('accepted_insurances') && is_array($this->input('accepted_insurances'))) {
            $normalized['accepted_insurances'] = array_values(array_map(
                fn ($plan) => is_string($plan) ? trim($plan) : $plan,
                $this->input('accepted_insurances'),
            ));
        }

        $this->merge($normalized);
    }

    public function rules(): array
    {
        $rules = [
            'first_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'last_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'birth_date' => [
                'sometimes',
                'required',
                'date',
                'before:today',
            ],
            'gender' => [
                'sometimes',
                'required',
                Rule::enum(UserGender::class),
            ],
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
                Rule::unique(User::class, 'phone')
                    ->ignore($this->user()->id),
            ],
            'country' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'sub_specialty' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],
            'workplace_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'workplace_address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],
            'city' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'clinic_area' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'accepted_insurances' => [
                'sometimes',
                'nullable',
                'array',
                'max:30',
            ],
            'accepted_insurances.*' => [
                'required',
                'string',
                'max:100',
                'distinct:ignore_case',
            ],
            'bio' => [
                'sometimes',
                'nullable',
                'string',
                'max:2000',
            ],
            'languages' => [
                'sometimes',
                'nullable',
                'array',
                'max:10',
            ],
            'languages.*' => [
                'required',
                'string',
                'max:50',
                'distinct:ignore_case',
            ],
            'consultation_types' => [
                'sometimes',
                'nullable',
                'array',
                'max:3',
            ],
            'consultation_types.*' => [
                'required',
                'distinct',
                Rule::enum(ConsultationType::class),
            ],

            'email' => ['prohibited'],
            'specialty' => ['prohibited'],
            'years_of_experience' => ['prohibited'],
            'medical_license_number' => ['prohibited'],
            'license_issuing_authority' => ['prohibited'],
            'government_id_front' => ['prohibited'],
            'government_id_back' => ['prohibited'],
            'medical_license' => ['prohibited'],
            'qualification' => ['prohibited'],
            'liveness_status' => ['prohibited'],
            'consent' => ['prohibited'],
        ];

        if ($this->user()?->hcpVerification !== null) {
            foreach (['first_name', 'last_name', 'birth_date', 'gender'] as $field) {
                $rules[$field] = ['prohibited'];
            }
        }

        return $rules;
    }
}
