<?php

namespace App\Http\Controllers\Patient;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Visit\AppointmentResource;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\User;
use App\Services\Visit\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PatientAppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::PATIENT, 403);

        $appointments = Appointment::query()
            ->where('patient_user_id', $request->user()->id)
            ->with(['clinician.hcpProfile', 'patient', 'results'])
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get();

        return AppointmentResource::collection($appointments)->response();
    }

    public function store(Request $request, AppointmentService $appointments): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::PATIENT, 403);

        $data = $request->validate([
            'clinician_id' => ['required', 'integer', 'exists:users,id'],
            'date' => ['required', 'date'],
            'time' => ['required', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $clinician = User::query()->findOrFail($data['clinician_id']);
        $appointment = $appointments->book(
            $request->user(),
            $clinician,
            $data['date'],
            substr($data['time'], 0, 5),
            $data['reason'] ?? null,
        );

        return (new AppointmentResource($appointment->load(['clinician.hcpProfile', 'patient', 'results'])))
            ->response()
            ->setStatusCode(201);
    }

    public function postpone(Request $request, Appointment $appointment, AppointmentService $appointments): AppointmentResource
    {
        $this->owns($request, $appointment);
        $data = $request->validate([
            'date' => ['required', 'date'],
            'time' => ['required', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/'],
        ]);

        $moved = $appointments->move($appointment, $data['date'], substr($data['time'], 0, 5), false);

        return new AppointmentResource($moved->load(['clinician.hcpProfile', 'patient', 'results']));
    }

    public function cancel(Request $request, Appointment $appointment, AppointmentService $appointments): AppointmentResource
    {
        $this->owns($request, $appointment);

        return new AppointmentResource(
            $appointments->cancel($appointment)->load(['clinician.hcpProfile', 'patient', 'results'])
        );
    }

    public function result(Request $request, Appointment $appointment, Document $document): StreamedResponse
    {
        $this->owns($request, $appointment);
        abort_unless($document->appointment_id === $appointment->id, 404);

        return Storage::disk('local')->response(
            $document->storage_path,
            $document->original_file_name,
            ['Content-Type' => $document->mime_type ?: 'application/octet-stream'],
        );
    }

    private function owns(Request $request, Appointment $appointment): void
    {
        abort_unless(
            $request->user()->role === UserRole::PATIENT
            && $appointment->patient_user_id === $request->user()->id,
            403,
        );
    }
}
