import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowUpRight,
    BadgeCheck,
    Calendar,
    Camera,
    CheckCircle2,
    ChevronLeft,
    Clock,
    Download,
    ExternalLink,
    FileText,
    Globe,
    MapPin,
    Share2,
    Tags,
    Trash2,
    UploadCloud,
    Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function Show({ project, installationPlan, availableTemplates }) {
    const [uploadProgress, setUploadProgress] = React.useState(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [heroPhotoId, setHeroPhotoId] = React.useState(project.hero_photo_id || project.photos?.[0]?.id || null);
    const [heroFocus, setHeroFocus] = React.useState({
        x: parseFloat(project.hero_focus_x || '50%'),
        y: parseFloat(project.hero_focus_y || '50%'),
    });
    const [templateCode, setTemplateCode] = React.useState(project.gallery_template_code || availableTemplates?.[0]?.code || '');
    const [websiteCategory, setWebsiteCategory] = React.useState(project.website_category || project.lead?.event_type || '');
    const [websiteDescription, setWebsiteDescription] = React.useState(project.website_description || '');
    const [photoState, setPhotoState] = React.useState(
        Object.fromEntries((project.photos || []).map((photo) => [
            photo.id,
            {
                tags: (photo.tags?.length ? photo.tags : (photo.category ? [photo.category] : [])).join(', '),
                show_on_website: !!photo.show_on_website,
            },
        ]))
    );

    const photoSaveTimers = React.useRef({});
    const heroSaveTimer = React.useRef(null);
    const metaSaveTimer = React.useRef(null);
    const templateSaveTimer = React.useRef(null);

    const heroPhoto = project.photos?.find((photo) => photo.id === heroPhotoId) || project.photos?.[0] || null;
    const signatureUrl = `${window.location.origin}/sign/${project.contract?.token}`;
    const galleryUrl = `${window.location.origin}/gallery/${project.gallery_token}`;
    const portfolioCount = project.photos?.filter((photo) => photo.show_on_website).length || 0;
    const storageUsedGb = ((project.originals_usage_bytes || 0) / (1024 ** 3)).toFixed(2);
    const storageLimitGb = installationPlan?.storage_limit_gb || 0;

    React.useEffect(() => () => {
        Object.values(photoSaveTimers.current).forEach(clearTimeout);
        clearTimeout(heroSaveTimer.current);
        clearTimeout(metaSaveTimer.current);
        clearTimeout(templateSaveTimer.current);
    }, []);

    React.useEffect(() => {
        clearTimeout(heroSaveTimer.current);
        heroSaveTimer.current = setTimeout(() => {
            router.put(`/admin/projects/${project.id}`, {
                hero_photo_id: heroPhotoId,
                hero_focus_x: `${Math.round(heroFocus.x)}%`,
                hero_focus_y: `${Math.round(heroFocus.y)}%`,
            }, { preserveScroll: true, preserveState: true });
        }, 700);
    }, [heroPhotoId, heroFocus.x, heroFocus.y]);

    React.useEffect(() => {
        clearTimeout(templateSaveTimer.current);
        templateSaveTimer.current = setTimeout(() => {
            router.put(`/admin/projects/${project.id}`, {
                gallery_template_code: templateCode,
            }, { preserveScroll: true, preserveState: true });
        }, 600);
    }, [templateCode]);

    React.useEffect(() => {
        clearTimeout(metaSaveTimer.current);
        metaSaveTimer.current = setTimeout(() => {
            router.put(`/admin/projects/${project.id}`, {
                website_category: websiteCategory,
                website_description: websiteDescription,
            }, { preserveScroll: true, preserveState: true });
        }, 900);
    }, [websiteCategory, websiteDescription]);

    const queuePhotoSave = (photoId, nextState) => {
        setPhotoState((current) => ({
            ...current,
            [photoId]: {
                ...current[photoId],
                ...nextState,
            },
        }));

        clearTimeout(photoSaveTimers.current[photoId]);
        photoSaveTimers.current[photoId] = setTimeout(() => {
            const snapshot = {
                ...photoState[photoId],
                ...nextState,
            };
            const tags = (snapshot.tags || '')
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

            const photo = project.photos.find((item) => item.id === photoId);

            router.put(`/admin/projects/${project.id}/photos/${photoId}`, {
                category: tags[0] || photo?.category || 'General',
                tags,
                show_on_website: snapshot.show_on_website,
            }, { preserveScroll: true, preserveState: true });
        }, 900);
    };

    const handleHeroFocusPick = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
        setHeroFocus({ x, y });
    };

    const deletePhoto = (photo) => {
        if (!window.confirm('Delete this photo from the project and bucket?')) return;
        router.post(`/admin/projects/${project.id}/photos/${photo.id}`, { _method: 'delete' }, { preserveScroll: true });
    };

    const copyToClipboard = async (text) => {
        await navigator.clipboard.writeText(text);
        window.alert('Link copied.');
    };

    const statusLabels = { active: 'Activo', pending_payment: 'Pago pendiente', editing: 'Edición', delivered: 'Entregado' };

    return (
        <AdminLayout>
            <Head title={`Proyecto: ${project.name}`} />

            <div className="space-y-8">
                <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a proyectos
                </Link>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Project overview</p>
                            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{project.name}</h1>
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Fecha por definir'}</span>
                                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {project.location || 'Sin ubicación'}</span>
                                <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4" /> {installationPlan?.name}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                {statusLabels[project.status] || project.status}
                            </span>
                            <Link href={`/gallery/${project.gallery_token}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                <ExternalLink className="h-4 w-4" />
                                Client gallery
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 xl:grid-cols-[1.2fr_.8fr]">
                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Contrato</h2>
                                    <p className="mt-1 text-sm text-slate-500">Versión pública minimalista y editor centralizado.</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {project.contract ? (
                                        <>
                                            <Link href="/admin/contracts" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                <FileText className="h-4 w-4" />
                                                Edit contract
                                            </Link>
                                            <Link href={`/sign/${project.contract.token}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                                <Download className="h-4 w-4" />
                                                Print / PDF
                                            </Link>
                                        </>
                                    ) : (
                                        <button onClick={() => router.post(`/admin/projects/${project.id}/contract`)} className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                            Generate contract
                                        </button>
                                    )}
                                </div>
                            </div>

                            {project.contract ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Status</p>
                                        <p className="mt-3 text-lg font-semibold text-slate-900">{project.contract.status}</p>
                                        <p className="mt-2 text-sm text-slate-500">Updated {new Date(project.contract.updated_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Secure sign link</p>
                                        <div className="mt-3 flex gap-2">
                                            <input readOnly value={signatureUrl} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none" />
                                            <button onClick={() => copyToClipboard(signatureUrl)} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600">
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[1.6rem] border border-dashed border-slate-200 px-8 py-14 text-center text-slate-500">
                                    No contract has been generated yet.
                                </div>
                            )}
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Plan y límites</h2>
                                    <p className="mt-1 text-sm text-slate-500">Lo que ve el owner y lo que termina recibiendo el cliente.</p>
                                </div>
                                <Link href="/admin/limits" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                    <ArrowUpRight className="h-4 w-4" />
                                    View limits
                                </Link>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Storage</p>
                                    <p className="mt-3 text-2xl font-semibold text-slate-900">{storageUsedGb} / {storageLimitGb} GB</p>
                                    <p className="mt-2 text-sm text-slate-500">Originals available: {project.high_res_available ? 'Yes' : 'No'}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Client quota</p>
                                    <p className="mt-3 text-2xl font-semibold text-slate-900">{project.is_full_gallery_purchased ? 'Full gallery unlocked' : `${project.weekly_download_limit || installationPlan?.weekly_download_limit || 0} downloads / week`}</p>
                                    <p className="mt-2 text-sm text-slate-500">Retention: {project.retention_days || installationPlan?.retention_days} days</p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {installationPlan?.highlights?.map((item) => (
                                    <span key={item} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600">{item}</span>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Galería y portafolio web</h2>
                                    <p className="mt-1 text-sm text-slate-500">El cliente ve todas las fotos del proyecto. La web pública solo muestra las que marques.</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                        Web portfolio: {portfolioCount}
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Client gallery link</p>
                                    <div className="mt-3 flex gap-2">
                                        <input readOnly value={galleryUrl} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none" />
                                        <button onClick={() => copyToClipboard(galleryUrl)} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600">
                                            <Share2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Client access code</p>
                                        <div className="mt-3 flex gap-2">
                                            <input readOnly value={project.gallery_password || ''} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 outline-none" />
                                            <button onClick={() => copyToClipboard(project.gallery_password || '')} className="rounded-xl border border-slate-200 px-3 py-2 text-slate-600">
                                                <Share2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-400">Con este codigo el cliente desbloquea la galeria completa y las descargas en alta resolucion.</p>
                                    </div>
                                </div>
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Public website category</p>
                                    <input
                                        value={websiteCategory}
                                        onChange={(event) => setWebsiteCategory(event.target.value)}
                                        placeholder="Wedding, Portrait, Commercial..."
                                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                                    />
                                    <textarea
                                        rows={3}
                                        value={websiteDescription}
                                        onChange={(event) => setWebsiteDescription(event.target.value)}
                                        placeholder="Short public description for this collection..."
                                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                                    />
                                    <p className="mt-2 text-xs text-slate-400">Saved automatically a moment after you stop typing.</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Hero and template</h3>
                                            <p className="text-sm text-slate-500">Both save automatically.</p>
                                        </div>
                                        <select
                                            value={templateCode}
                                            onChange={(event) => setTemplateCode(event.target.value)}
                                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                                        >
                                            {availableTemplates?.map((template) => (
                                                <option key={template.code} value={template.code}>{template.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div onClick={handleHeroFocusPick} className="relative aspect-[16/9] cursor-crosshair overflow-hidden rounded-[1.3rem] border border-slate-200 bg-white">
                                        {heroPhoto ? (
                                            <>
                                                <img
                                                    src={heroPhoto.url}
                                                    alt="Hero preview"
                                                    className="h-full w-full object-cover"
                                                    style={{ objectPosition: `${heroFocus.x}% ${heroFocus.y}%` }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                                                <div
                                                    className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
                                                    style={{ left: `${heroFocus.x}%`, top: `${heroFocus.y}%` }}
                                                />
                                            </>
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-slate-400">Upload photos to pick a hero.</div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-900">Upload & quick stats</h3>
                                        <Camera className="h-4 w-4 text-slate-400" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <MetricCard label="Selected" value={project.photos?.filter((photo) => photo.is_selected).length || 0} />
                                        <MetricCard label="Portfolio" value={portfolioCount} />
                                    </div>

                                    <input
                                        id="photo_upload"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) => {
                                            if (event.target.files.length > 0) {
                                                setIsUploading(true);
                                                const formData = new FormData();
                                                Array.from(event.target.files).forEach((file) => formData.append('photos[]', file));
                                                router.post(`/admin/projects/${project.id}/photos`, formData, {
                                                    forceFormData: true,
                                                    preserveScroll: true,
                                                    onProgress: (progress) => { if (progress.percentage) setUploadProgress(progress.percentage); },
                                                    onFinish: () => {
                                                        setIsUploading(false);
                                                        setUploadProgress(null);
                                                        document.getElementById('photo_upload').value = '';
                                                    },
                                                });
                                            }
                                        }}
                                    />

                                    <button onClick={() => document.getElementById('photo_upload').click()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                        <UploadCloud className="h-4 w-4" />
                                        Upload photos
                                    </button>
                                </div>
                            </div>

                            {project.photos?.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Tags className="h-4 w-4 text-slate-400" />
                                        <h3 className="font-semibold text-slate-900">Photo library</h3>
                                        <span className="text-xs text-slate-400">Tags and website selection autosave after a short pause.</span>
                                    </div>

                                    <div className="grid gap-4 xl:grid-cols-2">
                                        {project.photos.map((photo) => (
                                            <article key={photo.id} className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-50">
                                                <div className="aspect-[4/3] overflow-hidden">
                                                    <img src={photo.url} alt={`Photo ${photo.id}`} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="space-y-4 p-4">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Photo #{photo.id}</p>
                                                            <p className="mt-1 text-sm text-slate-500">{photo.category || 'General'}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setHeroPhotoId(photo.id)}
                                                                className={clsx(
                                                                    'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition',
                                                                    heroPhotoId === photo.id
                                                                        ? 'bg-slate-900 text-white'
                                                                        : 'border border-slate-200 bg-white text-slate-700'
                                                                )}
                                                            >
                                                                {heroPhotoId === photo.id ? 'Hero' : 'Use as hero'}
                                                            </button>
                                                            <button type="button" onClick={() => deletePhoto(photo)} className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={photoState[photo.id]?.tags || ''}
                                                        onChange={(event) => queuePhotoSave(photo.id, { tags: event.target.value })}
                                                        placeholder="wedding, ceremony, couple"
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
                                                    />

                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(photoState[photo.id]?.tags || '')
                                                            .split(',')
                                                            .map((tag) => tag.trim())
                                                            .filter(Boolean)
                                                            .map((tag) => (
                                                                <span key={`${photo.id}-${tag}`} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700">{tag}</span>
                                                            ))}
                                                    </div>

                                                    <label className="flex items-center justify-between rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                                        <span className="inline-flex items-center gap-2">
                                                            <Globe className="h-4 w-4 text-slate-400" />
                                                            Show on website portfolio
                                                        </span>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!photoState[photo.id]?.show_on_website}
                                                            onChange={(event) => queuePhotoSave(photo.id, { show_on_website: event.target.checked })}
                                                            className="h-4 w-4 rounded border-slate-300 text-primary-600"
                                                        />
                                                    </label>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary-500" />
                                <h2 className="font-semibold text-slate-900">Timeline</h2>
                            </div>
                            <div className="mt-6 space-y-5">
                                {[
                                    { label: 'Contrato creado', done: !!project.contract },
                                    { label: 'Firma del cliente', done: project.contract?.status === 'signed' },
                                    { label: 'Galería del cliente activa', done: !!project.gallery_token },
                                    { label: 'Fotos visibles en la web', done: portfolioCount > 0 },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className={clsx('h-3 w-3 rounded-full', item.done ? 'bg-emerald-500' : 'bg-slate-200')} />
                                        <span className={clsx('text-sm', item.done ? 'text-slate-800' : 'text-slate-400')}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-400" />
                                <h2 className="font-semibold text-slate-900">Invoices</h2>
                            </div>
                            <div className="space-y-3">
                                {project.invoices?.length > 0 ? project.invoices.map((invoice) => (
                                    <div key={invoice.id} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-slate-900">{invoice.concept}</p>
                                                <p className="mt-1 text-sm text-slate-500">Due {new Date(invoice.due_date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-slate-900">${invoice.amount}</p>
                                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{invoice.status}</p>
                                            </div>
                                        </div>
                                        {invoice.status !== 'paid' && (
                                            <button
                                                onClick={() => router.put(`/admin/invoices/${invoice.id}/pay`)}
                                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Mark as paid
                                            </button>
                                        )}
                                    </div>
                                )) : (
                                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
                                        No invoices yet.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                                <Download className="h-6 w-6" />
                            </div>
                            <h2 className="font-semibold text-slate-900">Client-facing limits</h2>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                Current gallery template: <strong>{templateCode}</strong>. Weekly downloads: <strong>{project.is_full_gallery_purchased ? 'Unlimited' : (project.weekly_download_limit || installationPlan?.weekly_download_limit || 0)}</strong>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isUploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                        <div className="w-[380px] rounded-[2rem] bg-white p-10 text-center shadow-2xl">
                            <UploadCloud className="mx-auto mb-4 h-14 w-14 animate-pulse text-primary-500" />
                            <h2 className="text-xl font-semibold text-slate-900">Uploading photos</h2>
                            <p className="mt-2 text-sm text-slate-500">Syncing originals and web versions to Cloudflare R2.</p>
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

function MetricCard({ label, value }) {
    return (
        <div className="rounded-[1.2rem] border border-slate-200 bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
    );
}
