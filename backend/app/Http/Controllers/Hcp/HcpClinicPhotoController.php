<?php

namespace App\Http\Controllers\Hcp;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HcpClinicPhotoController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === UserRole::HCP, 403);
        $request->validate(
            ['photo' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120'
                   ]]);

        $profile = $request->user()->hcpProfile()->firstOrFail();
        $oldPath = $profile->clinic_photo_path;
        $path = $request->file('photo')->store("hcp-clinics/{$request->user()->id}", 'public');
        $profile->update(['clinic_photo_path' => $path]);

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json([
            'message' => 'Clinic photo uploaded successfully.',
            'clinic_photo_url' => Storage::disk('public')->url($path),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === UserRole::HCP, 403);
        $profile = $request->user()->hcpProfile()->firstOrFail();

        if ($profile->clinic_photo_path) {
            Storage::disk('public')->delete($profile->clinic_photo_path);
            $profile->update(['clinic_photo_path' => null]);
        }

        return response()->json(['message' => 'Clinic photo deleted successfully.']);
    }
}
