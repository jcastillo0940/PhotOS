import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Users,
    Calendar,
    ArrowRight,
    TrendingUp,
    Cloud,
    DollarSign,
    Zap,
    ShieldCheck,
    Clock,
    Target,
    Settings,
    Layers3,
    Briefcase,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMemo, useState } from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel }) => (
    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className={clsx("p-2.5 rounded-xl text-primary-600 bg-primary-50")}>
                    <Icon className="w-5 h-5 text-primary-500" />
                </div>
                {trend && (
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-50 rounded-full">
                        <TrendingUp className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">{trend}</span>
                    </div>
                )}
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-800 mb-1">{value}</h2>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {trendLabel && <p className="text-xs text-slate-400 mt-3">{trendLabel}</p>}
        </div>
    </div>
);

const QuickAction = ({ title, href, icon: Icon, description }) => (
    <Link href={href} className="p-5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-5 group transition-all shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-primary-50 flex items-center justify-center text-slate-400 group-hover:text-primary-500 transition-all">
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-sm tracking-tight text-slate-700 group-hover:text-slate-900 mb-0.5">{title}</h4>
            <p className="text-xs text-slate-500">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-all" />
    </Link>
);

export default function Dashboard({ stats, system, plans, currentPlanCode, technicalSummary, eventTypes = [], eventReports = [] }) {
    const currentPlan = plans?.find(plan => plan.code === currentPlanCode) || plans?.[0];
    const [selectedEventType, setSelectedEventType] = useState('Todos');
    const visibleReports = useMemo(() => {
        if (selectedEventType === 'Todos') {
            return eventReports;
        }

        return eventReports.filter((report) => report.type === selectedEventType);
    }, [eventReports, selectedEventType]);

    return (
        <AdminLayout>
            <div className="flex flex-col space-y-8 pb-12">
                <Head title="Panel de control" />

                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">Página principal</h1>
                        <p className="text-sm text-slate-500">Resumen y actividad de tus colecciones.</p>
                    </div>
                    <Link href="/admin/settings" className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center text-slate-600 transition-colors bg-white shadow-sm text-sm font-medium">
                        <Settings className="w-4 h-4 mr-2" />
                        Ajustes Globales
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Nuevos Leads" value={stats.leads_count} icon={Target} color="bg-primary-500" trend="+12%" trendLabel="Últimos 30 días" />
                    <StatCard title="Proyectos Activos" value={stats.active_projects} icon={Zap} trendLabel="En progreso" />
                    <StatCard title="Ingresos" value={`$${Number(stats.total_revenue).toLocaleString()}`} icon={DollarSign} color="bg-green-500" trend="En vivo" />
                    <StatCard title="Próximo Evento" value={stats.next_event ? new Date(stats.next_event.start).toLocaleDateString() : 'N/A'} icon={Calendar} trendLabel={stats.next_event ? stats.next_event.title : 'Sin eventos programados'} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight text-slate-800">Plan Actual</h3>
                                    <p className="text-sm text-slate-500 mt-1">Uso y recursos de tu cuenta</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Almacenamiento</p>
                                    <p className="text-sm font-medium text-slate-700">{technicalSummary?.hosting_cost_label || 'Calculando...'}</p>
                                </div>
                            </div>

                            {currentPlan && (
                                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div className="flex items-start justify-between gap-6 mb-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                                                <Layers3 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-primary-500 mb-0.5 uppercase tracking-wide">{currentPlan.tagline}</p>
                                                <h4 className="font-bold text-xl tracking-tight text-slate-800">{currentPlan.name}</h4>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-slate-800">{currentPlan.price_label}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{currentPlan.billing_label}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-4">{currentPlan.audience}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {currentPlan.highlights?.map(item => (
                                            <span key={item} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600">{item}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold tracking-tight text-slate-800 mb-6">Estado del Sistema</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                {[
                                    { label: 'Cloudflare R2', active: system.r2_status, icon: Cloud, key: 'Almacenamiento' },
                                    { label: 'PayPal', active: system.paypal_status, icon: DollarSign, key: 'Pagos globales' },
                                    { label: 'TiloPay', active: system.tilopay_status, icon: ShieldCheck, key: 'Pagos locales' },
                                ].map((int, i) => (
                                    <div key={i} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 relative">
                                        <div className={clsx('absolute top-5 right-5 w-2 h-2 rounded-full', int.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300')} />
                                        <int.icon className={clsx('w-8 h-8 mb-4', int.active ? 'text-primary-500' : 'text-slate-400')} />
                                        <h5 className="font-semibold text-sm text-slate-800 mb-1">{int.label}</h5>
                                        <p className="text-xs text-slate-500 mb-4">{int.key}</p>
                                        <span className={clsx('text-xs font-medium px-2 py-1 rounded-md inline-block', int.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500')}>
                                            {int.active ? 'Conectado' : 'Desconectado'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight text-slate-800">Reportes por tipo de evento</h3>
                                    <p className="text-sm text-slate-500 mt-1">La misma taxonomía del CRM y la agenda se refleja aquí para leer el negocio sin mezclar categorías.</p>
                                </div>
                                <select
                                    value={selectedEventType}
                                    onChange={(event) => setSelectedEventType(event.target.value)}
                                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none"
                                >
                                    {['Todos', ...eventTypes].map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {visibleReports.map((report) => (
                                    <div key={report.type} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">Tipo de evento</p>
                                                <h4 className="mt-1 text-lg font-semibold text-slate-800">{report.type}</h4>
                                            </div>
                                            <div className="h-11 w-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                                                <Briefcase className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <MetricPill label="Leads" value={report.leads_count} />
                                            <MetricPill label="Proyectos" value={report.projects_count} />
                                            <MetricPill label="Eventos próximos" value={report.upcoming_events_count} />
                                            <MetricPill label="Ingresos" value={`$${Number(report.revenue || 0).toLocaleString()}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 text-slate-400">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h4 className="text-lg font-bold tracking-tight text-slate-800 mb-2">Accesos Rápidos</h4>
                            <p className="text-sm text-slate-500 mb-8">Administra tus colecciones y flujo de trabajo.</p>
                            <div className="space-y-3">
                                <QuickAction title="Crear Colección" href="/admin/projects" icon={Users} description="Nueva galería de cliente" />
                                <QuickAction title="Proyectos Activos" href="/admin/projects" icon={Zap} description="Entregas pendientes" />
                                <QuickAction title="Calendario" href="/admin/calendar" icon={Calendar} description="Ver reservas" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

const MetricPill = ({ label, value }) => (
    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-1 text-base font-semibold text-slate-800">{value}</p>
    </div>
);
