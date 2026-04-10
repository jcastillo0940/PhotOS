import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
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
    const collaboratorForm = useForm({ email: '', can_upload: true, can_manage_gallery: false });
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

    const invitePhotographer = (event) => {
        event.preventDefault();
        collaboratorForm.post(`/admin/projects/${project.id}/collaborators`, {
            preserveScroll: true,
            onSuccess: () => collaboratorForm.reset('email'),
        });
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

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Equipo</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Fotografos asignados a este proyecto</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500">Un fotografo puede colaborar en proyectos de varios owners. Aqui se genera su acceso por proyecto con link y codigo.</p>

                    <form onSubmit={invitePhotographer} className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_auto_auto_auto]">
                        <Field label="Correo del fotografo" value={collaboratorForm.data.email} onChange={(value) => collaboratorForm.setData('email', value)} />
                        <Toggle label="Puede subir" checked={!!collaboratorForm.data.can_upload} onChange={(checked) => collaboratorForm.setData('can_upload', checked)} />
                        <Toggle label="Puede editar galeria" checked={!!collaboratorForm.data.can_manage_gallery} onChange={(checked) => collaboratorForm.setData('can_manage_gallery', checked)} />
                        <div className="flex items-end">
                            <button type="submit" className="rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white">Asignar</button>
                        </div>
                    </form>

                    <div className="mt-6 space-y-4">
                        {(project.collaborators || []).length > 0 ? project.collaborators.map((collaborator) => (
                            <div key={collaborator.id} className="rounded-[1.4rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">{collaborator.name || collaborator.email}</p>
                                        <p className="mt-1 text-sm text-slate-500">{collaborator.email}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{collaborator.status}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => router.post(`/admin/projects/${project.id}/collaborators/${collaborator.id}/regenerate`, {}, { preserveScroll: true })} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                            Regenerar acceso
                                        </button>
                                        <button onClick={() => router.post(`/admin/projects/${project.id}/collaborators/${collaborator.id}/revoke`, {}, { preserveScroll: true })} className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                                            Revocar acceso
                                        </button>
                                        <button onClick={() => router.delete(`/admin/projects/${project.id}/collaborators/${collaborator.id}`, { preserveScroll: true })} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                    <InfoCard label="Link de acceso" value={collaborator.access_url} />
                                    <InfoCard label="Codigo" value={collaborator.access_code} />
                                    <InfoCard label="Permisos" value={`${collaborator.can_upload ? 'Subir' : 'Sin subida'}${collaborator.can_manage_gallery ? ' · Editar galeria' : ''}`} />
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-[1.6rem] border border-dashed border-[#ddd5c9] px-6 py-10 text-sm text-slate-500">
                                Aun no hay fotografos asignados a este proyecto.
                            </div>
                        )}
                    </div>
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

function Toggle({ label, checked, onChange }) {
    return (
        <label className="flex items-end">
            <span className="flex w-full items-center justify-between rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700">
                {label}
                <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" />
            </span>
        </label>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-[#e8e1d5] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-800">{value}</p>
        </div>
    );
}
