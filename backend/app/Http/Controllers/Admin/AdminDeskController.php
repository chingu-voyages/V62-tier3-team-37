<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminAccessStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\AdminAccessRequest;
use App\Models\HcpReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDeskController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $cliniciansWaiting = User::query()
            ->where('role', UserRole::HCP)
            ->where('status', UserStatus::ACTIVE)
            ->where(function ($query) {
                $query->whereDoesntHave('hcpVerification')
                    ->orWhereHas('hcpVerification', function ($verification) {
                        $verification->where('status', VerificationStatus::UNDER_REVIEW);
                    });
            })
            ->count();

        return response()->json([
            'data' => [
                'clinicians_waiting' => $cliniciansWaiting,
                'reports_open' => HcpReport::query()->where('status', ReportStatus::OPEN)->count(),
                'access_requests' => AdminAccessRequest::query()
                    ->where('status', AdminAccessStatus::PENDING)
                    ->count(),
                'patients' => User::query()->where('role', UserRole::PATIENT)->count(),
            ],
        ]);
    }

    private function requireAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::ADMIN) {
            abort(403);
        }
    }
}
