<?php

namespace App\Modules\Automations\Actions;

use App\Models\CrmTask;

class CompleteTaskAction
{
    public function execute(CrmTask $task, ?string $notes = null): CrmTask
    {
        $task->update([
            'status'       => 'completed',
            'completed_at' => now(),
            'notes'        => $notes,
        ]);

        return $task->fresh();
    }
}
