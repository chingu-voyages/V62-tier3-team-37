<?php

namespace App\Http\Controllers\Patient;

use App\Enums\Specialty;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Patient\HcpListingResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class HcpListingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'specialty' => ['sometimes', Rule::enum(Specialty::class)],
            'insurance' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'string', 'max:100'],
            'area' => ['sometimes', 'string', 'max:100'],
        ]);

        $hcps = User::query()
            ->where('role', UserRole::HCP)
            ->where('status', UserStatus::ACTIVE)
            ->whereHas('hcpProfile')
            ->whereHas('hcpVerification', fn ($query) => $query->where(
                'status', VerificationStatus::VERIFIED
            ))
            ->when(isset($validated['name']), function ($query) use ($validated) {
                $nameParts = preg_split('/\s+/', trim($validated['name'])) ?: [];

                foreach ($nameParts as $namePart) {
                    $query->where(function ($query) use ($namePart) {
                        $query->where('first_name', 'like', "%{$namePart}%")
                            ->orWhere('last_name', 'like', "%{$namePart}%");
                    });
                }
            })
            ->when(isset($validated['specialty']), fn ($query) => $query->whereHas(
                'hcpProfile', fn ($query) => $query->where('specialty', $validated['specialty'])
            ))
            ->when(isset($validated['city']), fn ($query) => $query->whereHas(
                'hcpProfile', fn ($query) => $query->where('clinic_city', 'like', "%{$validated['city']}%")
            ))
            ->when(isset($validated['area']), fn ($query) => $query->whereHas(
                'hcpProfile', fn ($query) => $query->where('clinic_area', 'like', "%{$validated['area']}%")
            ))
            ->when(isset($validated['insurance']), fn ($query) => $query->whereHas(
                'hcpProfile', fn ($query) => $query->whereJsonContains('accepted_insurances', $validated['insurance'])
            ))
            ->with('hcpProfile')
            ->paginate(10);

        return HcpListingResource::collection($hcps);
    }
}
