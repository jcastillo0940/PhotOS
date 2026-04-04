<?php

namespace App\Services;

use App\Models\AutomationRule;
use App\Models\AutomationRun;
use App\Models\CrmTask;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Project;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

class CrmAutomationService
{
    public const TRIGGERS = [
        'lead_created',
        'project_created',
        'gallery_published',
        'days_before_event',
        'day_of_event',
        'days_after_event',
        'first_anniversary',
        'invoice_overdue',
    ];

    public const ACTIONS = [
        'task',
        'email',
        'webhook',
    ];

    public function runImmediate(string $triggerType, Lead|Project|Invoice $subject): void
    {
        $rules = AutomationRule::query()
            ->where('is_active', true)
            ->where('trigger_type', $triggerType)
            ->get();

        foreach ($rules as $rule) {
            $this->executeRule($rule, $subject, $triggerType);
        }
    }

    public function runScheduled(): int
    {
        $count = 0;
        $today = now()->startOfDay();
        $rules = AutomationRule::query()
            ->where('is_active', true)
            ->whereIn('trigger_type', ['days_before_event', 'day_of_event', 'days_after_event', 'first_anniversary', 'invoice_overdue'])
            ->get();

        foreach ($rules as $rule) {
            if ($rule->trigger_type === 'invoice_overdue') {
                $invoices = Invoice::query()
                    ->with(['project.lead', 'client'])
                    ->where('status', '!=', 'paid')
                    ->whereDate('due_date', '<=', $today->copy()->subDays(max(0, $rule->trigger_offset_days)))
                    ->get();

                foreach ($invoices as $invoice) {
                    $this->executeRule($rule, $invoice, $rule->trigger_type);
                    $count++;
                }

                continue;
            }

            $projects = Project::query()
                ->with(['lead', 'client'])
                ->whereNotNull('event_date')
                ->get();

            foreach ($projects as $project) {
                $eventDate = optional($project->event_date)?->copy()?->startOfDay();
                if (!$eventDate) {
                    continue;
                }

                $shouldRun = match ($rule->trigger_type) {
                    'days_before_event' => $eventDate->equalTo($today->copy()->addDays($rule->trigger_offset_days)),
                    'day_of_event' => $eventDate->equalTo($today),
                    'days_after_event' => $eventDate->equalTo($today->copy()->subDays($rule->trigger_offset_days)),
                    'first_anniversary' => $eventDate->copy()->addYear()->equalTo($today),
                    default => false,
                };

                if ($shouldRun) {
                    $this->executeRule($rule, $project, $rule->trigger_type);
                    $count++;
                }
            }
        }

        return $count;
    }

    private function executeRule(AutomationRule $rule, Lead|Project|Invoice $subject, string $triggerType): void
    {
        if (!$this->matchesEventType($rule, $subject)) {
            return;
        }

        $runKey = $this->runKeyFor($rule, $subject, $triggerType);
        if (AutomationRun::query()->where('run_key', $runKey)->exists()) {
            return;
        }

        $payload = $this->buildPayload($subject, $triggerType);
        $status = 'completed';
        $message = 'Automatizacion ejecutada.';

        try {
            match ($rule->action_type) {
                'task' => $this->createTask($rule, $subject, $payload),
                'email' => $this->sendEmail($rule, $payload),
                'webhook' => $this->sendWebhook($rule, $payload),
                default => null,
            };
        } catch (\Throwable $e) {
            $status = 'failed';
            $message = $e->getMessage();
        }

        AutomationRun::create([
            'automation_rule_id' => $rule->id,
            'lead_id' => $payload['lead_id'] ?? null,
            'project_id' => $payload['project_id'] ?? null,
            'invoice_id' => $payload['invoice_id'] ?? null,
            'trigger_type' => $triggerType,
            'run_key' => $runKey,
            'status' => $status,
            'message' => $message,
            'payload' => $payload,
            'executed_at' => now(),
        ]);
    }

    private function createTask(AutomationRule $rule, Lead|Project|Invoice $subject, array $payload): void
    {
        $config = $rule->action_config ?? [];

        CrmTask::create([
            'automation_rule_id' => $rule->id,
            'lead_id' => $payload['lead_id'] ?? null,
            'project_id' => $payload['project_id'] ?? null,
            'client_id' => $payload['client_id'] ?? null,
            'title' => $this->renderTemplate($config['task_title'] ?? $rule->name, $payload),
            'description' => $this->renderTemplate($config['task_description'] ?? '', $payload),
            'priority' => $config['priority'] ?? 'normal',
            'status' => 'open',
            'due_at' => $this->resolveDueAt($subject, $rule),
        ]);
    }

    private function sendEmail(AutomationRule $rule, array $payload): void
    {
        $config = $rule->action_config ?? [];
        $recipient = $config['recipient_email'] ?? $payload['client_email'] ?? null;

        if (!$recipient) {
            throw new \RuntimeException('No hay correo destino para esta automatizacion.');
        }

        $subject = $this->renderTemplate($config['email_subject'] ?? $rule->name, $payload);
        $body = $this->renderTemplate($config['email_body'] ?? '', $payload);

        Mail::raw($body, function ($message) use ($recipient, $subject) {
            $message->to($recipient)->subject($subject);
        });
    }

    private function sendWebhook(AutomationRule $rule, array $payload): void
    {
        $url = $rule->action_config['webhook_url'] ?? null;

        if (!$url) {
            throw new \RuntimeException('No hay webhook configurado para esta regla.');
        }

        Http::timeout(15)->post($url, [
            'automation' => $rule->name,
            'trigger' => $rule->trigger_type,
            'payload' => $payload,
        ])->throw();
    }

    private function buildPayload(Lead|Project|Invoice $subject, string $triggerType): array
    {
        $project = $subject instanceof Project ? $subject->loadMissing('lead', 'client') : ($subject instanceof Invoice ? $subject->loadMissing('project.lead', 'client')->project : $subject->project);
        $lead = $subject instanceof Lead ? $subject->loadMissing('client', 'project') : $project?->lead;
        $client = $subject instanceof Invoice ? $subject->client : ($project?->client ?: $lead?->client);

        return [
            'trigger_type' => $triggerType,
            'lead_id' => $lead?->id,
            'lead_name' => $lead?->name,
            'client_id' => $client?->id,
            'client_name' => $client?->full_name ?: $lead?->name,
            'client_email' => $client?->email ?: $lead?->email,
            'project_id' => $project?->id,
            'project_name' => $project?->name,
            'event_type' => $lead?->event_type,
            'event_date' => optional($project?->event_date ?: $lead?->tentative_date)?->toDateString(),
            'invoice_id' => $subject instanceof Invoice ? $subject->id : null,
            'invoice_number' => $subject instanceof Invoice ? $subject->invoice_number : null,
            'invoice_balance_due' => $subject instanceof Invoice ? (float) $subject->balance_due : null,
        ];
    }

    private function runKeyFor(AutomationRule $rule, Lead|Project|Invoice $subject, string $triggerType): string
    {
        $subjectKey = match (true) {
            $subject instanceof Lead => 'lead-'.$subject->id,
            $subject instanceof Project => 'project-'.$subject->id,
            $subject instanceof Invoice => 'invoice-'.$subject->id,
            default => 'unknown',
        };

        return implode(':', [$rule->id, $triggerType, $subjectKey]);
    }

    private function matchesEventType(AutomationRule $rule, Lead|Project|Invoice $subject): bool
    {
        if (!$rule->event_type) {
            return true;
        }

        $eventType = match (true) {
            $subject instanceof Lead => $subject->event_type,
            $subject instanceof Project => $subject->lead?->event_type,
            $subject instanceof Invoice => $subject->project?->lead?->event_type,
            default => null,
        };

        return $rule->event_type === $eventType;
    }

    private function resolveDueAt(Lead|Project|Invoice $subject, AutomationRule $rule): ?Carbon
    {
        if ($subject instanceof Project && $subject->event_date) {
            return $subject->event_date->copy()->addDays($rule->trigger_offset_days);
        }

        return now()->addHours(2);
    }

    private function renderTemplate(string $template, array $payload): string
    {
        return preg_replace_callback('/\{([a-z0-9_]+)\}/i', function ($matches) use ($payload) {
            return (string) ($payload[$matches[1]] ?? '');
        }, $template);
    }
}
