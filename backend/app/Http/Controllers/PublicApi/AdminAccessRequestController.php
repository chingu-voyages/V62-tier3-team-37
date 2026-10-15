<?php

namespace App\Http\Controllers\PublicApi;

use App\Enums\AdminAccessRequestStatus;
use App\Http\Controllers\Controller;
use App\Models\AdminAccessRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminAccessRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique('admin_access_requests')->where(
                    fn ($query) => $query->where('status', AdminAccessRequestStatus::PENDING->value)
                ),
            ],
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $accessRequest = AdminAccessRequest::query()->create([
            ...$validated,
            'email' => strtolower(trim($validated['email'])),
            'status' => AdminAccessRequestStatus::PENDING,
        ]);

        return response()->json([
            'message' => 'Admin access request submitted successfully.',
            'data' => $accessRequest,
        ], 201);
    }
}
