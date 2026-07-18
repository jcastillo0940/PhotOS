<?php

namespace App\Modules\Billing\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\InvoiceResource;
use App\Models\Invoice;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $invoices = Invoice::with('project', 'client')
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->project_id, fn ($q, $v) => $q->where('project_id', $v))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return InvoiceResource::collection($invoices);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load('project', 'client'));
    }

    public function store(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate([
            'concept'    => 'required|string|max:500',
            'subtotal'   => 'required|numeric|min:0',
            'tax_rate'   => 'nullable|numeric|min:0|max:100',
            'due_date'   => 'nullable|date',
            'notes'      => 'nullable|string',
        ]);

        $taxRate = $data['tax_rate'] ?? 0;
        $subtotal = (float) $data['subtotal'];
        $taxAmount = round($subtotal * $taxRate / 100, 2);
        $total = round($subtotal + $taxAmount, 2);

        $invoice = Invoice::create([
            'project_id'     => $project->id,
            'client_id'      => $project->client_id,
            'concept'        => $data['concept'],
            'subtotal'       => $subtotal,
            'tax_rate'       => $taxRate,
            'tax_amount'     => $taxAmount,
            'total'          => $total,
            'balance_due'    => $total,
            'amount'         => $total,
            'status'         => 'unpaid',
            'due_date'       => $data['due_date'] ?? null,
            'notes'          => $data['notes'] ?? null,
            'invoice_number' => 'INV-' . strtoupper(uniqid()),
        ]);

        return (new InvoiceResource($invoice->load('project', 'client')))
            ->response()
            ->setStatusCode(201);
    }

    public function markPaid(Invoice $invoice): InvoiceResource
    {
        $invoice->update([
            'status'      => 'paid',
            'balance_due' => 0,
        ]);

        return new InvoiceResource($invoice->fresh()->load('project', 'client'));
    }
}
