<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\AppointmentStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Visit\AppointmentResource;
use App\Models\Appointment;
use App\Models\Document;
use App\Models\User;
use App\Services\Visit\AppointmentService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HcpAppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::HCP, 403);

        $appointments = Appointment::query()
            ->where('hcp_user_id', $request->user()->id)
            ->with(['clinician.hcpProfile', 'patient', 'results'])
            ->orderBy('appointment_date')
            ->orderBy('start_time')
            ->get();

        return AppointmentResource::collection($appointments)->response();
    }

    public function slots(Request $request, AppointmentService $appointments): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::HCP, 403);

        $clinician = $request->user()->load(['hcpProfile.availabilitySlots', 'hcpVerification']);
        $from = Carbon::parse($request->input('from', now()->toDateString()))->startOfDay();
        $to = Carbon::parse($request->input('to', now()->addDays(28)->toDateString()))->startOfDay();

        return response()->json([
            'data' => $appointments->openSlots($clinician, $from, $to),

            // Mirrors the patient-facing slots endpoint: the reschedule picker
            // needs the same visit length the slots it is offering were built on.
            'duration_minutes' => Appointment::DURATION_MINUTES,
        ]);
    }

    public function patients(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === UserRole::HCP, 403);

        $patients = User::query()
            ->whereIn('id', Appointment::query()
                ->where('hcp_user_id', $request->user()->id)
                ->select('patient_user_id'))
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'email']);

        return response()->json([
            'data' => $patients->map(fn (User $patient) => [
                'id' => $patient->id,
                'name' => trim("{$patient->first_name} {$patient->last_name}"),
                'email' => $patient->email,
            ])->values(),
        ]);
    }

    public function status(Request $request, Appointment $appointment, AppointmentService $appointments): AppointmentResource
    {
        $this->owns($request, $appointment);
        $data = $request->validate([
            'status' => ['required', Rule::in([
                AppointmentStatus::ARRIVED->value,
                AppointmentStatus::NO_SHOW->value,
                AppointmentStatus::COMPLETED->value,
                AppointmentStatus::BOOKED->value,
            ])],
        ]);

        $updated = $appointments->setStatus($appointment, AppointmentStatus::from($data['status']));

        return new AppointmentResource($updated->load(['clinician.hcpProfile', 'patient', 'results']));
    }

    public function postpone(Request $request, Appointment $appointment, AppointmentService $appointments): AppointmentResource
    {
        $this->owns($request, $appointment);
        $data = $request->validate([
            'date' => ['required', 'date'],
            'time' => ['required', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/'],
        ]);

        $moved = $appointments->move($appointment, $data['date'], substr($data['time'], 0, 5), true);

        return new AppointmentResource($moved->load(['clinician.hcpProfile', 'patient', 'results']));
    }

    public function cancel(Request $request, Appointment $appointment, AppointmentService $appointments): AppointmentResource
    {
        $this->owns($request, $appointment);
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        return new AppointmentResource(
            $appointments->cancel($appointment, $data['reason'])->load(['clinician.hcpProfile', 'patient', 'results'])
        );
    }

    public function summary(Request $request, Appointment $appointment, AppointmentService $appointments): AppointmentResource
    {
        $this->owns($request, $appointment);
        $data = $request->validate([
            'summary' => ['required', 'string', 'max:5000'],
        ]);

        $updated = $appointments->summarize($appointment, $data['summary']);

        return new AppointmentResource($updated->load(['clinician.hcpProfile', 'patient', 'results']));
    }

    public function result(Request $request, Appointment $appointment, AppointmentService $appointments): AppointmentResource
    {
        $this->owns($request, $appointment);
        $data = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $appointments->attachResult($appointment, $data['file'], $data['title'] ?? null);

        return new AppointmentResource($appointment->fresh()->load(['clinician.hcpProfile', 'patient', 'results']));
    }

    public function followUp(Request $request, Appointment $appointment, AppointmentService $appointments): JsonResponse
    {
        $this->owns($request, $appointment);
        $data = $request->validate([
            'date' => ['required', 'date'],
            'time' => ['required', 'regex:/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $created = $appointments->followUp(
            $appointment,
            $data['date'],
            substr($data['time'], 0, 5),
            $data['reason'] ?? null,
        );

        return (new AppointmentResource($created->load(['clinician.hcpProfile', 'patient', 'results'])))
            ->response()
            ->setStatusCode(201);
    }

    public function download(Request $request, Appointment $appointment, Document $document): StreamedResponse
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
            $request->user()->role === UserRole::HCP
            && $appointment->hcp_user_id === $request->user()->id,
            403,
        );
    }
}
