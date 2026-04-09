import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowRight,
    BadgeDollarSign,
    Bot,
    CalendarRange,
    Cloud,
    FolderKanban,
    Layers3,
    ReceiptText,
    ShieldCheck,
    Target,
    Workflow,
} from 'lucide-react';
import { clsx } from 'clsx';

function StatCard({ eyebrow, title, value, detail, icon: Icon, tone = 'slate' }) {
    const tones = {
        slate: 'bg-white border-[#e6e0d5] text-slate-900',
        dark: 'bg-[#171411] border-[#171411] text-white',
        mint: 'bg-[#ecf8f3] border-[#d7efe4] text-slate-900',
    };

    return (
        <div className={clsx('rounded-[1.8rem] border p-6 shadow-sm', tones[tone])}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className={clsx('text-[11px] font-semibold uppercase tracking-[0.24em]', tone === 'dark' ? 'text-white/55' : 'text-slate-400')}>{eyebrow}</p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
                    <p className={clsx('mt-2 text-sm', tone === 'dark' ? 'text-white/70' : 'text-slate-500')}>{title}</p>
                </div>
                <div className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl', tone === 'dark' ? 'bg-white/10' : 'bg-[#f3eee6]')}>
                    <Icon className={clsx('h-5 w-5', tone === 'dark' ? 'text-white' : 'text-slate-700')} />
                </div>
            </div>
            {detail && <p className={clsx('mt-6 text-sm', tone === 'dark' ? 'text-white/70' : 'text-slate-500')}>{detail}</p>}
        </div>
    );
}

function ActionTile({ href, icon: Icon, title, description }) {
    return (
        <Link href={href} className="group rounded-[1.6rem] border border-[#e6e0d5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4efe7] text-slate-700">
                    <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-700" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </Link>
    );
}

function ConnectionPill({ label, active, icon: Icon }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4">
            <div className="flex items-center gap-3">
                <div className={clsx('flex h-10 w-10 items-center justify-center rounded-2xl', active ? 'bg-[#e6f7ef] text-[#16794f]' : 'bg-white text-slate-400')}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-400">{active ? 'Conectado' : 'Pendiente'}</p>
                </div>
            </div>
            <span className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', active ? 'bg-[#dff4e9] text-[#16794f]' : 'bg-white text-slate-500 border border-[#e6e0d5]')}>
                {active ? 'OK' : 'Check'}
            </span>
        </div>
    );
}

export default function Dashboard({ stats, system, plans, currentPlanCode, technicalSummary, eventReports = [] }) {
    const currentPlan = plans?.find((plan) => plan.code === currentPlanCode) || plans?.[0];
    const topReports = eventReports.slice(0, 4);

    return (
        <AdminLayout>
            <Head title="Resumen del estudio" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-[linear-gradient(135deg,#171411_0%,#25201b_55%,#312a22_100%)] px-7 py-7 text-white shadow-sm md:px-8 md:py-8">
                    <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">Vision general</p>
                            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight">Un backoffice pensado para trabajar rapido, publicar mejor y no perder el hilo comercial.</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                                Desde aqui deberias poder entrar a colecciones, agenda, contratos, automatizaciones y facturacion sin tener que recordar rutas ni depender de una pantalla sobrecargada.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href="/admin/projects" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#f4efe7]">
                                    <FolderKanban className="h-4 w-4" />
                                    Abrir colecciones
                                </Link>
                                <Link href="/admin/leads" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
                                    <Target className="h-4 w-4" />
                                    Revisar leads
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">Plan activo</p>
                            <h3 className="mt-4 text-xl font-semibold">{currentPlan?.name || 'Plan del estudio'}</h3>
                            <p className="mt-2 text-sm text-white/72">{currentPlan?.audience || 'Configuracion general del estudio y sus recursos.'}</p>
                            <div className="mt-5 space-y-3">
                                <div className="rounded-2xl bg-white/8 px-4 py-3">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Precio</p>
                                    <p className="mt-1 text-sm font-semibold">{currentPlan?.price_label || '-'}</p>
                                </div>
                                <div className="rounded-2xl bg-white/8 px-4 py-3">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Costo operativo</p>
                                    <p className="mt-1 text-sm font-semibold">{technicalSummary?.hosting_cost_label || 'Calculando...'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard eyebrow="Leads" title="Nuevas oportunidades registradas" value={stats.leads_count} detail="Seguimiento comercial activo." icon={Target} />
                    <StatCard eyebrow="Colecciones" title="Proyectos en marcha" value={stats.active_projects} detail="Galerias y entregas abiertas." icon={FolderKanban} tone="mint" />
                    <StatCard eyebrow="Ingresos" title="Facturacion acumulada" value={`$${Number(stats.total_revenue || 0).toLocaleString()}`} detail="Suma de facturas emitidas." icon={BadgeDollarSign} />
                    <StatCard eyebrow="Agenda" title={stats.next_event ? new Date(stats.next_event.start).toLocaleDateString() : 'Sin evento'} value={stats.next_event ? stats.next_event.title : 'Proximo evento'} detail="Tu siguiente compromiso agendado." icon={CalendarRange} tone="dark" />
                </section>

                <section className="grid gap-8 xl:grid-cols-[1.1fr_.9fr]">
                    <div className="space-y-8">
                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Accesos del dia</p>
                                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Tareas frecuentes del estudio</h3>
                                </div>
                                <Link href="/admin/settings" className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm font-semibold text-slate-700">
                                    <Layers3 className="h-4 w-4" />
                                    Ajustes del sistema
                                </Link>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <ActionTile href="/admin/projects" icon={FolderKanban} title="Gestionar colecciones" description="Sube material, define portada, comparte galeria y controla estado del proyecto." />
                                <ActionTile href="/admin/calendar" icon={CalendarRange} title="Ordenar agenda" description="Revisa disponibilidad, eventos activos y proximas sesiones." />
                                <ActionTile href="/admin/contracts" icon={ReceiptText} title="Controlar contratos" description="Verifica firma, documentos pendientes y acceso publico." />
                                <ActionTile href="/admin/automations" icon={Workflow} title="Automatizar seguimiento" description="Activa tareas, recordatorios y webhooks por tipo de evento." />
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Negocio</p>
                                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Lectura rapida por tipo de evento</h3>
                                </div>
                                <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                                    Ir al CRM
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                {topReports.length > 0 ? topReports.map((report) => (
                                    <div key={report.type} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Tipo de evento</p>
                                        <h4 className="mt-2 text-lg font-semibold text-slate-900">{report.type}</h4>
                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                            <Metric label="Leads" value={report.leads_count} />
                                            <Metric label="Proyectos" value={report.projects_count} />
                                            <Metric label="Proximos" value={report.upcoming_events_count} />
                                            <Metric label="Ingresos" value={`$${Number(report.revenue || 0).toLocaleString()}`} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="rounded-[1.6rem] border border-dashed border-[#ddd5c9] px-6 py-14 text-center text-sm text-slate-400">
                                        Todavia no hay reportes segmentados por tipo de evento.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Integraciones</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Estado del sistema</h3>
                            <div className="mt-6 space-y-3">
                                <ConnectionPill label="Cloudflare R2" active={system.r2_status} icon={Cloud} />
                                <ConnectionPill label="PayPal" active={system.paypal_status} icon={BadgeDollarSign} />
                                <ConnectionPill label="TiloPay" active={system.tilopay_status} icon={ShieldCheck} />
                            </div>
                            <Link href="/admin/settings/tests" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                Abrir centro de pruebas
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Automatizacion</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Lo que conviene no olvidar</h3>
                            <div className="mt-6 space-y-3">
                                {[
                                    'Confirmar fecha y hora antes del evento.',
                                    'Publicar la galeria y disparar mensaje al cliente.',
                                    'Enviar NPS y recordatorios de saldo pendiente.',
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4">
                                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#171411] text-white">
                                            <Bot className="h-3.5 w-3.5" />
                                        </div>
                                        <p className="text-sm leading-6 text-slate-600">{item}</p>
                                    </div>
                                ))}
                            </div>
                            <Link href="/admin/automations" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                Configurar automatizaciones
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

function Metric({ label, value }) {
    return (
        <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
        </div>
    );
}
