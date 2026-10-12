<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\HcpReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->requireAdmin($request);

        $reports = HcpReport::query()
            ->with(['clinician', 'reporter'])
            ->latest()
            ->get()
            ->map(fn (HcpReport $report) => $this->payload($report))
            ->values();

        return response()->json(['data' => $reports]);
    }

    public function resolve(Request $request, HcpReport $report): JsonResponse
    {
        return $this->decide($request, $report, ReportStatus::RESOLVED, 'This report is resolved.');
    }

    public function dismiss(Request $request, HcpReport $report): JsonResponse
    {
        return $this->decide($request, $report, ReportStatus::DISMISSED, 'This report was dismissed.');
    }

    private function decide(Request $request, HcpReport $report, ReportStatus $status, string $message): JsonResponse
    {
        $this->requireAdmin($request);
        $report->forceFill(['status' => $status])->save();

        return response()->json([
            'message' => $message,
            'data' => $this->payload($report->load(['clinician', 'reporter'])),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(HcpReport $report): array
    {
        $clinician = $report->clinician;
        $reporter = $report->reporter;

        return [
            'id' => $report->id,
            'clinician_id' => $report->hcp_user_id,
            'clinician_name' => trim(($clinician?->first_name ?? '').' '.($clinician?->last_name ?? '')),
            'reason' => $report->reason,
            'details' => $report->details,
            'status' => $report->status?->value ?? ReportStatus::OPEN->value,
            'author' => trim(($reporter?->first_name ?? '').' '.($reporter?->last_name ?? '')),
            'created_at' => $report->created_at?->toIso8601String(),
        ];
    }

    private function requireAdmin(Request $request): void
    {
        $user = $request->user();

        if (! $user || $user->role !== UserRole::ADMIN) {
            abort(403);
        }
    }
}
