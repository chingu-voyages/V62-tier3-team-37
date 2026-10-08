<?php

namespace App\Http\Controllers\Hcp;

use App\Http\Controllers\Controller;
use App\Http\Resources\Patient\AppointmentResource;
use App\Models\Appointment;
use App\Services\Appointment\AppointmentManagementService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HcpAppointmentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $appointments = $request->user()
            ->hcpAppointments()
            ->with(['hcp.hcpProfile', 'patient'])
            ->orderByDesc('scheduled_start_at')
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
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $managedAppointment = $managementService->cancel(
            $request->user(),
            $this->hcpAppointment($request, $appointment),
            $validated['reason'] ?? null
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient'])
        );
    }

    public function complete(
        Request $request,
        int $appointment,
        AppointmentManagementService $managementService
    ): AppointmentResource {
        $managedAppointment = $managementService->complete(
            $request->user(),
            $this->hcpAppointment($request, $appointment)
        );

        return new AppointmentResource(
            $managedAppointment->load(['hcp.hcpProfile', 'patient'])
        );
    }

    private function hcpAppointment(Request $request, int $appointment): Appointment
    {
        return $request->user()
            ->hcpAppointments()
            ->with(['hcp.hcpProfile', 'patient'])
            ->whereKey($appointment)
            ->firstOrFail();
    }
}
