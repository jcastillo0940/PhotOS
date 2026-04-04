import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Check, Database, Download, Globe, Lock, Shield, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

const ICONS = {
    storage_limit_gb: Database,
    weekly_download_limit: Download,
    allows_custom_domain: Globe,
    watermark_mode: Shield,
    retention_days: Lock,
};

export default function Index({ plans, currentPlanCode, currentPlan, technicalSummary }) {
    const comparisons = [
        {
            key: 'storage_limit_gb',
            label: 'Storage por evento',
            format: (plan) => `${plan.storage_limit_gb} GB`,
        },
        {
            key: 'retention_days',
            label: 'Retencion de originales',
            format: (plan) => `${plan.retention_days} dias`,
        },
        {
            key: 'weekly_download_limit',
            label: 'Descargas por cliente',
            format: (plan) => `${plan.weekly_download_limit} / semana`,
        },
        {
            key: 'allows_custom_domain',
            label: 'Custom domain',
            format: (plan) => (plan.allows_custom_domain ? 'Disponible' : 'No incluido'),
        },
        {
            key: 'watermark_mode',
            label: 'Marca de agua',
            format: (plan) => {
                if (plan.watermark_mode === 'photographer_custom') return 'Personalizable';
                if (plan.watermark_mode === 'platform_forced') return 'Forzada por plataforma';
                return plan.watermark_mode;
            },
        },
    ];

    return (
        <AdminLayout>
            <Head title="Limites y paquetes" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Installation</p>
                    <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-slate-900">Limites, cuotas y paquetes</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                                Esta vista le sirve al owner para auditar que ofrece cada plan y tambien al fotografo para entender
                                los limites que impactan sus galerias, contratos, descargas y storage.
                            </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-primary-100 bg-primary-50 px-5 py-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-primary-500">Plan activo</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{currentPlan?.name || currentPlanCode}</p>
                            <p className="mt-1 text-sm text-slate-500">{currentPlan?.price_label}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    {plans.map((plan) => (
                        <article
                            key={plan.code}
                            className={clsx(
                                'rounded-[2rem] border bg-white p-8 shadow-sm transition-all',
                                plan.code === currentPlanCode ? 'border-primary-200 ring-2 ring-primary-100' : 'border-slate-200'
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{plan.billing_label}</p>
                                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">{plan.name}</h2>
                                    <p className="mt-2 text-sm text-slate-500">{plan.tagline}</p>
                                </div>
                                {plan.code === currentPlanCode && (
                                    <span className="rounded-full bg-primary-500 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                                        Activo
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 grid gap-3">
                                {comparisons.map((item) => {
                                    const Icon = ICONS[item.key] || Sparkles;

                                    return (
                                        <div key={item.key} className="flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="inline-flex items-center gap-3 text-slate-600">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500">
                                                    <Icon className="h-4 w-4" />
                                                </span>
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-900">{item.format(plan)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Highlights</p>
                                <div className="mt-4 grid gap-3">
                                    {plan.highlights?.map((highlight) => (
                                        <div key={highlight} className="inline-flex items-center gap-3 text-sm text-slate-600">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600">
                                                <Check className="h-4 w-4" />
                                            </span>
                                            {highlight}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </article>
                    ))}
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Resumen tecnico para owner</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Costo estimado</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-900">{technicalSummary?.hosting_cost_label}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Plan actual</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-900">{currentPlan?.estimated_cost_label}</p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Bucket layout</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {technicalSummary?.bucket_layout?.map((entry) => (
                                    <span key={entry} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                                        {entry}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Como se traduce para el cliente</h2>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">
                                    Cada galeria hereda los limites del plan activo: storage disponible, tiempo de retencion,
                                    numero de descargas semanales y si puede tener personalizacion avanzada.
                                </p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">
                                    La vista publica de galeria ya puede comunicar estas cuotas para que el cliente entienda
                                    si tiene originales activos, ventana de descarga y si la galeria completa esta desbloqueada.
                                </p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">
                                    Los contratos y la web del fotografo pueden mantenerse minimalistas, pero la operacion
                                    interna sigue mostrando el detalle exacto del paquete para evitar dudas.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Notas del sistema</p>
                            <div className="mt-4 space-y-3">
                                {technicalSummary?.notes?.map((note) => (
                                    <p key={note} className="text-sm leading-7 text-slate-600">
                                        {note}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </article>
                </section>
            </div>
        </AdminLayout>
    );
}
