<?php

namespace App\Services\Profile;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class ProfilePhotoService
{
    public function update(
        User $user,
        UploadedFile $photo
    ): string {
        $oldPath = $user->profile_photo_path;

        $newPath = $photo->store(
            "profile-photos/{$user->id}",
            'public'
        );

        if (! $newPath) {
            throw new RuntimeException(
                'Failed to store profile photo.'
            );
        }

        try {
            $user->update([
                'profile_photo_path' => $newPath,
            ]);
        } catch (Throwable $exception) {
            Storage::disk('public')->delete($newPath);

            throw $exception;
        }

        if ($oldPath) {
            $deleted = Storage::disk('public')
                ->delete($oldPath);

            if (! $deleted) {
                Log::warning(
                    'Failed to delete old profile photo.',
                    [
                        'user_id' => $user->id,
                        'path' => $oldPath,
                    ]
                );
            }
        }

        return $newPath;
    }

    public function delete(User $user): void
    {
        $path = $user->profile_photo_path;

        if (! $path) {
            return;
        }

        $user->update([
            'profile_photo_path' => null,
        ]);

        $deleted = Storage::disk('public')
            ->delete($path);

        if (! $deleted) {
            Log::warning(
                'Failed to delete profile photo.',
                [
                    'user_id' => $user->id,
                    'path' => $path,
                ]
            );
        }
    }
}