<?php

namespace App\Http\Requests\Patient;

use App\Enums\UserRole;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class GetHcpAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::PATIENT;
    }

    public function rules(): array
    {
        return [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['from', 'to'])) {
                    return;
                }

                $from = CarbonImmutable::createFromFormat('!Y-m-d', $this->string('from')->toString());
                $to = CarbonImmutable::createFromFormat('!Y-m-d', $this->string('to')->toString());

                if ($from->diffInDays($to) > 30) {
                    $validator->errors()->add(
                        'to',
                        'The availability range may not exceed 31 days.'
                    );
                }
            },
        ];
    }
}
