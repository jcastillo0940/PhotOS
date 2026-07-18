import React, { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ChevronDown, ChevronRight, Copy, Eye, EyeOff, Loader2, Plus, RefreshCw, Trash2, Webhook, CheckCircle, XCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

const EVENT_LABELS = {
    'project.created': 'Proyecto creado',
    'invoice.created': 'Factura creada',
    'invoice.paid':    'Factura pagada',
    'lead.created':    'Lead creado',
};

function StatusDot({ code }) {
    if (!code) return <span className="text-slate-300">—</span>;
    const ok = code >= 200 && code < 300;
    return (
        <span className={clsx('inline-flex items-center gap-1 text-xs font-bold', ok ? 'text-green-600' : 'text-red-500')}>
            {ok ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {code}
        </span>
    );
}

function DeliveryStatus({ status }) {
    const map = {
        success: { icon: CheckCircle, cls: 'text-green-600', label: 'OK' },
        failed:  { icon: XCircle,     cls: 'text-red-500',   label: 'Error' },
        pending: { icon: Clock,        cls: 'text-amber-500', label: 'Pendiente' },
    };
    const { icon: Icon, cls, label } = map[status] ?? map.pending;
    return <span className={clsx('inline-flex items-center gap-1 text-xs font-bold', cls)}><Icon className="h-3.5 w-3.5" />{label}</span>;
}

function SecretField({ secret }) {
    const [visible, setVisible] = useState(false);
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
            <code className="flex-1 text-xs text-slate-600 font-mono break-all">
                {visible ? secret : '•'.repeat(40)}
            </code>
            <button onClick={() => setVisible(!visible)} className="text-slate-400 hover:text-slate-600">
                {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button onClick={copy} className="text-slate-400 hover:text-slate-600">
                {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
        </div>
    );
}

function DeliveryLog({ endpointId }) {
    const [deliveries, setDeliveries] = useState(null);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/admin/settings/webhooks/${endpointId}/deliveries`);
            const json = await res.json();
            setDeliveries(json.deliveries);
        } finally {
            setLoading(false);
        }
    };

    if (!deliveries) {
        return (
            <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
                Ver historial de entregas
            </button>
        );
    }

    return (
        <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-slate-500">Últimas 50 entregas</p>
                <button onClick={load} className="text-slate-400 hover:text-primary">
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
            </div>
            {deliveries.length === 0 ? (
                <p className="text-xs text-slate-400">Sin entregas todavía.</p>
            ) : (
                <div className="rounded-lg border border-slate-100 overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                                <th className="py-2 pl-3 pr-2">Evento</th>
                                <th className="py-2 px-2">Estado</th>
                                <th className="py-2 px-2">Código</th>
                                <th className="py-2 px-2">ms</th>
                                <th className="py-2 pl-2 pr-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.map((d) => (
                                <tr key={d.id} className="border-b border-slate-50 last:border-0">
                                    <td className="py-1.5 pl-3 pr-2 font-mono text-[10px] text-slate-600">{d.event_type}</td>
                                    <td className="py-1.5 px-2"><DeliveryStatus status={d.status} /></td>
                                    <td className="py-1.5 px-2 text-slate-500">{d.response_code ?? '—'}</td>
                                    <td className="py-1.5 px-2 text-slate-400">{d.duration_ms ?? '—'}</td>
                                    <td className="py-1.5 pl-2 pr-3 text-slate-400">
                                        {d.created_at ? new Date(d.created_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function EndpointCard({ endpoint, eventTypes }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, put, processing } = useForm({
        name: endpoint.name,
        url: endpoint.url,
        event_types: endpoint.event_types ?? [],
        is_active: endpoint.is_active,
    });

    const toggleEvent = (ev) => {
        const list = data.event_types.includes(ev)
            ? data.event_types.filter((e) => e !== ev)
            : [...data.event_types, ev];
        setData('event_types', list);
    };

    const save = () => put(`/admin/settings/webhooks/${endpoint.id}`, { onSuccess: () => setEditing(false) });
    const destroy = () => {
        if (confirm(`¿Eliminar "${endpoint.name}"? Se perderá el historial de entregas.`)) {
            router.delete(`/admin/settings/webhooks/${endpoint.id}`);
        }
    };
    const regenerate = () => {
        if (confirm('¿Regenerar la clave secreta? Las integraciones actuales dejarán de funcionar hasta que actualices la clave.')) {
            router.post(`/admin/settings/webhooks/${endpoint.id}/regenerate-secret`);
        }
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className={clsx('h-2 w-2 rounded-full flex-shrink-0', endpoint.is_active ? 'bg-green-400' : 'bg-slate-300')} />
                        <p className="font-bold text-slate-800 truncate">{endpoint.name}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 font-mono truncate">{endpoint.url}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <StatusDot code={endpoint.last_response_code} />
                    <button onClick={() => setEditing(!editing)} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors">
                        {editing ? 'Cerrar' : 'Editar'}
                    </button>
                    <button onClick={destroy} className="rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {editing && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4 bg-slate-50/50">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600">Nombre</label>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-slate-600">URL</label>
                            <input value={data.url} onChange={(e) => setData('url', e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary font-mono" />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold text-slate-600">Eventos (vacío = todos)</label>
                        <div className="flex flex-wrap gap-2">
                            {eventTypes.map((ev) => (
                                <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                                    className={clsx('rounded-full px-3 py-1 text-xs font-bold border transition-colors', data.event_types.includes(ev)
                                        ? 'bg-primary/10 text-primary border-primary/30'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                                    {EVENT_LABELS[ev] ?? ev}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded" />
                            <span className="text-sm text-slate-600">Activo</span>
                        </label>
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-bold text-slate-600">Clave secreta (HMAC-SHA256)</p>
                        <SecretField secret={endpoint.secret} />
                        <button onClick={regenerate} className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 hover:text-amber-600 transition-colors">
                            <RefreshCw className="h-3 w-3" /> Regenerar clave
                        </button>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100">
                            Cancelar
                        </button>
                        <button onClick={save} disabled={processing} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
                            {processing ? 'Guardando…' : 'Guardar'}
                        </button>
                    </div>

                    <DeliveryLog endpointId={endpoint.id} />
                </div>
            )}
        </div>
    );
}

export default function Webhooks({ endpoints, eventTypes }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        url: '',
        event_types: [],
    });

    const toggleEvent = (ev) => {
        const list = data.event_types.includes(ev)
            ? data.event_types.filter((e) => e !== ev)
            : [...data.event_types, ev];
        setData('event_types', list);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        post('/admin/settings/webhooks', { onSuccess: () => reset() });
    };

    return (
        <AdminLayout>
            <div className="max-w-3xl space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Webhooks</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Recibe notificaciones en tiempo real cuando ocurren eventos en tu estudio.
                        Cada entrega incluye el header <code className="rounded bg-slate-100 px-1 text-xs">X-Webhook-Signature</code> para verificar autenticidad.
                    </p>
                </div>

                {/* Crear endpoint */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Nuevo endpoint
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-600">Nombre descriptivo</label>
                                <input placeholder="Zapier, CRM, etc." value={data.name} onChange={(e) => setData('name', e.target.value)}
                                    className={clsx('w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                                        errors.name ? 'border-red-400' : 'border-slate-200')} />
                                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-slate-600">URL del endpoint</label>
                                <input placeholder="https://hooks.zapier.com/…" value={data.url} onChange={(e) => setData('url', e.target.value)}
                                    className={clsx('w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                                        errors.url ? 'border-red-400' : 'border-slate-200')} />
                                {errors.url && <p className="mt-1 text-xs text-red-500">{errors.url}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold text-slate-600">Filtrar por evento (vacío = todos)</label>
                            <div className="flex flex-wrap gap-2">
                                {eventTypes.map((ev) => (
                                    <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                                        className={clsx('rounded-full px-3 py-1 text-xs font-bold border transition-colors', data.event_types.includes(ev)
                                            ? 'bg-primary/10 text-primary border-primary/30'
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300')}>
                                        {EVENT_LABELS[ev] ?? ev}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" disabled={processing || !data.name || !data.url}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50">
                            <Webhook className="h-4 w-4" />
                            {processing ? 'Creando…' : 'Crear webhook'}
                        </button>
                    </form>
                </div>

                {/* Endpoints existentes */}
                {endpoints.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-slate-400 rounded-xl border border-dashed border-slate-200">
                        <Webhook className="h-8 w-8 opacity-40" />
                        <p className="text-sm">No hay webhooks configurados todavía.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-slate-600">Endpoints activos ({endpoints.length})</h2>
                        {endpoints.map((ep) => (
                            <EndpointCard key={ep.id} endpoint={ep} eventTypes={eventTypes} />
                        ))}
                    </div>
                )}

                {/* Referencia de verificación */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Verificar firma (PHP)</h3>
                    <pre className="overflow-x-auto rounded-lg bg-slate-800 p-4 text-xs text-green-300">{`$secret = 'TU_CLAVE_SECRETA';
$body   = file_get_contents('php://input');
$sig    = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';

$expected = 'sha256=' . hash_hmac('sha256', $body, $secret);
if (!hash_equals($expected, $sig)) {
    http_response_code(401); exit;
}`}</pre>
                </div>
            </div>
        </AdminLayout>
    );
}
