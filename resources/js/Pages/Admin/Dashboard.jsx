import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { clsx } from 'clsx';
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
    TrendingUp,
    Clock,
    CheckCircle2,
    Calendar,
    ChevronRight,
    Zap
} from 'lucide-react';
import { Card, StatsCard, Badge, Button, Chart } from '@/Components/UI';

export default function Dashboard({ stats, system, plans, currentPlanCode, technicalSummary, eventReports = [] }) {
    const currentPlan = plans?.find((plan) => plan.code === currentPlanCode) || plans?.[0];
    const topReports = eventReports.slice(0, 4);

    const performanceChartOptions = {
        chart: { id: 'performance-chart', fontFamily: 'inherit' },
        xaxis: { categories: eventReports.map(r => r.type).slice(0, 6) },
        colors: ['#02c0ce', '#fb6d9d'],
        stroke: { curve: 'smooth', width: 2 },
    };

    const performanceChartSeries = [
        { name: 'Leads', data: eventReports.map(r => r.leads_count).slice(0, 6) },
        { name: 'Proyectos', data: eventReports.map(r => r.projects_count).slice(0, 6) }
    ];

    return (
        <AdminLayout>
            <Head title="Estudio — Resumen General" />

            <div className="space-y-8">
                {/* Modern Header */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel del Estudio</h2>
                        <p className="text-sm font-medium text-slate-500">Bienvenido de nuevo. Aquí tienes un resumen de tu operación hoy.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/projects">
                            <Button variant="primary" icon={Plus}>Nueva Colección</Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard 
                        title="Leads Activos" 
                        value={stats.leads_count} 
                        icon={Target} 
                        color="primary"
                        trend="up"
                        trendValue="+12%"
                    />
                    <StatsCard 
                        title="Colecciones" 
                        value={stats.active_projects} 
                        icon={FolderKanban} 
                        color="info"
                    />
                    <StatsCard 
                        title="Ingresos Totales" 
                        value={`$${Number(stats.total_revenue || 0).toLocaleString()}`} 
                        icon={BadgeDollarSign} 
                        color="success"
                        trend="up"
                        trendValue="+8.4%"
                    />
                    <StatsCard 
                        title="Próximo Evento" 
                        value={stats.next_event ? stats.next_event.title : 'Libre'} 
                        icon={CalendarRange} 
                        color={stats.next_event ? "warning" : "slate"}
                    />
                </div>

                {/* Middle Section: Business Logic */}
                <div className="grid gap-8 xl:grid-cols-3">
                    <Card className="xl:col-span-2" title="Desempeño por Categoría" subtitle="Relación Leads vs Proyectos activos">
                        <Chart options={performanceChartOptions} series={performanceChartSeries} type="bar" height={320} />
                    </Card>

                    <Card title="Plan y Recursos" subtitle="Estado de tu suscripción">
                        <div className="mb-6 overflow-hidden rounded-2xl border border-primary/10 bg-primary/5 p-5">
                            <div className="flex items-center justify-between">
                                <Badge variant="primary" className="px-3 uppercase font-black tracking-widest">{currentPlan?.name}</Badge>
                                <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-slate-600 leading-relaxed">
                                {currentPlan?.audience || 'Tu configuración actual del estudio.'}
                            </p>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-800">{currentPlan?.price_label || 'Incluido'}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">/ mes</span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <ConnectionPill label="Cloudflare R2" active={system.r2_status} icon={Cloud} />
                            <ConnectionPill label="Pagos PayPal" active={system.paypal_status} icon={BadgeDollarSign} />
                            <ConnectionPill label="TiloPay" active={system.tilopay_status} icon={ShieldCheck} />
                        </div>
                        
                        <Link href="/admin/settings" className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-primary hover:underline">
                            Gestionar suscripción y ajustes <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Card>
                </div>

                {/* Bottom Section: Operations */}
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card noPadding title="Accesos Rápidos" subtitle="Tareas frecuentes del día">
                        <div className="grid gap-0 sm:grid-cols-2 divide-x divide-y divide-slate-100">
                             <ActionTile href="/admin/projects" icon={FolderKanban} title="Colecciones" desc="Gestionar material y galerías." />
                             <ActionTile href="/admin/calendar" icon={CalendarRange} title="Agenda" desc="Revisa eventos y disponibilidad." />
                             <ActionTile href="/admin/contracts" icon={ReceiptText} title="Contratos" desc="Firmas y documentos pendientes." />
                             <ActionTile href="/admin/automations" icon={Workflow} title="Bots" desc="Configurar flujos automáticos." />
                        </div>
                    </Card>

                    <Card noPadding title="Asistente Virtual" subtitle="Lo que no debes olvidar hoy">
                        <div className="p-6 space-y-4">
                            {[
                                { t: 'Confirmar sesión técnica', d: 'Faltan 2 días para el evento de boda.', done: false },
                                { t: 'Publicar galería "Family"', d: 'El cliente espera la entrega final.', done: true },
                                { t: 'Revisar saldo pendiente', d: 'Hay un recibo sin conciliar en TiloPay.', done: false },
                            ].map((task, i) => (
                                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-slate-50 bg-slate-50/50 group hover:bg-white hover:border-slate-200 transition-all">
                                    <div className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${task.done ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                                        {task.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.t}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{task.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 p-4">
                            <Button variant="outline" className="w-full" size="sm" icon={Bot}>Preguntar a IA Assistant</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}

function Plus(props) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
}

function ActionTile({ href, icon: Icon, title, desc }) {
    return (
        <Link href={href} className="p-6 hover:bg-slate-50 transition-all group">
            <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800">{title}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{desc}</p>
                </div>
            </div>
        </Link>
    );
}

function ConnectionPill({ label, active, icon: Icon }) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 px-4 py-3">
            <div className="flex items-center gap-3">
                <Icon className={clsx('h-4 w-4', active ? 'text-primary' : 'text-slate-300')} />
                <span className="text-xs font-bold text-slate-600">{label}</span>
            </div>
            <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-200'}`} />
        </div>
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
