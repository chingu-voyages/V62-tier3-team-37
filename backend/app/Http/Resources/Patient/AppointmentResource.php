<?php

namespace App\Http\Resources\Patient;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'hcp' => [
                'id' => $this->hcp->id,
                'name' => trim("{$this->hcp->first_name} {$this->hcp->last_name}"),
                'profile_photo' => $this->hcp->profile_photo_path,
                'specialty' => $this->hcp->hcpProfile?->specialty?->value,
            ],
            'patient' => [
                'id' => $this->patient->id,
                'name' => trim("{$this->patient->first_name} {$this->patient->last_name}"),
            ],
            'scheduled_start_at' => $this->scheduled_start_at->toISOString(),
            'scheduled_end_at' => $this->scheduled_end_at->toISOString(),
            'duration_minutes' => Appointment::DURATION_MINUTES,
            'status' => $this->status->value,
            'booking_for' => $this->booking_for->value,
            'attendee' => [
                'first_name' => $this->attendee_first_name,
                'last_name' => $this->attendee_last_name,
                'email' => $this->attendee_email,
                'phone' => $this->attendee_phone,
                'birth_date' => $this->attendee_birth_date->toDateString(),
                'gender' => $this->attendee_gender->value,
            ],
            'notes' => $this->notes,
            'medical_summary' => $this->medical_summary,
            'arrived_at' => $this->arrived_at?->toISOString(),
            'no_show_at' => $this->no_show_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'cancelled_by_user_id' => $this->cancelled_by_user_id,
            'cancellation_reason' => $this->cancellation_reason,
            'rescheduled_at' => $this->rescheduled_at?->toISOString(),
            'rescheduled_by_user_id' => $this->rescheduled_by_user_id,
            'parent_appointment_id' => $this->parent_appointment_id,
            'results' => $this->whenLoaded('results', fn () => $this->results->map(fn ($document) => [
                'id' => $document->id,
                'title' => $document->title,
                'file_name' => $document->original_file_name,
                'mime_type' => $document->mime_type,
                'uploaded_at' => $document->uploaded_at?->toISOString(),
            ])),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
