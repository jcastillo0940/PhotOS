<?php

namespace App\Modules\Gallery\Actions;

use App\Models\GalleryFavorite;
use App\Models\Photo;

class ToggleFavoriteAction
{
    public function execute(string $visitorToken, Photo $photo): bool
    {
        $existing = GalleryFavorite::where('visitor_token', $visitorToken)
            ->where('photo_id', $photo->id)
            ->first();

        if ($existing) {
            $existing->delete();
            return false;
        }

        GalleryFavorite::create([
            'visitor_token' => $visitorToken,
            'photo_id'      => $photo->id,
            'project_id'    => $photo->project_id,
        ]);

        return true;
    }
}
