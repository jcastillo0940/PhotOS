import React, { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowRight,
    BadgeCheck,
    CalendarRange,
    CirclePlus,
    FolderKanban,
    MapPin,
    Search,
    UploadCloud,
    Workflow,
} from 'lucide-react';
import { clsx } from 'clsx';

const statusStyles = {
    active: 'bg-[#e9f4ff] text-[#1f5f93]',
    pending_payment: 'bg-[#fff4de] text-[#9a6b00]',
    editing: 'bg-[#f3ecff] text-[#6845b0]',
    delivered: 'bg-[#e6f7ef] text-[#16794f]',
};

const statusLabels = {
    active: 'Activo',
    pending_payment: 'Pago pendiente',
    editing: 'Edicion',
    delivered: 'Entregado',
};

function SummaryCard({ label, value, detail }) {
    return (
        <div className="rounded-[1.7rem] border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
    );
}

export default function Index({ projects, installationPlan, eventTypes = [] }) {
    const [showDirectForm, setShowDirectForm] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState('Todos');
    const [search, setSearch] = useState('');
    const { data, setData, post, processing, reset } = useForm({ client_name: '', project_name: '' });

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesType = selectedEventType === 'Todos' || project.lead?.event_type === selectedEventType;
            const haystack = [
                project.name,
                project.location,
                project.website_category,
                project.lead?.name,
                project.lead?.event_type,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return matchesType && haystack.includes(search.toLowerCase());
        });
    }, [projects, search, selectedEventType]);

    const summary = useMemo(() => ({
        total: projects.length,
        active: projects.filter((project) => project.status === 'active').length,
        delivered: projects.filter((project) => project.status === 'delivered').length,
        portfolio: projects.filter((project) => (project.photos || []).some((photo) => photo.show_on_website)).length,
    }), [projects]);

    const submitDirect = (event) => {
        event.preventDefault();
        post('/admin/projects', {
            onSuccess: () => {
                setShowDirectForm(false);
                reset();
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Colecciones" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-white p-7 shadow-sm">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Colecciones</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Un lugar claro para abrir, revisar y entregar cada proyecto.</h2>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                La vista prioriza lo que el estudio necesita todos los dias: buscar rapido, detectar estado, abrir una coleccion y crear proyectos nuevos sin perderse.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd5c9] bg-[#fbf9f6] px-4 py-3 text-sm font-semibold text-slate-700">
                                <Workflow className="h-4 w-4" />
                                Desde leads
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowDirectForm((value) => !value)}
                                className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white"
                            >
                                <CirclePlus className="h-4 w-4" />
                                Nueva coleccion
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard label="Total" value={summary.total} detail="Colecciones registradas" />
                        <SummaryCard label="Activas" value={summary.active} detail="En trabajo o pendientes" />
                        <SummaryCard label="Entregadas" value={summary.delivered} detail="Colecciones cerradas" />
                        <SummaryCard label="Portafolio" value={summary.portfolio} detail="Con fotos visibles en la web" />
                    </div>
                </section>

                {showDirectForm && (
                    <section className="rounded-[2rem] border border-[#d9d1c4] bg-[#171411] p-7 text-white shadow-sm">
                        <form onSubmit={submitDirect} className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
                            <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Nombre del cliente</label>
                                <input
                                    type="text"
                                    required
                                    value={data.client_name}
                                    onChange={(event) => setData('client_name', event.target.value)}
                                    placeholder="Ej. Ana y Luis"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">Nombre de la coleccion</label>
                                <input
                                    type="text"
                                    required
                                    value={data.project_name}
                                    onChange={(event) => setData('project_name', event.target.value)}
                                    placeholder="Ej. Boda en Santa Maria"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
                                />
                            </div>
                            <div className="flex items-end gap-3">
                                <button type="button" onClick={() => setShowDirectForm(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/75">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                                    {processing ? 'Creando...' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative w-full max-w-xl">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar por nombre, cliente, lugar o categoria"
                                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={selectedEventType}
                                onChange={(event) => setSelectedEventType(event.target.value)}
                                className="rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none"
                            >
                                {['Todos', ...eventTypes].map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>

                            <div className="rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700">
                                Plan del estudio: <span className="font-semibold">{installationPlan?.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                        {filteredProjects.length > 0 ? filteredProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={`/admin/projects/${project.id}/details`}
                                className="group rounded-[1.75rem] border border-[#ece5d8] bg-[#fbf9f6] p-5 transition hover:-translate-y-0.5 hover:border-[#d9d1c4] hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-start gap-4">
                                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                                            <FolderKanban className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-lg font-semibold text-slate-900">{project.name}</h3>
                                            <p className="mt-1 text-sm text-slate-500">{project.lead?.name || 'Cliente directo'}</p>
                                        </div>
                                    </div>

                                    <span className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', statusStyles[project.status] || 'bg-white text-slate-500 border border-[#e6e0d5]')}>
                                        {statusLabels[project.status] || project.status}
                                    </span>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-3">
                                    <InfoPill icon={BadgeCheck} label="Tipo" value={project.lead?.event_type || 'Sin categoria'} />
                                    <InfoPill icon={CalendarRange} label="Fecha" value={project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Por definir'} />
                                    <InfoPill icon={MapPin} label="Lugar" value={project.location || 'Sin ubicacion'} />
                                </div>

                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe5db] pt-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <UploadCloud className="h-3.5 w-3.5" />
                                        {project.contract?.status === 'signed' ? 'Contrato firmado' : 'Firma pendiente'}
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                                        Abrir coleccion
                                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-16 text-center xl:col-span-2">
                                <FolderKanban className="mx-auto h-8 w-8 text-slate-300" />
                                <h3 className="mt-4 text-lg font-semibold text-slate-900">No hay colecciones para este filtro.</h3>
                                <p className="mt-2 text-sm text-slate-500">Prueba con otro tipo de evento o crea una nueva coleccion desde el panel superior.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

function InfoPill({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-[#e8e1d5] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon className="h-3.5 w-3.5" />
                <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className="mt-2 truncate text-sm font-medium text-slate-800">{value}</p>
        </div>
    );
}
