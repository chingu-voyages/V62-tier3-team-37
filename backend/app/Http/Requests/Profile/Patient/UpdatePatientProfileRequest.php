<?php

namespace App\Http\Requests\Profile\Patient;

use App\Enums\BloodType;
use App\Enums\UserGender;
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
        $merge = [];

        foreach (['first_name', 'last_name', 'phone'] as $field) {
            if ($this->exists($field) && is_string($this->input($field))) {
                $merge[$field] = trim($this->input($field));
            }
        }

        if ($this->exists('country') && is_string($this->input('country'))) {
            $merge['country'] = trim($this->input('country'));
        }

        if ($merge !== []) {
            $this->merge($merge);
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['prohibited'],

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