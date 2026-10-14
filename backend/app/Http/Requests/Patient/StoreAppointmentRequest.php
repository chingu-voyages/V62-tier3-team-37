<?php

namespace App\Http\Requests\Patient;

use App\Enums\BookingFor;
use App\Enums\UserGender;
use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === UserRole::PATIENT;
    }

    protected function prepareForValidation(): void
    {
        $bookingFor = $this->input('booking_for');
        $gender = $this->input('attendee.gender');
        $normalized = [];

        if (is_string($bookingFor)) {
            $normalized['booking_for'] = strtoupper($bookingFor);
        }

        if (is_string($gender)) {
            $attendee = $this->input('attendee', []);

            if (is_array($attendee)) {
                $attendee['gender'] = strtoupper($gender);
                $normalized['attendee'] = $attendee;
            }
        }

        if ($normalized !== []) {
            $this->merge($normalized);
        }
    }

    public function rules(): array
    {
        return [
            'hcp_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id'),
            ],
            'scheduled_start_at' => [
                'required',
                'string',
                'date',
                'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/',
            ],
            'booking_for' => [
                'required',
                Rule::enum(BookingFor::class),
            ],
            'attendee' => [
                'required_if:booking_for,'.BookingFor::OTHER->value,
                'array',
            ],
            'attendee.first_name' => [
                'required_if:booking_for,'.BookingFor::OTHER->value,
                'string',
                'max:255',
            ],
            'attendee.last_name' => [
                'required_if:booking_for,'.BookingFor::OTHER->value,
                'string',
                'max:255',
            ],
            'attendee.email' => [
                'required_if:booking_for,'.BookingFor::OTHER->value,
                'email:rfc',
                'max:255',
            ],
            'attendee.birth_date' => [
                'required_if:booking_for,'.BookingFor::OTHER->value,
                'date',
                'before_or_equal:today',
            ],
            'attendee.gender' => [
                'required_if:booking_for,'.BookingFor::OTHER->value,
                Rule::enum(UserGender::class),
            ],
            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}
