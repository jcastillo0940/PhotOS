<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'user_name',
        'user_email',
        'event',
        'subject_type',
        'subject_id',
        'subject_label',
        'properties',
        'ip_address',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function eventLabel(): string
    {
        return match ($this->event) {
            'auth.login_success'        => 'Inicio de sesion',
            'auth.login_failed'         => 'Intento de acceso fallido',
            'auth.logout'               => 'Cierre de sesion',
            'project.deleted'           => 'Proyecto eliminado',
            'invoice.created'           => 'Factura creada',
            'invoice.paid'              => 'Factura marcada como pagada',
            'api_token.created'         => 'Token de API creado',
            'api_token.revoked'         => 'Token de API revocado',
            'user.created'              => 'Usuario creado',
            'user.deleted'              => 'Usuario eliminado',
            'tenant.billing_override'   => 'Override de facturacion',
            'tenant.payment_recorded'   => 'Pago manual registrado',
            'tenant.discount_applied'   => 'Descuento aplicado',
            default                     => $this->event,
        };
    }

    public function eventColor(): string
    {
        return match (true) {
            str_starts_with($this->event, 'auth.login_failed') => 'red',
            str_starts_with($this->event, 'auth.')             => 'slate',
            str_starts_with($this->event, 'project.deleted')   => 'red',
            str_starts_with($this->event, 'invoice.')          => 'blue',
            str_starts_with($this->event, 'api_token.')        => 'violet',
            str_starts_with($this->event, 'user.')             => 'amber',
            str_starts_with($this->event, 'tenant.')           => 'orange',
            default                                             => 'slate',
        };
    }
}
