<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\AppointmentStatus;
use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Patient\AppointmentResource;
use App\Models\Appointment;
use App\Models\Document;
use App\Services\Appointment\AppointmentManagementService;
use App\Services\Document\DocumentService;
use Carbon\CarbonImmutable;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HcpAppointmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
        ]);
        $day = CarbonImmutable::parse($validated['date'] ?? 'today');

        $appointments = $request->user()
            ->hcpAppointments()
            ->where('status', '!=', AppointmentStatus::CANCELLED->value)
            ->whereBetween('scheduled_start_at', [$day->startOfDay()->utc(), $day->endOfDay()->utc()])
            ->with(['hcp.hcpProfile', 'patient', 'results'])
            ->orderBy('scheduled_start_at')
            ->paginate(15);

        return AppointmentResource::collection($appointments);
    }

    public function show(Request $request, int $appointment): AppointmentResource
    {
        return new AppointmentResource(
            $this->hcpAppointment($request, $appointment)
        );
    }

    public function reschedule(
        Request $request,
        int $appointment,
        AppointmentManagementService $managementService
    ): AppointmentResource {
        $validated = $request->validate([
            'scheduled_start_at' => [
                'required',
                'string',
                'date',
                'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/',
            ],
        ]);

        $managedAppointment = $managementService->reschedule(
            $request->user(),
            $this->hcpAppointment($request, $appointment),
            CarbonImmutable::parse($validated['scheduled_start_at'])
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient'])
        );
    }

    public function cancel(
        Request $request,
        int $appointment,
        AppointmentManagementService $managementService
    ): AppointmentResource {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $managedAppointment = $managementService->cancel(
            $request->user(),
            $this->hcpAppointment($request, $appointment),
            $validated['reason']
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient'])
        );
    }

    public function status(
        Request $request,
        int $appointment,
        AppointmentManagementService $managementService
    ): AppointmentResource {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([AppointmentStatus::ARRIVED->value, AppointmentStatus::NO_SHOW->value]),
            ],
        ]);

        $managedAppointment = $managementService->updateAttendanceStatus(
            $request->user(),
            $this->hcpAppointment($request, $appointment),
            AppointmentStatus::from($validated['status'])
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient'])
        );
    }

    public function undoStatus(
        Request $request,
        int $appointment,
        AppointmentManagementService $managementService
    ): AppointmentResource {
        $managedAppointment = $managementService->undoStatus(
            $request->user(),
            $this->hcpAppointment($request, $appointment)
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient', 'results'])
        );
    }

    public function summary(
        Request $request,
        int $appointment,
        AppointmentManagementService $managementService
    ): AppointmentResource {
        $validated = $request->validate([
            'summary' => ['required', 'string', 'max:10000'],
        ]);

        $managedAppointment = $managementService->saveSummary(
            $request->user(),
            $this->hcpAppointment($request, $appointment),
            $validated['summary']
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient', 'results'])
        );
    }

    public function storeResult(
        Request $request,
        int $appointment,
        DocumentService $documentService
    ): JsonResponse {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);
        $appointmentModel = $this->hcpAppointment($request, $appointment);

        abort_unless(
            in_array($appointmentModel->status, [AppointmentStatus::ARRIVED, AppointmentStatus::COMPLETED], true),
            409,
            'Results can only be attached after the patient arrives.'
        );

        $document = $documentService->store(
            $appointmentModel->patient,
            $request->file('file'),
            DocumentCategory::MEDICAL,
            DocumentType::APPOINTMENT_RESULT,
            $validated['title'] ?? null
        );
        $document->update(['appointment_id' => $appointmentModel->id]);

        return response()->json([
            'message' => 'Appointment result uploaded successfully.',
            'data' => $document->fresh(),
        ], 201);
    }

    public function downloadResult(Request $request, int $appointment, Document $document): StreamedResponse
    {
        $appointmentModel = $this->hcpAppointment($request, $appointment);
        $this->ensureAppointmentResult($appointmentModel, $document);

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        return $disk->download($document->storage_path, $document->original_file_name);
    }

    public function followUp(
        Request $request,
        int $appointment,
        AppointmentManagementService $managementService
    ): JsonResponse {
        $validated = $request->validate([
            'scheduled_start_at' => [
                'required', 'string', 'date',
                'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/',
            ],
        ]);

        $followUp = $managementService->createFollowUp(
            $request->user(),
            $this->hcpAppointment($request, $appointment),
            CarbonImmutable::parse($validated['scheduled_start_at'])
        );

        return response()->json([
            'message' => 'Follow-up appointment booked successfully.',
            'data' => new AppointmentResource($followUp->load(['hcp.hcpProfile', 'patient', 'results'])),
        ], 201);
    }

    private function hcpAppointment(Request $request, int $appointment): Appointment
    {
        return $request->user()
            ->hcpAppointments()
            ->with(['hcp.hcpProfile', 'patient', 'results'])
            ->whereKey($appointment)
            ->firstOrFail();
    }

    private function ensureAppointmentResult(Appointment $appointment, Document $document): void
    {
        abort_unless(
            $document->appointment_id === $appointment->id
                && $document->document_type === DocumentType::APPOINTMENT_RESULT,
            404
        );
    }
}
