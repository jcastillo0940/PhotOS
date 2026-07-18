import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import SaasLayout from '@/Layouts/SaasLayout';
import { Search, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const COLOR_MAP = {
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    amber:  'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
    slate:  'bg-slate-100 text-slate-500',
};

function EventBadge({ label, color }) {
    return (
        <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold', COLOR_MAP[color] ?? COLOR_MAP.slate)}>
            {label}
        </span>
    );
}

function LogRow({ log }) {
    const [expanded, setExpanded] = useState(false);
    const hasProps = log.properties && Object.keys(log.properties).length > 0;

    return (
        <>
            <tr
                className={clsx('border-b border-slate-800/40 transition-colors', hasProps && 'cursor-pointer hover:bg-white/5')}
                onClick={() => hasProps && setExpanded(!expanded)}
            >
                <td className="py-3 pl-6 pr-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3 px-3">
                    <span className="text-xs font-medium text-violet-300">{log.tenant_name}</span>
                </td>
                <td className="py-3 px-3">
                    <EventBadge label={log.event_label} color={log.event_color} />
                </td>
                <td className="py-3 px-3">
                    <p className="text-sm font-medium text-slate-200">{log.user_name || '—'}</p>
                    <p className="text-xs text-slate-500">{log.user_email}</p>
                </td>
                <td className="py-3 px-3 text-sm text-slate-400">{log.subject_label || '—'}</td>
                <td className="py-3 pl-3 pr-6 text-xs text-slate-500 font-mono">{log.ip_address}</td>
            </tr>
            {expanded && hasProps && (
                <tr className="bg-white/5 border-b border-slate-800/40">
                    <td colSpan={6} className="px-6 py-3">
                        <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.properties, null, 2)}
                        </pre>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function SaasAuditLogIndex({ logs, tenants, eventTypes, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [event, setEvent] = useState(filters.event || '');
    const [tenantId, setTenantId] = useState(filters.tenant_id || '');

    const applyFilters = (overrides = {}) => {
        router.get('/audit-log', { search, event, tenant_id: tenantId, ...overrides }, { preserveState: true, replace: true });
    };

    return (
        <SaasLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-white">Auditoría global</h1>
                        <p className="mt-1 text-sm text-slate-400">Registro de eventos críticos de todos los tenants.</p>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-violet-400 opacity-60" />
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar usuario, email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500"
                        />
                    </div>
                    <select
                        value={tenantId}
                        onChange={(e) => { setTenantId(e.target.value); applyFilters({ tenant_id: e.target.value }); }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none"
                    >
                        <option value="">Todos los tenants</option>
                        {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select
                        value={event}
                        onChange={(e) => { setEvent(e.target.value); applyFilters({ event: e.target.value }); }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 outline-none"
                    >
                        <option value="">Todos los eventos</option>
                        {eventTypes.map((et) => <option key={et} value={et}>{et}</option>)}
                    </select>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
                    {logs.data.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
                            <ShieldCheck className="h-10 w-10 opacity-30" />
                            <p className="text-sm">Sin eventos que mostrar.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 pl-6 pr-3">Fecha</th>
                                    <th className="py-3 px-3">Tenant</th>
                                    <th className="py-3 px-3">Evento</th>
                                    <th className="py-3 px-3">Usuario</th>
                                    <th className="py-3 px-3">Objeto</th>
                                    <th className="py-3 pl-3 pr-6">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((log) => <LogRow key={log.id} log={log} />)}
                            </tbody>
                        </table>
                    )}
                </div>

                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Página {logs.current_page} de {logs.last_page} · {logs.total} eventos</span>
                        <div className="flex gap-2">
                            {logs.prev_page_url && (
                                <button onClick={() => router.get(logs.prev_page_url)} className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                                    Anterior
                                </button>
                            )}
                            {logs.next_page_url && (
                                <button onClick={() => router.get(logs.next_page_url)} className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800 text-slate-300">
                                    Siguiente
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </SaasLayout>
    );
}
