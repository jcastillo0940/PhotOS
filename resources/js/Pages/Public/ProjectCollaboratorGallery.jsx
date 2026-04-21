import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Camera, CheckCircle2, ImagePlus, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePhotoUploader } from '@/hooks/usePhotoUploader';

export default function ProjectCollaboratorGallery({ workspace }) {
    const { flash } = usePage().props;
    const fileInputRef = React.useRef(null);
    const canUpload = !!workspace?.project?.can_upload;
    const photos = workspace?.photos || [];
    const photosCount = workspace?.project?.photos_count ?? photos.length;
    const acceptedImageFormats = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
    const { state: upload, upload: startUpload } = usePhotoUploader({
        uploadUrl: `/project-invitations/${workspace.token}/photos`,
        batchSize: 1,
        reloadOnly: ['workspace'],
    });

    const [isDragging, setIsDragging] = React.useState(false);
    const dragCounter = React.useRef(0);

    const uploadPhotos = (files) => {
        if (!files?.length || !canUpload) return;
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

    return (
        <div className="min-h-screen bg-[#f6f3ed] px-4 py-6 text-slate-900 sm:py-8">
            <Head title={`Subida | ${workspace?.project?.name || 'Proyecto'}`} />

            <div className="mx-auto max-w-5xl space-y-5">
                {(flash?.success || flash?.error) && (
                    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                <section className="overflow-hidden rounded-[1.75rem] border border-[#e4ded2] bg-white shadow-sm">
                    <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="flex min-h-[280px] flex-col justify-between p-6 sm:p-8">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Acceso validado
                                </div>
                                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{workspace?.project?.name || 'Proyecto'}</h1>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                                    Sube las fotos del evento en JPG, PNG o WEBP. El sistema guarda los originales y prepara versiones web automaticamente.
                                </p>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                <InfoCard label="Fotografo" value={workspace?.collaborator?.email || 'Invitado'} />
                                <InfoCard label="Fotos" value={photosCount} />
                                <InfoCard label="Estado" value={canUpload ? 'Listo para subir' : 'Solo lectura'} />
                            </div>
                        </div>

                        <div className="border-t border-[#e9e2d6] bg-[#161411] p-6 text-white lg:border-l lg:border-t-0 sm:p-8">
                            <div className="flex h-full flex-col justify-between gap-8">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Entrega de material</p>
                                    <p className="mt-4 text-2xl font-semibold leading-tight">Arrastra, selecciona y listo.</p>
                                    <p className="mt-3 text-sm leading-6 text-white/60">No necesitas iniciar sesion. Mantente en esta pantalla mientras termina la carga.</p>
                                </div>
                                <div className="grid gap-3 text-sm text-white/75">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">1</span>
                                        Elige tus fotos
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">2</span>
                                        Espera el progreso
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">3</span>
                                        Confirma que aparezcan en la galeria
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    className={`rounded-[1.75rem] border bg-white p-4 shadow-sm transition-colors duration-150 sm:p-5 ${isDragging ? 'border-slate-500 bg-slate-50 ring-2 ring-slate-300' : 'border-[#e4ded2]'}`}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {!canUpload && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                            Este enlace no tiene permiso para subir fotos. Pide al administrador que active el permiso de subida.
                        </div>
                    )}

                    {canUpload && (
                        <label className={`flex cursor-pointer flex-col items-center justify-center rounded-[1.35rem] border-2 border-dashed px-5 py-12 text-center transition sm:px-8 sm:py-16 ${isDragging ? 'border-slate-700 bg-slate-100' : 'border-[#d8d0c2] bg-[#fbfaf7] hover:border-slate-500 hover:bg-white'}`}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept={acceptedImageFormats}
                                className="hidden"
                                onChange={(e) => uploadPhotos(e.target.files)}
                            />
                            <span className={`flex h-16 w-16 items-center justify-center rounded-full transition ${isDragging ? 'bg-slate-900 text-white' : 'bg-slate-900 text-white'}`}>
                                <UploadCloud className="h-7 w-7" />
                            </span>
                            <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{isDragging ? 'Suelta las fotos aqui' : 'Subir fotos del evento'}</h2>
                            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                {isDragging ? 'La carga inicia automaticamente al soltar los archivos.' : 'Arrastra las fotos a esta zona o haz clic para buscarlas en tu computadora.'}
                            </p>
                            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#171411] px-5 py-3 text-sm font-semibold text-white shadow-sm">
                                <ImagePlus className="h-4 w-4" />
                                Seleccionar fotos
                            </span>
                            <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-500">
                                <span className="rounded-full border border-[#ddd5c9] bg-white px-3 py-1.5">JPG</span>
                                <span className="rounded-full border border-[#ddd5c9] bg-white px-3 py-1.5">PNG</span>
                                <span className="rounded-full border border-[#ddd5c9] bg-white px-3 py-1.5">WEBP</span>
                                <span className="rounded-full border border-[#ddd5c9] bg-white px-3 py-1.5">Hasta 90 MB por foto</span>
                            </div>
                        </label>
                    )}

                    <div className="mt-6 border-t border-[#ebe4d8] pt-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Material sincronizado</p>
                                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{photos.length > 0 ? `${photos.length} foto${photos.length !== 1 ? 's' : ''} en galeria` : 'Aun no hay fotos cargadas'}</h2>
                            </div>
                            {photos.length > 0 && <p className="text-sm text-slate-500">Las fotos nuevas apareceran aqui al finalizar.</p>}
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {photos.length > 0 ? photos.map((photo) => (
                                <article key={photo.id} className="overflow-hidden rounded-2xl border border-[#ece5d8] bg-white shadow-sm">
                                    <img src={photo.thumbnail_url || photo.url} alt="Foto del proyecto" className="aspect-[4/3] w-full object-cover" />
                                    <div className="flex items-center justify-between gap-3 p-3">
                                        <p className="truncate text-sm font-semibold text-slate-900">Foto #{photo.id}</p>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Lista
                                        </span>
                                    </div>
                                </article>
                            )) : (
                                <div className="col-span-full rounded-2xl border border-[#e6e0d5] bg-[#fbfaf7] px-5 py-8 text-center">
                                    <Camera className="mx-auto h-9 w-9 text-slate-300" />
                                    <p className="mt-3 text-sm font-semibold text-slate-700">Cuando subas fotos, veras una vista previa aqui.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-3">
                    <GuideCard icon={ShieldCheck} title="Acceso protegido" description="El enlace queda protegido por token y el codigo de acceso del proyecto." />
                    <GuideCard icon={UploadCloud} title="Subida directa" description="El material se procesa y se publica al bucket del proyecto sin pasos adicionales." />
                    <GuideCard icon={Camera} title="Sin login" description="El fotografo no necesita iniciar sesion mientras conserve su enlace y codigo." />
                </section>
            </div>

            <AnimatePresence>
                {(upload.isUploading || upload.isDone) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur-md">
                        <div className="w-full max-w-[430px] rounded-[1.75rem] bg-white p-7 shadow-2xl sm:p-9">
                            <div className="flex flex-col items-center text-center">
                                {upload.isDone && upload.failedFiles === 0 ? (
                                    <CheckCircle2 className="mb-4 h-14 w-14 text-emerald-500" />
                                ) : upload.isDone ? (
                                    <XCircle className="mb-4 h-14 w-14 text-rose-500" />
                                ) : (
                                    <UploadCloud className="mb-4 h-14 w-14 animate-pulse text-slate-800" />
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
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function GuideCard({ icon: Icon, title, description }) {
    return (
        <div className="rounded-2xl border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] text-slate-700">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
    );
}
