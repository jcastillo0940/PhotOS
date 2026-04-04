<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Event;
use App\Models\Lead;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index()
    {
        return Inertia::render('Public/Booking', [
            'events' => Event::query()
                ->whereIn('status', ['confirmed', 'paid', 'blocked'])
                ->orderBy('start')
                ->get()
                ->map(fn (Event $event) => [
                    'id' => $event->id,
                    'title' => $event->title,
                    'start' => optional($event->start)?->toIso8601String(),
                    'end' => optional($event->end)?->toIso8601String(),
                    'status' => $event->status,
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'event_type' => 'required|string|max:120',
            'start' => 'required|date',
            'end' => 'required|date|after:start',
            'message' => 'nullable|string|max:1500',
        ]);

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
            'tentative_date' => $validated['start'],
            'responses' => [
                'phone' => $validated['phone'] ?? null,
                'message' => $validated['message'] ?? null,
                'booking_source' => 'public',
            ],
            'status' => 'lead',
            'last_active_at' => now(),
        ]);

        $project = Project::create([
            'lead_id' => $lead->id,
            'client_id' => $client->id,
            'name' => 'Booking: '.$validated['name'].' ('.$validated['event_type'].')',
            'status' => 'pending_payment',
            'event_date' => $validated['start'],
        ]);

        Event::create([
            'project_id' => $project->id,
            'title' => 'Pending booking: '.$validated['name'],
            'description' => $validated['message'] ?? null,
            'start' => $validated['start'],
            'end' => $validated['end'],
            'type' => 'tentative',
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'source' => 'public_booking',
            'client_name' => $validated['name'],
            'client_email' => $validated['email'],
            'client_phone' => $validated['phone'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Tu solicitud fue registrada como pendiente. El horario no se bloquea hasta confirmar la sesion.');
    }
}
