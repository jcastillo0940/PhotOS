import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { Camera, CreditCard, FileText, FolderOpen, Wallet } from 'lucide-react';
import { resolveTenantTheme } from '@/lib/tenantTheme';

export default function Dashboard({ projects = [], invoices = [], summary, statement = [] }) {
    const tenantTheme = resolveTenantTheme(usePage().props);
    const { palette, headingFont, bodyFont, studioName } = tenantTheme;

    return (
        <div className="min-h-screen px-6 py-10 md:px-10" style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: bodyFont }}>
            <Head title={`Portal cliente | ${studioName}`} />

            <div className="mx-auto max-w-6xl space-y-8">
                <section className="rounded-[2rem] bg-white p-8 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: palette.accent }}>{studioName}</p>
                    <h1 className="mt-3 text-3xl font-semibold" style={{ color: palette.text, fontFamily: headingFont }}>Tus proyectos, facturas y estado de cuenta</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: palette.muted }}>
                        Este panel reune tus galerias, facturas pendientes, saldo y el avance de tus proyectos en un solo lugar.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <MetricCard icon={FolderOpen} label="Proyectos" value={summary?.projects || 0} palette={palette} />
                    <MetricCard icon={Wallet} label="Saldo abierto" value={`$${Number(summary?.open_balance || 0).toFixed(2)}`} palette={palette} />
                    <MetricCard icon={CreditCard} label="Facturas pagadas" value={summary?.paid_invoices || 0} palette={palette} />
                    <MetricCard icon={FileText} label="Facturas pendientes" value={summary?.pending_invoices || 0} palette={palette} />
                </section>

                <section className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <Camera className="h-5 w-5" style={{ color: palette.accent }} />
                            <h2 className="text-lg font-semibold" style={{ color: palette.text, fontFamily: headingFont }}>Proyectos activos</h2>
                        </div>
                        <div className="mt-6 space-y-4">
                            {projects.length > 0 ? projects.map((project) => (
                                <div key={project.id} className="rounded-[1.5rem] border p-5" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: palette.text }}>{project.name}</p>
                                            <p className="mt-1 text-sm" style={{ color: palette.muted }}>
                                                {project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Fecha por definir'} · {project.photo_count} fotos
                                            </p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: palette.accent }}>{project.status}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {project.gallery_token && (
                                                <Link href={`/gallery/${project.gallery_token}`} className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ borderColor: palette.accent_soft, color: palette.text }}>
                                                    Ver galeria
                                                </Link>
                                            )}
                                            <span className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: palette.surface_dark }}>
                                                Saldo ${Number(project.balance_due || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm" style={{ color: palette.muted }}>Todavia no hay proyectos asociados a este usuario.</p>
                            )}
                        </div>
                    </article>

                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5" style={{ color: palette.accent }} />
                            <h2 className="text-lg font-semibold" style={{ color: palette.text, fontFamily: headingFont }}>Facturas y estado de cuenta</h2>
                        </div>
                        <div className="mt-6 space-y-4">
                            {invoices.length > 0 ? invoices.map((invoice) => (
                                <div key={invoice.id} className="rounded-[1.4rem] border p-4" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold" style={{ color: palette.text }}>{invoice.invoice_number || `Factura #${invoice.id}`}</p>
                                            <p className="mt-1 text-sm" style={{ color: palette.muted }}>{invoice.concept}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: palette.accent }}>
                                                {invoice.itbms_enabled ? 'ITBMS 7% aplicado' : 'Sin ITBMS'} · Alanube {invoice.alanube_status}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold" style={{ color: palette.text }}>${Number(invoice.total || 0).toFixed(2)}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: palette.accent }}>{invoice.status}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs" style={{ color: palette.muted }}>
                                        <div>Subtotal: ${Number(invoice.subtotal || 0).toFixed(2)}</div>
                                        <div>Impuesto: ${Number(invoice.tax_amount || 0).toFixed(2)}</div>
                                        <div>Saldo: ${Number(invoice.balance_due || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm" style={{ color: palette.muted }}>Todavia no hay facturas para mostrar.</p>
                            )}
                        </div>
                    </article>
                </section>

                <section className="rounded-[2rem] bg-white p-8 shadow-sm">
                    <h2 className="text-lg font-semibold" style={{ color: palette.text, fontFamily: headingFont }}>Estado de cuenta</h2>
                    <div className="mt-6 space-y-3">
                        {statement.length > 0 ? statement.map((entry) => (
                            <div key={entry.id} className="flex flex-col gap-2 rounded-[1.3rem] border p-4 md:flex-row md:items-center md:justify-between" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
                                <div>
                                    <p className="font-semibold" style={{ color: palette.text }}>{entry.description}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.18em]" style={{ color: palette.accent }}>
                                        {entry.entry_type} · {entry.reference || 'sin referencia'} · {entry.occurred_at}
                                    </p>
                                </div>
                                <p className={`font-semibold ${entry.amount < 0 ? 'text-emerald-600' : ''}`} style={entry.amount < 0 ? undefined : { color: palette.text }}>
                                    ${Number(entry.amount).toFixed(2)}
                                </p>
                            </div>
                        )) : (
                            <p className="text-sm" style={{ color: palette.muted }}>Todavia no hay movimientos registrados.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, palette }) {
    return (
        <article className="rounded-[1.6rem] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: palette.accent_soft, color: palette.accent }}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-4 text-[11px] uppercase tracking-[0.22em]" style={{ color: palette.accent }}>{label}</p>
            <p className="mt-2 text-2xl font-semibold" style={{ color: palette.text }}>{value}</p>
        </article>
    );
}
