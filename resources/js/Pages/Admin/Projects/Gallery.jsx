import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { Bot, ChevronLeft, Copy, ExternalLink, Globe2, Image as ImageIcon, LayoutTemplate, Sparkles, Trash2, UploadCloud, UserRound, WandSparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

export default function Gallery({ project, availableTemplates, faceRecognition }) {
    const { flash } = usePage().props;
    const fileInputRef = React.useRef(null);
    const identityForm = useForm({
        name: '',
        reference_image: null,
    });
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [heroPhotoId, setHeroPhotoId] = React.useState(project.hero_photo_id || project.photos?.[0]?.id || null);
    const [templateCode, setTemplateCode] = React.useState(project.gallery_template_code || availableTemplates?.[0]?.code || '');
    const [websiteCategory, setWebsiteCategory] = React.useState(project.website_category || project.lead?.event_type || '');
    const [websiteDescription, setWebsiteDescription] = React.useState(project.website_description || '');
    const [faceRecognitionEnabled, setFaceRecognitionEnabled] = React.useState(!!project.face_recognition_enabled);
    const [processingPhotoId, setProcessingPhotoId] = React.useState(null);
    const [clearingPhotoId, setClearingPhotoId] = React.useState(null);
    const [copiedLink, setCopiedLink] = React.useState(false);
    const [copiedCode, setCopiedCode] = React.useState(false);
    const canUseRecognition = !!faceRecognitionEnabled && !!faceRecognition?.service_configured && (faceRecognition?.identities || []).length > 0;
    const buildPhotoState = React.useCallback((photos) => (
        Object.fromEntries((photos || []).map((photo) => [
            photo.id,
            {
                tags: (photo.tags || []).join(', '),
                people_tags: (photo.people_tags || []).join(', '),
                show_on_website: !!photo.show_on_website,
            },
        ]))
    ), []);
    const [photoState, setPhotoState] = React.useState(buildPhotoState(project.photos || []));
    const heroPhoto = project.photos?.find((photo) => photo.id === heroPhotoId) || project.photos?.[0] || null;
    const recognitionSummary = faceRecognition?.summary || {};

    React.useEffect(() => {
        setPhotoState(buildPhotoState(project.photos || []));
    }, [project.photos, buildPhotoState]);
    const recognitionBadge = (photo) => {
        const status = photo.recognition_status || 'pending';

        switch (status) {
            case 'matched':
                return { label: photo.recognition_status_label || 'Coincidencia detectada', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
            case 'no_match':
                return { label: photo.recognition_status_label || 'Sin coincidencias', className: 'bg-amber-100 text-amber-700 border-amber-200' };
            case 'no_face':
                return { label: photo.recognition_status_label || 'Sin rostro', className: 'bg-slate-100 text-slate-600 border-slate-200' };
            case 'error':
                return { label: photo.recognition_status_label || 'Error de analisis', className: 'bg-rose-100 text-rose-700 border-rose-200' };
            case 'manual':
                return { label: photo.recognition_status_label || 'Etiquetado manual', className: 'bg-sky-100 text-sky-700 border-sky-200' };
            default:
                return { label: photo.recognition_status_label || 'Sin analizar', className: 'bg-[#f3eee6] text-slate-700 border-[#e6e0d5]' };
        }
    };

    const saveMeta = () => {
        router.put(`/admin/projects/${project.id}`, {
            gallery_template_code: templateCode,
            website_category: websiteCategory,
            website_description: websiteDescription,
            hero_photo_id: heroPhotoId,
            face_recognition_enabled: faceRecognitionEnabled,
        }, { preserveScroll: true, preserveState: true });
    };

    const savePhoto = (photoId, nextState) => {
        const next = { ...(photoState[photoId] || {}), ...nextState };
        setPhotoState((current) => ({ ...current, [photoId]: next }));
        const tags = (next.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        const peopleTags = (next.people_tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
        router.put(`/admin/projects/${project.id}/photos/${photoId}`, { category: tags[0] || 'General', tags, people_tags: peopleTags, show_on_website: next.show_on_website }, { preserveScroll: true, preserveState: true });
    };

    const uploadPhotos = (files) => {
        if (!files?.length) return;
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('photos[]', file));
        setIsUploading(true);
        router.post(`/admin/projects/${project.id}/photos`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onProgress: (event) => setUploadProgress(event?.percentage || 0),
            onFinish: () => {
                setIsUploading(false);
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
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

    const processPhotoRecognition = (photoId) => {
        setProcessingPhotoId(photoId);
        router.post(`/admin/projects/${project.id}/photos/${photoId}/recognition`, {}, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setProcessingPhotoId(null),
        });
    };

    const clearPhotoRecognition = (photoId) => {
        setClearingPhotoId(photoId);
        router.post(`/admin/projects/${project.id}/photos/${photoId}/recognition`, { _method: 'delete' }, {
            preserveScroll: true,
            onFinish: () => setClearingPhotoId(null),
        });
    };

    const copyPublicLink = async () => {
        if (!project.public_gallery_url) return;

        try {
            await navigator.clipboard.writeText(project.public_gallery_url);
            setCopiedLink(true);
            window.setTimeout(() => setCopiedLink(false), 2200);
        } catch (error) {
            window.prompt('Copia este enlace publico:', project.public_gallery_url);
        }
    };

    const copyAccessCode = async () => {
        if (!project.gallery_password) return;

        try {
            await navigator.clipboard.writeText(project.gallery_password);
            setCopiedCode(true);
            window.setTimeout(() => setCopiedCode(false), 2200);
        } catch (error) {
            window.prompt('Copia este codigo de acceso:', project.gallery_password);
        }
    };

    return (
        <AdminLayout>
            <Head title={`Galeria: ${project.name}`} />

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

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Galeria</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Media, portada y portafolio web</h2>
                            <p className="mt-2 text-sm leading-7 text-slate-500">Aqui solo se trabaja el material visual del proyecto: subida, seleccion, portada y publicacion web.</p>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white">
                            Agregar multimedia
                        </button>
                    </div>

                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(event) => uploadPhotos(event.target.files)} className="hidden" />

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-4">
                            <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Globe2 className="h-4 w-4" />
                                    <p className="text-sm font-semibold">Enlace publico de la galeria</p>
                                </div>
                                <p className="mt-2 text-sm leading-7 text-slate-500">Comparte esta URL con tu cliente para ver la galeria publica.</p>
                                <div className="mt-4 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="break-all text-sm text-slate-700">{project.public_gallery_url}</p>
                                </div>
                                <div className="mt-4 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Codigo de acceso cliente</p>
                                    <div className="mt-2 flex items-center justify-between gap-4">
                                        <p className="text-lg font-semibold tracking-[0.2em] text-slate-900">{project.gallery_password || 'Sin codigo'}</p>
                                        <button
                                            type="button"
                                            onClick={copyAccessCode}
                                            disabled={!project.gallery_password}
                                            className={clsx(
                                                'inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold',
                                                !project.gallery_password
                                                    ? 'cursor-not-allowed border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                    : 'border-[#ddd5c9] bg-white text-slate-700'
                                            )}
                                        >
                                            <Copy className="h-4 w-4" />
                                            {copiedCode ? 'Codigo copiado' : 'Copiar codigo'}
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={copyPublicLink}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                                    >
                                        <Copy className="h-4 w-4" />
                                        {copiedLink ? 'Enlace copiado' : 'Copiar enlace'}
                                    </button>
                                    <a
                                        href={project.public_gallery_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        Abrir galeria publica
                                    </a>
                                </div>
                            </div>

                            <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">Plantilla de galeria</label>
                                <select value={templateCode} onChange={(event) => setTemplateCode(event.target.value)} className="mt-3 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none">
                                    {availableTemplates?.map((template) => <option key={template.code} value={template.code}>{template.name}</option>)}
                                </select>
                                <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Categoria visible</label>
                                <input value={websiteCategory} onChange={(event) => setWebsiteCategory(event.target.value)} className="mt-3 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
                                <label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Descripcion corta</label>
                                <textarea rows={4} value={websiteDescription} onChange={(event) => setWebsiteDescription(event.target.value)} className="mt-3 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
                                <button onClick={saveMeta} className="mt-5 rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                                    Guardar ajustes visuales
                                </button>
                            </div>

                            <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <LayoutTemplate className="h-4 w-4" />
                                    <p className="text-sm font-semibold">Portada actual</p>
                                </div>
                                <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-[#e6e0d5] bg-white">
                                    {heroPhoto ? <img src={heroPhoto.url} alt={project.name} className="h-[260px] w-full object-cover" /> : <div className="flex h-[260px] items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></div>}
                                </div>
                            </div>

                            <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Reconocimiento facial</p>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900">Personas a reconocer en esta galeria</h3>
                                        <p className="mt-2 text-sm leading-7 text-slate-500">Activalo solo en las colecciones donde te interese reconocer personas y luego filtrar el front por nombres.</p>
                                    </div>
                                    <Bot className="h-5 w-5 text-slate-300" />
                                </div>

                                <label className="mt-5 flex items-center justify-between rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700">
                                    <span>Activar reconocimiento facial para esta galeria</span>
                                    <input
                                        type="checkbox"
                                        checked={faceRecognitionEnabled}
                                        onChange={(event) => setFaceRecognitionEnabled(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-primary-600"
                                    />
                                </label>

                                <div className="mt-4 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4 text-sm text-slate-600">
                                    Servicio IA: {faceRecognition?.service_configured ? 'configurado' : 'pendiente de configurar FACE_AI_SERVICE_URL'}
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fotos detectadas</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{recognitionSummary.photos_with_people || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fotos pendientes</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{recognitionSummary.photos_pending || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Personas marcadas</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{recognitionSummary.people_detected_total || 0}</p>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sin rostro</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{recognitionSummary.photos_without_face || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sin coincidencias</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{recognitionSummary.photos_without_match || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Con error</p>
                                        <p className="mt-2 text-2xl font-semibold text-slate-900">{recognitionSummary.photos_with_errors || 0}</p>
                                    </div>
                                </div>

                                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#171411] via-[#7c5d45] to-[#d1a673] transition-all"
                                        style={{
                                            width: `${Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    ((recognitionSummary.photos_with_people || 0) / Math.max(1, (project.photos || []).length)) * 100
                                                )
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    {recognitionSummary.photos_with_people || 0} de {(project.photos || []).length} fotos tienen personas detectadas.
                                </p>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => router.post(`/admin/projects/${project.id}/recognition/run`, {}, { preserveScroll: true })}
                                        disabled={!canUseRecognition}
                                        className={clsx(
                                            'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
                                            !canUseRecognition
                                                ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                : 'bg-[#171411] text-white'
                                        )}
                                    >
                                        <WandSparkles className="h-4 w-4" />
                                        Procesar galeria completa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveMeta}
                                        className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                                    >
                                        Guardar configuracion IA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.post(`/admin/projects/${project.id}/recognition/test`, {}, { preserveScroll: true })}
                                        className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                                    >
                                        Probar servicio IA
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm('Limpiar todas las personas detectadas de la galeria?')) {
                                                router.post(`/admin/projects/${project.id}/recognition`, { _method: 'delete' }, { preserveScroll: true });
                                            }
                                        }}
                                        disabled={(recognitionSummary.people_detected_total || 0) === 0}
                                        className={clsx(
                                            'rounded-2xl px-4 py-3 text-sm font-semibold',
                                            (recognitionSummary.people_detected_total || 0) === 0
                                                ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                : 'border border-[#f0d7d0] bg-white text-rose-600'
                                        )}
                                    >
                                        Limpiar galeria
                                    </button>
                                </div>

                                <form onSubmit={createIdentity} className="mt-5 space-y-3">
                                    <input
                                        type="text"
                                        value={identityForm.data.name}
                                        onChange={(event) => identityForm.setData('name', event.target.value)}
                                        placeholder="Nombre de la persona"
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
                                        disabled={identityForm.processing || !faceRecognitionEnabled || !faceRecognition?.service_configured}
                                        className={clsx(
                                            'rounded-2xl px-4 py-3 text-sm font-semibold',
                                            identityForm.processing || !faceRecognitionEnabled || !faceRecognition?.service_configured
                                                ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                : 'border border-[#ddd5c9] bg-white text-slate-700'
                                        )}
                                    >
                                        {identityForm.processing ? 'Registrando...' : 'Agregar persona'}
                                    </button>
                                </form>

                                <div className="mt-5 space-y-3">
                                    {(faceRecognition?.identities || []).length > 0 ? faceRecognition.identities.map((identity) => (
                                        <div key={identity.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900">{identity.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">Referencia cargada para esta galeria</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm(`Eliminar a ${identity.name} de esta galeria?`)) {
                                                        router.post(`/admin/projects/${project.id}/face-identities/${identity.id}`, { _method: 'delete' }, { preserveScroll: true });
                                                    }
                                                }}
                                                className="rounded-full border border-[#e6e0d5] p-2 text-slate-500"
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
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[1.8rem] border border-dashed border-[#d9d1c4] bg-[#fbf9f6] px-6 py-10 text-center">
                                <UploadCloud className="mx-auto h-9 w-9 text-slate-300" />
                                <h3 className="mt-4 text-xl font-semibold text-slate-900">Arrastra fotos o subelas aqui</h3>
                                <p className="mt-2 text-sm text-slate-500">Sube el material del proyecto y decide cuales fotos vive tambien en el portafolio.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {(project.photos || []).length > 0 ? project.photos.map((photo) => (
                                    <article key={photo.id} className="overflow-hidden rounded-[1.7rem] border border-[#ece5d8] bg-white shadow-sm">
                                        <div className="relative">
                                            <img src={photo.thumbnail_url || photo.url} alt="" className="h-48 w-full object-cover" />
                                            <button type="button" onClick={() => { if (window.confirm('Eliminar esta foto del proyecto y del bucket?')) router.post(`/admin/projects/${project.id}/photos/${photo.id}`, { _method: 'delete' }, { preserveScroll: true }); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-4 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-semibold text-slate-900">Foto #{photo.id}</p>
                                                <button type="button" onClick={() => { setHeroPhotoId(photo.id); router.put(`/admin/projects/${project.id}`, { hero_photo_id: photo.id }, { preserveScroll: true, preserveState: true }); }} className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', heroPhotoId === photo.id ? 'bg-[#171411] text-white' : 'border border-[#e6e0d5] text-slate-600')}>
                                                    {heroPhotoId === photo.id ? 'Portada' : 'Usar en portada'}
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold', recognitionBadge(photo).className)}>
                                                    {recognitionBadge(photo).label}
                                                </span>
                                                {photo.recognition_note && (
                                                    <span className="text-xs text-slate-500">{photo.recognition_note}</span>
                                                )}
                                            </div>
                                            <input value={photoState[photo.id]?.tags || ''} onChange={(event) => savePhoto(photo.id, { tags: event.target.value })} placeholder="Tags generales: ceremonia, retratos" className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" />
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                                    <UserRound className="h-3.5 w-3.5" />
                                                    Personas
                                                </div>
                                                <p className="text-xs leading-6 text-slate-500">
                                                    Si el reconocimiento detecta una o varias personas, sus nombres se guardan aqui automaticamente como tags.
                                                </p>
                                                <input value={photoState[photo.id]?.people_tags || ''} onChange={(event) => savePhoto(photo.id, { people_tags: event.target.value })} placeholder="Juan Carlos, Maria Fernanda" className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" />
                                                {!!photoState[photo.id]?.people_tags && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {(photoState[photo.id]?.people_tags || '').split(',').map((person) => person.trim()).filter(Boolean).map((person) => (
                                                            <span key={`${photo.id}-${person}`} className="inline-flex items-center gap-1 rounded-full bg-[#f3eee6] px-3 py-1 text-[11px] font-semibold text-slate-700">
                                                                <Sparkles className="h-3 w-3" />
                                                                {person}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <button
                                                    type="button"
                                                    onClick={() => processPhotoRecognition(photo.id)}
                                                    disabled={!canUseRecognition || processingPhotoId === photo.id}
                                                    className={clsx(
                                                        'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
                                                        !canUseRecognition || processingPhotoId === photo.id
                                                            ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                            : 'border border-[#ddd5c9] bg-white text-slate-700'
                                                    )}
                                                >
                                                    <WandSparkles className="h-4 w-4" />
                                                    {processingPhotoId === photo.id ? 'Procesando foto...' : 'Procesar foto'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => clearPhotoRecognition(photo.id)}
                                                    disabled={!(photoState[photo.id]?.people_tags || '').trim() || clearingPhotoId === photo.id}
                                                    className={clsx(
                                                        'inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
                                                        !(photoState[photo.id]?.people_tags || '').trim() || clearingPhotoId === photo.id
                                                            ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                                            : 'border border-[#f0d7d0] bg-white text-rose-600'
                                                    )}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    {clearingPhotoId === photo.id ? 'Limpiando...' : 'Limpiar deteccion'}
                                                </button>
                                            </div>
                                            <label className="flex items-center justify-between rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700">
                                                <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-slate-400" />Mostrar en web</span>
                                                <input type="checkbox" checked={!!photoState[photo.id]?.show_on_website} onChange={(event) => savePhoto(photo.id, { show_on_website: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600" />
                                            </label>
                                        </div>
                                    </article>
                                )) : <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-16 text-center text-sm text-slate-400 md:col-span-2">Aun no hay fotos en esta coleccion.</div>}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <AnimatePresence>
                {isUploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                        <div className="w-[380px] rounded-[2rem] bg-white p-10 text-center shadow-2xl">
                            <UploadCloud className="mx-auto mb-4 h-14 w-14 animate-pulse text-primary-500" />
                            <h2 className="text-xl font-semibold text-slate-900">Subiendo fotos</h2>
                            <p className="mt-2 text-sm text-slate-500">Sincronizando originales y versiones web en Cloudflare R2.</p>
                            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
                                <motion.div className="h-full rounded-full bg-primary-500" initial={{ width: 0 }} animate={{ width: `${uploadProgress || 0}%` }} />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-primary-600">{Math.round(uploadProgress || 0)}%</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
