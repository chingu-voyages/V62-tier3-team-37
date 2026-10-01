<?php

namespace App\Http\Requests\Profile;

use App\Enums\AllergySeverity;
use App\Enums\BloodType;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientProfileRequest extends FormRequest
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

        return $role === UserRole::PATIENT->value;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('country')) {
            $this->merge([
                'country' => strtoupper(
                    (string) $this->input('country')
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
                Rule::unique('users', 'phone')
                    ->ignore($this->user()->id),
            ],

            'country' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            
            ],

            'blood_type' => [
                'sometimes',
                'nullable',
                Rule::enum(BloodType::class),
            ],

            'height_cm' => [
                'sometimes',
                'nullable',
                'integer',
                'min:30',
                'max:300',
            ],

            'weight_kg' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:1',
                'max:500',
            ],

            'allergies' => [
                'sometimes',
                'nullable',
                'array',
            ],

            'allergies.*.name' => [
                'required',
                'string',
                'max:255',
            ],

            'allergies.*.reaction' => [
                'nullable',
                'string',
                'max:500',
            ],

            'allergies.*.severity' => [
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }
}