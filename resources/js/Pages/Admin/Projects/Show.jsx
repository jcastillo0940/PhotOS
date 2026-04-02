import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    ChevronLeft, Share2, Zap, BadgeCheck, Clock, MapPin, 
    FileText, ExternalLink, Calendar, ShieldCheck, Download, 
    CheckCircle2, Camera, UploadCloud, Save, Trash2, Tags
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export default function Show({ project, installationPlan, availableTemplates }) {
    const [uploadProgress, setUploadProgress] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const signatureUrl = `${window.location.origin}/sign/${project.contract?.token}`;
    const [heroPhotoId, setHeroPhotoId] = useState(project.hero_photo_id || project.photos?.[0]?.id || null);
    const [heroFocus, setHeroFocus] = useState({
        x: parseFloat(project.hero_focus_x || '50%'),
        y: parseFloat(project.hero_focus_y || '50%'),
    });
    const [photoTagInputs, setPhotoTagInputs] = useState(
        Object.fromEntries((project.photos || []).map(photo => [
            photo.id,
            (photo.tags?.length ? photo.tags : (photo.category ? [photo.category] : [])).join(', '),
        ]))
    );
    const heroPhoto = project.photos?.find(p => p.id === heroPhotoId) || project.photos?.[0] || null;
    const storageUsedGb = ((project.originals_usage_bytes || 0) / (1024 ** 3)).toFixed(2);
    const storageLimitGb = installationPlan?.storage_limit_gb || 0;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('¡Link copiado al portapapeles!');
    };

    const saveHero = (payload = {}) => {
        router.put(`/admin/projects/${project.id}`, {
            hero_photo_id: heroPhotoId,
            hero_focus_x: `${Math.round((payload.x ?? heroFocus.x))}%`,
            hero_focus_y: `${Math.round((payload.y ?? heroFocus.y))}%`,
        }, { preserveScroll: true });
    };

    const handleHeroFocusPick = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
        setHeroFocus({ x, y });
        saveHero({ x, y });
    };

    const savePhotoTags = (photo) => {
        const tags = (photoTagInputs[photo.id] || '').split(',').map(t => t.trim()).filter(Boolean);
        router.put(`/admin/projects/${project.id}/photos/${photo.id}`, {
            category: tags[0] || photo.category || 'General',
            tags,
        }, { preserveScroll: true });
    };

    const deletePhoto = (photo) => {
        if (!window.confirm('¿Eliminar esta foto del proyecto y del bucket?')) return;
        router.post(`/admin/projects/${project.id}/photos/${photo.id}`, { _method: 'delete' }, { preserveScroll: true });
    };

    const statusLabels = { active: 'Activo', pending_payment: 'Pago pendiente', editing: 'Edición', delivered: 'Entregado' };
    const statusColors = {
        active: 'bg-blue-50 text-blue-700 border-blue-100',
        pending_payment: 'bg-amber-50 text-amber-700 border-amber-100',
        editing: 'bg-purple-50 text-purple-700 border-purple-100',
        delivered: 'bg-green-50 text-green-700 border-green-100',
    };

    return (
        <AdminLayout>
            <div className="flex flex-col space-y-8">
                <Head title={`Proyecto: ${project.name}`} />

                <Link href="/admin/projects" className="group flex items-center text-slate-500 hover:text-slate-900 transition-all text-sm font-medium w-fit">
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    Volver a Proyectos
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Header card */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-3">{project.name}</h1>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="flex items-center text-slate-500 text-sm gap-1.5">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Fecha por definir'}
                                        </span>
                                        <span className="flex items-center text-slate-500 text-sm gap-1.5">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {project.location || 'Sin ubicación'}
                                        </span>
                                        <span className="flex items-center text-slate-500 text-sm gap-1.5">
                                            <BadgeCheck className="w-4 h-4 text-slate-400" />
                                            {installationPlan?.name}
                                        </span>
                                    </div>
                                </div>
                                <span className={clsx("px-3 py-1.5 rounded-full text-xs font-medium border self-start sm:self-center", statusColors[project.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                                    {statusLabels[project.status] || project.status}
                                </span>
                            </div>
                        </div>

                        {/* Contract card */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">Estado Legal</h3>
                                    <p className="text-xs text-slate-500">Gestión de contratos</p>
                                </div>
                            </div>

                            {project.contract ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contrato Digital</span>
                                            {project.contract.status === 'signed' ? (
                                                <span className="flex items-center text-green-700 text-xs font-medium gap-1">
                                                    <BadgeCheck className="w-3.5 h-3.5" /> Firmado
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-amber-600 text-xs font-medium gap-1">
                                                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Pendiente
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 mb-4">
                                            Versión 1.0 — Actualizado {new Date(project.contract.updated_at).toLocaleDateString()}
                                        </p>
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                                                <FileText className="w-3.5 h-3.5 inline mr-1.5" /> Ver términos
                                            </button>
                                            <a href={`/sign/${project.contract.token}`} target="_blank" rel="noreferrer"
                                               className="w-10 h-10 rounded-xl bg-primary-50 hover:bg-primary-100 flex items-center justify-center text-primary-600 border border-primary-100 transition-all">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl">
                                        <Share2 className="w-6 h-6 text-white/30 mb-3" />
                                        <h4 className="text-white font-semibold mb-1.5">Compartir link de firma</h4>
                                        <p className="text-white/70 text-xs mb-4">Envía al cliente para finalizar la reserva.</p>
                                        <button onClick={() => copyToClipboard(signatureUrl)}
                                            className="w-full py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-white text-xs font-medium transition-all border border-white/20">
                                            Copiar link seguro
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-center">
                                    <FileText className="w-10 h-10 text-slate-300 mb-3" />
                                    <h4 className="font-semibold text-slate-700 mb-1.5">Sin contrato generado</h4>
                                    <p className="text-sm text-slate-500 mb-5 max-w-sm">No hay un acuerdo legal vinculante aún. Genera uno para asegurar la reserva.</p>
                                    <button onClick={() => router.post(`/admin/projects/${project.id}/contract`)}
                                        className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors">
                                        + Generar Contrato
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Plan info */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800">Plan Global Activo</h3>
                                <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-medium">
                                    {installationPlan?.tagline || 'Operación completa'}
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Cobertura</p>
                                    <h4 className="font-bold text-slate-800 mb-2">{installationPlan?.name}</h4>
                                    <p className="text-sm text-slate-600 mb-3">{installationPlan?.audience}</p>
                                    <div className="space-y-1 text-xs text-slate-500">
                                        <p>Originales usados: {storageUsedGb} GB / {storageLimitGb} GB</p>
                                        <p>Alta resolución: {project.high_res_available ? 'Disponible' : 'No disponible'}</p>
                                        <p>Expiran: {project.originals_expires_at ? new Date(project.originals_expires_at).toLocaleDateString() : 'Sin fecha'}</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Plantilla del cliente</p>
                                    <select
                                        value={project.gallery_template_code || availableTemplates?.[0]?.code || ''}
                                        onChange={(e) => router.put(`/admin/projects/${project.id}`, { gallery_template_code: e.target.value }, { preserveScroll: true })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all"
                                    >
                                        {availableTemplates?.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
                                    </select>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {installationPlan?.highlights?.map(item => (
                                            <span key={item} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Billing */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Facturación e Hitos</h3>
                                        <p className="text-xs text-slate-500">Control de pagos</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                                    + Generar factura
                                </button>
                            </div>
                            <div className="space-y-3">
                                {project.invoices?.length > 0 ? project.invoices.map((inv) => (
                                    <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx("w-9 h-9 rounded-xl flex items-center justify-center", inv.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')}>
                                                {inv.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{inv.concept}</p>
                                                <p className="text-xs text-slate-500">Vence {new Date(inv.due_date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold text-slate-800">${inv.amount}</p>
                                                <p className="text-xs text-slate-500">{inv.status}</p>
                                            </div>
                                            {inv.status !== 'paid' && (
                                                <button onClick={() => router.put(`/admin/invoices/${inv.id}/pay`)}
                                                    className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors">
                                                    Marcar pagado
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm">
                                        Sin facturas registradas
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Photo gallery */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-primary-600">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Galería de Fotos</h3>
                                        <p className="text-xs text-slate-500">Entrega y proofing en tiempo real</p>
                                    </div>
                                </div>
                                <Link href={`/gallery/${project.gallery_token}`}
                                    className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all">
                                    Vista pública
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Selecciones</p>
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-3xl font-bold text-slate-800">{project.photos?.filter(p => p.is_selected).length || 0}</p>
                                            <p className="text-xs text-primary-600 font-medium">Favoritas</p>
                                        </div>
                                        <div className="w-px h-10 bg-slate-200" />
                                        <div>
                                            <p className="text-3xl font-bold text-slate-800">{project.photos?.length || 0}</p>
                                            <p className="text-xs text-slate-500 font-medium">Total</p>
                                        </div>
                                    </div>
                                    <input type="file" multiple accept="image/*" className="hidden" id="photo_upload"
                                        onChange={e => {
                                            if (e.target.files.length > 0) {
                                                setIsUploading(true);
                                                const formData = new FormData();
                                                Array.from(e.target.files).forEach(file => formData.append('photos[]', file));
                                                router.post(`/admin/projects/${project.id}/photos`, formData, {
                                                    forceFormData: true, preserveScroll: true,
                                                    onProgress: p => { if (p.percentage) setUploadProgress(p.percentage); },
                                                    onFinish: () => { setIsUploading(false); setUploadProgress(null); document.getElementById('photo_upload').value = ''; }
                                                });
                                            }
                                        }} />
                                    <button onClick={() => document.getElementById('photo_upload').click()}
                                        className="mt-4 w-full py-2.5 bg-primary-500 text-white rounded-xl text-xs font-semibold hover:bg-primary-600 transition-colors">
                                        Subir fotos
                                    </button>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Acceso público</p>
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-300" />
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">Token seguro — el cliente puede elegir favoritos en tiempo real.</p>
                                    <div className="flex items-center gap-2">
                                        <input readOnly value={`${window.location.origin}/gallery/${project.gallery_token}`}
                                            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-primary-600 font-mono flex-1 outline-none" />
                                        <button onClick={() => copyToClipboard(`${window.location.origin}/gallery/${project.gallery_token}`)}
                                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-all">
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Photo library */}
                            {project.photos?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Tags className="w-4 h-4 text-slate-400" />
                                        <h4 className="font-semibold text-sm text-slate-700">Biblioteca de Fotos</h4>
                                        <span className="text-xs text-slate-400">— tags y gestión</span>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {project.photos.map(photo => (
                                            <div key={photo.id} className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                                                <div className="aspect-[4/3]">
                                                    <img src={photo.url} alt={`Foto ${photo.id}`} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-xs font-semibold text-slate-500">Foto #{photo.id}</p>
                                                        <button type="button" onClick={() => deletePhoto(photo)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs font-medium hover:bg-red-100 transition-all">
                                                            <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                                        </button>
                                                    </div>
                                                    <input type="text"
                                                        value={photoTagInputs[photo.id] || ''}
                                                        onChange={e => setPhotoTagInputs(cur => ({ ...cur, [photo.id]: e.target.value }))}
                                                        placeholder="Ej: ceremonia, familia, retrato"
                                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all"
                                                    />
                                                    <div className="mt-2 flex flex-wrap gap-1.5 min-h-6">
                                                        {(photoTagInputs[photo.id] || '').split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                                                            <span key={`${photo.id}-${tag}`} className="px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 text-xs font-medium">{tag}</span>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 flex gap-2">
                                                        <button type="button" onClick={() => savePhotoTags(photo)}
                                                            className="flex items-center gap-1 px-3 py-2 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors">
                                                            <Save className="w-3.5 h-3.5" /> Guardar
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => { setHeroPhotoId(photo.id); router.put(`/admin/projects/${project.id}`, { hero_photo_id: photo.id, hero_focus_x: `${Math.round(heroFocus.x)}%`, hero_focus_y: `${Math.round(heroFocus.y)}%` }, { preserveScroll: true }); }}
                                                            className={clsx('px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                                                                heroPhotoId === photo.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')}>
                                                            {heroPhotoId === photo.id ? '★ Hero activo' : 'Usar de hero'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Hero focus picker */}
                            {project.photos?.length > 0 && (
                                <div className="mt-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold text-sm text-slate-800">Hero de la Galería</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">Haz clic para definir el punto focal</p>
                                        </div>
                                        <button onClick={() => saveHero()} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors">
                                            Guardar Hero
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
                                        <div onClick={handleHeroFocusPick}
                                            className="relative aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 cursor-crosshair">
                                            {heroPhoto ? (
                                                <>
                                                    <img src={heroPhoto.url} alt="Hero preview" className="w-full h-full object-cover"
                                                        style={{ objectPosition: `${heroFocus.x}% ${heroFocus.y}%` }} />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                                    <div className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2"
                                                        style={{ left: `${heroFocus.x}%`, top: `${heroFocus.y}%` }} />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                                    Sube fotos para elegir un hero
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                                            {project.photos.map(photo => (
                                                <button key={photo.id} type="button"
                                                    onClick={() => { setHeroPhotoId(photo.id); router.put(`/admin/projects/${project.id}`, { hero_photo_id: photo.id, hero_focus_x: `${Math.round(heroFocus.x)}%`, hero_focus_y: `${Math.round(heroFocus.y)}%` }, { preserveScroll: true }); }}
                                                    className={clsx('relative overflow-hidden rounded-xl border transition-all aspect-square',
                                                        heroPhotoId === photo.id ? 'border-primary-500 ring-2 ring-primary-500/30' : 'border-slate-200 hover:border-primary-300')}>
                                                    <img src={photo.url} alt={`Hero ${photo.id}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Roadmap */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Zap className="w-4 h-4 text-primary-500" />
                                <h3 className="font-semibold text-sm text-slate-800">Hoja de Ruta</h3>
                            </div>
                            <div className="space-y-5 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100" />
                                {[
                                    { label: 'Contrato creado', desc: 'Cumplimiento automático', done: true },
                                    { label: 'Firma del cliente', desc: 'Verificación e-signature', done: project.contract?.status === 'signed' },
                                    { label: 'Logística verificada', desc: 'Agenda actualizada', done: true },
                                    { label: 'Entrega de galería', desc: 'Preparación fase 5', done: false },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-start gap-4 relative z-10">
                                        <div className={clsx("w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0",
                                            step.done ? 'bg-green-500 border-green-500' : 'bg-white border-slate-200')} />
                                        <div>
                                            <p className={clsx("text-sm font-medium leading-none mb-0.5", step.done ? 'text-slate-800' : 'text-slate-400')}>{step.label}</p>
                                            <p className="text-xs text-slate-400">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Final assets */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4">
                                <Download className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-slate-800 mb-1.5">Archivos Finales</h4>
                            <p className="text-xs text-slate-500 mb-5 leading-relaxed">El acceso a la galería se desbloqueará tras el pago final.</p>
                            <button disabled className="w-full py-2.5 bg-slate-100 rounded-xl text-xs font-medium text-slate-400 cursor-not-allowed">
                                Desbloquear acceso
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload overlay */}
            <AnimatePresence>
                {isUploading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md">
                        <div className="p-10 bg-white rounded-3xl shadow-2xl text-center w-[380px]">
                            <UploadCloud className="w-14 h-14 text-primary-500 mx-auto mb-4 animate-pulse" />
                            <h2 className="text-xl font-bold text-slate-800 mb-1.5">Sincronizando fotos</h2>
                            <p className="text-sm text-slate-500 mb-6">Subiendo a Cloudflare R2...</p>
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                                <motion.div className="bg-primary-500 h-full rounded-full"
                                    initial={{ width: 0 }} animate={{ width: `${uploadProgress || 0}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>0%</span>
                                <span className="font-semibold text-primary-600">{Math.round(uploadProgress || 0)}%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
