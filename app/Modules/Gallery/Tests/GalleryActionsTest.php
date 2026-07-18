<?php

namespace App\Modules\Gallery\Tests;

use App\Modules\Gallery\Actions\RegisterGalleryVisitorAction;
use App\Modules\Gallery\Actions\ToggleFavoriteAction;
use App\Modules\Gallery\Events\GalleryViewed;
use PHPUnit\Framework\TestCase;

class GalleryActionsTest extends TestCase
{
    public function test_action_classes_exist(): void
    {
        $this->assertTrue(class_exists(RegisterGalleryVisitorAction::class));
        $this->assertTrue(class_exists(ToggleFavoriteAction::class));
    }

    public function test_event_classes_exist(): void
    {
        $this->assertTrue(class_exists(GalleryViewed::class));
    }
}
