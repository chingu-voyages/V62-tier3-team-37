<?php

namespace App\Http\Resources\Patient;

use App\Models\Appointment;
use App\Models\Document;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * One clinician's folder of records, as the patient sees it.
 *
 * The records page groups documents by the clinician who wrote them rather than
 * listing files flat, because a result is only meaningful next to the clinician
 * and the visit it came from. This resource owns that grouping shape: the clinician
 * identity at the top of a card, and the documents beneath it.
 *
 * Only `VISIT_RESULT` documents reach a patient. A patient never uploads their own
 * files here, so this is not a general file listing.
 */
class MedicalRecordResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $clinician */
        $clinician = $this->resource['clinician'];

        /** @var Collection<int, Document> $documents */
        $documents = $this->resource['documents'];

        /** @var Collection<int, Appointment> $appointments */
        $appointments = $this->resource['appointments'];

        return [
            'hcp' => [
                'id' => $clinician->id,
                'full_name' => trim("{$clinician->first_name} {$clinician->last_name}"),
                'email' => $clinician->email,
                'specialty_label' => $clinician->hcpProfile?->specialty?->label(),
                'city' => $clinician->hcpProfile?->city,
                'profile_photo_url' => $this->photoUrl($clinician),
            ],

            // How many visits this clinician recorded for the patient. Shown next to
            // the name so a card reads as a history, not a loose pile of files.
            'visits_count' => $appointments->count(),

            'documents' => $documents
                ->map(fn (Document $document) => $this->document($document))
                ->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function document(Document $document): array
    {
        return [
            'id' => $document->id,
            'appointment_id' => $document->appointment_id,
            'title' => $document->title ?: 'Visit result',
            'file_name' => $document->original_file_name,
            'mime_type' => $document->mime_type,
            'file_size_bytes' => $document->file_size_bytes,
            'uploaded_at' => optional($document->uploaded_at)->toIso8601String(),
            'appointment_date' => optional($document->appointment)->appointment_date?->toDateString(),

            // Built server-side so the client never has to know the nested route
            // shape, and so a change to the URL is a one-line edit here. Spelled
            // out rather than via `route()` because no route in api.php is named.
            'download_url' => sprintf(
                '/api/patient/appointments/%d/results/%d',
                $document->appointment_id,
                $document->id
            ),
        ];
    }

    /**
     * The clinician's own photo, falling back to their clinic's.
     *
     * The client falls back to initials when both are absent, so this returns null
     * rather than inventing a placeholder path.
     */
    private function photoUrl(User $clinician): ?string
    {
        $path = $clinician->profile_photo_path
            ?: $clinician->hcpProfile?->clinic_photo_path;

        if (! $path) {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($path);
    }
}
