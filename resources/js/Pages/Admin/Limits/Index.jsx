import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Brain, Database, Gauge, Globe, Shield, Sparkles, Users } from 'lucide-react';

const formatMaybeNumber = (value, suffix = '') => value === null || value === undefined ? 'Ilimitado' : `${value}${suffix}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : 'Sin fecha';
const percent = (used, limit) => !limit || limit <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((used / limit) * 100)));

function GaugeCard({ title, value, helper, percentValue, accent = '#0f766e' }) {
    const safePercent = Math.max(0, Math.min(100, percentValue || 0));
    const radius = 72;
    const circumference = Math.PI * radius;
    const dashOffset = circumference - (circumference * safePercent) / 100;

    return (
        <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>
                </div>

                <div className="relative h-48 w-48">
                    <svg viewBox="0 0 200 120" className="h-full w-full">
                        <path d="M 28 100 A 72 72 0 0 1 172 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
                        <path
                            d="M 28 100 A 72 72 0 0 1 172 100"
                            fill="none"
                            stroke={accent}
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                        />
                    </svg>
                    <div className="absolute inset-x-0 bottom-5 text-center">
                        <p className="text-4xl font-black tracking-tight text-slate-900">{safePercent}%</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Uso actual</p>
                    </div>
                </div>
            </div>
        </article>
    );
}

function FeatureCard({ icon: Icon, label, value, helper }) {
    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
                </div>
            </div>
            {helper && <p className="mt-3 text-sm leading-6 text-slate-600">{helper}</p>}
        </div>
    );
}

export default function Index({ tenant, currentPlanCode, currentPlan, usage }) {
    const aiPercent = percent(usage?.ai_used || 0, usage?.ai_limit);
    const storagePercent = percent(usage?.storage_used_bytes || 0, usage?.storage_limit_bytes);

    return (
        <AdminLayout>
            <Head title="Mi plan y limites" />

            <div className="space-y-8">
                <section className="rounded-[2.3rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.08),_transparent_40%),linear-gradient(135deg,#ffffff,#f8fafc)] p-8 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="max-w-3xl">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Control de consumo</p>
                            <h1 className="mt-4 text-3xl font-semibold text-slate-900">Limites y uso real del estudio</h1>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                                Aqui ves tu plan como tablero operativo: cuanto llevas consumido, cuanto te queda y cuando vuelve a empezar el ciclo mensual.
                            </p>
                        </div>

                        <div className="rounded-[1.7rem] border border-teal-100 bg-teal-50 px-5 py-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-teal-700">Plan activo</p>
                            <p className="mt-2 text-xl font-semibold text-slate-900">{currentPlan?.name || currentPlanCode || 'Sin plan'}</p>
                            <p className="mt-1 text-sm text-slate-600">{tenant?.name || 'Tenant no disponible'}</p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reinicio mensual: {formatDate(usage?.resets_at)}</p>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <GaugeCard
                        title="Cuota mensual de IA y fotos"
                        value={usage?.ai_limit ? `${usage.ai_used} de ${usage.ai_limit}` : `${usage?.ai_used || 0} usados`}
                        helper={usage?.ai_limit
                            ? `Te quedan ${usage?.ai_remaining || 0} procesamientos hasta el reinicio del ${formatDate(usage?.resets_at)}.`
                            : 'Tu plan no tiene tope mensual configurado para este recurso.'}
                        percentValue={aiPercent}
                        accent="#0f766e"
                    />
                    <GaugeCard
                        title="Almacenamiento usado"
                        value={usage?.storage_limit_gb ? `${usage?.storage_used_gb || 0} GB de ${usage.storage_limit_gb} GB` : `${usage?.storage_used_gb || 0} GB usados`}
                        helper={usage?.storage_limit_gb
                            ? 'Este medidor muestra el espacio ocupado por originales y optimizados dentro de tu plan.'
                            : 'Tu plan no tiene un techo de almacenamiento definido.'}
                        percentValue={storagePercent}
                        accent="#2563eb"
                    />
                </section>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <FeatureCard icon={Gauge} label="Estado" value={tenant?.status || 'Sin estado'} helper="Si la cuenta entra en gracia o suspension, aqui lo veras reflejado." />
                    <FeatureCard icon={Users} label="Equipo" value={formatMaybeNumber(currentPlan?.staff_limit)} helper="Cantidad de usuarios permitidos en tu backoffice." />
                    <FeatureCard icon={Globe} label="Dominio propio" value={currentPlan?.allows_custom_domain ? 'Incluido' : 'No incluido'} helper="Determina si puedes usar dominio custom para tu estudio." />
                    <FeatureCard icon={Shield} label="Patrocinadores" value={currentPlan?.ai_sponsor_detection ? formatMaybeNumber(currentPlan?.sponsor_selection_limit) : 'No aplica'} helper="Maximo por evento cuando el plan incluye deteccion de sponsors." />
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Capacidades incluidas</h2>
                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <FeatureCard icon={Database} label="Storage total" value={formatMaybeNumber(currentPlan?.storage_limit_gb, ' GB')} />
                            <FeatureCard icon={Sparkles} label="Fotos por mes" value={formatMaybeNumber(currentPlan?.photos_per_month)} />
                            <FeatureCard icon={Brain} label="Reconocimiento facial" value={currentPlan?.ai_face_recognition ? 'Activo' : 'Desactivado'} />
                            <FeatureCard icon={Shield} label="Seleccion explicita" value={currentPlan?.requires_explicit_sponsors ? 'Si' : 'No'} />
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <h2 className="text-xl font-semibold text-slate-900">Acciones de plan</h2>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm leading-7 text-slate-700">
                                    Los contadores mensuales se reinician el primer dia de cada mes. Si hoy cambias de plan, el nuevo limite aplica al siguiente ciclo o cuando administracion confirme el ajuste.
                                </p>
                            </div>
                            <Link href="/admin/subscription" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                Ver suscripcion, pagos y cambios de plan
                            </Link>
                        </div>
                    </article>
                </section>
            </div>
        </AdminLayout>
    );
}
