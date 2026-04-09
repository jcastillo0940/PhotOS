<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id', 'project_id', 'client_id', 'amount', 'status', 'due_date', 'concept', 'notes', 'invoice_number',
        'subtotal', 'tax_rate', 'tax_amount', 'total', 'balance_due', 'itbms_enabled', 'alanube_enabled', 'alanube_status',
        'alanube_document_id', 'alanube_legal_status', 'alanube_cufe', 'alanube_xml_url', 'alanube_qr_url',
        'alanube_response', 'alanube_submitted_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'due_date' => 'date',
        'itbms_enabled' => 'boolean',
        'alanube_enabled' => 'boolean',
        'alanube_response' => 'array',
        'alanube_submitted_at' => 'datetime',
    ];

    public function project() { return $this->belongsTo(Project::class); }
    public function client() { return $this->belongsTo(Client::class); }
    public function payments() { return $this->hasMany(Payment::class); }
}
