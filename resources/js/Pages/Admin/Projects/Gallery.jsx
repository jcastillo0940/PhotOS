import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { ChevronLeft, Globe2, LayoutTemplate, Trash2, UploadCloud } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

export default function Gallery({ project }) {
    const { flash } = usePage().props;
    const fileInputRef = React.useRef(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [heroPhotoId, setHeroPhotoId] = React.useState(project.hero_photo_id || project.photos?.[0]?.id || null);
    const canUpload = !!project.permissions?.can_upload;
    const canManageGallery = !!project.permissions?.can_manage_gallery;

    const buildPhotoState = React.useCallback((photos) => (
        Object.fromEntries((photos || []).map((photo) => [
            photo.id,
            {
                tags: (photo.tags || []).join(', '),
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
        router.put(`/admin/projects/${project.id}/photos/${photoId}`, { category: tags[0] || 'General', tags, show_on_website: next.show_on_website }, { preserveScroll: true, preserveState: true });
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

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
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

                    <div className="mt-8">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {(project.photos || []).length > 0 ? project.photos.map((photo) => (
                                <article key={photo.id} className="overflow-hidden rounded-[1.5rem] border border-[#ece5d8] bg-white shadow-sm transition hover:shadow-md">
                                    <div className="relative group">
                                        <img src={photo.thumbnail_url || photo.url} alt="" className="h-48 w-full object-cover" />
                                        {canManageGallery && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                                            <button type="button" onClick={() => { setHeroPhotoId(photo.id); router.put(`/admin/projects/${project.id}`, { hero_photo_id: photo.id }, { preserveScroll: true, preserveState: true }); }} className={clsx('rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-sm', heroPhotoId === photo.id ? 'bg-[#171411] text-white border border-[#171411]' : 'border border-white/40 bg-white/30 text-white')}>
                                                {heroPhotoId === photo.id ? 'Portada de Galeria' : 'Hacer Portada'}
                                            </button>
                                        </div>}
                                        {canManageGallery && <button type="button" onClick={() => { if (window.confirm('Eliminar esta foto del proyecto y del bucket?')) router.post(`/admin/projects/${project.id}/photos/${photo.id}`, { _method: 'delete' }, { preserveScroll: true }); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-600">
                                            <Trash2 className="h-4 w-4" />
                                        </button>}
                                    </div>
                                    <div className="p-4 space-y-4">
                                        {canManageGallery && <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Etiquetas (Opcional)</label>
                                            <input value={photoState[photo.id]?.tags || ''} onChange={(event) => savePhoto(photo.id, { tags: event.target.value })} placeholder="Boda, Pareja, Fiesta..." className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-3 py-2 text-xs text-slate-700 outline-none focus:border-slate-400 focus:bg-white" />
                                        </div>}
                                        {canManageGallery && <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e6e0d5] bg-slate-50 px-3 py-2.5 hover:bg-slate-100 transition">
                                            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><Globe2 className="h-3.5 w-3.5 text-primary-500" />Mostrar en Web</span>
                                            <input type="checkbox" checked={!!photoState[photo.id]?.show_on_website} onChange={(event) => savePhoto(photo.id, { show_on_website: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                        </label>}
                                    </div>
                                </article>
                            )) : (
                                <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] bg-slate-50 px-6 py-20 text-center col-span-full">
                                    <UploadCloud className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                                    <h3 className="text-xl font-semibold text-slate-900">Tu coleccion esta vacia</h3>
                                    <p className="mt-2 text-sm text-slate-500">Comienza arrastrando fotos aqui o busca en tu computadora.</p>
                                    {canUpload && <button onClick={() => fileInputRef.current?.click()} className="mt-6 rounded-2xl border border-[#ddd5c9] bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                                        Seleccionar Archivos
                                    </button>}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <AnimatePresence>
                {isUploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                        <div className="w-[380px] rounded-[2rem] bg-white p-10 text-center shadow-2xl">
                            <UploadCloud className="mx-auto mb-4 h-14 w-14 animate-pulse text-primary-500" />
                            <h2 className="text-xl font-semibold text-slate-900">Subiendo material</h2>
                            <p className="mt-2 text-sm text-slate-500">Enviando a Cloudflare R2 sin tocar el disco del servidor...</p>
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
