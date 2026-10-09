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
            'area',
            'currency',
            'waiting_time',
            'bio',
        ];

        $normalized = [];

        foreach ($fields as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $normalized[$field] = trim($this->input($field));
            }
        }

        // `fees` is numeric, so it must not go through the string trim above.
        if ($this->has('fees') && $this->input('fees') !== null) {
            $normalized['fees'] = $this->input('fees');
        }

        $this->merge($normalized);
    }

    public function rules(): array
    {
        return [
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
            'area' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'fees' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
                'max:1000000',
            ],
            'currency' => [
                'sometimes',
                'nullable',
                'string',
                'max:10',
            ],
            'waiting_time' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
            ],
            'insurance_accepted' => [
                'sometimes',
                'nullable',
                'array',
                'max:20',
            ],
            'insurance_accepted.*' => [
                'required',
                'string',
                'max:50',
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

            // Aggregates of patient reviews. A clinician must never be able to
            // set these, so they are refused rather than merely ignored.
            'rating' => ['prohibited'],
            'review_count' => ['prohibited'],
        ];
    }
}
