<?php

namespace App\Http\Controllers\Patient;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\GetHcpAvailabilityRequest;
use App\Models\Appointment;
use App\Models\User;
use App\Services\Appointment\AppointmentAvailabilityService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class PatientHcpAvailabilityController extends Controller
{
    public function index(
        GetHcpAvailabilityRequest $request,
        int $hcp,
        AppointmentAvailabilityService $availabilityService
    ): JsonResponse {
        $provider = User::query()
            ->whereKey($hcp)
            ->where('role', UserRole::HCP->value)
            ->where('status', UserStatus::ACTIVE->value)
            ->whereHas('hcpVerification', fn ($query) => $query
                ->where('status', VerificationStatus::VERIFIED->value))
            ->firstOrFail();

        $validated = $request->validated();
        $availability = $availabilityService->availableSlotsForRange(
            $provider,
            CarbonImmutable::createFromFormat('!Y-m-d', $validated['from']),
            CarbonImmutable::createFromFormat('!Y-m-d', $validated['to'])
        );

        $dates = [];

        foreach ($availability as $date => $slots) {
            $dates[] = [
                'date' => $date,
                'slots' => $slots,
            ];
        }

        return response()->json([
            'data' => [
                'hcp_id' => $provider->id,
                'duration_minutes' => Appointment::DURATION_MINUTES,
                'dates' => $dates,
            ],
        ]);
    }
}
