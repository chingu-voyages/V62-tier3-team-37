<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\AppointmentStatus;
use App\Enums\DocumentCategory;
use App\Enums\DocumentType;
use App\Http\Controllers\Controller;
use App\Http\Resources\Patient\AppointmentResource;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\User;
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
    /**
     * Which tab an appointment status belongs to.
     *
     * A clinician works by workflow stage, not by enum vocabulary: the tabs are
     * "still actionable", "here now", "did not attend", "already closed". The
     * frontend mirrors this table, so a status added to the enum without a home
     * here is simply never listed - which is why every case is named explicitly.
     *
     * @var array<string, string>
     */
    private const STATUS_GROUPS = [
        AppointmentStatus::BOOKED->value => 'upcoming',
        AppointmentStatus::RESCHEDULED->value => 'upcoming',
        AppointmentStatus::ARRIVED->value => 'in_progress',
        AppointmentStatus::NO_SHOW->value => 'no_show',
        AppointmentStatus::COMPLETED->value => 'history',
        AppointmentStatus::CANCELLED->value => 'history',
    ];

    /**
     * The clinician's own appointments, filtered by workflow stage.
     *
     * `status[]` is what the screen's tabs send. Each tab maps to a group of
     * statuses rather than one, because a clinician works by "who is still
     * actionable" rather than by the enum's vocabulary.
     *
     * `date` is optional and no longer defaults to today: with it defaulted, a
     * clinician could never see a visit from yesterday, so COMPLETED and NO_SHOW
     * rows - the ones they actually need to review - were unreachable.
     *
     * CANCELLED is excluded only when the caller does not ask for statuses. A
     * "History" tab has to be able to request it.
     *
     * `facets` carries the per-tab counts so the filter can show them, computed
     * against the same clinician scope as the list.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'status' => ['sometimes', 'array', 'min:1'],
            'status.*' => ['string', Rule::enum(AppointmentStatus::class)],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $clinician = $request->user();

        $appointments = $clinician->hcpAppointments()
            ->with(['hcp.hcpProfile', 'patient', 'results'])
            ->orderBy('scheduled_start_at');

        if (isset($validated['status'])) {
            $appointments->whereIn('status', $validated['status']);
        } else {
            $appointments->where('status', '!=', AppointmentStatus::CANCELLED->value);
        }

        if (isset($validated['date'])) {
            $day = CarbonImmutable::parse($validated['date']);
            $appointments->whereBetween('scheduled_start_at', [
                $day->startOfDay()->utc(),
                $day->endOfDay()->utc(),
            ]);
        }

        $facets = $this->facetCounts($clinician, isset($validated['date']) ? $validated['date'] : null);

        $paginator = $appointments->paginate($validated['per_page'] ?? 15)->withQueryString();

        return AppointmentResource::collection($paginator)->additional(['facets' => $facets]);
    }

    /**
     * How many appointments sit in each workflow group.
     *
     * One grouped query rather than six counts: the filter is rendered on every
     * list load, and the clinician scope is identical for each group so a single
     * `CASE` over the same relation is both correct and cheap.
     *
     * @return array<string, int>
     */
    private function facetCounts(User $clinician, ?string $date): array
    {
        $counts = ['upcoming' => 0, 'in_progress' => 0, 'no_show' => 0, 'history' => 0];

        $base = $clinician->hcpAppointments();

        if ($date !== null) {
            $day = CarbonImmutable::parse($date);
            $base->whereBetween('scheduled_start_at', [
                $day->startOfDay()->utc(),
                $day->endOfDay()->utc(),
            ]);
        }

        $rows = $base
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        foreach ($rows as $status => $total) {
            $group = self::STATUS_GROUPS[$status] ?? null;

            if ($group !== null) {
                $counts[$group] += (int) $total;
            }
        }

        return $counts;
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
