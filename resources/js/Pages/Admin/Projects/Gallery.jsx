import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { Bot, ChevronLeft, CheckCircle2, Globe2, Sparkles, Trash2, UploadCloud, UserRound, X, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { usePhotoUploader } from '@/hooks/usePhotoUploader';

export default function Gallery({ project, faceRecognition }) {
    const peopleCountOptions = ['0 personas', '1 persona', '2 personas', '3 personas', '4 o mas personas'];
    const { flash } = usePage().props;
    const fileInputRef = React.useRef(null);
    const { state: upload, upload: startUpload } = usePhotoUploader({
        uploadUrl: `/admin/projects/${project.id}/photos`,
        batchSize: 1,
        reloadOnly: ['project'],
    });
    const [heroPhotoId, setHeroPhotoId] = React.useState(project.hero_photo_id || project.photos?.[0]?.id || null);
    const canUpload = !!project.permissions?.can_upload;
    const canManageGallery = !!project.permissions?.can_manage_gallery;
    const recognitionSummary = faceRecognition?.summary || {};
    const recognitionConfigured = !!faceRecognition?.service_configured;
    const recognitionReady = !!project.face_recognition_enabled && recognitionConfigured && !!faceRecognition?.database_ready;
    const analyzedPhotos = recognitionSummary.photos_processed || 0;
    const totalPhotos = (project.photos || []).length;
    const processedPercentage = Math.max(0, Math.min(100, totalPhotos > 0 ? (analyzedPhotos / totalPhotos) * 100 : 0));
    const sportsModeEnabled = !!faceRecognition?.sports_mode_enabled;
    const supportsSponsorDetection = !!project?.plan_capabilities?.supports_sponsor_detection;

    const buildPhotoState = React.useCallback((photos) => (
        Object.fromEntries((photos || []).map((photo) => [
            photo.id,
            {
                tags: (photo.tags || []).join(', '),
                people_tags: (photo.people_tags || []).join(', '),
                brand_tags: (photo.brand_tags || []).join(', '),
                jersey_numbers: (photo.jersey_numbers || []).join(', '),
                sponsor_tags: (photo.sponsor_tags || []).join(', '),
                context_tags: (photo.context_tags || []).join(', '),
                action_tags: (photo.action_tags || []).join(', '),
                people_count_label: photo.people_count_label || '',
                show_on_website: !!photo.show_on_website,
            },
        ]))
    ), []);
    
    const [photoState, setPhotoState] = React.useState(buildPhotoState(project.photos || []));

    React.useEffect(() => {
        setPhotoState(buildPhotoState(project.photos || []));
    }, [project.photos, buildPhotoState]);

    const savePhoto = (photoId, nextState) => {
        const next = { ...(photoState[photoId] || {}), ...nextState };
        setPhotoState((current) => ({ ...current, [photoId]: next }));
        const tags = (next.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        const peopleTags = (next.people_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        const brandTags = (next.brand_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        const jerseyNumbers = (next.jersey_numbers || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        const sponsorTags = supportsSponsorDetection ? (next.sponsor_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean) : [];
        const contextTags = (next.context_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        const actionTags = (next.action_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

        router.put(`/admin/projects/${project.id}/photos/${photoId}`, {
            category: tags[0] || 'General',
            tags,
            people_tags: peopleTags,
            brand_tags: brandTags,
            jersey_numbers: jerseyNumbers,
            sponsor_tags: sponsorTags,
            context_tags: contextTags,
            action_tags: actionTags,
            people_count_label: next.people_count_label || null,
            show_on_website: next.show_on_website,
        }, { preserveScroll: true, preserveState: true });
    };

    const [taggingFace, setTaggingFace] = React.useState(null); // { photoId, detectionId }
    const [tagName, setTagName] = React.useState('');

    const handleTagFace = (detectionId, photoId) => {
        const name = tagName.trim();
        if (!name) return;
        const current = photoState[photoId]?.people_tags || '';
        const names = current.split(',').map((t) => t.trim()).filter(Boolean);
        if (!names.includes(name)) names.push(name);
        setPhotoState((prev) => ({ ...prev, [photoId]: { ...prev[photoId], people_tags: names.join(', ') } }));
        setTaggingFace(null);
        setTagName('');
        router.post(`/admin/face-detection/unknowns/${detectionId}/name`, { name }, { preserveScroll: true });
    };

    const [isDragging, setIsDragging] = React.useState(false);
    const dragCounter = React.useRef(0);

    const uploadPhotos = (files) => {
        if (!files?.length) return;
        if (fileInputRef.current) fileInputRef.current.value = '';
        startUpload(files);
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragging(false);
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        if (!canUpload) return;
        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        if (files.length) uploadPhotos(files);
    };

    return (
        <AdminLayout>
            <Head title={`Fotos y Media: ${project.name}`} />

            <div className="space-y-8">
                <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a colecciones
                </Link>

                <ProjectWorkspaceNav project={project} current="gallery" />

                {(flash?.success || flash?.error) && (
                    <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                <section
                    className={clsx('rounded-[2rem] border bg-white p-7 shadow-sm transition-colors duration-150', isDragging ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-300' : 'border-[#e6e0d5]')}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e0d5] pb-6">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Media</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Archivos del Proyecto</h2>
                            <p className="mt-2 text-sm text-slate-500">Sube las fotos en alta resolucion. El sistema comprimira miniaturas automaticamente para la web.</p>
                        </div>
                        {canUpload && (
                        <button onClick={() => fileInputRef.current?.click()} className="rounded-2xl bg-[#171411] px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5">
                            Agregar multimedia
                        </button>
                        )}
                    </div>

                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(event) => uploadPhotos(event.target.files)} className="hidden" />

                    {canManageGallery && (
                        <div className="mt-8 rounded-[1.7rem] border border-[#e6e0d5] bg-[#fbf9f6] p-5 lg:p-6">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="max-w-3xl">
                                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6e0d5] bg-white text-slate-700">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Procesamiento inteligente</p>
                                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Procesar galeria</h3>
                                    <p className="mt-2 text-sm leading-7 text-slate-500">
                                        {sportsModeEnabled
                                            ? 'El sistema analiza la galeria completa y detecta rostros, dorsales, marcas, sponsors, contexto y acciones automaticamente. No necesitas llenar esos campos foto por foto.'
                                            : 'El sistema analiza la galeria completa y detecta personas automaticamente. No necesitas editar cada archivo para iniciar el proceso.'}
                                    </p>
                                </div>

                                <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[280px]">
                                    <button
                                        type="button"
                                        onClick={() => router.post(`/admin/projects/${project.id}/recognition/run`, {}, { preserveScroll: true })}
                                        disabled={!recognitionReady || totalPhotos === 0}
                                        className={clsx(
                                            'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold',
                                            !recognitionReady || totalPhotos === 0
                                                ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                : 'bg-[#171411] text-white shadow-md transition hover:-translate-y-0.5'
                                        )}
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Procesar galeria
                                    </button>
                                    <Link
                                        href={`/admin/projects/${project.id}/ai`}
                                        className="inline-flex items-center justify-center rounded-2xl border border-[#ddd5c9] bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Abrir configuracion
                                    </Link>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Fotos</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{totalPhotos}</p>
                                </div>
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Analizadas</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-900">{analyzedPhotos}</p>
                                </div>
                                <div className={`rounded-2xl border px-4 py-4 ${(recognitionSummary.photos_queued_or_stuck || 0) > 0 ? 'border-amber-200 bg-amber-50' : 'border-[#e6e0d5] bg-white'}`}>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Sin procesar</p>
                                    <p className={`mt-1 text-2xl font-semibold ${(recognitionSummary.photos_queued_or_stuck || 0) > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{recognitionSummary.photos_pending || 0}</p>
                                    {(recognitionSummary.photos_queued_or_stuck || 0) > 0 && (
                                        <p className="mt-1 text-[11px] text-amber-600">{recognitionSummary.photos_queued_or_stuck} en cola â€” vuelve a procesar si no avanza</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#171411] via-[#7c5d45] to-[#d1a673] transition-all duration-1000"
                                    style={{ width: `${processedPercentage}%` }}
                                />
                            </div>

                            <p className="mt-3 text-sm text-slate-500">
                                {!project.face_recognition_enabled
                                    ? 'Primero activa la IA de esta galeria en la configuracion.'
                                    : !recognitionConfigured
                                        ? 'El motor IA no esta configurado todavia.'
                                        : !faceRecognition?.database_ready
                                            ? 'Agrega al menos una persona de referencia para comenzar.'
                                            : totalPhotos === 0
                                                ? 'Sube fotos para poder procesar la galeria.'
                                                : `Llevas ${analyzedPhotos} de ${totalPhotos} fotos procesadas.`}
                            </p>
                        </div>
                    )}

                    <div className="mt-8">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {(project.photos || []).length > 0 ? project.photos.map((photo) => (
                                <article key={photo.id} className="overflow-hidden rounded-[1.5rem] border border-[#ece5d8] bg-white shadow-sm transition hover:shadow-md">
                                    <div className="relative group">
                                        <img src={photo.thumbnail_url || photo.url} alt="" className="h-48 w-full object-cover" />

                                        {canManageGallery && (photo.face_detections || []).map((det) => {
                                            if (!det.bbox) return null;
                                            const [x1, y1, x2, y2] = det.bbox;
                                            const isActive = taggingFace?.detectionId === det.id;
                                            return (
                                                <button
                                                    key={det.id}
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setTaggingFace({ photoId: photo.id, detectionId: det.id }); setTagName(''); }}
                                                    style={{ left: `${x1 * 100}%`, top: `${y1 * 100}%`, width: `${(x2 - x1) * 100}%`, height: `${(y2 - y1) * 100}%` }}
                                                    className={clsx('absolute border-2 transition-colors', isActive ? 'border-amber-400' : 'border-amber-300 hover:border-amber-400')}
                                                    title="Etiquetar persona"
                                                >
                                                    <span className="absolute -top-5 left-0 flex items-center gap-0.5 rounded bg-amber-400 px-1 py-0.5 text-[10px] font-semibold text-white shadow">
                                                        <UserRound className="h-2.5 w-2.5" />?
                                                    </span>
                                                </button>
                                            );
                                        })}

                                        {taggingFace?.photoId === photo.id && (
                                            <div className="absolute inset-x-0 bottom-0 z-10 bg-white/97 backdrop-blur-sm p-3 shadow-lg">
                                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600">Etiquetar rostro</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        autoFocus
                                                        value={tagName}
                                                        onChange={(e) => setTagName(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleTagFace(taggingFace.detectionId, photo.id); if (e.key === 'Escape') { setTaggingFace(null); setTagName(''); } }}
                                                        placeholder={sportsModeEnabled ? 'Jugador...' : 'Nombre...'}
                                                        className="flex-1 rounded-lg border border-[#e6e0d5] bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-amber-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTagFace(taggingFace.detectionId, photo.id)}
                                                        disabled={!tagName.trim()}
                                                        className="rounded-lg bg-[#171411] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                                                    >
                                                        OK
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setTaggingFace(null); setTagName(''); }}
                                                        className="flex items-center justify-center rounded-lg border border-[#e6e0d5] px-2 text-slate-400 hover:text-slate-700"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {canManageGallery && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button type="button" onClick={() => { setHeroPhotoId(photo.id); router.put(`/admin/projects/${project.id}`, { hero_photo_id: photo.id }, { preserveScroll: true, preserveState: true }); }} className={clsx('rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm', heroPhotoId === photo.id ? 'bg-[#171411] text-white border border-[#171411]' : 'border border-white/40 bg-white/30 text-white')}>
                                                {heroPhotoId === photo.id ? 'Portada de Galeria' : 'Hacer Portada'}
                                            </button>
                                        </div>}
                                        {canManageGallery && <button type="button" onClick={() => { if (window.confirm('Eliminar esta foto del proyecto y del bucket?')) router.delete(`/admin/projects/${project.id}/photos/${photo.id}`, { preserveScroll: true }); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm transition hover:bg-white hover:text-rose-600">
                                            <Trash2 className="h-4 w-4" />
                                        </button>}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {canManageGallery && <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Etiquetas (Opcional)</label>
                                            <input value={photoState[photo.id]?.tags || ''} onChange={(event) => savePhoto(photo.id, { tags: event.target.value })} placeholder="Boda, Pareja, Fiesta..." className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white" />
                                        </div>}
                                        {canManageGallery && (
                                            <div className="grid gap-3">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{sportsModeEnabled ? 'Jugador / Persona' : 'Persona'}</label>
                                                        {(photo.face_detections || []).length > 0 && (
                                                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                                <UserRound className="h-2.5 w-2.5" />
                                                                {(photo.face_detections || []).length} rostro{(photo.face_detections || []).length > 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <input
                                                        value={photoState[photo.id]?.people_tags || ''}
                                                        onChange={(event) => savePhoto(photo.id, { people_tags: event.target.value })}
                                                        placeholder={sportsModeEnabled ? 'Jeremy, Maria, Carlos...' : 'Maria, Carlos, Sofia...'}
                                                        className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Cantidad de personas</label>
                                                    <select
                                                        value={photoState[photo.id]?.people_count_label || ''}
                                                        onChange={(event) => savePhoto(photo.id, { people_count_label: event.target.value })}
                                                        className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                                                    >
                                                        <option value="">Sin definir</option>
                                                        {peopleCountOptions.map((option) => (
                                                            <option key={option} value={option}>{option}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Marca</label>
                                                    <input
                                                        value={photoState[photo.id]?.brand_tags || ''}
                                                        onChange={(event) => savePhoto(photo.id, { brand_tags: event.target.value })}
                                                        placeholder="Nike, Adidas, Puma..."
                                                        className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Dorsal</label>
                                                    <input
                                                        value={photoState[photo.id]?.jersey_numbers || ''}
                                                        onChange={(event) => savePhoto(photo.id, { jersey_numbers: event.target.value })}
                                                        placeholder="10, 7, 21..."
                                                        className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                                                    />
                                                </div>
                                                {supportsSponsorDetection && (
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Sponsor</label>
                                                        <input
                                                            value={photoState[photo.id]?.sponsor_tags || ''}
                                                            onChange={(event) => savePhoto(photo.id, { sponsor_tags: event.target.value })}
                                                            placeholder="Patrocinador principal..."
                                                            className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                                                        />
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Contexto</label>
                                                    <input
                                                        value={photoState[photo.id]?.context_tags || ''}
                                                        onChange={(event) => savePhoto(photo.id, { context_tags: event.target.value })}
                                                        placeholder="Balon, porteria, arbitro..."
                                                        className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Acciones</label>
                                                    <input
                                                        value={photoState[photo.id]?.action_tags || ''}
                                                        onChange={(event) => savePhoto(photo.id, { action_tags: event.target.value })}
                                                        placeholder="Gol, remate, celebracion..."
                                                        className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {canManageGallery && <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e6e0d5] bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition">
                                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><Globe2 className="h-3.5 w-3.5 text-primary-500" />Mostrar en Web</span>
                                            <input type="checkbox" checked={!!photoState[photo.id]?.show_on_website} onChange={(event) => savePhoto(photo.id, { show_on_website: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                        </label>}
                                    </div>
                                </article>
                            )) : (
                                <div className={clsx('rounded-[1.8rem] border border-dashed px-6 py-20 text-center col-span-full transition-colors duration-150', isDragging ? 'border-slate-400 bg-white' : 'border-[#ddd5c9] bg-slate-50')}>
                                    <UploadCloud className={clsx('mx-auto h-12 w-12 mb-4 transition-colors', isDragging ? 'text-slate-600' : 'text-slate-300')} />
                                    <h3 className="text-xl font-semibold text-slate-900">{isDragging ? 'Suelta las fotos aqui' : 'Tu coleccion esta vacia'}</h3>
                                    <p className="mt-2 text-sm text-slate-500">{isDragging ? 'Se subiran automaticamente al soltar' : 'Arrastra fotos aqui o busca en tu computadora.'}</p>
                                    {canUpload && !isDragging && <button onClick={() => fileInputRef.current?.click()} className="mt-6 rounded-2xl border border-[#ddd5c9] bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                                        Seleccionar Archivos
                                    </button>}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <AnimatePresence>
                {(upload.isUploading || upload.isDone) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                        <div className="w-[420px] rounded-[2rem] bg-white p-10 shadow-2xl">
                            <div className="flex flex-col items-center text-center">
                                {upload.isDone && upload.failedFiles === 0 ? (
                                    <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
                                ) : upload.isDone ? (
                                    <XCircle className="mb-4 h-14 w-14 text-rose-500" />
                                ) : (
                                    <UploadCloud className="mb-4 h-14 w-14 animate-pulse text-slate-700" />
                                )}
                                <h2 className="text-xl font-semibold text-slate-900">
                                    {upload.isDone ? (upload.failedFiles === 0 ? 'Subida completa' : 'Subida con errores') : 'Subiendo fotos'}
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">{upload.statusMessage}</p>
                            </div>

                            {upload.isUploading && (
                                <div className="mt-6 space-y-3">
                                    <div>
                                        <div className="mb-1 flex justify-between text-xs text-slate-400">
                                            <span>Progreso general</span>
                                            <span className="font-semibold text-slate-600">{upload.uploadedFiles} / {upload.totalFiles} fotos</span>
                                        </div>
                                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                            <motion.div
                                                className="h-full rounded-full bg-slate-800"
                                                animate={{ width: upload.totalFiles > 0 ? `${Math.round((upload.uploadedFiles / upload.totalFiles) * 100)}%` : '0%' }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    </div>
                                    {upload.totalBatches > 1 && (
                                        <div>
                                            <div className="mb-1 flex justify-between text-xs text-slate-400">
                                                <span>Lote actual {upload.currentBatch} de {upload.totalBatches}</span>
                                                <span className="font-semibold text-slate-600">{upload.batchProgress}%</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                                <motion.div
                                                    className="h-full rounded-full bg-slate-400"
                                                    animate={{ width: `${upload.batchProgress}%` }}
                                                    transition={{ duration: 0.1 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {upload.isDone && upload.errors.length > 0 && (
                                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 space-y-1">
                                    {upload.errors.map((e, i) => <p key={i}>{e}</p>)}
                                </div>
                            )}

                            {!upload.isUploading && (
                                <p className="mt-4 text-center text-xs text-slate-400">Actualizando galeria...</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}


