import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { ChevronLeft, Download, FileText, Heart, ImageDown, Mail, Video } from 'lucide-react';
import { clsx } from 'clsx';

const formatDateTime = (value) => value ? new Date(value).toLocaleString() : 'Sin fecha';

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

                {(flash?.success || flash?.error) && <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{flash?.error || flash?.success}</div>}

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
                                            <Link href={`/sign/${project.contract.token}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white"><Download className="h-4 w-4" />PDF</Link>
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
                                    <input type="number" min="0" step="0.01" value={invoiceForm.data.amount} onChange={(event) => invoiceForm.setData('amount', event.target.value)} placeholder="Monto base" className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
                                    <input type="text" value={invoiceForm.data.concept} onChange={(event) => invoiceForm.setData('concept', event.target.value)} placeholder="Concepto" className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
                                    <input type="date" value={invoiceForm.data.due_date} onChange={(event) => invoiceForm.setData('due_date', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" />
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
                            )) : <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-16 text-center text-sm text-slate-400">Todavia no hay facturas en esta coleccion.</div>}
                        </div>
                    </section>
                </div>

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
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900">Nueva lista de favoritos</h3>
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
