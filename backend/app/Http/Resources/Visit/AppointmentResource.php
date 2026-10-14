<?php

namespace App\Http\Resources\Visit;

use App\Models\Appointment;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Appointment $appointment */
        $appointment = $this->resource;
        $clinician = $appointment->clinician;
        $patient = $appointment->patient;
        $profile = $clinician?->hcpProfile;

        return [
            'id' => $appointment->id,
            'status' => $appointment->status->value,
            'date' => $appointment->appointment_date->toDateString(),
            'time' => substr((string) $appointment->start_time, 0, 5),
            'reason' => $appointment->reason,
            'cancellation_reason' => $appointment->cancellation_reason,
            'summary' => $appointment->summary,
            'follow_up_of_id' => $appointment->follow_up_of_id,
            'clinician' => [
                'id' => $clinician?->id,
                'name' => trim(($clinician->first_name ?? '').' '.($clinician->last_name ?? '')),
                'email' => $clinician?->email,
                'phone' => $clinician?->phone,
                'specialty' => $profile?->specialty?->value,
                'location' => collect([$profile?->workplace_name, $profile?->city])->filter()->implode(', '),
            ],
            'patient' => [
                'id' => $patient?->id,
                'name' => trim(($patient->first_name ?? '').' '.($patient->last_name ?? '')),
                'email' => $patient?->email,
                'phone' => $patient?->phone,
            ],
            'results' => $appointment->results->map(fn (Document $document) => [
                'id' => $document->id,
                'title' => $document->title,
                'file_name' => $document->original_file_name,
            ])->values(),
        ];
    }
}
