<?php

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\ProfilePhotoRequest;
use App\Services\Profile\ProfilePhotoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter;
class ProfilePhotoController extends Controller
{
    public function update(
        ProfilePhotoRequest $request,
        ProfilePhotoService $photoService
    ): JsonResponse {
        $user = $request->user();

        $path = $photoService->update(
            $user,
            $request->file('photo')
        );

        /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('public');

            $url = $disk->url($path);

        return response()->json([
            'message' => 'Profile photo updated successfully.',

            'data' => [
                'profile_photo_path' => $path,

                'profile_photo_url' => $url,           
                ],
        ]);
    }

    public function destroy(
        ProfilePhotoService $photoService
    ): JsonResponse {
        $user = request()->user();

        $photoService->delete($user);

        return response()->json([
            'message' => 'Profile photo deleted successfully.',
        ]);
    }
}