<?php

namespace App\Http\Controllers\Patient;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Patient\HcpListingRequest;
use App\Http\Resources\Patient\HcpListingResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The patient-facing doctor directory.
 *
 * Every filter, the sort and the pagination live here rather than in Next.js:
 * the client is only ever holding one page, so filtering its own copy would
 * search that page and miss every other match in the database.
 *
 * Eligibility (active role, verified) is enforced in the query, so it can never
 * be widened by a filter or a sort.
 */
class HcpListingController extends Controller
{
    public function index(HcpListingRequest $request): AnonymousResourceCollection
    {
        $search = $request->search();
        $specialty = $request->specialty();
        $city = $request->city();
        $area = $request->area();
        $insurance = $request->insurance();

        $hcps = User::query()
            ->where('role', UserRole::HCP)
            ->where('status', UserStatus::ACTIVE)
            ->whereHas('hcpVerification', fn (Builder $query) => $query->where('status', VerificationStatus::VERIFIED))
            // An inner join, not `whereHas`: sorting orders by columns on the
            // profile, which needs the table in the FROM clause. `hcp_profiles`
            // is unique per user, so the join cannot duplicate a row.
            ->join('hcp_profiles', 'hcp_profiles.user_id', '=', 'users.id')
            ->where(function (Builder $profile) use ($specialty, $city, $area, $insurance) {
                if ($specialty) {
                    $profile->where('hcp_profiles.specialty', $specialty->value);
                }
                if ($city) {
                    $profile->where('hcp_profiles.city', $city);
                }
                if ($area) {
                    $profile->where('hcp_profiles.area', $area);
                }
                if ($insurance) {
                    // JSON column: matches when the array contains the value.
                    $profile->whereJsonContains('hcp_profiles.insurance_accepted', $insurance);
                }
            })
            ->when($search, function (Builder $query) use ($search) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $search).'%';

                $query->where(function (Builder $inner) use ($like) {
                    $inner->where('users.first_name', 'like', $like)
                        ->orWhere('users.last_name', 'like', $like)
                        ->orWhere('hcp_profiles.sub_specialty', 'like', $like)
                        ->orWhere('hcp_profiles.specialty', 'like', $like)
                        ->orWhere('hcp_profiles.workplace_name', 'like', $like)
                        ->orWhere('hcp_profiles.city', 'like', $like);
                });
            })
            ->select('users.*')
            ->with('hcpProfile')
            ->tap(fn (Builder $query) => $this->applySort($query, $request->sort()))
            ->paginate($request->perPage())
            // Keeps the requested page in the JSON, so the client can read it
            // back out of `meta` instead of tracking it separately.
            ->withQueryString();

        return HcpListingResource::collection($hcps);
    }

    private function applySort(Builder $query, string $sort): void
    {
        switch ($sort) {
            case 'name':
                $query->orderBy('users.last_name')->orderBy('users.first_name');
                break;
            case 'rating':
                $query->orderByDesc('hcp_profiles.rating')->orderByDesc('hcp_profiles.review_count');
                break;
            case 'experience':
                $query->orderByDesc('hcp_profiles.years_of_experience');
                break;
            case 'price':
                $query->orderBy('hcp_profiles.fees');
                break;
            default:
                // "Best match" with no search term: most reviewed first.
                $query->orderByDesc('hcp_profiles.review_count')
                    ->orderByDesc('hcp_profiles.rating');
        }
    }
}
