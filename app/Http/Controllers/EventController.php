<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Calendar/Index', [
            'events' => Event::with('project')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|integer|exists:events,id',
            'title' => 'required|string|max:255',
            'start' => 'required|date',
            'end' => 'required|date',
            'type' => 'required|string|in:session,blocked,tentative',
            'status' => 'nullable|string|in:pending,confirmed,paid,blocked,cancelled',
            'payment_status' => 'nullable|string|in:unpaid,partial,paid,waived',
        ]);

        $event = isset($validated['id'])
            ? Event::findOrFail($validated['id'])
            : new Event();

        $payload = collect($validated)->except('id')->all();
        $payload['status'] = $validated['status']
            ?? match ($validated['type']) {
                'blocked' => 'blocked',
                'session' => 'confirmed',
                default => 'pending',
            };
        $payload['payment_status'] = $validated['payment_status'] ?? 'unpaid';
        $payload['source'] = $event->exists ? $event->source : 'admin';

        $event->fill($payload);
        $event->save();

        return redirect()->back()->with('success', 'Calendar updated.');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return redirect()->back();
    }
}
