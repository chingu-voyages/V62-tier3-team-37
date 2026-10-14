<?php

namespace App\Http\Controllers\Patient;

use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\HcpProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/**
 * Filter dropdown options, derived from the rows that are actually eligible.
 *
 * Hard-coded option lists drift: they offer a city or insurer that exists in
 * the UI and nowhere in the database, and the user picks it to get nothing.
 * These are read off the same eligibility rule the listing uses.
 */
class HcpFilterOptionsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $profiles = HcpProfile::query()
            ->whereHas('user', fn (Builder $query) => $this->eligible($query))
            ->whereHas('user.hcpVerification', fn (Builder $query) => $query->where('status', VerificationStatus::VERIFIED));

        $insurers = (clone $profiles)
            ->whereNotNull('insurance_accepted')
            ->pluck('insurance_accepted')
            ->flatten()
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return response()->json([
            'data' => [
                'specialties' => collect(Specialty::cases())
                    ->map(fn (Specialty $specialty) => [
                        'value' => $specialty->label(),
                        'enum' => $specialty->value,
                    ])
                    ->all(),

                'cities' => (clone $profiles)->whereNotNull('city')->distinct()->orderBy('city')->pluck('city')->values(),
                'areas' => (clone $profiles)->whereNotNull('area')->distinct()->orderBy('area')->pluck('area')->values(),
                'insurances' => $insurers,
            ],
        ]);
    }

    private function eligible(Builder $query): void
    {
        $query->where('role', UserRole::HCP)->where('status', UserStatus::ACTIVE);
    }
}
