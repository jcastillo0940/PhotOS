import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Activity,
    BadgeDollarSign,
    Building2,
    ChevronRight,
    Cloud,
    Cpu,
    CreditCard,
    Globe2,
    Layers3,
    ShieldEllipsis,
    TrendingUp,
    Users,
    Wrench,
    Zap,
} from 'lucide-react';
import { Card, StatsCard, Badge, Button, Chart } from '@/Components/UI';

export default function Dashboard({ stats, finance, system, tenants, registrations }) {
    const fmtUsd = (value, digits = 2) => `$${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;

    const revenueChartOptions = {
        chart: { id: 'revenue-chart', fontFamily: 'inherit' },
        xaxis: { categories: finance.monthly.map((row) => row.label) },
        dataLabels: { enabled: false },
        colors: ['#0f766e', '#dc2626', '#2563eb'],
        grid: { borderColor: '#f1f1f1' },
        stroke: { curve: 'smooth', width: 3 },
    };

    const revenueChartSeries = [
        {
            name: 'Cobrado',
            data: finance.monthly.map((row) => Number(row.revenue_usd || 0)),
        },
        {
            name: 'Costo Gemini',
            data: finance.monthly.map((row) => Number(row.cost_usd || 0)),
        },
        {
            name: 'Margen bruto',
            data: finance.monthly.map((row) => Number(row.profit_usd || 0)),
        },
    ];

    return (
        <AdminLayout>
            <Head title="SaaS - Panel de Control" />

            <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800">Consola SaaS Central</h2>
                        <p className="text-sm font-medium text-slate-500">Supervision tecnica, comercial y financiera del ecosistema multitenant.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/saas/gemini-usage">
                            <Button variant="secondary" icon={Cpu}>Tokens Gemini</Button>
                        </Link>
                        <Link href="/admin/saas/payments">
                            <Button variant="outline" icon={CreditCard}>Pagos SaaS</Button>
                        </Link>
                        <Link href="/admin/saas/costs">
                            <Button variant="outline" icon={BadgeDollarSign}>Costos SaaS</Button>
                        </Link>
                        <Link href="/admin/settings">
                            <Button variant="outline" icon={Wrench}>Configuracion Global</Button>
                        </Link>
                    </div>
                </div>

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
                        value={fmtUsd(stats.monthly_recurring_revenue || 0)}
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

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <StatsCard
                        title="Cobrado a Clientes"
                        value={fmtUsd(finance.collected_revenue_usd || 0)}
                        icon={CreditCard}
                        color="success"
                    />
                    <StatsCard
                        title="Gastado en Gemini"
                        value={fmtUsd(finance.exact_gemini_cost_usd || 0, 4)}
                        icon={Cpu}
                        color="danger"
                    />
                    <StatsCard
                        title="Costos Manuales"
                        value={fmtUsd(finance.manual_actual_cost_usd || 0, 4)}
                        icon={CreditCard}
                        color="warning"
                    />
                    <StatsCard
                        title="Margen Bruto"
                        value={fmtUsd(finance.gross_profit_usd || 0)}
                        icon={TrendingUp}
                        color={Number(finance.gross_profit_usd || 0) >= 0 ? 'primary' : 'danger'}
                    />
                </div>

                <div className="grid gap-8 xl:grid-cols-3">
                    <Card className="xl:col-span-2" title="Cobrado vs Gasto Gemini" subtitle="Ultimos 6 meses con datos reales">
                        <Chart options={revenueChartOptions} series={revenueChartSeries} height={320} />
                    </Card>

                    <Card title="Resumen Financiero" subtitle="Lo que se cobro y lo que costo operar IA">
                        <div className="space-y-4">
                            {[
                                { label: 'Cobrado este mes', value: fmtUsd(finance.current_month_revenue_usd || 0), tone: 'success' },
                                { label: 'Costo Gemini este mes', value: fmtUsd(finance.current_month_gemini_cost_usd || 0, 4), tone: 'danger' },
                                { label: 'Costos manuales este mes', value: fmtUsd(finance.current_month_manual_actual_cost_usd || 0, 4), tone: 'warning' },
                                { label: 'Margen bruto este mes', value: fmtUsd(finance.current_month_gross_profit_usd || 0), tone: Number(finance.current_month_gross_profit_usd || 0) >= 0 ? 'primary' : 'danger' },
                                { label: 'Costo legacy estimado', value: fmtUsd(finance.estimated_legacy_cost_usd || 0, 4), tone: 'warning' },
                                { label: 'Costos estimados manuales', value: fmtUsd(finance.manual_estimated_cost_usd || 0, 4), tone: 'info' },
                                { label: 'Margen %', value: finance.gross_margin_pct == null ? 'N/D' : `${Number(finance.gross_margin_pct).toLocaleString()}%`, tone: 'primary' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{item.label}</p>
                                        <p className="text-[11px] font-medium text-slate-400">Vista financiera del developer basada en datos reales.</p>
                                    </div>
                                    <Badge variant={item.tone} className="text-xs uppercase">{item.value}</Badge>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <Button variant="outline" className="w-full" size="sm" icon={ShieldEllipsis}>Centro de Seguridad</Button>
                        </div>
                    </Card>
                </div>

                <div className="grid gap-8 xl:grid-cols-3">
                    <Card className="xl:col-span-2" noPadding title="Rentabilidad por Tenant" subtitle="Cobrado menos costo exacto de Gemini">
                        <div className="divide-y divide-slate-100">
                            {finance.tenants.length ? finance.tenants.map((tenant) => (
                                <div key={tenant.tenant_id} className="flex items-center justify-between px-6 py-4 transition-all hover:bg-slate-50">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{tenant.tenant_name}</p>
                                        <div className="mt-1 flex items-center gap-3">
                                            <Badge variant="primary" className="text-[10px] uppercase">{tenant.plan_code}</Badge>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{tenant.status}</span>
                                        </div>
                                    </div>
                                    <div className="grid gap-1 text-right">
                                        <p className="text-xs font-semibold text-emerald-600">Cobrado: {fmtUsd(tenant.revenue_usd)}</p>
                                        <p className="text-xs font-semibold text-rose-600">Gemini: {fmtUsd(tenant.cost_usd, 4)}</p>
                                        <p className={`text-sm font-black ${Number(tenant.profit_usd || 0) >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                                            Margen: {fmtUsd(tenant.profit_usd)}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400">
                                            {tenant.margin_pct == null ? 'Sin cobro aun' : `${Number(tenant.margin_pct).toLocaleString()}% margen`}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="px-6 py-10 text-center text-sm font-medium text-slate-400">
                                    Todavia no hay datos suficientes para calcular rentabilidad por tenant.
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Estado de Infraestructura" subtitle="Servicios globales">
                        <div className="space-y-4">
                            {[
                                { label: 'Cloudflare R2', active: system.r2_status, icon: Cloud },
                                { label: 'Gateway PayPal', active: system.paypal_status, icon: BadgeDollarSign },
                                { label: 'Alanube Invoice', active: system.alanube_status, icon: CreditCard },
                                { label: 'CF for SaaS', active: system.cloudflare_status, icon: Globe2 },
                            ].map((s) => (
                                <div key={s.label} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${s.active ? 'border-green-100 bg-green-50 text-green-600' : 'border-slate-200 bg-slate-100 text-slate-400'}`}>
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
                    </Card>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    <Card noPadding title="Estudios (Tenants) Recientes" subtitle="Ultimas incorporaciones al sistema">
                        <div className="divide-y divide-slate-100">
                            {tenants.map((tenant) => (
                                <Link key={tenant.id} href={`/admin/saas/tenants/${tenant.id}`} className="group flex items-center justify-between px-6 py-4 transition-all hover:bg-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all group-hover:bg-primary/10 group-hover:text-primary">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{tenant.name}</p>
                                            <p className="text-xs font-medium text-slate-400">{tenant.hostname || tenant.slug}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="primary" className="text-[10px] uppercase">{tenant.plan_code}</Badge>
                                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-300">{tenant.status}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="rounded-b-[1.5rem] border-t border-slate-100 bg-slate-50/50 p-4">
                            <Link href="/admin/saas/tenants" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 transition-all hover:text-primary">
                                ver todos los estudios <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </Card>

                    <Card noPadding title="Nuevas Solicitudes (Onboarding)" subtitle="Pendientes de activacion manual">
                        <div className="divide-y divide-slate-100">
                            {registrations.map((reg) => (
                                <div key={reg.id} className="px-6 py-4 transition-all hover:bg-slate-50">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{reg.studio_name}</p>
                                            <p className="text-xs font-medium text-slate-400">{reg.owner_email}</p>
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
