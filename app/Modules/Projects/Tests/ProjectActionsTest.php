<?php

namespace App\Modules\Projects\Tests;

use App\Modules\Projects\Actions\CreateProjectAction;
use App\Modules\Projects\Actions\DeleteProjectAction;
use App\Modules\Projects\Actions\UpdateProjectSettingsAction;
use App\Modules\Projects\Events\ProjectCreated;
use App\Modules\Projects\Events\ProjectDeleted;
use PHPUnit\Framework\TestCase;

class ProjectActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(CreateProjectAction::class));
        $this->assertTrue(class_exists(DeleteProjectAction::class));
        $this->assertTrue(class_exists(UpdateProjectSettingsAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(ProjectCreated::class));
        $this->assertTrue(class_exists(ProjectDeleted::class));
    }
}
