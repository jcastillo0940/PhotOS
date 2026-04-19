<?php

namespace App\Http\Controllers;

use App\Mail\LeadBriefingMail;
use App\Mail\LeadNpsMail;
use App\Models\AccountStatement;
use App\Models\Client;
use App\Models\Lead;
use App\Support\CalendarAvailability;
use App\Support\EventTypeSettings;
use App\Support\LeadBriefingTemplate;
use App\Services\CrmAutomationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function __construct(
        private readonly CrmAutomationService $automationService,
    ) {}

    public function create()
    {
        return Inertia::render('Admin/Leads/Create', [
            'eventTypes' => EventTypeSettings::get(),
            'busyCalendarEvents' => CalendarAvailability::busyEvents(),
            'businessHours' => CalendarAvailability::businessHours(),
            'availabilitySettings' => CalendarAvailability::settings(),
        ]);
    }

    public function index()
    {
        return Inertia::render('Admin/Leads/Index', [
            'leads' => Lead::query()
                ->with(['client', 'project'])
                ->latest()
                ->get()
                ->map(fn (Lead $lead) => $this->serializeLead($lead)),
            'eventTypes' => EventTypeSettings::get(),
        ]);
    }

    public function show(Lead $lead)
    {
        $lead->load([
            'client.invoices',
            'client.statements' => fn ($query) => $query->latest('occurred_at')->limit(12),
            'project.invoices',
        ]);

        $briefingTemplate = LeadBriefingTemplate::forEventType($lead->event_type);
        $client = $lead->client;
        $project = $lead->project;

        return Inertia::render('Admin/Leads/Show', [
            'lead' => array_merge($this->serializeLead($lead), [
                'briefing_template' => $briefingTemplate,
                'briefing_url' => $lead->briefing_token ? route('public.leads.briefing.show', $lead->briefing_token) : null,
                'nps_url' => $lead->nps_token ? route('public.leads.nps.show', $lead->nps_token) : null,
                'briefing_enabled' => (bool) $lead->briefing_sent_at || ! empty($lead->briefing_answers),
                'project' => $project ? [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'balance_due' => (float) $project->invoices->sum('balance_due'),
                ] : null,
                'accounting' => [
                    'client_id' => $client?->id,
                    'invoices_count' => $client?->invoices->count() ?? 0,
                    'open_balance' => (float) ($client?->invoices->sum('balance_due') ?? 0),
                    'latest_entries' => $client?->statements->map(fn (AccountStatement $entry) => [
                        'id' => $entry->id,
                        'description' => $entry->description,
                        'amount' => (float) $entry->amount,
                        'occurred_at' => optional($entry->occurred_at)?->toDateString(),
                    ])->values() ?? [],
                ],
            ]),
            'eventTypes' => EventTypeSettings::get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'event_type' => 'required|string',
            'tentative_date' => 'nullable|date',
            'tentative_time' => 'nullable|required_with:tentative_date|date_format:H:i',
            'phone' => 'nullable|string|max:50',
            'message' => 'nullable|string|max:2000',
            'client_document' => 'nullable|string|max:255',
        ]);

        if (!empty($validated['tentative_date']) && !empty($validated['tentative_time'])) {
            $availableSlots = CalendarAvailability::availableSlotsForDate($validated['tentative_date']);

            if (!in_array($validated['tentative_time'], $availableSlots, true)) {
                return redirect()->back()
                    ->withErrors(['tentative_time' => 'La hora seleccionada ya no esta disponible para esa fecha.'])
                    ->withInput();
            }
        }

        $client = Client::firstOrCreate(
            ['email' => $validated['email']],
            [
                'full_name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
            ]
        );

        $lead = Lead::create([
            'client_id' => $client->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'event_type' => $validated['event_type'],
            'tentative_date' => $validated['tentative_date'] ?? null,
            'responses' => [
                'phone' => $validated['phone'] ?? null,
                'message' => $validated['message'] ?? null,
                'client_document' => $validated['client_document'] ?? null,
                'tentative_time' => $validated['tentative_time'] ?? null,
            ],
            'status' => 'lead',
        ]);

        $this->automationService->runImmediate('lead_created', $lead);

        if ($request->routeIs('admin.leads.store')) {
            return redirect()->route('admin.leads.show', $lead)->with('success', 'Lead creado correctamente.');
        }

        return redirect()->back()->with('success', 'Thank you! We\'ll be in touch soon.');
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:lead,qualified,project,lost',
        ]);

        $lead->update($validated);

        return redirect()->back();
    }

    public function update(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'event_type' => 'required|string|max:120',
            'tentative_date' => 'nullable|date',
            'phone' => 'nullable|string|max:50',
            'message' => 'nullable|string|max:2000',
            'client_document' => 'nullable|string|max:255',
        ]);

        $lead->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'event_type' => $validated['event_type'],
            'tentative_date' => $validated['tentative_date'] ?? null,
            'responses' => array_merge($lead->responses ?? [], [
                'phone' => $validated['phone'] ?? null,
                'message' => $validated['message'] ?? null,
                'client_document' => $validated['client_document'] ?? null,
            ]),
        ]);

        if ($lead->client) {
            $lead->client->update([
                'full_name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? $lead->client->phone,
            ]);
        }

        return redirect()->back()->with('success', 'Lead actualizado.');
    }

    public function saveBriefing(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $lead->update([
            'briefing_answers' => $validated['answers'],
            'briefing_completed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Briefing actualizado.');
    }

    public function sendBriefing(Lead $lead)
    {
        $lead->forceFill([
            'briefing_token' => $lead->briefing_token ?: Str::uuid()->toString(),
            'briefing_sent_at' => now(),
        ])->save();

        try {
            Mail::to($lead->email)->send(new LeadBriefingMail(
                $lead,
                route('public.leads.briefing.show', $lead->briefing_token)
            ));
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo enviar el correo. Revisa la configuracion SMTP.');
        }

        return redirect()->back()->with('success', 'Formulario de briefing enviado.');
    }

    public function disableBriefing(Lead $lead)
    {
        $lead->forceFill([
            'briefing_sent_at' => null,
            'briefing_token' => null,
        ])->save();

        return redirect()->back()->with('success', 'El briefing quedo como opcional y ya no se enviara automaticamente.');
    }

    public function sendNps(Lead $lead)
    {
        $lead->forceFill([
            'nps_token' => $lead->nps_token ?: Str::uuid()->toString(),
            'nps_sent_at' => now(),
        ])->save();

        try {
            Mail::to($lead->email)->send(new LeadNpsMail(
                $lead,
                route('public.leads.nps.show', $lead->nps_token)
            ));
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'No se pudo enviar el correo. Revisa la configuracion SMTP.');
        }

        return redirect()->back()->with('success', 'Encuesta NPS enviada.');
    }

    public function publicBriefing(string $token)
    {
        $lead = Lead::where('briefing_token', $token)->firstOrFail();

        return Inertia::render('Public/LeadBriefing', [
            'lead' => [
                'name' => $lead->name,
                'event_type' => $lead->event_type,
                'tentative_date' => optional($lead->tentative_date)?->toDateString(),
                'briefing_answers' => $lead->briefing_answers ?? [],
            ],
            'token' => $token,
            'questions' => LeadBriefingTemplate::forEventType($lead->event_type),
        ]);
    }

    public function submitPublicBriefing(Request $request, string $token)
    {
        $lead = Lead::where('briefing_token', $token)->firstOrFail();

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $lead->update([
            'briefing_answers' => $validated['answers'],
            'briefing_completed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Gracias. Tus respuestas fueron guardadas.');
    }

    public function publicNps(string $token)
    {
        $lead = Lead::where('nps_token', $token)->firstOrFail();

        return Inertia::render('Public/NpsSurvey', [
            'lead' => [
                'name' => $lead->name,
                'event_type' => $lead->event_type,
                'nps_score' => $lead->nps_score,
                'nps_comment' => $lead->nps_comment,
            ],
            'token' => $token,
        ]);
    }

    public function submitPublicNps(Request $request, string $token)
    {
        $lead = Lead::where('nps_token', $token)->firstOrFail();

        $validated = $request->validate([
            'score' => 'required|integer|min:0|max:10',
            'comment' => 'nullable|string|max:2000',
        ]);

        $lead->update([
            'nps_score' => $validated['score'],
            'nps_comment' => $validated['comment'] ?? null,
            'nps_completed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Gracias por tu respuesta.');
    }

    public function accountRedirect(Lead $lead)
    {
        if ($lead->client_id) {
            return redirect()->route('admin.clients.accounting', $lead->client_id);
        }

        if ($lead->project) {
            return redirect()->route('admin.projects.show', $lead->project);
        }

        return redirect()->back()->with('error', 'Este lead todavia no tiene cliente o facturacion asociada.');
    }

    private function serializeLead(Lead $lead): array
    {
        return [
            'id' => $lead->id,
            'client_id' => $lead->client_id,
            'name' => $lead->name,
            'email' => $lead->email,
            'event_type' => $lead->event_type,
            'tentative_date' => optional($lead->tentative_date)?->toDateString(),
            'responses' => $lead->responses ?? [],
            'briefing_answers' => $lead->briefing_answers ?? [],
            'briefing_sent_at' => optional($lead->briefing_sent_at)?->toIso8601String(),
            'briefing_completed_at' => optional($lead->briefing_completed_at)?->toIso8601String(),
            'nps_score' => $lead->nps_score,
            'nps_comment' => $lead->nps_comment,
            'nps_sent_at' => optional($lead->nps_sent_at)?->toIso8601String(),
            'nps_completed_at' => optional($lead->nps_completed_at)?->toIso8601String(),
            'notes' => $lead->notes,
            'status' => $lead->status,
            'created_at' => optional($lead->created_at)?->toIso8601String(),
            'project_id' => $lead->project?->id,
        ];
    }
}
