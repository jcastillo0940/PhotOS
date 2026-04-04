import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Camera, CreditCard, FileText, FolderOpen, Wallet } from 'lucide-react';

export default function Dashboard({ projects = [], invoices = [], summary, statement = [] }) {
    return (
        <div className="min-h-screen bg-[#f6f7fb] px-6 py-10 md:px-10">
            <Head title="Client Dashboard" />

            <div className="mx-auto max-w-6xl space-y-8">
                <section className="rounded-[2rem] bg-white p-8 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Cliente</p>
                    <h1 className="mt-3 text-3xl font-semibold text-slate-900">Tus proyectos, facturas y estado de cuenta</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                        Este panel reune tus galerias, facturas pendientes, saldo y el avance de tus proyectos en un solo lugar.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <MetricCard icon={FolderOpen} label="Proyectos" value={summary?.projects || 0} />
                    <MetricCard icon={Wallet} label="Saldo abierto" value={`$${Number(summary?.open_balance || 0).toFixed(2)}`} />
                    <MetricCard icon={CreditCard} label="Facturas pagadas" value={summary?.paid_invoices || 0} />
                    <MetricCard icon={FileText} label="Facturas pendientes" value={summary?.pending_invoices || 0} />
                </section>

                <section className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Camera className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900">Proyectos activos</h2>
                        </div>
                        <div className="mt-6 space-y-4">
                            {projects.length > 0 ? projects.map((project) => (
                                <div key={project.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{project.name}</p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Fecha por definir'} · {project.photo_count} fotos
                                            </p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{project.status}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {project.gallery_token && (
                                                <Link href={`/gallery/${project.gallery_token}`} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                                    Ver galeria
                                                </Link>
                                            )}
                                            <span className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                                Saldo ${Number(project.balance_due || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">Todavia no hay proyectos asociados a este usuario.</p>
                            )}
                        </div>
                    </article>

                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900">Facturas y estado de cuenta</h2>
                        </div>
                        <div className="mt-6 space-y-4">
                            {invoices.length > 0 ? invoices.map((invoice) => (
                                <div key={invoice.id} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-slate-900">{invoice.invoice_number || `Factura #${invoice.id}`}</p>
                                            <p className="mt-1 text-sm text-slate-500">{invoice.concept}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                                                {invoice.itbms_enabled ? 'ITBMS 7% aplicado' : 'Sin ITBMS'} · Alanube {invoice.alanube_status}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">${Number(invoice.total || 0).toFixed(2)}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{invoice.status}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
                                        <div>Subtotal: ${Number(invoice.subtotal || 0).toFixed(2)}</div>
                                        <div>Impuesto: ${Number(invoice.tax_amount || 0).toFixed(2)}</div>
                                        <div>Saldo: ${Number(invoice.balance_due || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">Todavia no hay facturas para mostrar.</p>
                            )}
                        </div>
                    </article>
                </section>

                <section className="rounded-[2rem] bg-white p-8 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-900">Estado de cuenta</h2>
                    <div className="mt-6 space-y-3">
                        {statement.length > 0 ? statement.map((entry) => (
                            <div key={entry.id} className="flex flex-col gap-2 rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="font-semibold text-slate-900">{entry.description}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                                        {entry.entry_type} · {entry.reference || 'sin referencia'} · {entry.occurred_at}
                                    </p>
                                </div>
                                <p className={`font-semibold ${entry.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                    ${Number(entry.amount).toFixed(2)}
                                </p>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">Todavia no hay movimientos registrados.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value }) {
    return (
        <article className="rounded-[1.6rem] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </article>
    );
}
