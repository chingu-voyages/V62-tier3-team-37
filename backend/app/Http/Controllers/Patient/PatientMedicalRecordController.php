<?php

namespace App\Http\Controllers\Patient;

use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Patient\MedicalRecordResource;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/**
 * A patient's medical records, grouped by the clinician who produced them.
 *
 * A patient does not upload files here. Everything in this list was attached by a
 * clinician to a visit they finished, which is why the grouping key is the
 * clinician on the appointment rather than the document's own owner.
 */
class PatientMedicalRecordController extends Controller
{
    public function index(): JsonResponse
    {
        /** @var User $patient */
        $patient = request()->user();

        abort_unless($patient->role === UserRole::PATIENT, 403);

        return response()->json([
            'data' => MedicalRecordResource::collection($this->groupedByClinician($patient->id)),
        ]);
    }

    /**
     * Build one entry per clinician who recorded a visit for this patient.
     *
     * Loaded in two steps rather than a per-clinician query loop: the documents and
     * the appointments are fetched once and grouped in memory, so the page costs a
     * fixed two queries no matter how many clinicians the patient has seen.
     *
     * @return Collection<int, array{clinician: User, documents: Collection, appointments: Collection}>
     */
    private function groupedByClinician(int $patientId)
    {
        /** @var Collection<int, Document> $documents */
        $documents = Document::query()
            ->where('category', DocumentCategory::MEDICAL->value)
            ->where('document_type', DocumentType::VISIT_RESULT->value)
            ->whereNotNull('appointment_id')
            ->whereHas(
                'appointment',
                fn ($query) => $query->where('patient_user_id', $patientId)
            )
            ->with(['appointment', 'appointment.clinician', 'appointment.clinician.hcpProfile'])
            ->latest('uploaded_at')
            ->latest('id')
            ->get();

        if ($documents->isEmpty()) {
            return collect();
        }

        /** @var Collection<int, Appointment> $appointments */
        $appointments = Appointment::query()
            ->where('patient_user_id', $patientId)
            ->whereIn('id', $documents->pluck('appointment_id')->unique())
            ->get()
            ->groupBy('hcp_user_id');

        return $documents
            ->groupBy(fn (Document $document) => $document->appointment->hcp_user_id)
            ->map(function ($clinicianDocuments, $hcpUserId) use ($appointments) {
                /** @var Collection<int, Document> $clinicianDocuments */
                $clinician = $clinicianDocuments->first()->appointment->clinician;

                return [
                    'clinician' => $clinician,
                    'documents' => $clinicianDocuments->values(),
                    'appointments' => $appointments->get($hcpUserId, collect()),
                ];
            })
            ->values();
    }
}
