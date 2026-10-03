<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\DocumentType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\Hcp\UpdateHcpAvailabilityRequest;
use App\Http\Requests\Profile\Hcp\UpdateHcpProfileRequest;
use App\Http\Resources\Hcp\HcpProfileResource;
use App\Models\HcpAvailabilitySlot;
use App\Models\User;
use App\Services\Hcp\HcpAvailabilityService;
use App\Services\Hcp\HcpProfileService;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\Request;

class HcpProfileController extends Controller
{
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
