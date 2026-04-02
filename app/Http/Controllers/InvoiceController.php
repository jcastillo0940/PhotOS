<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'concept' => 'required|string|max:255',
            'due_date' => 'required|date',
        ]);

        $project->invoices()->create($validated);

        return redirect()->back()->with('success', 'Invoice generated successfully.');
    }

    public function markAsPaid(Invoice $invoice)
    {
        $invoice->update(['status' => 'paid']);
        return redirect()->back()->with('success', 'Payment recorded.');
    }
}
