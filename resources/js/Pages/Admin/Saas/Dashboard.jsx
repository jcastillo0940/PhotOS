import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    BadgeDollarSign, 
    Building2, 
    Cpu, 
    Cloud, 
    CreditCard, 
    Globe2, 
    Layers3, 
    ShieldEllipsis, 
    UserRound, 
    Wrench,
    TrendingUp,
    ChevronRight,
    Zap,
    Users,
    Activity
} from 'lucide-react';
import { Card, StatsCard, Badge, Button, Chart } from '@/Components/UI';

export default function Dashboard({ stats, system, tenants, users, plans, registrations }) {
    const revenueChartOptions = {
        chart: { id: 'revenue-chart', fontFamily: 'inherit' },
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'] },
        dataLabels: { enabled: false },
        colors: ['#02c0ce'],
        grid: { borderColor: '#f1f1f1' },
    };

    const revenueChartSeries = [{
        name: 'Revenue',
        data: [31, 40, 28, 51, 42, 109, 100]
    }];

    return (
        <AdminLayout>
            <Head title="SaaS — Panel de Control" />

            <div className="space-y-8">
                {/* Header Welcome Section */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Consola SaaS Central</h2>
                        <p className="text-sm font-medium text-slate-500">Supervisión técnica y comercial del ecosistema multitenante.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/saas/gemini-usage">
                            <Button variant="secondary" icon={Cpu}>Tokens Gemini</Button>
                        </Link>
                        <Link href="/admin/settings">
                            <Button variant="outline" icon={Wrench}>Configuración Global</Button>
                        </Link>
                    </div>
                </div>

                {/* Primary KPIs */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard 
                        title="Tenants Activos" 
                        value={stats.tenants_total} 
                        icon={Building2} 
                        color="primary"
                        trend="up"
                        trendValue="+5.2%"
                    />
                    <StatsCard 
                        title="Usuarios Totales" 
                        value={stats.users_total} 
                        icon={Users} 
                        color="success"
                    />
                    <StatsCard 
                        title="MRR Estimado" 
                        value={`$${Number(stats.monthly_recurring_revenue || 0).toLocaleString()}`} 
                        icon={BadgeDollarSign} 
                        color="info"
                        trend="up"
                        trendValue="+12.8%"
                    />
                    <StatsCard 
                        title="Suscripciones en Mora" 
                        value={stats.past_due_subscriptions} 
                        icon={Activity} 
                        color="danger"
                    />
                </div>

                {/* Growth & Infrastructure */}
                <div className="grid gap-8 xl:grid-cols-3">
                    <Card className="xl:col-span-2" title="Crecimiento de Ingresos" subtitle="Desempeño mensual acumulado">
                        <Chart options={revenueChartOptions} series={revenueChartSeries} height={320} />
                    </Card>

                    <Card title="Estado de Infraestructura" subtitle="Servicios globales">
                        <div className="space-y-4">
                            {[
                                { label: 'Cloudflare R2', active: system.r2_status, icon: Cloud },
                                { label: 'Gateway PayPal', active: system.paypal_status, icon: BadgeDollarSign },
                                { label: 'Alanube Invoice', active: system.alanube_status, icon: CreditCard },
                                { label: 'CF for SaaS', active: system.cloudflare_status, icon: Globe2 },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white group">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${s.active ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                            <s.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{s.label}</p>
                                            <Badge variant={s.active ? 'success' : 'slate'} className="mt-0.5 text-[8px] uppercase">{s.active ? 'Operativo' : 'Desconectado'}</Badge>
                                        </div>
                                    </div>
                                    <Zap className={`h-4 w-4 ${s.active ? 'text-amber-400 opacity-100' : 'text-slate-200 opacity-50'}`} />
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <Button variant="outline" className="w-full" size="sm" icon={ShieldEllipsis}>Centro de Seguridad</Button>
                        </div>
                    </Card>
                </div>

                {/* Bottom Lists */}
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card noPadding title="Estudios (Tenants) Recientes" subtitle="Últimas incorporaciones al sistema">
                        <div className="divide-y divide-slate-100">
                            {tenants.map((tenant) => (
                                <Link key={tenant.id} href={`/admin/saas/tenants/${tenant.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{tenant.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{tenant.hostname || tenant.slug}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="primary" className="text-[10px] uppercase">{tenant.plan_code}</Badge>
                                        <p className="mt-1 text-[10px] font-black uppercase text-slate-300 tracking-widest">{tenant.status}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-[1.5rem]">
                            <Link href="/admin/saas/tenants" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-all">
                                ver todos los estudios <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </Card>

                    <Card noPadding title="Nuevas Solicitudes (Onboarding)" subtitle="Pendientes de activación manual">
                         <div className="divide-y divide-slate-100">
                            {registrations.map((reg) => (
                                <div key={reg.id} className="px-6 py-4 hover:bg-slate-50 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{reg.studio_name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{reg.owner_email}</p>
                                        </div>
                                        <Badge variant={reg.status === 'success' ? 'success' : 'warning'} className="text-[8px] uppercase">{reg.status}</Badge>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{reg.plan_code}</span>
                                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                                        <span className="text-[10px] font-bold text-slate-400">{reg.requested_domain || 'subdominio'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}