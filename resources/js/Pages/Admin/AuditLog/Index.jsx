import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Search, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

const COLOR_MAP = {
    red:    'bg-red-100 text-red-700',
    blue:   'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    amber:  'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700',
    slate:  'bg-slate-100 text-slate-600',
};

function EventBadge({ label, color }) {
    return (
        <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold', COLOR_MAP[color] ?? COLOR_MAP.slate)}>
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
                className={clsx('border-b border-slate-100 transition-colors', hasProps && 'cursor-pointer hover:bg-slate-50')}
                onClick={() => hasProps && setExpanded(!expanded)}
            >
                <td className="py-3 pl-6 pr-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="py-3 px-3">
                    <EventBadge label={log.event_label} color={log.event_color} />
                </td>
                <td className="py-3 px-3">
                    <p className="text-sm font-medium text-slate-800">{log.user_name || '—'}</p>
                    <p className="text-xs text-slate-400">{log.user_email}</p>
                </td>
                <td className="py-3 px-3 text-sm text-slate-600">{log.subject_label || '—'}</td>
                <td className="py-3 pl-3 pr-6 text-xs text-slate-400 font-mono">{log.ip_address}</td>
            </tr>
            {expanded && hasProps && (
                <tr className="bg-slate-50 border-b border-slate-100">
                    <td colSpan={5} className="px-6 py-3">
                        <pre className="text-xs text-slate-600 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.properties, null, 2)}
                        </pre>
                    </td>
                </tr>
            )}
        </>
    );
}

export default function AuditLogIndex({ logs, eventTypes, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [event, setEvent] = useState(filters.event || '');

    const applyFilters = (overrides = {}) => {
        router.get('/admin/audit-log', { search, event, ...overrides }, { preserveState: true, replace: true });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Auditoría</h1>
                        <p className="mt-1 text-sm text-slate-500">Registro inmutable de acciones críticas del estudio.</p>
                    </div>
                    <ShieldCheck className="h-8 w-8 text-slate-300" />
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por usuario, email, objeto…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <select
                        value={event}
                        onChange={(e) => { setEvent(e.target.value); applyFilters({ event: e.target.value }); }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                        <option value="">Todos los eventos</option>
                        {eventTypes.map((et) => (
                            <option key={et} value={et}>{et}</option>
                        ))}
                    </select>
                </div>

                {/* Tabla */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {logs.data.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
                            <ShieldCheck className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No hay eventos registrados todavía.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    <th className="py-3 pl-6 pr-3">Fecha</th>
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

                {/* Paginación */}
                {logs.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Página {logs.current_page} de {logs.last_page} · {logs.total} eventos</span>
                        <div className="flex gap-2">
                            {logs.prev_page_url && (
                                <button onClick={() => router.get(logs.prev_page_url)} className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
                                    Anterior
                                </button>
                            )}
                            {logs.next_page_url && (
                                <button onClick={() => router.get(logs.next_page_url)} className="rounded-lg border border-slate-200 px-3 py-1.5 hover:bg-slate-50">
                                    Siguiente
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
