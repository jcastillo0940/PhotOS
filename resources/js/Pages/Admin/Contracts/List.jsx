import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Eye, FileText, LayoutGrid, List as ListIcon, PencilLine, Plus, Printer, Search, UserRound } from 'lucide-react';
import { clsx } from 'clsx';

const statusTone = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    signed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function List({ contracts }) {
    const [query, setQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [viewMode, setViewMode] = React.useState('grid');

    const filteredContracts = React.useMemo(() => {
        const term = query.trim().toLowerCase();
        return contracts.filter((contract) => {
            const matchesQuery = !term || [
                contract.project?.name,
                contract.project?.lead?.name,
                contract.project?.lead?.email,
                contract.project?.lead?.event_type,
            ]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(term));

            const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

            return matchesQuery && matchesStatus;
        });
    }, [contracts, query, statusFilter]);

    const counters = React.useMemo(() => ({
        all: contracts.length,
        pending: contracts.filter((item) => item.status === 'pending').length,
        signed: contracts.filter((item) => item.status === 'signed').length,
    }), [contracts]);

    return (
        <AdminLayout>
            <Head title="Contratos" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Contracts</p>
                            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Contratos</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                                Trabaja desde una lista clara de clientes. Cada contrato tiene acciones separadas para ver,
                                editar o imprimir, sin mezclar toda la gestion en una sola vista.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                <UserRound className="h-4 w-4" />
                                Ver leads
                            </Link>
                            <Link href="/admin/leads/create" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                <Plus className="h-4 w-4" />
                                Nuevo lead
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Buscar por cliente, email o tipo de evento..."
                                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {[
                                { key: 'all', label: 'Todos' },
                                { key: 'pending', label: 'Pendientes' },
                                { key: 'signed', label: 'Firmados' },
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setStatusFilter(item.key)}
                                    className={clsx(
                                        'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition',
                                        statusFilter === item.key
                                            ? 'bg-slate-900 text-white'
                                            : 'border border-slate-200 bg-white text-slate-600'
                                    )}
                                >
                                    {item.label} ({counters[item.key]})
                                </button>
                            ))}

                            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={clsx('rounded-full p-2 transition', viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('table')}
                                    className={clsx('rounded-full p-2 transition', viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400')}
                                >
                                    <ListIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {viewMode === 'grid' ? (
                    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredContracts.map((contract) => (
                            <article key={contract.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                                            {contract.project?.lead?.event_type || 'Contrato'}
                                        </p>
                                        <h2 className="mt-3 text-2xl font-semibold leading-tight text-slate-900">
                                            {contract.project?.lead?.name}
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-500">{contract.project?.lead?.email}</p>
                                    </div>
                                    <span className={clsx('rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]', statusTone[contract.status] || 'border-slate-200 bg-slate-50 text-slate-600')}>
                                        {contract.status}
                                    </span>
                                </div>

                                <div className="mt-6 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Proyecto</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800">{contract.project?.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Evento</p>
                                            <p className="mt-1 text-slate-700">{contract.variables?.['[event_date]']}</p>
                                        </div>
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Firma</p>
                                            <p className="mt-1 text-slate-700">{contract.signed_at ? 'Completa' : 'Pendiente'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-3">
                                    <Link href={`/admin/contracts/${contract.id}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300">
                                        <Eye className="h-4 w-4" />
                                        Ver
                                    </Link>
                                    <Link href={`/admin/contracts/${contract.id}/edit`} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800">
                                        <PencilLine className="h-4 w-4" />
                                        Editar
                                    </Link>
                                    <Link href={`/admin/contracts/${contract.id}/print`} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300">
                                        <Printer className="h-4 w-4" />
                                        Imprimir
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </section>
                ) : (
                    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                        <div className="grid grid-cols-[1.3fr_1.1fr_.8fr_.9fr_1.2fr] border-b border-slate-200 bg-slate-50 px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            <span>Cliente</span>
                            <span>Proyecto</span>
                            <span>Estado</span>
                            <span>Evento</span>
                            <span className="text-right">Acciones</span>
                        </div>
                        {filteredContracts.map((contract) => (
                            <div key={contract.id} className="grid grid-cols-[1.3fr_1.1fr_.8fr_.9fr_1.2fr] items-center gap-4 border-b border-slate-100 px-6 py-5 last:border-b-0">
                                <div>
                                    <p className="font-semibold text-slate-900">{contract.project?.lead?.name}</p>
                                    <p className="mt-1 text-sm text-slate-500">{contract.project?.lead?.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{contract.project?.name}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{contract.project?.lead?.event_type}</p>
                                </div>
                                <div>
                                    <span className={clsx('rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em]', statusTone[contract.status] || 'border-slate-200 bg-slate-50 text-slate-600')}>
                                        {contract.status}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-700">{contract.variables?.['[event_date]']}</div>
                                <div className="flex justify-end gap-2">
                                    <Link href={`/admin/contracts/${contract.id}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                        <Eye className="h-4 w-4" />
                                        Ver
                                    </Link>
                                    <Link href={`/admin/contracts/${contract.id}/edit`} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                        <PencilLine className="h-4 w-4" />
                                        Editar
                                    </Link>
                                    <Link href={`/admin/contracts/${contract.id}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                        <Printer className="h-4 w-4" />
                                        Imprimir
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {filteredContracts.length === 0 && (
                    <section className="rounded-[2rem] border border-dashed border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
                        <FileText className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-4 text-sm text-slate-500">No encontramos contratos con ese criterio.</p>
                    </section>
                )}
            </div>
        </AdminLayout>
    );
}
