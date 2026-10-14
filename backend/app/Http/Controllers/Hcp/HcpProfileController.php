<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\DocumentType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\Hcp\UpdateHcpAvailabilityRequest;
use App\Http\Requests\Profile\Hcp\UpdateHcpProfileRequest;
use App\Http\Resources\Hcp\HcpProfileResource;
use App\Models\Appointment;
use App\Models\HcpAvailabilitySlot;
use App\Models\User;
use App\Services\Appointment\AppointmentAvailabilityService;
use App\Services\Hcp\HcpAvailabilityService;
use App\Services\Hcp\HcpProfileService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HcpProfileController extends Controller
{
    /** Matches the patient availability endpoint's own ceiling. */
    private const AVAILABILITY_RANGE_MAX_DAYS = 31;

    public function show(Request $request): HcpProfileResource
    {
        $user = $request->user();

        abort_unless(
            $user->role === UserRole::HCP,
            403,
            'Only healthcare Providers can access this profile.'
        );

        return new HcpProfileResource(
            $this->loadProfileRelations($user)
        );
    }

    public function update(
        UpdateHcpProfileRequest $request,
        HcpProfileService $profileService
    ): HcpProfileResource {
        $user = $profileService->update(
            $request->user(),
            $request->validated()
        );

        return (new HcpProfileResource(
            $this->loadProfileRelations($user)
        ))->additional([
            'message' => 'HCP profile updated successfully.',
        ]);
    }

    public function updateAvailability(
        UpdateHcpAvailabilityRequest $request,
        HcpAvailabilityService $availabilityService
    ): HcpProfileResource {
        $validated = $request->validated();

        $user = $availabilityService->replace(
            $request->user(),
            $validated['slots']
        );

        return (new HcpProfileResource(
            $this->loadProfileRelations($user)
        ))->additional([
            'message' => 'HCP availability updated successfully.',
        ]);
    }

    /**
     * The signed-in clinician's own bookable slots, for a date range.
     *
     * Deliberately separate from `/patient/hcps/{hcp}/availability`: that one is
     * patient-only by design (`GetHcpAvailabilityRequest::authorize`), because a
     * patient may read any clinician's diary. A clinician rescheduling a visit
     * needs their *own* diary, and adding HCP to that check would have let one
     * clinician read another's by changing the id.
     *
     * `excludeAppointmentId` is what makes this usable for a reschedule: the slot
     * the visit currently occupies must appear as free, or the clinician could not
     * move it to a time they had just been treating as taken.
     */
    public function availabilitySlots(
        Request $request,
        AppointmentAvailabilityService $availabilityService
    ): JsonResponse {
        $validated = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $range = $validated['to'] === $validated['from']
            ? 0
            : CarbonImmutable::createFromFormat('!Y-m-d', $validated['from'])
                ->diffInDays(CarbonImmutable::createFromFormat('!Y-m-d', $validated['to']));

        abort_if(
            $range > self::AVAILABILITY_RANGE_MAX_DAYS - 1,
            422,
            'The availability range may not exceed '.self::AVAILABILITY_RANGE_MAX_DAYS.' days.',
        );

        $exclude = $request->integer('exclude_appointment') ?: null;

        if ($exclude !== null) {
            // Silently ignoring someone else's id would leak nothing but would make
            // a reschedule target the wrong slot, so this is a hard 404.
            abort_unless(
                $request->user()->hcpAppointments()->whereKey($exclude)->exists(),
                404,
            );
        }

        $availability = $availabilityService->availableSlotsForRange(
            $request->user(),
            CarbonImmutable::createFromFormat('!Y-m-d', $validated['from']),
            CarbonImmutable::createFromFormat('!Y-m-d', $validated['to']),
            $exclude,
        );

        $dates = [];

        foreach ($availability as $date => $slots) {
            $dates[] = ['date' => $date, 'slots' => $slots];
        }

        return response()->json([
            'data' => [
                'hcp_id' => $request->user()->id,
                'duration_minutes' => Appointment::DURATION_MINUTES,
                'dates' => $dates,
            ],
        ]);
    }

    public function destroyAvailability(
        Request $request,
        HcpAvailabilitySlot $availabilitySlot,
        HcpAvailabilityService $availabilityService
    ): HcpProfileResource {
        $user = $availabilityService->delete(
            $request->user(),
            $availabilitySlot
        );

        return (new HcpProfileResource(
            $this->loadProfileRelations($user)
        ))->additional([
            'message' => 'HCP availability slot deleted successfully.',
        ]);
    }

    private function loadProfileRelations(User $user): User
    {
        return $user->load([
            'hcpProfile.availabilitySlots' => function (HasMany $query): void {
                $query
                    ->orderBy('day_of_week')
                    ->orderBy('start_time');
            },
            'hcpVerification',
            'documents' => function (HasMany $query): void {
                $query->whereIn('document_type', [
                    DocumentType::GOVERNMENT_ID_FRONT->value,
                    DocumentType::GOVERNMENT_ID_BACK->value,
                    DocumentType::MEDICAL_LICENSE->value,
                    DocumentType::QUALIFICATION->value,
                ]);
            },
        ]);
    }
}
