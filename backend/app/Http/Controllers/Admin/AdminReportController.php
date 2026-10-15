<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(ReportStatus::class)],
        ]);

        $reports = Report::query()
            ->with([
                'reporter:id,first_name,last_name,email',
                'reportedHcp:id,first_name,last_name,email,status',
                'appointment:id,scheduled_start_at,status',
                'resolvedBy:id,first_name,last_name,email',
            ])
            ->when($validated['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($reports);
    }

    public function show(Report $report): JsonResponse
    {
        return response()->json(['data' => $report->load([
            'reporter', 'reportedHcp.hcpProfile', 'appointment', 'resolvedBy',
        ])]);
    }

    public function decide(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in([
                ReportStatus::RESOLVED->value,
                ReportStatus::DISMISSED->value,
            ])],
            'resolution_note' => ['required', 'string', 'max:5000'],
        ]);

        abort_if($report->status !== ReportStatus::OPEN, 409, 'This report is already closed.');

        $report->update([
            'status' => $validated['status'],
            'resolved_by_user_id' => $request->user()->id,
            'resolution_note' => $validated['resolution_note'],
            'resolved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Report reviewed successfully.',
            'data' => $report->fresh(['reporter', 'reportedHcp', 'appointment', 'resolvedBy']),
        ]);
    }
}
