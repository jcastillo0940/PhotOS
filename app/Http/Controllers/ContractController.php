<?php

namespace App\Http\Controllers;

use App\Models\Contract;
use App\Support\ContractTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContractController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Contracts/List', [
            'contracts' => Contract::with('project.lead', 'project.owner', 'project.invoices')->latest()->get()
                ->map(fn (Contract $contract) => $this->serializeContract($contract))
                ->values(),
        ]);
    }

    public function show(Contract $contract)
    {
        $contract->load('project.lead', 'project.owner', 'project.invoices');

        return Inertia::render('Admin/Contracts/Show', [
            'contract' => $this->serializeContract($contract),
        ]);
    }

    public function edit(Contract $contract)
    {
        $contract->load('project.lead', 'project.owner', 'project.invoices');

        return Inertia::render('Admin/Contracts/Edit', [
            'contract' => $this->serializeContract($contract),
            'presets' => ContractTemplate::presets(),
            'variableCatalog' => ContractTemplate::variableCatalog(),
        ]);
    }

    public function update(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'status' => 'nullable|string|in:pending,signed',
            'contract_data' => 'nullable|array',
            'contract_data.city' => 'nullable|string|max:255',
            'contract_data.location' => 'nullable|string|max:255',
            'contract_data.photographer_business' => 'nullable|string|max:255',
            'contract_data.photographer_document' => 'nullable|string|max:255',
            'contract_data.client_document' => 'nullable|string|max:255',
            'contract_data.jurisdiction_country' => 'nullable|string|max:255',
            'contract_data.balance_due_date' => 'nullable|string|max:255',
            'contract_data.reservation_amount' => 'nullable|numeric|min:0',
            'contract_data.remaining_amount' => 'nullable|numeric|min:0',
            'contract_data.privacy_fee' => 'nullable|numeric|min:0',
        ]);

        $payload = [
            'content' => $validated['content'],
            'contract_data' => $validated['contract_data'] ?? $contract->contract_data,
        ];

        if (array_key_exists('status', $validated)) {
            $payload['status'] = $validated['status'];
        }

        $contract->update($payload);

        return back()->with('success', 'Contrato actualizado.');
    }

    public function print(Contract $contract)
    {
        $contract->load('project.lead');

        return response()->view('contracts.print', [
            'contract' => $contract,
            'renderedContent' => ContractTemplate::render($contract),
        ]);
    }

    public function publicPrint(string $token)
    {
        $contract = Contract::where('token', $token)->with('project.lead')->firstOrFail();

        return response()->view('contracts.print', [
            'contract' => $contract,
            'renderedContent' => ContractTemplate::render($contract),
        ]);
    }

    private function serializeContract(Contract $contract): array
    {
        return [
            ...$contract->toArray(),
            'rendered_content' => ContractTemplate::render($contract),
            'variables' => ContractTemplate::variablesForContract($contract),
        ];
    }
}
