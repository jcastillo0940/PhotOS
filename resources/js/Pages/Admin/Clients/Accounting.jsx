import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ChevronLeft, CreditCard, FileText, FolderOpen, Wallet } from 'lucide-react';

export default function Accounting({ client }) {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title={`Estado de cuenta: ${client.full_name}`} />

                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                            <ChevronLeft className="h-4 w-4" /> Volver a Leads
                        </Link>
                        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{client.full_name}</h1>
                        <p className="mt-2 text-sm text-slate-500">{client.email || 'Sin correo'} · {client.phone || 'Sin telefono'}</p>
                    </div>
                </div>

                <section className="grid gap-4 md:grid-cols-4">
                    <MetricCard icon={FolderOpen} label="Proyectos" value={client.summary.project_count} />
                    <MetricCard icon={FileText} label="Facturas" value={client.summary.invoice_count} />
                    <MetricCard icon={Wallet} label="Saldo abierto" value={`$${Number(client.summary.open_balance).toFixed(2)}`} />
                    <MetricCard icon={CreditCard} label="Pagos" value={`$${Number(client.summary.payment_total).toFixed(2)}`} />
                </section>

                <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Facturacion</h2>
                        <div className="mt-6 space-y-4">
                            {client.invoices.length ? client.invoices.map((invoice) => (
                                <div key={invoice.id} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-slate-900">{invoice.invoice_number || `Factura #${invoice.id}`}</p>
                                            <p className="mt-1 text-sm text-slate-500">{invoice.concept}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{invoice.status} · Alanube {invoice.alanube_status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">${Number(invoice.total).toFixed(2)}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Saldo ${Number(invoice.balance_due).toFixed(2)}</p>
                                        </div>
                                    </div>
                                    {invoice.project_id && (
                                        <Link href={`/admin/projects/${invoice.project_id}/management`} className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
                                            Abrir factura en proyecto
                                        </Link>
                                    )}
                                </div>
                            )) : <p className="text-sm text-slate-500">Todavia no hay facturas registradas.</p>}
                        </div>
                    </article>

                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Estado de cuenta</h2>
                        <div className="mt-6 space-y-3">
                            {client.statements.length ? client.statements.map((entry) => (
                                <div key={entry.id} className="flex items-center justify-between rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                                    <div>
                                        <p className="font-semibold text-slate-900">{entry.description}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{entry.entry_type} · {entry.reference || 'sin referencia'} · {entry.occurred_at}</p>
                                    </div>
                                    <p className={`font-semibold ${entry.amount < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        ${Number(entry.amount).toFixed(2)}
                                    </p>
                                </div>
                            )) : <p className="text-sm text-slate-500">Todavia no hay movimientos.</p>}
                        </div>
                    </article>
                </section>
            </div>
        </AdminLayout>
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
