import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Bot, Camera, FolderKanban, ScanFace, Trash2, UserRound, WandSparkles } from 'lucide-react';
import { clsx } from 'clsx';

export default function Index({ mode, serviceConfigured, projects = [], identities = [], stats = {} }) {
    const { flash } = usePage().props;
    const modeForm = useForm({ mode: mode || 'project_only', enable_existing_projects: mode === 'all_galleries' });
    const identityForm = useForm({ name: '', scope: 'global', project_id: '', reference_image: null });

    const submitMode = (event) => {
        event.preventDefault();
        modeForm.post('/admin/face-detection/mode', { preserveScroll: true });
    };

    const submitIdentity = (event) => {
        event.preventDefault();
        identityForm.post('/admin/face-detection/identities', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => identityForm.reset('name', 'project_id', 'reference_image'),
        });
    };

    return (
        <AdminLayout>
            <Head title="Deteccion facial" />

            <div className="space-y-8">
                {(flash?.success || flash?.error) && (
                    <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">IA visual</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Deteccion facial</h2>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                Aqui centralizas todos los rostros con nombre del tenant y decides si la IA trabaja por galeria o en todas las galerias existentes y nuevas.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => router.post('/admin/face-detection/run-all', {}, { preserveScroll: true })}
                                disabled={!serviceConfigured}
                                className={clsx(
                                    'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
                                    !serviceConfigured
                                        ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                        : 'bg-[#171411] text-white'
                                )}
                            >
                                <WandSparkles className="h-4 w-4" />
                                Escanear todas las galerias
                            </button>
                            <Link href="/admin/projects" className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd5c9] bg-[#fbf9f6] px-4 py-3 text-sm font-semibold text-slate-700">
                                <FolderKanban className="h-4 w-4" />
                                Abrir colecciones
                            </Link>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Galerias" value={stats.projects_count || 0} detail="Proyectos del tenant" />
                        <StatCard label="Fotos" value={stats.photos_count || 0} detail="Fotos disponibles para IA" />
                        <StatCard label="Rostros globales" value={stats.global_identities_count || 0} detail="Disponibles para todas las galerias" />
                        <StatCard label="Pendientes" value={stats.photos_pending || 0} detail="Fotos aun no procesadas" />
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <form onSubmit={submitMode} className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm space-y-5">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Modo de trabajo</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Como quieres usar la deteccion</h3>
                        </div>

                        <ModeCard
                            title="Deteccion por galeria"
                            description="Cada galeria decide si activa IA y puede mantener rostros locales propios."
                            checked={modeForm.data.mode === 'project_only'}
                            onChange={() => modeForm.setData('mode', 'project_only')}
                        />
                        <ModeCard
                            title="Deteccion en todas las galerias"
                            description="Las galerias nuevas nacen con IA activa y puedes encender las actuales para escaneo masivo."
                            checked={modeForm.data.mode === 'all_galleries'}
                            onChange={() => modeForm.setData('mode', 'all_galleries')}
                        />

                        <label className="flex items-center justify-between rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-4 text-sm text-slate-700">
                            Aplicar a galerias existentes
                            <input
                                type="checkbox"
                                checked={!!modeForm.data.enable_existing_projects}
                                onChange={(event) => modeForm.setData('enable_existing_projects', event.target.checked)}
                                className="h-4 w-4"
                            />
                        </label>

                        <button type="submit" className="rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white">
                            Guardar modo
                        </button>
                    </form>

                    <form onSubmit={submitIdentity} className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm space-y-5">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Rostros con nombre</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Registrar un nuevo rostro</h3>
                        </div>

                        <Field label="Nombre" value={identityForm.data.name} onChange={(value) => identityForm.setData('name', value)} placeholder="Ej. Maria, Carlos, Sofia" />

                        <div className="grid gap-4 md:grid-cols-2">
                            <SelectField
                                label="Alcance"
                                value={identityForm.data.scope}
                                onChange={(value) => setIdentityScope(identityForm, value)}
                                options={[
                                    { value: 'global', label: 'Todas las galerias' },
                                    { value: 'project', label: 'Solo una galeria' },
                                ]}
                            />
                            <SelectField
                                label="Galeria"
                                value={identityForm.data.project_id}
                                onChange={(value) => identityForm.setData('project_id', value)}
                                options={projects.map((project) => ({ value: String(project.id), label: project.name }))}
                                disabled={identityForm.data.scope !== 'project'}
                                blankLabel="Selecciona una galeria"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Imagen de referencia</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => identityForm.setData('reference_image', event.target.files?.[0] || null)}
                                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={identityForm.processing || !serviceConfigured}
                            className={clsx(
                                'rounded-2xl px-5 py-3 text-sm font-semibold',
                                identityForm.processing || !serviceConfigured
                                    ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                    : 'bg-[#171411] text-white'
                            )}
                        >
                            {identityForm.processing ? 'Registrando...' : 'Guardar rostro'}
                        </button>
                    </form>
                </section>

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Rostros registrados</p>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        {identities.length > 0 ? identities.map((identity) => (
                            <article key={identity.id} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#e6e0d5] bg-white">
                                            {identity.preview_url ? (
                                                <img src={identity.preview_url} alt={identity.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <UserRound className="h-5 w-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-lg font-semibold text-slate-900">{identity.name}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                                                {identity.scope === 'global' ? 'Global' : identity.project_name || 'Galeria local'}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">{identity.processing_status}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm(`Eliminar a ${identity.name} del tenant?`)) {
                                                router.post(`/admin/face-detection/identities/${identity.id}`, { _method: 'delete' }, { preserveScroll: true });
                                            }
                                        }}
                                        className="rounded-full border border-[#e6e0d5] bg-white p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                {identity.processing_note && <p className="mt-4 text-sm text-slate-500">{identity.processing_note}</p>}
                            </article>
                        )) : (
                            <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-14 text-center text-sm text-slate-400 lg:col-span-2">
                                Todavia no hay rostros registrados para este tenant.
                            </div>
                        )}
                    </div>
                </section>

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Galerias</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Estado de deteccion por galeria</h3>
                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                        {projects.map((project) => (
                            <article key={project.id} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">{project.name}</p>
                                        <p className="mt-1 text-sm text-slate-500">{project.client_name || 'Cliente directo'} {project.event_type ? `· ${project.event_type}` : ''}</p>
                                    </div>
                                    <span className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', project.face_recognition_enabled ? 'bg-[#e6f7ef] text-[#16794f]' : 'bg-white text-slate-500 border border-[#e6e0d5]')}>
                                        {project.face_recognition_enabled ? 'IA activa' : 'Manual'}
                                    </span>
                                </div>
                                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    <MiniStat icon={Camera} label="Fotos" value={project.photos_count || 0} />
                                    <MiniStat icon={ScanFace} label="Rostros locales" value={project.local_identities_count || 0} />
                                    <MiniStat icon={Bot} label="Base lista" value={project.database_ready ? 'Si' : 'No'} />
                                </div>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Link href={project.workspace_url} className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                                        <FolderKanban className="h-4 w-4" />
                                        Abrir IA de la galeria
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

function setIdentityScope(form, value) {
    form.setData((current) => ({
        ...current,
        scope: value,
        project_id: value === 'project' ? current.project_id : '',
    }));
}

function StatCard({ label, value, detail }) {
    return (
        <div className="rounded-[1.7rem] border border-[#e6e0d5] bg-[#fbf9f6] px-5 py-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
    );
}

function MiniStat({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-[#e8e1d5] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon className="h-3.5 w-3.5" />
                <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
        </div>
    );
}

function ModeCard({ title, description, checked, onChange }) {
    return (
        <label className={clsx('block rounded-[1.6rem] border px-5 py-5 transition', checked ? 'border-[#171411] bg-[#171411] text-white' : 'border-[#e6e0d5] bg-[#fbf9f6] text-slate-700')}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-base font-semibold">{title}</p>
                    <p className={clsx('mt-2 text-sm leading-6', checked ? 'text-white/70' : 'text-slate-500')}>{description}</p>
                </div>
                <input type="radio" checked={checked} onChange={onChange} className="mt-1 h-4 w-4" />
            </div>
        </label>
    );
}

function Field({ label, value, onChange, placeholder = '' }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options = [], blankLabel = null, disabled = false }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
                {blankLabel !== null && <option value="">{blankLabel}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
}
