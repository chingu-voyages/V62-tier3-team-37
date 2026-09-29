<?php

namespace App\Http\Requests\Profile;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

class StorePatientMedicalExaminationRequest extends FormRequest
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

    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'files' => [
                'required',
                'array',
                'min:1',
                'max:10',
            ],

            'files.*' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:10240',
            ],
        ];
    }
}