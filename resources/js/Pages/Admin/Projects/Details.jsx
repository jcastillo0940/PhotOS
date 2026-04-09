import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { ChevronLeft } from 'lucide-react';

const statuses = [
    { value: 'active', label: 'Activo' },
    { value: 'pending_payment', label: 'Pago pendiente' },
    { value: 'editing', label: 'Edicion' },
    { value: 'delivered', label: 'Entregado' },
];

export default function Details({ project, installationPlan }) {
    const { flash } = usePage().props;
    const [form, setForm] = React.useState({
        name: project.name || '',
        event_date: project.event_date ? new Date(project.event_date).toISOString().slice(0, 10) : '',
        location: project.location || '',
        status: project.status || 'active',
    });

    const save = (event) => {
        event.preventDefault();
        router.put(`/admin/projects/${project.id}`, form, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title={`Detalles: ${project.name}`} />

            <div className="space-y-8">
                <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a colecciones
                </Link>

                <ProjectWorkspaceNav project={project} current="details" />

                {flash?.success && <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">{flash.success}</div>}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Detalles</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Informacion base del proyecto</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500">Esta vista se enfoca solo en el nombre, la fecha, la ubicacion y el estado del proyecto.</p>

                    <form onSubmit={save} className="mt-6 grid gap-4 lg:grid-cols-2">
                        <Field label="Nombre de la coleccion" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
                        <Field label="Fecha del evento" type="date" value={form.event_date} onChange={(value) => setForm((current) => ({ ...current, event_date: value }))} />
                        <Field label="Ubicacion" value={form.location} onChange={(value) => setForm((current) => ({ ...current, location: value }))} />
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Estado</label>
                            <select
                                value={form.status}
                                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none"
                            >
                                {statuses.map((status) => (
                                    <option key={status.value} value={status.value}>{status.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5 lg:col-span-2">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Plan aplicado</p>
                            <h3 className="mt-2 text-lg font-semibold text-slate-900">{installationPlan?.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">{installationPlan?.audience || 'Configuracion global activa para esta instalacion.'}</p>
                        </div>

                        <div className="lg:col-span-2">
                            <button type="submit" className="rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white">
                                Guardar detalles
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </AdminLayout>
    );
}

function Field({ label, value, onChange, type = 'text' }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            <input
                type={type}
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none"
            />
        </div>
    );
}
