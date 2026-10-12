<?php

namespace App\Services\Admin;

use App\Enums\DocumentCategory;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class AdminClinicianService
{
    /**
     * @return Collection<int, User>
     */
    public function list(): Collection
    {
        return User::query()
            ->where('role', UserRole::HCP)
            ->with(['hcpProfile', 'hcpVerification'])
            ->withCount([
                'reviewsReceived',
                'reportsReceived as reports_received_count' => function ($query) {
                    $query->where('status', ReportStatus::OPEN);
                },
            ])
            ->latest()
            ->get();
    }

    public function find(User $user): User
    {
        $this->ensureClinician($user);

        return $user->load([
            'hcpProfile',
            'hcpVerification',
            'documents',
            'reviewsReceived.patient',
            'reportsReceived.reporter',
        ])->loadCount([
            'reviewsReceived',
            'reportsReceived as reports_received_count' => function ($query) {
                $query->where('status', ReportStatus::OPEN);
            },
        ]);
    }

    public function block(User $user): User
    {
        $this->ensureClinician($user);
        $user->forceFill(['status' => UserStatus::DISABLED])->save();

        return $this->find($user);
    }

    public function unblock(User $user): User
    {
        $this->ensureClinician($user);
        $user->forceFill(['status' => UserStatus::ACTIVE])->save();

        return $this->find($user);
    }

    public function decide(User $user, string $decision, ?string $reason): User
    {
        $this->ensureClinician($user);
        $verification = $user->hcpVerification;

        if (! $verification) {
            throw ValidationException::withMessages([
                'decision' => 'This clinician has not submitted credentials yet.',
            ]);
        }

        if ($decision === VerificationStatus::REJECTED->value && ($reason === null || $reason === '')) {
            throw ValidationException::withMessages([
                'reason' => 'Add a short reason for the rejection.',
            ]);
        }

        $verification->forceFill([
            'status' => $decision,
            'reviewed_at' => now(),
            'rejection_reason' => $decision === VerificationStatus::REJECTED->value ? $reason : null,
        ])->save();

        return $this->find($user);
    }

    /**
     * @return array<string, mixed>
     */
    public function summary(User $user): array
    {
        $profile = $user->hcpProfile;
        $verification = $user->hcpVerification;

        return [
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'birth_date' => $user->birth_date?->toDateString(),
            'gender' => $user->gender?->value,
            'country' => $user->country,
            'status' => $user->status?->value ?? UserStatus::ACTIVE->value,
            'created_at' => $user->created_at?->toIso8601String(),
            'specialty' => $profile?->specialty?->value,
            'years_of_experience' => $profile?->years_of_experience,
            'medical_license_number' => $profile?->medical_license_number,
            'license_issuing_authority' => $profile?->license_issuing_authority,
            'city' => $profile?->city,
            'workplace_name' => $profile?->workplace_name,
            'verification_status' => $verification?->status?->value,
            'submitted_at' => $verification?->submitted_at?->toIso8601String(),
            'liveness_status' => $verification?->liveness_status?->value,
            'rejection_reason' => $verification?->rejection_reason,
            'reviews_count' => (int) ($user->reviews_received_count ?? 0),
            'reports_count' => (int) ($user->reports_received_count ?? 0),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detail(User $user): array
    {
        $summary = $this->summary($user);

        $summary['documents'] = $user->documents
            ->filter(fn ($document) => $document->category !== DocumentCategory::MEDICAL)
            ->map(fn ($document) => [
                'id' => $document->id,
                'type' => $document->document_type?->value,
                'title' => $document->title,
            ])
            ->values();

        $summary['reviews'] = $user->reviewsReceived
            ->sortByDesc('created_at')
            ->values()
            ->map(fn ($review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'author' => trim(($review->patient?->first_name ?? '').' '.($review->patient?->last_name ?? '')),
                'created_at' => $review->created_at?->toIso8601String(),
            ]);

        $summary['reports'] = $user->reportsReceived
            ->sortByDesc('created_at')
            ->values()
            ->map(fn ($report) => [
                'id' => $report->id,
                'reason' => $report->reason,
                'details' => $report->details,
                'status' => $report->status?->value,
                'author' => trim(($report->reporter?->first_name ?? '').' '.($report->reporter?->last_name ?? '')),
                'created_at' => $report->created_at?->toIso8601String(),
            ]);

        return $summary;
    }

    private function ensureClinician(User $user): void
    {
        if ($user->role !== UserRole::HCP) {
            abort(404);
        }
    }
}
