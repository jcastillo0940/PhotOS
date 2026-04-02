<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeadController extends Controller
{
    public function captureView()
    {
        return Inertia::render('Public/Capture');
    }

    public function index()
    {
        return Inertia::render('Admin/Leads/Index', [
            'leads' => Lead::latest()->get(),
        ]);
    }

    public function show(Lead $lead)
    {
        return Inertia::render('Admin/Leads/Show', [
            'lead' => $lead,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'event_type' => 'required|string',
            'tentative_date' => 'nullable|date',
        ]);

        $lead = Lead::create($validated + ['status' => 'lead']);

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
}
