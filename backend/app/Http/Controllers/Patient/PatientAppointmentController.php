<?php

namespace App\Http\Controllers\Patient;

use App\Enums\BookingFor;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\StoreAppointmentRequest;
use App\Http\Resources\Patient\AppointmentResource;
use App\Models\Appointment;
use App\Models\User;
use App\Services\Appointment\AppointmentBookingService;
use App\Services\Appointment\AppointmentManagementService;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PatientAppointmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->ensurePatient($request);

        $appointments = $request->user()
            ->patientAppointments()
            ->with(['hcp.hcpProfile', 'patient'])
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
        $this->ensurePatient($request);

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
        $this->ensurePatient($request);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $managedAppointment = $managementService->cancel(
            $request->user(),
            $this->patientAppointment($request, $appointment),
            $validated['reason'] ?? null
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient'])
        );
    }

    private function patientAppointment(Request $request, int $appointment): Appointment
    {
        $this->ensurePatient($request);

        return $request->user()
            ->patientAppointments()
            ->with(['hcp.hcpProfile', 'patient'])
            ->whereKey($appointment)
            ->firstOrFail();
    }

    private function ensurePatient(Request $request): void
    {
        if ($request->user()?->role !== UserRole::PATIENT) {
            throw new AuthorizationException('Only patients can access patient appointments.');
        }
    }
}
