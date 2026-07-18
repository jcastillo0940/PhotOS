<?php

namespace App\Modules\Gallery\Actions;

use App\Models\GalleryEmailRegistration;
use App\Models\Project;

class RegisterGalleryVisitorAction
{
    public function execute(Project $project, string $email, string $name): GalleryEmailRegistration
    {
        return GalleryEmailRegistration::firstOrCreate(
            ['project_id' => $project->id, 'email' => $email],
            ['name' => $name, 'registered_at' => now()]
        );
    }
}
