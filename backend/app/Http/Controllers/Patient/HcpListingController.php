<?php

namespace App\Http\Controllers\Patient;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Patient\HcpListingResource;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HcpListingController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $hcps = User::query()
            ->where('role', UserRole::HCP)
            ->where('status', UserStatus::ACTIVE)
            ->whereHas('hcpProfile')
            ->whereHas('hcpVerification', function ($query) {
                $query->where('status', VerificationStatus::VERIFIED);
            })
            ->with('hcpProfile')
            ->paginate(10);

        return HcpListingResource::collection($hcps);
    }
}