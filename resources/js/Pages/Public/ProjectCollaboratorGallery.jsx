import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Camera, ImagePlus, ShieldCheck, UploadCloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProjectCollaboratorGallery({ workspace }) {
    const { flash } = usePage().props;
    const fileInputRef = React.useRef(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const canUpload = !!workspace?.project?.can_upload;
    const photos = workspace?.photos || [];

    const uploadPhotos = (files) => {
        if (!files?.length || !canUpload) return;

        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('photos[]', file));
        setIsUploading(true);

        router.post(`/project-invitations/${workspace.token}/photos`, formData, {
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
        <div className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-slate-900">
            <Head title={`Subida | ${workspace?.project?.name || 'Proyecto'}`} />

            <div className="mx-auto max-w-6xl space-y-6">
                {(flash?.success || flash?.error) && (
                    <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Workspace de fotografo</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight">{workspace?.project?.name || 'Proyecto'}</h1>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                Este acceso fue validado con codigo. Desde aqui puedes subir material sin iniciar sesion.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <InfoCard label="Fotografo" value={workspace?.collaborator?.email || 'Invitado'} />
                            <InfoCard label="Fotos actuales" value={workspace?.project?.photos_count || 0} />
                            <InfoCard label="Permiso" value={canUpload ? 'Puede subir' : 'Solo lectura'} />
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-[#e6e0d5] pb-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Subida directa</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Cargar fotos del evento</h2>
                            <p className="mt-2 text-sm text-slate-500">Las fotos se envian al bucket y se generan versiones web automaticamente.</p>
                        </div>
                        {canUpload && (
                            <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-5 py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5">
                                <ImagePlus className="h-4 w-4" />
                                Seleccionar archivos
                            </button>
                        )}
                    </div>

                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(event) => uploadPhotos(event.target.files)} className="hidden" />

                    {!canUpload && (
                        <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                            Este enlace no tiene permiso para subir fotos. Pide al administrador que active el permiso de subida.
                        </div>
                    )}

                    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {photos.length > 0 ? photos.map((photo) => (
                            <article key={photo.id} className="overflow-hidden rounded-[1.5rem] border border-[#ece5d8] bg-white shadow-sm">
                                <img src={photo.thumbnail_url || photo.url} alt="Foto del proyecto" className="h-48 w-full object-cover" />
                                <div className="space-y-2 p-4">
                                    <p className="text-sm font-semibold text-slate-900">Foto #{photo.id}</p>
                                    <p className="text-xs text-slate-400">Sincronizada en galeria</p>
                                </div>
                            </article>
                        )) : (
                            <div className="col-span-full rounded-[1.8rem] border border-dashed border-[#ddd5c9] bg-slate-50 px-6 py-20 text-center">
                                <UploadCloud className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                                <h3 className="text-xl font-semibold text-slate-900">Todavia no hay material cargado</h3>
                                <p className="mt-2 text-sm text-slate-500">Cuando subas fotos apareceran aqui para confirmar que llegaron al proyecto.</p>
                                {canUpload && (
                                    <button onClick={() => fileInputRef.current?.click()} className="mt-6 rounded-2xl border border-[#ddd5c9] bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                                        Subir primeras fotos
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <GuideCard icon={ShieldCheck} title="Acceso protegido" description="El enlace queda protegido por token y el codigo de acceso del proyecto." />
                    <GuideCard icon={UploadCloud} title="Subida directa" description="El material se procesa y se publica al bucket del proyecto sin pasos adicionales." />
                    <GuideCard icon={Camera} title="Sin login" description="El fotografo no necesita iniciar sesion mientras conserve su enlace y codigo." />
                </section>
            </div>

            <AnimatePresence>
                {isUploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                        <div className="w-[380px] rounded-[2rem] bg-white p-10 text-center shadow-2xl">
                            <UploadCloud className="mx-auto mb-4 h-14 w-14 animate-pulse text-slate-900" />
                            <h2 className="text-xl font-semibold text-slate-900">Subiendo material</h2>
                            <p className="mt-2 text-sm text-slate-500">Enviando originales y generando versiones web...</p>
                            <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
                                <motion.div className="h-full rounded-full bg-slate-900" initial={{ width: 0 }} animate={{ width: `${uploadProgress || 0}%` }} />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{Math.round(uploadProgress || 0)}%</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-[1.4rem] border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function GuideCard({ icon: Icon, title, description }) {
    return (
        <div className="rounded-[1.6rem] border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] text-slate-700">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
    );
}
