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
        ]);

        $event = isset($validated['id'])
            ? Event::findOrFail($validated['id'])
            : new Event();

        $event->fill(collect($validated)->except('id')->all());
        $event->save();

        return redirect()->back()->with('success', 'Calendar updated.');
    }

    public function destroy(Event $event)
    {
        $event->delete();
        return redirect()->back();
    }
}
