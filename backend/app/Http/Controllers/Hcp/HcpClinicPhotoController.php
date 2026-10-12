<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Hcp\HcpProfileResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HcpClinicPhotoController extends Controller
{
    public function update(Request $request): HcpProfileResource
    {
        $user = $this->clinician($request);
        $data = $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $profile = $user->hcpProfile;
        abort_unless($profile !== null, 422, 'Add your clinic details before uploading a photo.');

        $path = $data['photo']->store("clinic-photos/{$user->id}", 'public');
        $previous = $profile->clinic_photo_path;
        $profile->update(['clinic_photo_path' => $path]);

        if ($previous) {
            Storage::disk('public')->delete($previous);
        }

        return new HcpProfileResource($user->fresh()->load($this->relations()));
    }

    public function destroy(Request $request): HcpProfileResource
    {
        $user = $this->clinician($request);
        $profile = $user->hcpProfile;
        abort_unless($profile !== null, 404);

        if ($profile->clinic_photo_path) {
            Storage::disk('public')->delete($profile->clinic_photo_path);
            $profile->update(['clinic_photo_path' => null]);
        }

        return new HcpProfileResource($user->fresh()->load($this->relations()));
    }

    private function clinician(Request $request): User
    {
        $user = $request->user();
        abort_unless($user->role === UserRole::HCP, 403);

        return $user;
    }

    /**
     * @return list<string>
     */
    private function relations(): array
    {
        return [
            'hcpProfile.availabilitySlots',
            'hcpVerification',
        ];
    }
}
