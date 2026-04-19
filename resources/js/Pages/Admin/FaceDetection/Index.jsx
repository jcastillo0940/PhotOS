import React, { useRef, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Bot, Camera, Check, FolderKanban, HelpCircle, ImagePlus, ScanFace, Shield, Tags, Ticket, Trash2, UserPlus, UserRound, WandSparkles, X } from 'lucide-react';
import { clsx } from 'clsx';

const CATALOG_META = {
    brand: {
        title: 'Marcas',
        eyebrow: 'Biblioteca visual',
        placeholder: 'Ej. Nike, Adidas, Puma',
        helper: 'Carga marcas clave para tu tenant. Puedes adjuntar un logo o referencia visual.',
        icon: Tags,
        empty: 'Todavia no hay marcas cargadas.',
        button: 'Guardar marca',
    },
    sponsor: {
        title: 'Sponsors',
        eyebrow: 'Biblioteca comercial',
        placeholder: 'Ej. Fly Emirates, Pepsi, Copa Airlines',
        helper: 'Usa esta biblioteca para patrocinadores principales en camisetas, vallas o activaciones.',
        icon: Shield,
        empty: 'Todavia no hay sponsors cargados.',
        button: 'Guardar sponsor',
    },
    jersey: {
        title: 'Dorsales',
        eyebrow: 'Biblioteca deportiva',
        placeholder: 'Ej. 10, 7, 21',
        helper: 'Opcional. Gemini puede detectar dorsales visibles por patron en camiseta o pantaloneta sin cargar una biblioteca previa.',
        icon: Ticket,
        empty: 'Todavia no hay dorsales cargados.',
        button: 'Guardar dorsal opcional',
    },
    context: {
        title: 'Contexto',
        eyebrow: 'Biblioteca de escenas',
        placeholder: 'Ej. Balon, Porteria, Tarjeta roja',
        helper: 'Define escenas importantes del partido o del evento para que el equipo las siga de cerca.',
        icon: Bot,
        empty: 'Todavia no hay contextos cargados.',
        button: 'Guardar contexto',
    },
};

export default function Index({ mode, sportsModeEnabled = false, serviceConfigured, projects = [], identities = [], unknownDetections = [], catalogs = {}, stats = {} }) {
    const { flash } = usePage().props;
    const modeForm = useForm({ mode: mode || 'project_only', enable_existing_projects: mode === 'all_galleries' });
    const identityForm = useForm({ name: '', scope: 'global', project_id: '', reference_image: null });
    const catalogForm = useForm({ type: 'brand', name: '', reference_image: null });

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

    const submitCatalog = (event) => {
        event.preventDefault();
        catalogForm.post('/admin/face-detection/catalog', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => catalogForm.reset('name', 'reference_image'),
        });
    };

    const selectedCatalog = CATALOG_META[catalogForm.data.type] || CATALOG_META.brand;

    return (
        <AdminLayout>
            <Head title={sportsModeEnabled ? 'IA Deportiva' : 'Deteccion facial'} />

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
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                                {sportsModeEnabled ? 'Centro de IA deportiva' : 'Centro de reconocimiento visual'}
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                {sportsModeEnabled
                                    ? 'Desde aqui gestionas la biblioteca IA del tenant: rostros, marcas, sponsors y escenas clave. Los dorsales Gemini los detecta visualmente sin necesidad de precargarlos.'
                                    : 'Desde aqui gestionas la biblioteca IA del tenant: rostros y referencias visuales base para todo el estudio.'}
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
                        <StatCard label="Rostros locales" value={stats.local_identities_count || 0} detail="Especificos por galeria" />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <StatCard label="Con personas" value={stats.photos_with_people || 0} detail="Fotos con rostros identificados" />
                        <StatCard label="Sin coincidencia" value={stats.photos_without_match || 0} detail="Rostros detectados sin match" highlight={stats.photos_without_match > 0} />
                        <StatCard label="Pendientes" value={stats.photos_pending || 0} detail="Fotos aun no procesadas" />
                        <StatCard label="Catalogo total" value={(stats.catalog_brands_count || 0) + (stats.catalog_sponsors_count || 0) + (stats.catalog_jerseys_count || 0) + (stats.catalog_context_count || 0)} detail="Marcas, sponsors, dorsales y contextos" />
                    </div>

                    {sportsModeEnabled ? (
                        <div className="mt-6 grid gap-4 xl:grid-cols-4">
                            <InsightCard icon={ScanFace} title="Rostros conocidos" description="Entrena protagonistas y arbitros con referencias base del tenant." />
                            <InsightCard icon={Ticket} title="Dorsales automaticos" description="Gemini busca numeros visibles en camiseta o pantaloneta sin depender de una carga previa." />
                            <InsightCard icon={Camera} title="Sponsors y marcas" description="Centraliza referencias comerciales para medir presencia en fotos del partido." />
                            <InsightCard icon={Bot} title="Escenas clave" description="Agrupa contexto como balon, porteria, tarjeta o celebracion para venta y prensa." />
                        </div>
                    ) : (
                        <div className="mt-6 rounded-[1.7rem] border border-[#e6e0d5] bg-[#fffdf9] px-5 py-5 text-sm leading-7 text-slate-500 shadow-sm">
                            Este tenant esta en modo general. Si trabajas deportes y quieres habilitar dorsales, sponsors y contexto de juego, activa <span className="font-semibold text-slate-900">Personalizar para deportes</span> en <span className="font-semibold text-slate-900">Settings &gt; Branding</span>.
                        </div>
                    )}
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <form onSubmit={submitMode} className="space-y-5 rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Modo de trabajo</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                {sportsModeEnabled ? 'Como quieres usar la IA deportiva' : 'Como quieres usar la IA visual'}
                            </h3>
                        </div>

                        <ModeCard
                            title="Deteccion por galeria"
                            description={sportsModeEnabled
                                ? 'Cada galeria decide si activa IA y puede mantener su propio roster base y pipeline deportivo.'
                                : 'Cada galeria decide si activa IA y puede mantener su propia base de personas.'}
                            checked={modeForm.data.mode === 'project_only'}
                            onChange={() => modeForm.setData('mode', 'project_only')}
                        />
                        <ModeCard
                            title="Deteccion en todas las galerias"
                            description={sportsModeEnabled
                                ? 'Las galerias nuevas nacen con IA activa y puedes encender las actuales para escaneo deportivo masivo.'
                                : 'Las galerias nuevas nacen con IA activa y puedes encender las actuales para escaneo masivo.'}
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

                    <form onSubmit={submitIdentity} className="space-y-5 rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Roster y personas</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                {sportsModeEnabled ? 'Registrar un nuevo protagonista' : 'Registrar un nuevo rostro'}
                            </h3>
                        </div>

                        <Field
                            label="Nombre"
                            value={identityForm.data.name}
                            onChange={(value) => identityForm.setData('name', value)}
                            placeholder={sportsModeEnabled ? 'Ej. Jeremy, Portero, Arbitro central' : 'Ej. Maria, Carlos, Sofia'}
                        />

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

                        <FileField
                            label="Imagen de referencia"
                            onChange={(file) => identityForm.setData('reference_image', file)}
                        />

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
                            {identityForm.processing ? 'Registrando...' : sportsModeEnabled ? 'Guardar protagonista' : 'Guardar rostro'}
                        </button>
                    </form>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                    <form onSubmit={submitCatalog} className="space-y-5 rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Biblioteca IA del tenant</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Subir marcas, sponsors y contexto</h3>
                            <p className="mt-2 text-sm leading-7 text-slate-500">Todo lo que cargues aqui queda centralizado en este tenant y viaja como referencia hacia el pipeline de analisis. Los dorsales son opcionales porque Gemini puede leerlos directo en la imagen.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <SelectField
                                label="Tipo de referencia"
                                value={catalogForm.data.type}
                                onChange={(value) => catalogForm.setData('type', value)}
                                options={Object.entries(CATALOG_META).map(([value, meta]) => ({ value, label: meta.title }))}
                            />
                            <Field
                                label="Nombre"
                                value={catalogForm.data.name}
                                onChange={(value) => catalogForm.setData('name', value)}
                                placeholder={selectedCatalog.placeholder}
                            />
                        </div>

                        <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-4 text-sm leading-6 text-slate-500">
                            <p className="font-semibold text-slate-900">{selectedCatalog.title}</p>
                            <p className="mt-1">{selectedCatalog.helper}</p>
                        </div>

                        <FileField
                            label="Imagen de referencia opcional"
                            onChange={(file) => catalogForm.setData('reference_image', file)}
                        />

                        <button
                            type="submit"
                            disabled={catalogForm.processing}
                            className={clsx(
                                'rounded-2xl px-5 py-3 text-sm font-semibold',
                                catalogForm.processing
                                    ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                    : 'bg-[#171411] text-white'
                            )}
                        >
                            {catalogForm.processing ? 'Guardando...' : selectedCatalog.button}
                        </button>
                    </form>

                    <div className="space-y-4 rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Bibliotecas activas</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Todo lo que el tenant ya tiene cargado</h3>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-2">
                            {Object.entries(CATALOG_META).map(([type, meta]) => (
                                <CatalogCard
                                    key={type}
                                    type={type}
                                    meta={meta}
                                    items={catalogs?.[type]?.items || []}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                        {sportsModeEnabled ? 'Jugadores registrados' : 'Personas registradas'}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        {sportsModeEnabled
                            ? 'Cada jugador puede tener múltiples fotos de referencia. Más muestras = mejor reconocimiento.'
                            : 'Personas registradas para reconocimiento facial en el tenant.'}
                    </p>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        {identities.length > 0 ? identities.map((identity) => (
                            <PlayerIdentityCard
                                key={identity.id}
                                identity={identity}
                                serviceConfigured={serviceConfigured}
                                sportsModeEnabled={sportsModeEnabled}
                            />
                        )) : (
                            <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-14 text-center text-sm text-slate-400 lg:col-span-2">
                                {sportsModeEnabled ? 'Todavía no hay jugadores registrados para este tenant.' : 'Todavía no hay personas registradas para este tenant.'}
                            </div>
                        )}
                    </div>
                </section>

                {unknownDetections.length > 0 && (
                    <section className="rounded-[2rem] border border-amber-200 bg-white p-7 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-500">Aprendizaje</p>
                                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                    Rostros sin identificar
                                </h3>
                                <p className="mt-2 text-sm leading-7 text-slate-500">
                                    La IA detecto estos rostros pero no los pudo asociar a ninguna identidad conocida. Al confirmarlos, el sistema aprende y mejora futuros reconocimientos.
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                                {unknownDetections.length} pendientes
                            </span>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {unknownDetections.map((detection) => (
                                <UnknownFaceCard key={detection.id} detection={detection} identities={identities} />
                            ))}
                        </div>
                    </section>
                )}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Galerias</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                        {sportsModeEnabled ? 'Estado de IA por galeria' : 'Estado de reconocimiento por galeria'}
                    </h3>
                    <div className="mt-6 grid gap-4 xl:grid-cols-2">
                        {projects.map((project) => (
                            <article key={project.id} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">{project.name}</p>
                                        <p className="mt-1 text-sm text-slate-500">{project.client_name || 'Cliente directo'} {project.event_type ? `· ${project.event_type}` : ''}</p>
                                    </div>
                                    <span className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', project.face_recognition_enabled ? 'bg-[#e6f7ef] text-[#16794f]' : 'border border-[#e6e0d5] bg-white text-slate-500')}>
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

function PlayerIdentityCard({ identity, serviceConfigured, sportsModeEnabled }) {
    const [addingPhoto, setAddingPhoto] = useState(false);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('reference_image', file);
        router.post(`/admin/face-detection/identities/${identity.id}/photos`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => { setUploading(false); setAddingPhoto(false); },
        });
    };

    return (
        <article className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[#e6e0d5] bg-white">
                        {identity.preview_url ? (
                            <img src={identity.preview_url} alt={identity.name} className="h-full w-full object-cover" />
                        ) : (
                            <UserRound className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-lg font-semibold text-slate-900">{identity.name}</p>
                            <span className={clsx('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', identity.vectors_count >= 3 ? 'bg-emerald-100 text-emerald-700' : identity.vectors_count >= 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                                {identity.vectors_count === 0 ? 'Sin muestras' : `${identity.vectors_count} ${identity.vectors_count === 1 ? 'muestra' : 'muestras'}`}
                            </span>
                            {identity.scope === 'global' && (
                                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Global</span>
                            )}
                        </div>
                        <p className={clsx('mt-1 text-sm', identity.processing_status === 'error' ? 'text-rose-500' : 'text-slate-500')}>
                            {identity.processing_status === 'ready' ? 'Entrenado' : identity.processing_status === 'queued' ? 'Procesando...' : identity.processing_status === 'error' ? 'Error al entrenar' : 'Pendiente'}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 gap-2">
                    {serviceConfigured && (
                        <button
                            type="button"
                            title="Agregar foto de referencia"
                            onClick={() => { setAddingPhoto((v) => !v); }}
                            className="rounded-full border border-[#e6e0d5] bg-white p-2 text-slate-500 transition hover:bg-amber-50 hover:text-amber-600"
                        >
                            <ImagePlus className="h-4 w-4" />
                        </button>
                    )}
                    <DeleteButton onClick={() => {
                        if (window.confirm(`Eliminar a ${identity.name} del tenant?`)) {
                            router.delete(`/admin/face-detection/identities/${identity.id}`, { preserveScroll: true });
                        }
                    }} />
                </div>
            </div>
            {identity.processing_note && <p className="mt-3 text-sm text-slate-500">{identity.processing_note}</p>}
            {addingPhoto && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Agregar muestra de {identity.name}
                    </p>
                    <p className="mb-3 text-xs text-amber-700">Sube otra foto del jugador para enriquecer su reconocimiento.</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none disabled:opacity-60"
                    />
                    {uploading && <p className="mt-2 text-xs text-amber-600">Subiendo y procesando...</p>}
                </div>
            )}
        </article>
    );
}

function CatalogCard({ type, meta, items = [] }) {
    const Icon = meta.icon;

    return (
        <article className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6e0d5] bg-white text-slate-700">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{meta.eyebrow}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{meta.title}</p>
                </div>
            </div>

            <div className="mt-4 space-y-3">
                {items.length > 0 ? items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6e0d5] bg-white px-3 py-3">
                        <div className="min-w-0 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[#ece5d8] bg-[#fbf9f6]">
                                {item.preview_url ? (
                                    <img src={item.preview_url} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Icon className="h-4 w-4 text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{type === 'jersey' ? `#${item.name}` : item.name}</p>
                                <p className="text-xs text-slate-400">{item.reference_path ? 'Con referencia visual' : 'Solo etiqueta manual'}</p>
                            </div>
                        </div>
                        <DeleteButton onClick={() => {
                            const subject = type === 'jersey' ? `el dorsal ${item.name}` : item.name;
                            if (window.confirm(`Eliminar ${subject} de la biblioteca IA?`)) {
                                router.delete(`/admin/face-detection/catalog/${type}/${item.id}`, { preserveScroll: true });
                            }
                        }} />
                    </div>
                )) : (
                    <div className="rounded-2xl border border-dashed border-[#ddd5c9] px-4 py-8 text-center text-sm text-slate-400">
                        {meta.empty}
                    </div>
                )}
            </div>
        </article>
    );
}

function DeleteButton({ onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-full border border-[#e6e0d5] bg-white p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}

function setIdentityScope(form, value) {
    form.setData((current) => ({
        ...current,
        scope: value,
        project_id: value === 'project' ? current.project_id : '',
    }));
}

function StatCard({ label, value, detail, highlight = false }) {
    return (
        <div className={clsx('rounded-[1.7rem] border px-5 py-5 shadow-sm', highlight && value > 0 ? 'border-amber-200 bg-amber-50' : 'border-[#e6e0d5] bg-[#fbf9f6]')}>
            <p className={clsx('text-[11px] font-semibold uppercase tracking-[0.2em]', highlight && value > 0 ? 'text-amber-500' : 'text-slate-400')}>{label}</p>
            <p className={clsx('mt-3 text-2xl font-semibold tracking-tight', highlight && value > 0 ? 'text-amber-700' : 'text-slate-900')}>{value}</p>
            <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
    );
}

function InsightCard({ icon: Icon, title, description }) {
    return (
        <div className="rounded-[1.7rem] border border-[#e6e0d5] bg-[#fffdf9] px-5 py-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6e0d5] bg-white text-slate-700">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
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

function FileField({ label, onChange }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            <input
                type="file"
                accept="image/*"
                onChange={(event) => onChange(event.target.files?.[0] || null)}
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

function UnknownFaceCard({ detection, identities = [] }) {
    const [mode, setMode] = useState('existing'); // 'existing' | 'new'
    const [selectedIdentityId, setSelectedIdentityId] = useState(
        detection.best_match_identity_id ? String(detection.best_match_identity_id) : ''
    );
    const [newName, setNewName] = useState('');
    const confidence = detection.best_confidence ? Math.round(detection.best_confidence * 100) : 0;
    const similarityPct = confidence;

    const confirm = () => {
        if (!selectedIdentityId) return;
        router.post(`/admin/face-detection/unknowns/${detection.id}/confirm`, {
            face_identity_id: selectedIdentityId,
        }, { preserveScroll: true });
    };

    const labelNew = () => {
        if (!newName.trim()) return;
        router.post(`/admin/face-detection/unknowns/${detection.id}/name`, {
            name: newName.trim(),
        }, { preserveScroll: true });
    };

    const reject = () => {
        router.delete(`/admin/face-detection/unknowns/${detection.id}/reject`, { preserveScroll: true });
    };

    return (
        <div className="rounded-[1.6rem] border border-amber-100 bg-amber-50 p-4 space-y-3">
            {/* Pipeline steps */}
            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-600">
                <span className="flex items-center gap-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white">1</span>
                    Deteccion
                </span>
                <span className="flex-1 border-t border-amber-300" />
                <span className="flex items-center gap-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white">2</span>
                    Vector 512D
                </span>
                <span className="flex-1 border-t border-amber-300" />
                <span className="flex items-center gap-1">
                    <span className={clsx('flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white', similarityPct >= 60 ? 'bg-emerald-400' : 'bg-rose-400')}>3</span>
                    {similarityPct >= 60 ? `${similarityPct}%` : 'Sin match'}
                </span>
            </div>

            {/* Photo with bbox */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-100" style={{ aspectRatio: '16/9' }}>
                {detection.photo_url ? (
                    <img src={detection.photo_url} alt="Foto con rostro desconocido" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <HelpCircle className="h-8 w-8 text-slate-300" />
                    </div>
                )}
                {detection.bbox && (
                    <div
                        className="absolute border-2 border-amber-400 rounded"
                        style={{
                            left: `${detection.bbox[0] * 100}%`,
                            top: `${detection.bbox[1] * 100}%`,
                            width: `${(detection.bbox[2] - detection.bbox[0]) * 100}%`,
                            height: `${(detection.bbox[3] - detection.bbox[1]) * 100}%`,
                        }}
                    />
                )}
            </div>

            {confidence > 0 && (
                <p className="text-xs text-amber-700">
                    Mas cercano: <span className="font-semibold">{detection.best_match_name || 'Desconocido'}</span> — {confidence}% similitud
                </p>
            )}

            {/* Mode toggle */}
            <div className="flex rounded-2xl border border-amber-200 bg-white overflow-hidden text-xs font-semibold">
                <button
                    type="button"
                    onClick={() => setMode('existing')}
                    className={clsx('flex-1 py-2 transition', mode === 'existing' ? 'bg-[#171411] text-white' : 'text-slate-500')}
                >
                    Es alguien conocido
                </button>
                <button
                    type="button"
                    onClick={() => setMode('new')}
                    className={clsx('flex-1 py-2 transition', mode === 'new' ? 'bg-amber-500 text-white' : 'text-slate-500')}
                >
                    Nueva persona
                </button>
            </div>

            {mode === 'existing' ? (
                <>
                    <select
                        value={selectedIdentityId}
                        onChange={(e) => setSelectedIdentityId(e.target.value)}
                        className="w-full rounded-2xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                    >
                        <option value="">Seleccionar identidad...</option>
                        {identities.map((id) => (
                            <option key={id.id} value={String(id.id)}>{id.name}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={confirm}
                            disabled={!selectedIdentityId}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#171411] py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                            <Check className="h-3.5 w-3.5" />
                            Confirmar y aprender
                        </button>
                        <button
                            type="button"
                            onClick={reject}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm text-slate-500"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && labelNew()}
                        placeholder="Nombre de la persona..."
                        className="w-full rounded-2xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                    />
                    <p className="text-[11px] text-amber-700 leading-5">
                        El vector de 512 dimensiones se guarda como identidad nueva. El sistema la reconocera en futuras fotos automaticamente.
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={labelNew}
                            disabled={!newName.trim()}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-amber-500 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            Etiquetar y guardar vector
                        </button>
                        <button
                            type="button"
                            onClick={reject}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm text-slate-500"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
