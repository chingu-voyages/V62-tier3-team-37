<?php

namespace App\Http\Controllers\Patient;

use App\Enums\BookingFor;
use App\Enums\DocumentType;
use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\StoreAppointmentRequest;
use App\Http\Resources\Patient\AppointmentResource;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\Report;
use App\Models\User;
use App\Services\Appointment\AppointmentBookingService;
use App\Services\Appointment\AppointmentManagementService;
use Carbon\CarbonImmutable;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientAppointmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $appointments = $request->user()
            ->patientAppointments()
            ->with(['hcp.hcpProfile', 'patient', 'results'])
            ->orderByDesc('scheduled_start_at')
            ->paginate(15);

        return AppointmentResource::collection($appointments);
    }

    public function show(Request $request, int $appointment): AppointmentResource
    {
        return new AppointmentResource(
            $this->patientAppointment($request, $appointment)
        );
    }

    public function store(
        StoreAppointmentRequest $request,
        AppointmentBookingService $bookingService
    ): JsonResponse {
        $validated = $request->validated();
        $hcp = User::query()->findOrFail($validated['hcp_id']);

        $appointment = $bookingService->book(
            patient: $request->user(),
            hcp: $hcp,
            start: CarbonImmutable::parse($validated['scheduled_start_at']),
            bookingFor: BookingFor::from($validated['booking_for']),
            attendee: $validated['attendee'] ?? [],
            phone: $validated['attendee_phone'] ?? null,
            notes: $validated['notes'] ?? null,
        )->load(['hcp.hcpProfile', 'patient']);

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'data' => new AppointmentResource($appointment),
        ], 201);
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
            $this->patientAppointment($request, $appointment),
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
            $this->patientAppointment($request, $appointment),
            $validated['reason']
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient'])
        );
    }

    public function downloadResult(Request $request, int $appointment, Document $document): StreamedResponse
    {
        $appointmentModel = $this->patientAppointment($request, $appointment);

        abort_unless(
            $document->appointment_id === $appointmentModel->id
                && $document->document_type === DocumentType::APPOINTMENT_RESULT,
            404
        );

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        return $disk->download($document->storage_path, $document->original_file_name);
    }

    public function report(Request $request, int $appointment): JsonResponse
    {
        $appointmentModel = $this->patientAppointment($request, $appointment);
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $report = DB::transaction(function () use ($request, $appointmentModel, $validated): Report {
            $lockedAppointment = Appointment::query()
                ->whereKey($appointmentModel->id)
                ->where('patient_user_id', $request->user()->id)
                ->lockForUpdate()
                ->firstOrFail();

            $hasOpenReport = Report::query()
                ->where('appointment_id', $lockedAppointment->id)
                ->where('status', ReportStatus::OPEN->value)
                ->exists();

            abort_if(
                $hasOpenReport,
                409,
                'An open report already exists for this appointment.'
            );

            return Report::query()->create([
                'reporter_user_id' => $request->user()->id,
                'reported_hcp_user_id' => $lockedAppointment->hcp_user_id,
                'appointment_id' => $lockedAppointment->id,
                'message' => $validated['message'],
                'status' => ReportStatus::OPEN,
            ]);
        });

        return response()->json([
            'message' => 'Report submitted successfully.',
            'data' => $report,
        ], 201);
    }

    private function patientAppointment(Request $request, int $appointment): Appointment
    {
        return $request->user()
            ->patientAppointments()
            ->with(['hcp.hcpProfile', 'patient', 'results'])
            ->whereKey($appointment)
            ->firstOrFail();
    }
}
