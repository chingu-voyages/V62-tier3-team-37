<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AdminAccessRequestStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\AdminAccessRequest;
use App\Models\HcpVerification;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'clinician_requests' => HcpVerification::query()
                ->where('status', VerificationStatus::UNDER_REVIEW->value)->count(),
            'open_reports' => Report::query()
                ->where('status', ReportStatus::OPEN->value)->count(),
            'access_requests' => AdminAccessRequest::query()
                ->where('status', AdminAccessRequestStatus::PENDING->value)->count(),
            'patients' => User::query()->where('role', UserRole::PATIENT->value)->count(),
        ]]);
    }
}
