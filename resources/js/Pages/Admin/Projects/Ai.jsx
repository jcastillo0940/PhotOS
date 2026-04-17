import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { Bot, Camera, ChevronLeft, ScanFace, Trash2, UserRound, WandSparkles } from 'lucide-react';
import { clsx } from 'clsx';

export default function Ai({ project, faceRecognition }) {
    const { flash } = usePage().props;
    const identityForm = useForm({
        name: '',
        reference_image: null,
    });

    const capabilities = project?.plan_capabilities || {};
    const supportsFaceRecognition = !!capabilities.supports_face_recognition;
    const supportsSponsorDetection = !!capabilities.supports_sponsor_detection;
    const sponsorSelectionLimit = capabilities.sponsor_selection_limit;
    const requiresExplicitSponsors = !!capabilities.requires_explicit_sponsors;
    const sponsorCatalog = project?.sponsor_catalog || faceRecognition?.sponsor_catalog || [];

    const [faceRecognitionEnabled, setFaceRecognitionEnabled] = React.useState(!!project.face_recognition_enabled);
    const [selectedSponsors, setSelectedSponsors] = React.useState(project.selected_sponsors || faceRecognition?.selected_sponsors || []);

    React.useEffect(() => {
        setFaceRecognitionEnabled(!!project.face_recognition_enabled);
        setSelectedSponsors(project.selected_sponsors || faceRecognition?.selected_sponsors || []);
    }, [project.face_recognition_enabled, project.selected_sponsors, faceRecognition?.selected_sponsors]);

    const canUseRecognition = supportsFaceRecognition
        && !!faceRecognitionEnabled
        && !!faceRecognition?.service_configured
        && !!faceRecognition?.database_ready
        && (!supportsSponsorDetection || !requiresExplicitSponsors || selectedSponsors.length > 0);

    const recognitionSummary = faceRecognition?.summary || {};
    const processedPhotos = recognitionSummary.photos_processed || 0;
    const sportsModeEnabled = !!faceRecognition?.sports_mode_enabled;

    const saveMeta = () => {
        router.put(`/admin/projects/${project.id}`, {
            face_recognition_enabled: supportsFaceRecognition ? faceRecognitionEnabled : false,
            selected_sponsors: supportsSponsorDetection ? selectedSponsors : [],
        }, { preserveScroll: true, preserveState: true });
    };

    const toggleSponsor = (sponsor) => {
        setSelectedSponsors((current) => {
            if (current.includes(sponsor)) {
                return current.filter((item) => item !== sponsor);
            }

            if (sponsorSelectionLimit !== null && sponsorSelectionLimit !== undefined && current.length >= sponsorSelectionLimit) {
                return current;
            }

            return [...current, sponsor];
        });
    };

    const createIdentity = (event) => {
        event.preventDefault();
        identityForm.post(`/admin/projects/${project.id}/face-identities`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => identityForm.reset(),
        });
    };

    return (
        <AdminLayout>
            <Head title={`${sportsModeEnabled ? 'Procesar galeria deportiva' : 'Procesar galeria'}: ${project.name}`} />

            <div className="space-y-8">
                <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a colecciones
                </Link>

                <ProjectWorkspaceNav project={project} current="ai" />

                {(flash?.success || flash?.error) && (
                    <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                {!supportsFaceRecognition && (
                    <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                        Este plan no incluye IA. La galeria puede seguir operando, pero el reconocimiento y el procesamiento inteligente quedan bloqueados.
                    </div>
                )}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">IA visual</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                {sportsModeEnabled ? 'Procesa la galeria y detecta rostros y patrocinadores' : 'Procesa la galeria y detecta personas'}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-slate-500">
                                {supportsSponsorDetection
                                    ? 'Este evento puede usar reconocimiento facial y deteccion de patrocinadores segun el catalogo que elijas para la corrida.'
                                    : 'Este evento usa reconocimiento facial unicamente. La deteccion de patrocinadores queda oculta y bloqueada en este plan.'}
                            </p>
                        </div>
                        <Bot className="h-8 w-8 text-slate-300" />
                    </div>

                    <div className="mt-6 grid gap-4 xl:grid-cols-4">
                        <CapabilityCard icon={ScanFace} eyebrow="Identidad" title="Rostros" description="Entrena referencias base para reconocer personas conocidas en la galeria." />
                        <CapabilityCard icon={Camera} eyebrow="Plan" title={supportsSponsorDetection ? 'Patrocinadores activos' : 'Patrocinadores bloqueados'} description={supportsSponsorDetection ? 'La corrida IA solo analizara los patrocinadores seleccionados para este evento.' : 'Starter y Basic ocultan por completo la seleccion y busqueda de patrocinadores.'} />
                        <CapabilityCard icon={WandSparkles} eyebrow="Cuota" title="Procesamiento mensual" description={capabilities.photos_per_month_limit ? `${capabilities.remaining_photo_quota ?? 0} de ${capabilities.photos_per_month_limit} fotos disponibles este mes.` : 'Sin cuota de fotos configurada en este tenant.'} />
                        <CapabilityCard icon={UserRound} eyebrow="Evento" title="Seleccion actual" description={supportsSponsorDetection ? `${selectedSponsors.length} patrocinadores elegidos para este evento.` : 'No aplica para este plan.'} />
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-4">
                            <label className="flex items-center justify-between rounded-[1.6rem] border border-[#e6e0d5] bg-[#fbf9f6] px-5 py-5 text-sm text-slate-700">
                                <div>
                                    <span className="block font-semibold">Activar IA para la galeria</span>
                                    <span className="mt-1 block text-xs text-slate-500">
                                        {supportsFaceRecognition
                                            ? 'Habilita el procesamiento automatico antes de enviar fotos a la cola IA.'
                                            : 'El plan actual no permite activar la IA en esta galeria.'}
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={faceRecognitionEnabled}
                                    onChange={(event) => setFaceRecognitionEnabled(event.target.checked)}
                                    disabled={!supportsFaceRecognition}
                                    className="h-5 w-5 rounded border-slate-300 text-primary-600"
                                />
                            </label>

                            {supportsSponsorDetection && (
                                <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Patrocinadores del evento</p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">Selecciona solo los que aplican a esta corrida</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                {sponsorSelectionLimit ? `Maximo ${sponsorSelectionLimit} patrocinadores por evento.` : 'Este plan permite patrocinadores ilimitados, pero debes elegirlos explicitamente.'}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-[#e6e0d5] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                            {selectedSponsors.length}{sponsorSelectionLimit ? ` / ${sponsorSelectionLimit}` : ''}
                                        </span>
                                    </div>

                                    {requiresExplicitSponsors && selectedSponsors.length === 0 && (
                                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                            Este plan requiere elegir al menos un patrocinador antes de ejecutar la IA del evento.
                                        </div>
                                    )}

                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {sponsorCatalog.length > 0 ? sponsorCatalog.map((sponsor) => {
                                            const selected = selectedSponsors.includes(sponsor);
                                            const disabled = !selected && sponsorSelectionLimit !== null && sponsorSelectionLimit !== undefined && selectedSponsors.length >= sponsorSelectionLimit;

                                            return (
                                                <button
                                                    key={sponsor}
                                                    type="button"
                                                    onClick={() => toggleSponsor(sponsor)}
                                                    disabled={disabled}
                                                    className={clsx(
                                                        'rounded-full border px-4 py-2 text-xs font-semibold transition',
                                                        selected
                                                            ? 'border-[#171411] bg-[#171411] text-white'
                                                            : disabled
                                                                ? 'cursor-not-allowed border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                                : 'border-[#ddd5c9] bg-white text-slate-700 hover:bg-slate-50'
                                                    )}
                                                >
                                                    {sponsor}
                                                </button>
                                            );
                                        }) : (
                                            <div className="rounded-2xl border border-dashed border-[#ddd5c9] px-4 py-6 text-sm text-slate-400">
                                                Aun no hay patrocinadores cargados en la biblioteca IA del tenant.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={createIdentity} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5 space-y-3">
                                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">Base de personas</p>
                                <input
                                    type="text"
                                    value={identityForm.data.name}
                                    onChange={(event) => identityForm.setData('name', event.target.value)}
                                    placeholder="Nombre de la persona (Ej. Maria, Carlos, Sofia)"
                                    className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => identityForm.setData('reference_image', event.target.files?.[0] || null)}
                                    className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={identityForm.processing || !faceRecognitionEnabled || !faceRecognition?.service_configured || !supportsFaceRecognition}
                                    className={clsx(
                                        'w-full rounded-2xl px-4 py-3 text-sm font-semibold',
                                        identityForm.processing || !faceRecognitionEnabled || !faceRecognition?.service_configured || !supportsFaceRecognition
                                            ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                            : 'border border-[#171411] bg-[#171411] text-white'
                                    )}
                                >
                                    {identityForm.processing ? 'Registrando...' : 'Agregar persona'}
                                </button>
                            </form>

                            <div className="space-y-3">
                                {(faceRecognition?.identities || []).length > 0 ? faceRecognition.identities.map((identity) => (
                                    <div key={identity.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3">
                                        <div className="min-w-0 flex items-center gap-3">
                                            {identity.path_reference ? (
                                                <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200">
                                                    <img src={'/storage/' + identity.path_reference} className="h-full w-full object-cover" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                                                </div>
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                                    <UserRound className="h-4 w-4 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{identity.name}</p>
                                                <p className={`mt-0.5 text-[11px] ${identity.processing_status === 'error' ? 'text-rose-500' : 'text-slate-500'}`}>
                                                    {identity.processing_status === 'ready' ? 'Entrenado' : identity.processing_status === 'queued' ? 'Procesando...' : identity.processing_status === 'error' ? 'Error al entrenar' : 'Pendiente'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm(`Eliminar a ${identity.name} de esta galeria?`)) {
                                                    router.post(`/admin/projects/${project.id}/face-identities/${identity.id}`, { _method: 'delete' }, { preserveScroll: true });
                                                }
                                            }}
                                            className="rounded-full border border-[#e6e0d5] p-2 text-slate-500 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="rounded-2xl border border-dashed border-[#ddd5c9] px-4 py-8 text-center text-sm text-slate-400">
                                        Todavia no hay personas registradas para reconocer en esta galeria.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-6 lg:p-8">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Estado del escaneo</p>

                            {!faceRecognition?.service_configured && (
                                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                                    Motor IA no configurado. Faltan variables de Redis o de colas.
                                </div>
                            )}

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fotos analizadas</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{processedPhotos}</p>
                                </div>
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Personas halladas</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{recognitionSummary.people_detected_total || 0}</p>
                                </div>
                                {supportsSponsorDetection && (
                                    <div className="rounded-2xl border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm sm:col-span-2">
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Patrocinadores detectados</p>
                                        <p className="mt-2 text-3xl font-semibold text-slate-900">{recognitionSummary.sponsors_detected_total || 0}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pendientes</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{recognitionSummary.photos_pending || 0}</p>
                                </div>
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sin rostro</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{recognitionSummary.photos_without_face || 0}</p>
                                </div>
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fallidas</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{recognitionSummary.photos_with_errors || 0}</p>
                                </div>
                            </div>

                            <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#171411] via-[#7c5d45] to-[#d1a673] transition-all duration-1000"
                                    style={{
                                        width: `${Math.max(0, Math.min(100, (processedPhotos / Math.max(1, (project.photos || []).length)) * 100))}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-3 text-sm font-medium text-slate-500">
                                {`Progreso visual: ${processedPhotos} de ${(project.photos || []).length} fotos ya pasaron por la canalizacion IA.`}
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => router.post(`/admin/projects/${project.id}/recognition/run`, {}, { preserveScroll: true })}
                                    disabled={!canUseRecognition}
                                    className={clsx(
                                        'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold',
                                        !canUseRecognition
                                            ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                            : 'bg-[#171411] text-white shadow-md transition hover:-translate-y-0.5'
                                    )}
                                >
                                    <WandSparkles className="h-4 w-4" />
                                    Procesar galeria
                                </button>

                                <button
                                    type="button"
                                    onClick={saveMeta}
                                    className="flex-1 rounded-2xl border border-[#ddd5c9] bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Guardar preferencias
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

function CapabilityCard({ icon: Icon, eyebrow, title, description }) {
    return (
        <div className="rounded-[1.5rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6e0d5] bg-white text-slate-700">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
    );
}

