<?php

namespace App\Http\Controllers;

use App\Models\AutomationRule;
use App\Models\AutomationRun;
use App\Models\CrmTask;
use App\Services\CrmAutomationService;
use App\Support\EventTypeSettings;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AutomationController extends Controller
{
    public function __construct(
        private readonly CrmAutomationService $automationService,
    ) {}

    public function index()
    {
        return Inertia::render('Admin/Automations/Index', [
            'rules' => AutomationRule::query()->latest()->get(),
            'tasks' => CrmTask::query()->with(['lead', 'project'])->latest()->limit(20)->get()->map(fn (CrmTask $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'status' => $task->status,
                'priority' => $task->priority,
                'due_at' => optional($task->due_at)?->toIso8601String(),
                'project_name' => $task->project?->name,
                'lead_name' => $task->lead?->name,
            ]),
            'runs' => AutomationRun::query()->with('rule')->latest()->limit(20)->get()->map(fn (AutomationRun $run) => [
                'id' => $run->id,
                'rule_name' => $run->rule?->name,
                'trigger_type' => $run->trigger_type,
                'status' => $run->status,
                'message' => $run->message,
                'executed_at' => optional($run->executed_at)?->toIso8601String(),
            ]),
            'eventTypes' => EventTypeSettings::get(),
            'triggerOptions' => CrmAutomationService::TRIGGERS,
            'actionOptions' => CrmAutomationService::ACTIONS,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'nullable|boolean',
            'event_type' => 'nullable|string|max:120',
            'trigger_type' => 'required|string|max:120',
            'trigger_offset_days' => 'nullable|integer|min:0|max:365',
            'action_type' => 'required|string|max:120',
            'task_title' => 'nullable|string|max:255',
            'task_description' => 'nullable|string|max:5000',
            'email_subject' => 'nullable|string|max:255',
            'email_body' => 'nullable|string|max:5000',
            'recipient_email' => 'nullable|string|max:255',
            'webhook_url' => 'nullable|url|max:2000',
            'priority' => 'nullable|string|max:50',
        ]);

        AutomationRule::create([
            'name' => $validated['name'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'event_type' => $validated['event_type'] ?: null,
            'trigger_type' => $validated['trigger_type'],
            'trigger_offset_days' => (int) ($validated['trigger_offset_days'] ?? 0),
            'action_type' => $validated['action_type'],
            'action_config' => [
                'task_title' => $validated['task_title'] ?? null,
                'task_description' => $validated['task_description'] ?? null,
                'email_subject' => $validated['email_subject'] ?? null,
                'email_body' => $validated['email_body'] ?? null,
                'recipient_email' => $validated['recipient_email'] ?? null,
                'webhook_url' => $validated['webhook_url'] ?? null,
                'priority' => $validated['priority'] ?? 'normal',
            ],
        ]);

        return back()->with('success', 'Automatizacion creada.');
    }

    public function update(Request $request, AutomationRule $automationRule)
    {
        $validated = $request->validate([
            'is_active' => 'nullable|boolean',
        ]);

        $automationRule->update([
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        return back()->with('success', 'Automatizacion actualizada.');
    }

    public function destroy(AutomationRule $automationRule)
    {
        $automationRule->delete();

        return back()->with('success', 'Automatizacion eliminada.');
    }

    public function run()
    {
        $count = $this->automationService->runScheduled();

        return back()->with('success', "Automatizaciones ejecutadas: {$count}.");
    }

    public function completeTask(CrmTask $crmTask)
    {
        $crmTask->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Tarea completada.');
    }
}
