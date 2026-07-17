import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { ChevronLeft, Download, FileText, Heart, ImageDown, Mail, Video, Users, Camera, CheckCircle2, Copy, Check, FileDown } from 'lucide-react';
import { clsx } from 'clsx';

const formatDateTime = (value) => value ? new Date(value).toLocaleString() : 'Sin fecha';
const formatDate = (value) => value ? new Date(value).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function downloadCsv(filename, rows) {
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function ClientInitial({ name, email }) {
    const letter = (name || email || '?').trim()[0].toUpperCase();
    const colors = [
        'bg-violet-100 text-violet-700',
        'bg-sky-100 text-sky-700',
        'bg-emerald-100 text-emerald-700',
        'bg-amber-100 text-amber-700',
        'bg-rose-100 text-rose-700',
        'bg-indigo-100 text-indigo-700',
    ];
    const color = colors[(letter.charCodeAt(0) || 0) % colors.length];
    return (
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}>
            {letter}
        </div>
    );
}

function PhotoThumb({ photo }) {
    if (!photo.thumbnail_url) {
        return (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                <Camera className="h-4 w-4" />
            </div>
        );
    }
    return (
        <div className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            <img
                src={photo.thumbnail_url}
                alt={photo.filename}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
            />
            <div className="absolute inset-0 flex items-end justify-start bg-gradient-to-t from-black/40 to-[rgba(0,0,0,0)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <span className="truncate px-1.5 pb-1 text-[9px] font-medium text-white">{photo.filename}</span>
            </div>
        </div>
    );
}

function ClientSelectionCard({ client }) {
    const MAX_VISIBLE = 18;
    const visiblePhotos = client.photos.slice(0, MAX_VISIBLE);
    const remaining = client.photo_count - MAX_VISIBLE;
    const [copied, setCopied] = React.useState(false);

    const filenames = client.photos.map(p => p.filename);

    const handleCopy = () => {
        const text = filenames.join('\n');
        const tryFallback = () => {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;border:none;outline:none';
            document.body.appendChild(el);
            el.focus();
            el.setSelectionRange(0, el.value.length);
            document.execCommand('copy');
            document.body.removeChild(el);
        };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).catch(tryFallback);
        } else {
            tryFallback();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCsv = () => {
        const label = client.visitor_name || client.visitor_email || 'cliente';
        const rows = ['Archivo', ...filenames];
        downloadCsv(`seleccion-${label.replace(/[^a-z0-9]/gi, '-')}.csv`, rows);
    };

    return (
        <div className="rounded-[1.6rem] border border-[#ece5d8] bg-white p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ClientInitial name={client.visitor_name} email={client.visitor_email} />
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                            {client.visitor_name || 'Cliente sin nombre'}
                        </p>
                        <p className="truncate text-sm text-slate-500">{client.visitor_email || 'Sin correo'}</p>
                    </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">
                            {client.photo_count} {client.photo_count === 1 ? 'foto' : 'fotos'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleCopy}
                            title="Copiar nombres de archivo"
                            className={clsx(
                                'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors',
                                copied
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-[#e2dbd3] bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                            )}
                        >
                            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copied ? 'Copiado' : 'Copiar'}
                        </button>
                        <button
                            onClick={handleCsv}
                            title="Descargar CSV"
                            className="flex items-center gap-1.5 rounded-full border border-[#e2dbd3] bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                        >
                            <FileDown className="h-3 w-3" />
                            CSV
                        </button>
                    </div>
                    {client.updated_at && (
                        <p className="text-[11px] text-slate-400">{formatDate(client.updated_at)}</p>
                    )}
                </div>
            </div>

            <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9">
                {visiblePhotos.map((photo) => (
                    <PhotoThumb key={photo.id} photo={photo} />
                ))}
                {remaining > 0 && (
                    <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500">
                        +{remaining}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Management({ project, installationPlan, billingSettings, analytics }) {
    const { flash } = usePage().props;
    const [downloadTab, setDownloadTab] = React.useState('gallery');
    const invoiceForm = useForm({
        amount: '',
        concept: '',
        due_date: '',
        itbms_enabled: !!billingSettings?.itbms_enabled,
        alanube_enabled: !!billingSettings?.alanube_enabled,
    });

    const clientSelections = analytics?.client_selections || [];
    const totalSelectedPhotos = clientSelections.reduce((sum, c) => sum + c.photo_count, 0);

    const createInvoice = (event) => {
        event.preventDefault();
        invoiceForm.post(`/admin/projects/${project.id}/invoices`, { preserveScroll: true, onSuccess: () => invoiceForm.reset('amount', 'concept', 'due_date') });
    };

    return (
        <AdminLayout>
            <Head title={`Gestion: ${project.name}`} />

            <div className="space-y-8">
                <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a colecciones
                </Link>

                <ProjectWorkspaceNav project={project} current="management" />

                {(flash?.success || flash?.error) && (
                    <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                {/* Fotos seleccionadas por cliente */}
                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Para editar</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Fotos seleccionadas por cliente</h2>
                            <p className="mt-2 text-sm leading-7 text-slate-500">
                                Las fotos que cada cliente marco con corazon en la galeria. Estas son las que debes editar y entregar.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-start gap-3">
                            <div className="rounded-[1.3rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-3 text-center">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Clientes</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">{clientSelections.length}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-3 text-center">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fotos a editar</p>
                                <p className="mt-2 text-xl font-semibold text-emerald-700">{totalSelectedPhotos}</p>
                            </div>
                            {clientSelections.length > 0 && (
                                <button
                                    onClick={() => {
                                        const rows = ['Cliente,Correo,Archivo'];
                                        clientSelections.forEach(c => {
                                            c.photos.forEach(p => {
                                                rows.push(`"${(c.visitor_name || '').replace(/"/g, '""')}","${(c.visitor_email || '').replace(/"/g, '""')}","${p.filename.replace(/"/g, '""')}"`);
                                            });
                                        });
                                        downloadCsv(`selecciones-completas.csv`, rows);
                                    }}
                                    className="flex items-center gap-2 self-start rounded-[1.3rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900"
                                >
                                    <FileDown className="h-4 w-4" />
                                    Exportar todo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6">
                        {clientSelections.length > 0 ? (
                            <div className="space-y-4">
                                {clientSelections.map((client) => (
                                    <ClientSelectionCard key={client.client_hash} client={client} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] bg-[#fbf9f6] px-6 py-20 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                                    <Heart className="h-7 w-7 text-slate-300" />
                                </div>
                                <h4 className="mt-5 text-lg font-semibold text-slate-900">Ningun cliente ha seleccionado fotos aun</h4>
                                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                                    Cuando tus clientes marquen fotos con corazon en la galeria, apareceran aqui organizadas por cliente para que sepas exactamente cuales editar.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Contrato, plan y facturas */}
                <div className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr]">
                    <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Gestion</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Contrato, plan y cobro</h2>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Contrato</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{project.contract ? project.contract.status : 'Sin generar'}</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {project.contract ? (
                                        <>
                                            <Link href="/admin/contracts" className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700">Editar contrato</Link>
                                            <Link href={`/sign/${project.contract.token}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white">
                                                <Download className="h-4 w-4" />PDF
                                            </Link>
                                        </>
                                    ) : (
                                        <button onClick={() => router.post(`/admin/projects/${project.id}/contract`)} className="rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white">Generar contrato</button>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Plan y limites</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">{installationPlan?.name}</p>
                                <p className="mt-1 text-sm text-slate-500">Retencion: {project.retention_days || installationPlan?.retention_days} dias</p>
                                <p className="mt-1 text-sm text-slate-500">Descargas por semana: {project.weekly_download_limit || installationPlan?.weekly_download_limit || 0}</p>
                            </div>

                            <form onSubmit={createInvoice} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Nueva factura</p>
                                <div className="mt-4 space-y-3">
                                    <input type="number" min="0" step="0.01" value={invoiceForm.data.amount} onChange={(e) => invoiceForm.setData('amount', e.target.value)} placeholder="Monto base" className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
                                    <input type="text" value={invoiceForm.data.concept} onChange={(e) => invoiceForm.setData('concept', e.target.value)} placeholder="Concepto" className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
                                    <input type="date" value={invoiceForm.data.due_date} onChange={(e) => invoiceForm.setData('due_date', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
                                </div>
                                <button type="submit" disabled={invoiceForm.processing} className="mt-5 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white">
                                    {invoiceForm.processing ? 'Creando...' : 'Crear factura'}
                                </button>
                            </form>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                        <div className="flex items-center gap-2 text-slate-700">
                            <FileText className="h-4 w-4" />
                            <h2 className="text-xl font-semibold">Facturas del proyecto</h2>
                        </div>
                        <div className="mt-6 space-y-4">
                            {(project.invoices || []).length > 0 ? project.invoices.map((invoice) => (
                                <div key={invoice.id} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div>
                                            <p className="text-lg font-semibold text-slate-900">{invoice.concept}</p>
                                            <p className="mt-1 text-sm text-slate-500">Vence {new Date(invoice.due_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-slate-900">${invoice.total || invoice.amount}</p>
                                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{invoice.status}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button onClick={() => router.put(`/admin/invoices/${invoice.id}/toggle-tax`)} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                            {invoice.itbms_enabled ? 'Quitar 7%' : 'Aplicar 7%'}
                                        </button>
                                        <button onClick={() => {
                                            const amount = window.prompt('Monto del pago parcial', invoice.balance_due || invoice.total || invoice.amount);
                                            if (!amount) return;
                                            router.post(`/admin/invoices/${invoice.id}/payments`, { amount, method: 'manual', reference: `MANUAL-${invoice.invoice_number || invoice.id}` }, { preserveScroll: true });
                                        }} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                            Registrar pago
                                        </button>
                                        <button onClick={() => router.post(`/admin/invoices/${invoice.id}/alanube`, {}, { preserveScroll: true })} disabled={!invoice.alanube_enabled} className={`rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${invoice.alanube_enabled ? 'border border-[#dbeee4] bg-[#eef8f3] text-[#16794f]' : 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'}`}>
                                            {invoice.alanube_status === 'submitted' ? 'Alanube enviado' : 'Enviar a Alanube'}
                                        </button>
                                        <a href={`/admin/invoices/${invoice.id}/pdf`} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                            Descargar PDF
                                        </a>
                                        {invoice.status !== 'paid' && (
                                            <button onClick={() => router.put(`/admin/invoices/${invoice.id}/pay`)} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                                                Marcar pagada
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-16 text-center text-sm text-slate-400">Todavia no hay facturas en esta coleccion.</div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Actividad de la coleccion */}
                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Analisis</p>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Actividad de la coleccion</h2>
                            <p className="mt-2 text-sm leading-7 text-slate-500">Aqui se concentra lo que pasa cuando el cliente entra, descarga, marca favoritos o registra su correo antes de abrir la galeria.</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[1.3rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Descargas</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">{(analytics?.downloads?.summary?.gallery_count || 0) + (analytics?.downloads?.summary?.photo_count || 0) + (analytics?.downloads?.summary?.video_count || 0)}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Favoritos</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">{analytics?.favorites?.lists_count || 0}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Correos registrados</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900">{analytics?.registrations?.count || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-[1.8rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Actividad de descargas</p>
                                    <h3 className="mt-2 text-lg font-semibold text-slate-900">Descargas registradas</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'gallery', label: 'Galeria', icon: ImageDown },
                                        { key: 'photo', label: 'Foto individual', icon: Download },
                                        { key: 'video', label: 'Video individual', icon: Video },
                                    ].map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setDownloadTab(key)}
                                            className={clsx(
                                                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition',
                                                downloadTab === key
                                                    ? 'bg-[#171411] text-white'
                                                    : 'border border-[#ddd5c9] bg-white text-slate-600'
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-5">
                                {(analytics?.downloads?.[downloadTab] || []).length > 0 ? (
                                    <div className="space-y-3">
                                        {analytics.downloads[downloadTab].map((item) => (
                                            <div key={item.id} className="rounded-[1.2rem] border border-[#e8e0d5] bg-white px-4 py-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900">{item.visitor_email || 'Visitante sin correo visible'}</p>
                                                        <p className="mt-1 text-sm text-slate-500">{item.photo_label || (downloadTab === 'gallery' ? 'Descarga completa de galeria' : 'Elemento descargado')}</p>
                                                    </div>
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(item.created_at)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-[1.6rem] border border-dashed border-[#ddd5c9] bg-white px-6 py-16 text-center">
                                        <ImageDown className="mx-auto h-10 w-10 text-slate-300" />
                                        <h4 className="mt-5 text-lg font-semibold text-slate-900">
                                            {downloadTab === 'gallery' && 'Aun no hay descargas de la galeria'}
                                            {downloadTab === 'photo' && 'Aun no hay descargas de fotos individuales'}
                                            {downloadTab === 'video' && 'Aun no hay descargas de videos individuales'}
                                        </h4>
                                        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                                            {downloadTab === 'gallery' && 'Los detalles de la actividad de descargas de la galeria apareceran aqui cuando los visitantes descarguen todas las fotos de su coleccion.'}
                                            {downloadTab === 'photo' && 'Los detalles de la actividad de descargas individuales apareceran aqui cuando el cliente descargue una foto puntual de la coleccion.'}
                                            {downloadTab === 'video' && 'Los detalles de la actividad de descargas de video apareceran aqui cuando existan videos publicados dentro de esta coleccion.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-[1.8rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Actividad de favoritos</p>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900">Historial reciente</h3>
                                    </div>
                                    <Heart className="h-5 w-5 text-slate-300" />
                                </div>

                                <div className="mt-5">
                                    {(analytics?.favorites?.activity || []).length > 0 ? (
                                        <div className="space-y-3">
                                            {analytics.favorites.activity.map((item) => (
                                                <div key={item.id} className="rounded-[1.2rem] border border-[#e8e0d5] bg-white px-4 py-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{item.visitor_email || 'Cliente identificado'}</p>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {item.action === 'added' ? 'Agrego a favoritos' : 'Quito de favoritos'}
                                                                {item.photo_label ? ` · ${item.photo_label}` : ''}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(item.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-[1.6rem] border border-dashed border-[#ddd5c9] bg-white px-6 py-14 text-center">
                                            <Heart className="mx-auto h-10 w-10 text-slate-300" />
                                            <h4 className="mt-5 text-lg font-semibold text-slate-900">Aun no hay actividad de favoritos</h4>
                                            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                                                Los detalles de la actividad de favoritos apareceran aqui cuando los visitantes creen o actualicen sus listas de favoritos.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[1.8rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Registro de correo electronico</p>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900">Accesos identificados</h3>
                                    </div>
                                    <Mail className="h-5 w-5 text-slate-300" />
                                </div>

                                <div className="mt-5">
                                    {(analytics?.registrations?.activity || []).length > 0 ? (
                                        <div className="space-y-3">
                                            {analytics.registrations.activity.map((item) => (
                                                <div key={item.id} className="rounded-[1.2rem] border border-[#e8e0d5] bg-white px-4 py-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">{item.visitor_name || 'Visitante'}</p>
                                                            <p className="mt-1 text-sm text-slate-500">{item.visitor_email}</p>
                                                        </div>
                                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(item.created_at)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="rounded-[1.6rem] border border-dashed border-[#ddd5c9] bg-white px-6 py-14 text-center">
                                            <Mail className="mx-auto h-10 w-10 text-slate-300" />
                                            <h4 className="mt-5 text-lg font-semibold text-slate-900">Aun no hay actividad de registro de correo</h4>
                                            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                                                La actividad de registro de correo aparecera aqui cuando los visitantes registren su correo antes de ver la coleccion.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
