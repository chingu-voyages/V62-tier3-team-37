<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminAccessRequest;
use App\Models\AdminAccessRequest;
use App\Models\User;
use App\Services\Admin\AdminAccessRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAccessRequestController extends Controller
{
    public function index(Request $request, AdminAccessRequestService $requests): JsonResponse
    {
        $this->requireAdmin($request);

        return response()->json([
            'data' => $requests->pending()
                ->map(fn ($row) => $row->toPortalArray())
                ->values(),
        ]);
    }

    public function mine(Request $request, AdminAccessRequestService $requests): JsonResponse
    {
        $user = $this->currentUser($request);
        if (! $user) {
            abort(401);
        }

        $latest = $requests->latestForEmail($user->email);

        return response()->json([
            'data' => $latest?->toPortalArray(),
        ]);
    }

    public function store(
        StoreAdminAccessRequest $request,
        AdminAccessRequestService $requests,
    ): JsonResponse {
        $record = $requests->store($this->currentUser($request), $request->validated());

        return response()->json([
            'message' => 'Your request to become an admin was sent.',
            'data' => $record->toPortalArray(),
        ], 201);
    }

    public function approve(
        Request $request,
        AdminAccessRequest $accessRequest,
        AdminAccessRequestService $requests,
    ): JsonResponse {
        $this->requireAdmin($request);
        $updated = $requests->approve($accessRequest);

        return response()->json([
            'message' => 'This person is now an admin.',
            'data' => $updated->toPortalArray(),
        ]);
    }

    public function decline(
        Request $request,
        AdminAccessRequest $accessRequest,
        AdminAccessRequestService $requests,
    ): JsonResponse {
        $this->requireAdmin($request);
        $updated = $requests->decline($accessRequest);

        return response()->json([
            'message' => 'This request was declined.',
            'data' => $updated->toPortalArray(),
        ]);
    }

    private function requireAdmin(Request $request): User
    {
        $user = $this->currentUser($request);

        if (! $user || $user->role !== UserRole::ADMIN) {
            abort(403);
        }

        return $user;
    }

    private function currentUser(Request $request): ?User
    {
        $user = $request->user() ?? Auth::guard('web')->user();

        return $user instanceof User ? $user : null;
    }
}
