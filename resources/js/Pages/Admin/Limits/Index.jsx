import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { BadgeCheck, Brain, Database, Globe, Shield, Sparkles, Users } from 'lucide-react';

const formatBoolean = (value, positive = 'Disponible', negative = 'No incluido') => (value ? positive : negative);

const formatMaybeNumber = (value, suffix = '') => {
    if (value === null || value === undefined) return 'Ilimitado';
    return `${value}${suffix}`;
};

const planSummary = (plan) => [
    {
        key: 'storage',
        label: 'Almacenamiento total',
        value: formatMaybeNumber(plan?.storage_limit_gb, ' GB'),
        icon: Database,
    },
    {
        key: 'photos',
        label: 'Fotos por mes',
        value: formatMaybeNumber(plan?.photos_per_month),
        icon: Sparkles,
    },
    {
        key: 'staff',
        label: 'Usuarios del equipo',
        value: formatMaybeNumber(plan?.staff_limit),
        icon: Users,
    },
    {
        key: 'domain',
        label: 'Custom domain',
        value: formatBoolean(plan?.allows_custom_domain),
        icon: Globe,
    },
];

const aiCapabilities = (plan) => [
    {
        key: 'faces',
        label: 'Reconocimiento facial',
        value: formatBoolean(plan?.ai_face_recognition, 'Activo', 'Desactivado'),
        icon: Brain,
    },
    {
        key: 'sponsors',
        label: 'Patrocinadores',
        value: formatBoolean(plan?.ai_sponsor_detection, 'Activo', 'Desactivado'),
        icon: Shield,
    },
    {
        key: 'ai_quota',
        label: 'Procesamientos IA por mes',
        value: formatMaybeNumber(plan?.ai_scans_monthly),
        icon: Sparkles,
    },
    {
        key: 'sponsor_limit',
        label: 'Patrocinadores por evento',
        value: plan?.ai_sponsor_detection ? formatMaybeNumber(plan?.sponsor_selection_limit) : 'No aplica',
        icon: BadgeCheck,
    },
    {
        key: 'explicit',
        label: 'Selección explícita requerida',
        value: plan?.ai_sponsor_detection ? formatBoolean(plan?.requires_explicit_sponsors, 'Sí', 'No') : 'No aplica',
        icon: Shield,
    },
];

function StatCard({ item }) {
    const Icon = item.icon;

    return (
        <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
            <div className="inline-flex items-center gap-3 text-slate-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white">
                    <Icon className="h-5 w-5" />
                </span>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900">{item.value}</p>
        </div>
    );
}

export default function Index({ tenant, currentPlanCode, currentPlan }) {
    const summary = planSummary(currentPlan);
    const ai = aiCapabilities(currentPlan);

    return (
        <AdminLayout>
            <Head title="Mi plan y limites" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Mi suscripcion</p>
                            <h1 className="mt-4 text-3xl font-semibold text-slate-900">Tu plan y sus límites operativos</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                                Esta vista muestra únicamente el plan activo de tu cuenta para que puedas entender qué funciones tienes habilitadas
                                y qué límites aplican a tus eventos, almacenamiento e IA.
                            </p>
                        </div>

                        <div className="rounded-[1.5rem] border border-primary-100 bg-primary-50 px-5 py-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-primary-500">Plan activo</p>
                            <p className="mt-2 text-lg font-semibold text-slate-900">{currentPlan?.name || currentPlanCode || 'Sin plan'}</p>
                            <p className="mt-1 text-sm text-slate-500">Tenant: {tenant?.name || 'No disponible'}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Resumen de tu plan</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {summary.map((item) => (
                                <StatCard key={item.key} item={item} />
                            ))}
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Capacidades de IA y patrocinadores</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            {ai.map((item) => (
                                <StatCard key={item.key} item={item} />
                            ))}
                        </div>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Cómo te impacta este plan</h2>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">
                                    El almacenamiento total limita cuánto contenido pesado puedes conservar antes de frenar nuevas subidas.
                                </p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">
                                    Las fotos y procesamientos IA mensuales determinan cuánto reconocimiento puedes ejecutar durante cada ciclo.
                                </p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm text-slate-600">
                                    Si tu plan incluye patrocinadores, debes respetar el máximo permitido por evento y, en planes B2B, seleccionarlos explícitamente.
                                </p>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Estado de la cuenta</h2>
                        <div className="mt-6 grid gap-4">
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Código del plan</p>
                                <p className="mt-3 text-2xl font-semibold text-slate-900">{currentPlanCode || 'No definido'}</p>
                            </div>
                            <div className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Estado del tenant</p>
                                <p className="mt-3 text-2xl font-semibold capitalize text-slate-900">{tenant?.status || 'No disponible'}</p>
                            </div>
                        </div>
                    </article>
                </section>
            </div>
        </AdminLayout>
    );
}
