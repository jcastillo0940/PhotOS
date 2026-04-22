import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { Bot, ChevronLeft, ChevronRight, CheckCircle2, Crosshair, Globe2, Loader2, Sparkles, Trash2, UploadCloud, UserRound, X, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { usePhotoUploader } from '@/hooks/usePhotoUploader';

const PEOPLE_COUNT_OPTIONS = ['0 personas', '1 persona', '2 personas', '3 personas', '4 o mas personas'];

const TagFields = React.memo(function TagFields({
    photo, photoId, dark = false, photoValues, savePhoto,
    sportsModeEnabled, supportsSponsorDetection,
    isAnalyzing, analyzeWithGemini, canManageGallery,
}) {
    const wasAnalyzedWithGemini = !!(photo?.gemini_request_id || photo?.gemini_total_tokens || photo?.gemini_tokens);
    const inputCls = dark
        ? 'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-400 focus:bg-white/10'
        : 'w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white';
    const labelCls = `text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? 'text-slate-400' : 'text-slate-400'}`;
    return (
        <div className="grid gap-3">
            {sportsModeEnabled && canManageGallery && (
                <button
                    type="button"
                    onClick={() => analyzeWithGemini(photo || { id: photoId })}
                    disabled={isAnalyzing}
                    className={clsx(
                        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition',
                        dark
                            ? 'border border-white/10 bg-white/5 text-amber-300 hover:bg-white/10 disabled:opacity-40'
                            : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40',
                    )}
                >
                    {isAnalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isAnalyzing ? 'Analizando...' : wasAnalyzedWithGemini ? 'Reanalizar con Gemini' : 'Analizar con Gemini'}
                </button>
            )}
            <div className="flex flex-col gap-2">
                <label className={labelCls}>Etiquetas</label>
                <input value={photoValues?.tags || ''} onChange={(e) => savePhoto(photoId, { tags: e.target.value })} placeholder="Boda, Pareja, Fiesta..." className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
                <label className={labelCls}>{sportsModeEnabled ? 'Jugador / Persona' : 'Persona'}</label>
                <input value={photoValues?.people_tags || ''} onChange={(e) => savePhoto(photoId, { people_tags: e.target.value })} placeholder={sportsModeEnabled ? 'Jeremy, Maria...' : 'Maria, Carlos...'} className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
                <label className={labelCls}>Cantidad de personas</label>
                <select value={photoValues?.people_count_label || ''} onChange={(e) => savePhoto(photoId, { people_count_label: e.target.value })} className={inputCls}>
                    <option value="">Sin definir</option>
                    {PEOPLE_COUNT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-2">
                <label className={labelCls}>Marca</label>
                <input value={photoValues?.brand_tags || ''} onChange={(e) => savePhoto(photoId, { brand_tags: e.target.value })} placeholder="Nike, Adidas..." className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
                <label className={labelCls}>Dorsal</label>
                <input value={photoValues?.jersey_numbers || ''} onChange={(e) => savePhoto(photoId, { jersey_numbers: e.target.value })} placeholder="10, 7, 21..." className={inputCls} />
            </div>
            {supportsSponsorDetection && (
                <div className="flex flex-col gap-2">
                    <label className={labelCls}>Sponsor</label>
                    <input value={photoValues?.sponsor_tags || ''} onChange={(e) => savePhoto(photoId, { sponsor_tags: e.target.value })} placeholder="Patrocinador..." className={inputCls} />
                </div>
            )}
            <div className="flex flex-col gap-2">
                <label className={labelCls}>Contexto</label>
                <input value={photoValues?.context_tags || ''} onChange={(e) => savePhoto(photoId, { context_tags: e.target.value })} placeholder="Balon, porteria..." className={inputCls} />
            </div>
            <div className="flex flex-col gap-2">
                <label className={labelCls}>Acciones</label>
                <input value={photoValues?.action_tags || ''} onChange={(e) => savePhoto(photoId, { action_tags: e.target.value })} placeholder="Gol, remate..." className={inputCls} />
            </div>
            <label className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition ${dark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-[#e6e0d5] bg-slate-50 hover:bg-slate-100'}`}>
                <span className={`inline-flex items-center gap-2 text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-700'}`}><Globe2 className="h-3.5 w-3.5" />Mostrar en Web</span>
                <input type="checkbox" checked={!!photoValues?.show_on_website} onChange={(e) => savePhoto(photoId, { show_on_website: e.target.checked })} className="h-4 w-4 rounded border-slate-300" />
            </label>
        </div>
    );
});

export default function Gallery({ project, faceRecognition }) {
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
    const pendingEditsRef = React.useRef({});
    const saveTimersRef = React.useRef({});

    React.useEffect(() => {
        setPhotoState((current) => {
            const base = buildPhotoState(project.photos || []);
            const pending = pendingEditsRef.current;
            if (Object.keys(pending).length === 0) return base;
            return { ...base, ...pending };
        });
    }, [project.photos, buildPhotoState]);

    const savePhoto = React.useCallback((photoId, nextState) => {
        const next = { ...(photoState[photoId] || {}), ...nextState };
        setPhotoState((current) => ({ ...current, [photoId]: next }));
        pendingEditsRef.current[photoId] = next;

        if (saveTimersRef.current[photoId]) clearTimeout(saveTimersRef.current[photoId]);

        saveTimersRef.current[photoId] = setTimeout(() => {
            const state = pendingEditsRef.current[photoId];
            if (!state) return;
            delete pendingEditsRef.current[photoId];

            const tags = (state.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
            const peopleTags = (state.people_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
            const brandTags = (state.brand_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
            const jerseyNumbers = (state.jersey_numbers || '').split(',').map((tag) => tag.trim()).filter(Boolean);
            const sponsorTags = supportsSponsorDetection ? (state.sponsor_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean) : [];
            const contextTags = (state.context_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
            const actionTags = (state.action_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

            router.put(`/admin/projects/${project.id}/photos/${photoId}`, {
                category: tags[0] || 'General',
                tags,
                people_tags: peopleTags,
                brand_tags: brandTags,
                jersey_numbers: jerseyNumbers,
                sponsor_tags: sponsorTags,
                context_tags: contextTags,
                action_tags: actionTags,
                people_count_label: state.people_count_label || null,
                show_on_website: state.show_on_website,
            }, { preserveScroll: true, preserveState: true });
        }, 700);
    }, [photoState, project.id, supportsSponsorDetection]);

    // ── Face tagging state ────────────────────────────────────────────────────
    const [taggingFace, setTaggingFace] = React.useState(null); // { photoId, detectionId }
    const [tagName, setTagName] = React.useState('');
    const [tagSearchOpen, setTagSearchOpen] = React.useState(false);
    const [tagHighlight, setTagHighlight] = React.useState(0);

    // ── Manual face draw state ────────────────────────────────────────────────
    const [manualDrawMode, setManualDrawMode] = React.useState(false);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [drawStart, setDrawStart] = React.useState(null);
    const [drawEnd, setDrawEnd] = React.useState(null);
    const [manualBox, setManualBox] = React.useState(null);
    const [manualTagName, setManualTagName] = React.useState('');
    const [manualTagSearchOpen, setManualTagSearchOpen] = React.useState(false);
    const [manualTagHighlight, setManualTagHighlight] = React.useState(0);
    const imageContainerRef = React.useRef(null);
    const drawStartRef = React.useRef(null);

    const identities = faceRecognition?.identities || [];

    const tagMatches = React.useMemo(() => {
        const q = tagName.trim().toLowerCase();
        const filtered = q ? identities.filter((i) => i.name.toLowerCase().includes(q)) : identities;
        const limited = filtered.slice(0, 8);
        // disambiguate duplicate names by appending short ID suffix
        const nameCounts = {};
        limited.forEach((i) => { nameCounts[i.name] = (nameCounts[i.name] || 0) + 1; });
        return limited.map((i) => ({
            ...i,
            displayName: nameCounts[i.name] > 1 ? `${i.name} · #${String(i.id).slice(-4)}` : i.name,
        }));
    }, [tagName, identities]);

    const tagExactMatch = tagName.trim() && identities.some((i) => i.name.toLowerCase() === tagName.trim().toLowerCase());

    const applyTag = (name, photoId, detectionId, identityId) => {
        const current = photoState[photoId]?.people_tags || '';
        const names = current.split(',').map((t) => t.trim()).filter(Boolean);
        if (!names.includes(name)) names.push(name);
        setPhotoState((prev) => ({ ...prev, [photoId]: { ...prev[photoId], people_tags: names.join(', ') } }));
        setTaggingFace(null);
        setTagName('');
        setTagSearchOpen(false);
        if (identityId) {
            router.post(`/admin/face-detection/unknowns/${detectionId}/confirm`, { face_identity_id: identityId }, { preserveScroll: true });
        } else {
            router.post(`/admin/face-detection/unknowns/${detectionId}/name`, { name }, { preserveScroll: true });
        }
    };

    const handleTagFace = (detectionId, photoId) => {
        const name = tagName.trim();
        if (!name) return;
        const exact = identities.find((i) => i.name.toLowerCase() === name.toLowerCase());
        applyTag(exact?.name || name, photoId, detectionId, exact?.id || null);
    };

    const handleTagKeyDown = (e, detectionId, photoId) => {
        const options = [...tagMatches, ...(tagName.trim() && !tagExactMatch ? ['__new__'] : [])];
        if (e.key === 'ArrowDown') { e.preventDefault(); setTagHighlight((h) => Math.min(h + 1, options.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setTagHighlight((h) => Math.max(h - 1, 0)); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const sel = options[tagHighlight];
            if (!sel) { handleTagFace(detectionId, photoId); return; }
            if (sel === '__new__') { handleTagFace(detectionId, photoId); }
            else { applyTag(sel.name, photoId, detectionId, sel.id); }
        } else if (e.key === 'Escape') { setTaggingFace(null); setTagName(''); setTagSearchOpen(false); }
    };

    // ── Manual face draw handlers ─────────────────────────────────────────────
    const handleDrawStart = (e) => {
        if (e.button !== 0 || !imageContainerRef.current) return;
        e.preventDefault();
        const rect = imageContainerRef.current.getBoundingClientRect();
        const pos = {
            x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
        };
        drawStartRef.current = pos;
        setDrawStart(pos);
        setDrawEnd(pos);
        setIsDrawing(true);
        setManualBox(null);
        setManualTagName('');
        setManualTagSearchOpen(false);
    };

    React.useEffect(() => {
        if (!isDrawing || !imageContainerRef.current) return;
        const move = (e) => {
            if (!imageContainerRef.current) return;
            const rect = imageContainerRef.current.getBoundingClientRect();
            setDrawEnd({
                x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
                y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
            });
        };
        const up = (e) => {
            if (!imageContainerRef.current) return;
            const rect = imageContainerRef.current.getBoundingClientRect();
            const end = {
                x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
                y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
            };
            const start = drawStartRef.current;
            setIsDrawing(false);
            setDrawStart(null);
            setDrawEnd(null);
            if (start) {
                const x1 = Math.min(start.x, end.x);
                const y1 = Math.min(start.y, end.y);
                const x2 = Math.max(start.x, end.x);
                const y2 = Math.max(start.y, end.y);
                if ((x2 - x1) > 0.02 && (y2 - y1) > 0.02) {
                    setManualBox({ x1, y1, x2, y2 });
                }
            }
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    }, [isDrawing]);

    const submitManualFace = (name, identityId) => {
        if (!manualBox || !lightboxPhoto) return;
        const bbox = [manualBox.x1, manualBox.y1, manualBox.x2, manualBox.y2];
        const displayName = identityId ? identities.find((i) => i.id === identityId)?.name || name : name;
        const current = photoState[lightboxPhoto.id]?.people_tags || '';
        const names = current.split(',').map((t) => t.trim()).filter(Boolean);
        if (!names.includes(displayName)) names.push(displayName);
        setPhotoState((prev) => ({ ...prev, [lightboxPhoto.id]: { ...prev[lightboxPhoto.id], people_tags: names.join(', ') } }));
        setManualBox(null);
        setManualDrawMode(false);
        setManualTagName('');
        setManualTagSearchOpen(false);
        router.post(`/admin/projects/${project.id}/photos/${lightboxPhoto.id}/manual-face`, {
            bbox,
            ...(identityId ? { identity_id: identityId } : { name: displayName }),
        }, { preserveScroll: true });
    };

    // ── Lightbox ──────────────────────────────────────────────────────────────
    const photos = project.photos || [];
    const [lightboxId, setLightboxId] = React.useState(null);
    const lightboxIdx = lightboxId != null ? photos.findIndex((p) => p.id === lightboxId) : -1;
    const lightboxPhoto = lightboxIdx >= 0 ? photos[lightboxIdx] : null;

    const openLightbox = (photoId) => {
        setTaggingFace(null);
        setTagName('');
        setTagSearchOpen(false);
        setLightboxId(photoId);
    };
    const closeLightbox = () => {
        setLightboxId(null);
        setTaggingFace(null);
        setTagName('');
        setTagSearchOpen(false);
        setManualDrawMode(false);
        setManualBox(null);
        setIsDrawing(false);
        setManualTagName('');
        setManualTagSearchOpen(false);
    };
    const lightboxPrev = () => {
        if (lightboxIdx > 0) { setLightboxId(photos[lightboxIdx - 1].id); setTaggingFace(null); setTagName(''); setTagSearchOpen(false); }
    };
    const lightboxNext = () => {
        if (lightboxIdx < photos.length - 1) { setLightboxId(photos[lightboxIdx + 1].id); setTaggingFace(null); setTagName(''); setTagSearchOpen(false); }
    };

    React.useEffect(() => {
        if (!lightboxPhoto) return;
        const onKey = (e) => {
            if (e.key === 'Escape') { if (taggingFace) { setTaggingFace(null); setTagName(''); setTagSearchOpen(false); } else closeLightbox(); }
            if (e.key === 'ArrowLeft' && !taggingFace) lightboxPrev();
            if (e.key === 'ArrowRight' && !taggingFace) lightboxNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [lightboxPhoto, lightboxIdx, taggingFace]);

    // ── Drag & drop ───────────────────────────────────────────────────────────
    const [isDragging, setIsDragging] = React.useState(false);
    const dragCounter = React.useRef(0);

    const uploadPhotos = (files) => {
        if (!files?.length) return;
        const selectedFiles = Array.from(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
        startUpload(selectedFiles);
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

    // ── Shared face-tag input (used in both grid and lightbox) ────────────────
    const FaceTagInput = ({ photoId, detectionId }) => (
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input
                    autoFocus
                    value={tagName}
                    onChange={(e) => { setTagName(e.target.value); setTagSearchOpen(true); setTagHighlight(0); }}
                    onFocus={() => setTagSearchOpen(true)}
                    onKeyDown={(e) => handleTagKeyDown(e, detectionId, photoId)}
                    placeholder={sportsModeEnabled ? 'Buscar jugador...' : 'Buscar persona...'}
                    className="w-full rounded-lg border border-[#e6e0d5] bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-amber-400"
                />
                {tagSearchOpen && (tagMatches.length > 0 || (tagName.trim() && !tagExactMatch)) && (
                    <ul className="absolute bottom-full left-0 right-0 mb-1 max-h-44 overflow-y-auto rounded-lg border border-[#e6e0d5] bg-white shadow-lg z-10">
                        {tagMatches.map((identity, idx) => (
                            <li key={identity.id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); applyTag(identity.name, photoId, detectionId, identity.id); }}
                                    className={`w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-amber-50 ${tagHighlight === idx ? 'bg-amber-50' : ''}`}
                                >
                                    {identity.displayName}
                                </button>
                            </li>
                        ))}
                        {tagName.trim() && !tagExactMatch && (
                            <li>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); handleTagFace(detectionId, photoId); }}
                                    className={`w-full px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 ${tagHighlight === tagMatches.length ? 'bg-amber-50' : ''}`}
                                >
                                    + Crear &ldquo;{tagName.trim()}&rdquo;
                                </button>
                            </li>
                        )}
                    </ul>
                )}
            </div>
            <button
                type="button"
                onClick={() => handleTagFace(detectionId, photoId)}
                disabled={!tagName.trim()}
                className="rounded-lg bg-[#171411] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
                OK
            </button>
            <button
                type="button"
                onClick={() => { setTaggingFace(null); setTagName(''); setTagSearchOpen(false); }}
                className="flex items-center justify-center rounded-lg border border-[#e6e0d5] px-2 text-slate-400 hover:text-slate-700"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );

    // ── Gemini per-photo analysis ─────────────────────────────────────────────
    const [geminiLoading, setGeminiLoading] = React.useState({});
    const geminiEnabled = !!faceRecognition?.gemini_enabled;

    const analyzeWithGemini = (photo) => {
        const photoId = photo.id;
        const wasAnalyzed = !!(photo.gemini_request_id || photo.gemini_total_tokens || photo.gemini_tokens);
        const force = wasAnalyzed
            ? window.confirm('Esta foto ya fue analizada con Gemini. Procesarla nuevamente volvera a gastar tokens. Deseas continuar?')
            : false;

        if (wasAnalyzed && !force) return;

        setGeminiLoading((prev) => ({ ...prev, [photoId]: true }));
        router.post(`/admin/projects/${project.id}/photos/${photoId}/gemini`, { force }, {
            preserveScroll: true,
            onFinish: () => setGeminiLoading((prev) => ({ ...prev, [photoId]: false })),
        });
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

                    <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => uploadPhotos(event.target.files)} className="sr-only" />

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
                                        <p className="mt-1 text-[11px] text-amber-600">{recognitionSummary.photos_queued_or_stuck} en cola — vuelve a procesar si no avanza</p>
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
                            {photos.length > 0 ? photos.map((photo) => (
                                <article key={photo.id} className="overflow-hidden rounded-[1.5rem] border border-[#ece5d8] bg-white shadow-sm transition hover:shadow-md">
                                    <div className="relative group">
                                        {/* thumbnail — click opens lightbox */}
                                        <button type="button" className="block w-full" onClick={() => openLightbox(photo.id)}>
                                            <img src={photo.thumbnail_url || photo.url} alt="" className="h-48 w-full object-cover" />
                                        </button>

                                        {/* face detection boxes in grid (hidden when lightbox open) */}
                                        {canManageGallery && !lightboxPhoto && (photo.face_detections || []).map((det) => {
                                            if (!det.bbox) return null;
                                            const [x1, y1, x2, y2] = det.bbox;
                                            const isActive = taggingFace?.detectionId === det.id;
                                            return (
                                                <button
                                                    key={det.id}
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setTaggingFace({ photoId: photo.id, detectionId: det.id }); setTagName(''); setTagSearchOpen(false); }}
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

                                        {/* inline tag input in grid (only when lightbox is closed) */}
                                        {!lightboxPhoto && taggingFace?.photoId === photo.id && (
                                            <div className="absolute inset-x-0 bottom-0 z-10 bg-white/97 backdrop-blur-sm p-3 shadow-lg">
                                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600">Etiquetar rostro</p>
                                                <FaceTagInput photoId={photo.id} detectionId={taggingFace.detectionId} />
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
                                        {canManageGallery && (
                                            <TagFields
                                                photo={photo}
                                                photoId={photo.id}
                                                photoValues={photoState[photo.id]}
                                                savePhoto={savePhoto}
                                                sportsModeEnabled={sportsModeEnabled}
                                                supportsSponsorDetection={supportsSponsorDetection}
                                                isAnalyzing={!!geminiLoading[photo.id]}
                                                analyzeWithGemini={analyzeWithGemini}
                                                canManageGallery={canManageGallery}
                                            />
                                        )}
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

            {/* ── Lightbox ─────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {lightboxPhoto && (
                    <motion.div
                        key="lightbox"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
                    >
                        <div className="relative flex max-h-[95vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-[#141210] shadow-2xl" style={{ minHeight: 0 }}>

                            {/* header */}
                            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={lightboxPrev}
                                        disabled={lightboxIdx === 0}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="text-xs font-semibold text-white/70">{lightboxIdx + 1} / {photos.length}</span>
                                    <button
                                        type="button"
                                        onClick={lightboxNext}
                                        disabled={lightboxIdx === photos.length - 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 transition"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canManageGallery && (
                                        <button
                                            type="button"
                                            onClick={() => { setManualDrawMode((v) => !v); setManualBox(null); setManualTagName(''); setManualTagSearchOpen(false); setTaggingFace(null); }}
                                            title="Marcar persona manualmente"
                                            className={clsx('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition', manualDrawMode ? 'bg-blue-500 text-white' : 'bg-white/10 text-white hover:bg-white/20')}
                                        >
                                            <Crosshair className="h-3.5 w-3.5" />
                                            {manualDrawMode ? 'Cancelar' : 'Marcar persona'}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={closeLightbox}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* photo + face boxes */}
                            <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 pt-14 min-w-0">
                                <div
                                    ref={imageContainerRef}
                                    className="relative inline-flex max-h-full max-w-full"
                                    style={{ cursor: manualDrawMode ? 'crosshair' : undefined }}
                                    onMouseDown={manualDrawMode ? handleDrawStart : undefined}
                                >
                                    <img
                                        src={lightboxPhoto.url || lightboxPhoto.thumbnail_url}
                                        alt=""
                                        className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-xl"
                                        style={{ display: 'block', userSelect: 'none', pointerEvents: manualDrawMode ? 'none' : undefined }}
                                        draggable={false}
                                    />

                                    {/* face detection boxes (hidden in draw mode) */}
                                    {!manualDrawMode && canManageGallery && (lightboxPhoto.face_detections || []).map((det) => {
                                        if (!det.bbox) return null;
                                        const [x1, y1, x2, y2] = det.bbox;
                                        const isActive = taggingFace?.detectionId === det.id;
                                        return (
                                            <button
                                                key={det.id}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setTaggingFace({ photoId: lightboxPhoto.id, detectionId: det.id }); setTagName(''); setTagSearchOpen(false); }}
                                                style={{ left: `${x1 * 100}%`, top: `${y1 * 100}%`, width: `${(x2 - x1) * 100}%`, height: `${(y2 - y1) * 100}%`, position: 'absolute' }}
                                                className={clsx('border-2 transition-colors', isActive ? 'border-amber-400' : 'border-amber-300 hover:border-amber-400')}
                                                title="Etiquetar persona"
                                            >
                                                <span className="absolute -top-6 left-0 flex items-center gap-0.5 rounded bg-amber-400 px-1.5 py-1 text-[11px] font-semibold text-white shadow">
                                                    <UserRound className="h-3 w-3" />?
                                                </span>
                                            </button>
                                        );
                                    })}

                                    {/* live draw rectangle */}
                                    {manualDrawMode && isDrawing && drawStart && drawEnd && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${Math.min(drawStart.x, drawEnd.x) * 100}%`,
                                                top: `${Math.min(drawStart.y, drawEnd.y) * 100}%`,
                                                width: `${Math.abs(drawEnd.x - drawStart.x) * 100}%`,
                                                height: `${Math.abs(drawEnd.y - drawStart.y) * 100}%`,
                                                border: '2px solid #3b82f6',
                                                backgroundColor: 'rgba(59,130,246,0.1)',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}

                                    {/* finalized manual box */}
                                    {manualDrawMode && manualBox && !isDrawing && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                left: `${manualBox.x1 * 100}%`,
                                                top: `${manualBox.y1 * 100}%`,
                                                width: `${(manualBox.x2 - manualBox.x1) * 100}%`,
                                                height: `${(manualBox.y2 - manualBox.y1) * 100}%`,
                                                border: '2px solid #3b82f6',
                                                backgroundColor: 'rgba(59,130,246,0.08)',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    )}
                                </div>

                                {/* hint when draw mode active but no box yet */}
                                {manualDrawMode && !manualBox && !isDrawing && (
                                    <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl bg-[#1e1b18]/90 backdrop-blur-sm px-4 py-3 text-center text-xs text-blue-300 border border-blue-500/30">
                                        Haz clic y arrastra sobre la imagen para marcar un rostro
                                    </div>
                                )}

                                {/* manual face tag input */}
                                {manualDrawMode && manualBox && !isDrawing && (
                                    <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl bg-[#1e1b18]/95 backdrop-blur-sm p-3 shadow-lg border border-blue-400/30">
                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-400">Marcar persona en area seleccionada</p>
                                        <ManualFaceTagInput
                                            identities={identities}
                                            tagName={manualTagName}
                                            setTagName={setManualTagName}
                                            tagSearchOpen={manualTagSearchOpen}
                                            setTagSearchOpen={setManualTagSearchOpen}
                                            tagHighlight={manualTagHighlight}
                                            setTagHighlight={setManualTagHighlight}
                                            sportsModeEnabled={sportsModeEnabled}
                                            onSubmit={submitManualFace}
                                            onCancel={() => { setManualBox(null); setManualTagName(''); setManualTagSearchOpen(false); }}
                                        />
                                    </div>
                                )}

                                {/* tag input panel inside lightbox (auto-detected faces) */}
                                {!manualDrawMode && taggingFace?.photoId === lightboxPhoto.id && (
                                    <div className="absolute inset-x-4 bottom-4 z-10 rounded-xl bg-[#1e1b18]/95 backdrop-blur-sm p-3 shadow-lg border border-white/10">
                                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-400">Etiquetar rostro</p>
                                        <FaceTagInput photoId={lightboxPhoto.id} detectionId={taggingFace.detectionId} />
                                    </div>
                                )}
                            </div>

                            {/* side panel with tag fields */}
                            {canManageGallery && (
                                <div className="w-72 shrink-0 overflow-y-auto border-l border-white/10 bg-[#1a1714] p-4 pt-14">
                                    <TagFields
                                        photo={lightboxPhoto}
                                        photoId={lightboxPhoto.id}
                                        dark
                                        photoValues={photoState[lightboxPhoto.id]}
                                        savePhoto={savePhoto}
                                        sportsModeEnabled={sportsModeEnabled}
                                        supportsSponsorDetection={supportsSponsorDetection}
                                        isAnalyzing={!!geminiLoading[lightboxPhoto.id]}
                                        analyzeWithGemini={analyzeWithGemini}
                                        canManageGallery={canManageGallery}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Upload progress modal ─────────────────────────────────────────── */}
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

function ManualFaceTagInput({ identities, tagName, setTagName, tagSearchOpen, setTagSearchOpen, tagHighlight, setTagHighlight, sportsModeEnabled, onSubmit, onCancel }) {
    const matches = React.useMemo(() => {
        const q = tagName.trim().toLowerCase();
        const filtered = q ? identities.filter((i) => i.name.toLowerCase().includes(q)) : identities;
        return filtered.slice(0, 8);
    }, [tagName, identities]);

    const exactMatch = tagName.trim() && identities.some((i) => i.name.toLowerCase() === tagName.trim().toLowerCase());

    const submit = (name, identityId) => onSubmit(name, identityId);

    const handleKeyDown = (e) => {
        const options = [...matches, ...(tagName.trim() && !exactMatch ? ['__new__'] : [])];
        if (e.key === 'ArrowDown') { e.preventDefault(); setTagHighlight((h) => Math.min(h + 1, options.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setTagHighlight((h) => Math.max(h - 1, 0)); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const sel = options[tagHighlight];
            if (!sel || sel === '__new__') { if (tagName.trim()) submit(tagName.trim(), null); }
            else { submit(sel.name, sel.id); }
        } else if (e.key === 'Escape') onCancel();
    };

    return (
        <div className="flex gap-2">
            <div className="relative flex-1">
                <input
                    autoFocus
                    value={tagName}
                    onChange={(e) => { setTagName(e.target.value); setTagSearchOpen(true); setTagHighlight(0); }}
                    onFocus={() => setTagSearchOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={sportsModeEnabled ? 'Buscar jugador...' : 'Buscar persona...'}
                    className="w-full rounded-lg border border-blue-400/30 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-blue-400"
                />
                {tagSearchOpen && (matches.length > 0 || (tagName.trim() && !exactMatch)) && (
                    <ul className="absolute bottom-full left-0 right-0 mb-1 max-h-44 overflow-y-auto rounded-lg border border-[#e6e0d5] bg-white shadow-lg z-10">
                        {matches.map((identity, idx) => (
                            <li key={identity.id}>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); submit(identity.name, identity.id); }}
                                    className={`w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 ${tagHighlight === idx ? 'bg-blue-50' : ''}`}
                                >
                                    {identity.name}
                                </button>
                            </li>
                        ))}
                        {tagName.trim() && !exactMatch && (
                            <li>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); submit(tagName.trim(), null); }}
                                    className={`w-full px-3 py-2 text-left text-xs font-semibold text-blue-700 hover:bg-blue-50 ${tagHighlight === matches.length ? 'bg-blue-50' : ''}`}
                                >
                                    + Crear &ldquo;{tagName.trim()}&rdquo;
                                </button>
                            </li>
                        )}
                    </ul>
                )}
            </div>
            <button
                type="button"
                onClick={() => { if (tagName.trim()) submit(tagName.trim(), null); }}
                disabled={!tagName.trim()}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
                OK
            </button>
            <button
                type="button"
                onClick={onCancel}
                className="flex items-center justify-center rounded-lg border border-white/10 px-2 text-slate-400 hover:text-slate-200"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
