import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { clsx } from 'clsx';
import {
    ArrowUpRight,
    BadgeCheck,
    CalendarClock,
    Check,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    CreditCard,
    FileUp,
    Gem,
    Landmark,
    Receipt,
    RefreshCcw,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : 'No definido';
const formatCurrency = (amount, currency = 'USD') => amount || amount === 0 ? `$${Number(amount).toFixed(2)} ${currency}` : 'Sin monto';
const toTitle = (value) => value ? String(value).replaceAll('_', ' ') : 'Sin dato';
const cycleLabel = (cycle) => cycle === 'yearly' ? 'Anual' : 'Mensual';

function statusTone(status) {
    switch (status) {
        case 'active':
        case 'paid':
        case 'completed':
            return 'emerald';
        case 'pending_manual':
        case 'submitted':
        case 'requested':
            return 'amber';
        case 'overdue':
        case 'past_due':
        case 'suspended':
            return 'rose';
        default:
            return 'slate';
    }
}

function toneClasses(tone) {
    return {
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        amber: 'border-amber-200 bg-amber-50 text-amber-700',
        rose: 'border-rose-200 bg-rose-50 text-rose-700',
        sky: 'border-sky-200 bg-sky-50 text-sky-700',
        slate: 'border-slate-200 bg-slate-100 text-slate-700',
    }[tone] || 'border-slate-200 bg-slate-100 text-slate-700';
}

function planAccent(index) {
    const accents = [
        'from-[#0f766e] to-[#14b8a6]',
        'from-[#2563eb] to-[#60a5fa]',
        'from-[#7c3aed] to-[#c084fc]',
        'from-[#ea580c] to-[#fb923c]',
    ];

    return accents[index % accents.length];
}

function currentPlan(plans, code) {
    return plans.find((plan) => plan.code === code) ?? null;
}

function cycleProgress(subscription, billing) {
    const daysRemaining = Number(billing?.days_remaining ?? 0);
    const cycleDays = subscription?.billing_cycle === 'yearly' ? 365 : 30;
    const consumed = Math.max(0, cycleDays - Math.min(daysRemaining, cycleDays));
    const percent = Math.max(0, Math.min(100, Math.round((consumed / cycleDays) * 100)));

    return {
        cycleDays,
        consumed,
        daysRemaining,
        percent,
    };
}

function annualSavings(plan) {
    const monthly = Number(plan?.price_monthly || 0);
    const yearly = Number(plan?.price_yearly || 0);
    const baseline = monthly * 12;

    if (!baseline || !yearly || yearly >= baseline) {
        return 0;
    }

    return baseline - yearly;
}

function featuredUpgrade(plans, currentCode, cycle) {
    const currentIndex = plans.findIndex((plan) => plan.code === currentCode);
    const fallback = plans.find((plan) => plan.code !== currentCode) ?? null;

    if (currentIndex === -1) {
        return fallback;
    }

    return plans[currentIndex + 1] ?? fallback;
}

function InfoCard({ icon: Icon, label, value, helper, tone = 'slate' }) {
    return (
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
            <div className="flex items-start gap-4">
                <div className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl border', toneClasses(tone))}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
                    {helper && <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>}
                </div>
            </div>
        </article>
    );
}

function StatusPill({ label, tone = 'slate' }) {
    return (
        <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all duration-300', toneClasses(tone))}>
            {label}
        </span>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="relative overflow-hidden rounded-[1.8rem] border border-dashed border-slate-300 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.08),_transparent_40%),linear-gradient(135deg,#f8fafc,#ffffff)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-600 shadow-sm">
                <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">{description}</p>
        </div>
    );
}

function PlanCard({ plan, selected, current, cycle, onSelect, index }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={clsx(
                'group relative overflow-hidden rounded-[1.85rem] border p-5 text-left transition-all duration-300',
                selected ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70'
            )}
        >
            <div className={clsx('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', planAccent(index))} />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{plan.name}</p>
                        {current && <StatusPill label="Plan actual" tone={selected ? 'slate' : 'sky'} />}
                    </div>
                    <p className={clsx('mt-1 text-sm', selected ? 'text-white/70' : 'text-slate-500')}>
                        {plan.segment || 'Plan operativo para estudios'}
                    </p>
                </div>
                <Gem className={clsx('h-5 w-5', selected ? 'text-white/80' : 'text-slate-300')} />
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                    <p className={clsx('text-3xl font-black tracking-tight', selected ? 'text-white' : 'text-slate-900')}>
                        ${Number(cycle === 'yearly' ? plan.price_yearly || 0 : plan.price_monthly || 0).toFixed(2)}
                    </p>
                    <p className={clsx('mt-1 text-xs font-semibold uppercase tracking-[0.18em]', selected ? 'text-white/60' : 'text-slate-500')}>
                        por {cycle === 'yearly' ? 'ano' : 'mes'}
                    </p>
                </div>
                <div className={clsx('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]', selected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600')}>
                    {cycleLabel(cycle)}
                </div>
            </div>

            <div className="mt-5 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <span className={selected ? 'text-white/70' : 'text-slate-500'}>Fotos / mes</span>
                    <span className="font-semibold">{plan.photos_per_month ?? 'Ilimitadas'}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className={selected ? 'text-white/70' : 'text-slate-500'}>Storage</span>
                    <span className="font-semibold">{plan.storage_gb ?? 'Ilimitado'} GB</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className={selected ? 'text-white/70' : 'text-slate-500'}>Equipo</span>
                    <span className="font-semibold">{plan.staff_limit ?? 'Ilimitado'} usuarios</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className={selected ? 'text-white/70' : 'text-slate-500'}>Dominio propio</span>
                    <span className="font-semibold">{plan.custom_domain ? 'Incluido' : 'No incluido'}</span>
                </div>
            </div>

            <div className={clsx('mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]', selected ? 'text-white' : 'text-slate-600')}>
                {selected ? 'Plan seleccionado' : 'Seleccionar plan'}
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </button>
    );
}

export default function Show({ tenant, billing, subscription, transactions = [], plans = [] }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const current = currentPlan(plans, subscription?.plan_code || tenant?.plan_code);
    const cycleState = cycleProgress(subscription, billing);

    const offlineForm = useForm({
        amount: subscription?.amount || '',
        reference: '',
        note: '',
        receipt: null,
    });

    const planForm = useForm({
        plan_code: subscription?.plan_code || tenant?.plan_code || plans[0]?.code || '',
        billing_cycle: subscription?.billing_cycle || 'monthly',
    });

    const selectedPlan = currentPlan(plans, planForm.data.plan_code);
    const subscriptionTone = statusTone(subscription?.status || billing?.status || tenant?.status);
    const paymentTone = subscription?.payment_mode === 'offline' ? 'amber' : 'sky';
    const recommendedPlan = featuredUpgrade(plans, subscription?.plan_code || tenant?.plan_code, planForm.data.billing_cycle);
    const selectedSavings = annualSavings(selectedPlan);

    return (
        <AdminLayout>
            <Head title="Suscripcion y pagos" />

            <div className="space-y-8">
                {flash?.success && (
                    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm">
                        {flash.success}
                    </div>
                )}

                <section className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_35%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(135deg,#ffffff,#f8fafc)] shadow-sm">
                    <div className="grid gap-0 xl:grid-cols-[1.35fr,0.85fr]">
                        <div className="p-8 md:p-10">
                            <div className="flex flex-wrap items-center gap-3">
                                <StatusPill label={toTitle(subscription?.status || billing?.status || tenant?.status || 'Sin estado')} tone={subscriptionTone} />
                                <StatusPill label={subscription?.payment_mode === 'offline' ? 'Pago offline' : toTitle(subscription?.payment_mode || 'Sin metodo')} tone={paymentTone} />
                                <StatusPill label={cycleLabel(subscription?.billing_cycle)} tone="slate" />
                            </div>

                            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Billing portal</p>
                            <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                Tu cuenta, cobro y plan en una sola vista
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                                Controla el estado de tu suscripcion, reporta pagos, revisa cuanto tiempo te queda y solicita upgrades o downgrades sin salir del backoffice.
                            </p>

                            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                                <div className="group rounded-[1.6rem] border border-white/60 bg-white/80 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Plan activo</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">{current?.name || subscription?.plan_code || tenant?.plan_code || 'Sin plan'}</p>
                                    <p className="mt-2 text-sm text-slate-600">{tenant?.name}</p>
                                </div>
                                <div className="group rounded-[1.6rem] border border-white/60 bg-white/80 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Proximo corte</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">{formatDate(subscription?.expires_at || billing?.expires_at)}</p>
                                    <p className="mt-2 text-sm text-slate-600">{billing?.days_remaining ?? 0} dias restantes</p>
                                </div>
                                <div className="group rounded-[1.6rem] border border-white/60 bg-white/80 p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/70">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Monto actual</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900 md:text-2xl">{formatCurrency(subscription?.amount, subscription?.currency)}</p>
                                    <p className="mt-2 text-sm text-slate-600">Facturacion {cycleLabel(subscription?.billing_cycle).toLowerCase()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200/70 bg-slate-900 p-6 text-white md:p-8 xl:border-l xl:border-t-0">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">Subscription health</p>
                                    <h2 className="mt-3 text-2xl font-semibold">Salud del ciclo actual</h2>
                                </div>
                                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                                    {cycleState.percent}% consumido
                                </div>
                            </div>

                            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-sm text-white/60">Dias restantes</p>
                                        <p className="mt-2 text-5xl font-black tracking-tight">{cycleState.daysRemaining}</p>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-sm text-white/60">Ventana del ciclo</p>
                                        <p className="mt-2 text-lg font-semibold">{cycleState.cycleDays} dias</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-white/45">
                                        <span>Inicio operativo</span>
                                        <span>Renovacion</span>
                                    </div>
                                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400"
                                            style={{ width: `${Math.max(10, cycleState.percent)}%` }}
                                        />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-sm text-white/70">
                                        <span>{cycleState.consumed} dias transcurridos</span>
                                        <span>vence {formatDate(subscription?.expires_at || billing?.expires_at)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">1. Ciclo abierto</p>
                                        <p className="mt-2 text-sm font-semibold text-white">La cuenta esta operativa</p>
                                        <p className="mt-1 text-sm leading-6 text-white/60">Tu plan actual sigue habilitado mientras el periodo se mantiene vigente.</p>
                                    </div>
                                    <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">2. Validacion</p>
                                        <p className="mt-2 text-sm font-semibold text-white">Pago o ajuste en revision</p>
                                        <p className="mt-1 text-sm leading-6 text-white/60">Si reportas un pago manual o pides cambio, el equipo lo valida desde administracion.</p>
                                    </div>
                                    <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">3. Renovacion</p>
                                        <p className="mt-2 text-sm font-semibold text-white">Nuevo corte del plan</p>
                                        <p className="mt-1 text-sm leading-6 text-white/60">El siguiente cobro o ajuste impacta el proximo ciclo operativo de la suscripcion.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                                <InfoCard
                                    icon={ShieldCheck}
                                    label="Cuenta de cobro"
                                    value={tenant?.billing_email || 'Sin email de cobro'}
                                    helper="Aqui llega la comunicacion administrativa relacionada con pagos y validaciones."
                                    tone="sky"
                                />
                                <InfoCard
                                    icon={Clock3}
                                    label="Estado de renovacion"
                                    value={subscription?.provider || 'manual'}
                                    helper={subscription?.payment_mode === 'offline'
                                        ? 'Tus pagos requieren revision administrativa cuando reportas un comprobante.'
                                        : 'El cobro se procesa con tu proveedor configurado.'}
                                    tone="amber"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <InfoCard
                        icon={CreditCard}
                        label="Suscripcion"
                        value={current?.name || toTitle(subscription?.plan_code || tenant?.plan_code)}
                        helper={`Ciclo ${cycleLabel(subscription?.billing_cycle).toLowerCase()}`}
                        tone="sky"
                    />
                    <InfoCard
                        icon={CalendarClock}
                        label="Periodo activo"
                        value={formatDate(subscription?.current_period_ends_at || subscription?.expires_at || billing?.expires_at)}
                        helper="Fecha operativa usada para controlar renovacion y acceso."
                        tone="emerald"
                    />
                    <InfoCard
                        icon={Wallet}
                        label="Metodo de pago"
                        value={toTitle(subscription?.payment_mode || 'No definido')}
                        helper={`Proveedor ${subscription?.provider || 'manual'}`}
                        tone="amber"
                    />
                    <InfoCard
                        icon={Receipt}
                        label="Cobro estimado"
                        value={formatCurrency(subscription?.amount, subscription?.currency)}
                        helper="Monto asociado a tu plan actual segun la configuracion activa."
                        tone="slate"
                    />
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/70 md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                <FileUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Reportar pago offline</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Para transferencias, deposito o efectivo. El comprobante queda visible para revision administrativa.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Monto sugerido</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(subscription?.amount, subscription?.currency)}</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Modo</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">Revision manual</p>
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Resultado</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">Se registra en historial</p>
                                </div>
                            </div>
                        </div>

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                offlineForm.post('/admin/subscription/offline-payment', { forceFormData: true });
                            }}
                            className="mt-6 grid gap-5 md:grid-cols-2"
                        >
                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Monto</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={offlineForm.data.amount}
                                    onChange={(event) => offlineForm.setData('amount', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                                />
                                {offlineForm.errors.amount && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.amount}</p>}
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Referencia</span>
                                <input
                                    value={offlineForm.data.reference}
                                    onChange={(event) => offlineForm.setData('reference', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                                />
                                {offlineForm.errors.reference && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.reference}</p>}
                            </label>

                            <label className="block md:col-span-2">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Nota de soporte</span>
                                <textarea
                                    rows={4}
                                    value={offlineForm.data.note}
                                    onChange={(event) => offlineForm.setData('note', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                                    placeholder="Ejemplo: transferencia realizada desde Banco General, cuenta terminada en 4451."
                                />
                                {offlineForm.errors.note && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.note}</p>}
                            </label>

                            <label className="block md:col-span-2">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Comprobante</span>
                                <input
                                    type="file"
                                    onChange={(event) => offlineForm.setData('receipt', event.target.files?.[0] || null)}
                                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                                />
                                {offlineForm.errors.receipt && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.receipt}</p>}
                            </label>

                            <div className="md:col-span-2 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-600">
                                    Cuando se envie, el movimiento quedara registrado y podras ver su estado en el historial de abajo.
                                </p>
                                <button
                                    type="submit"
                                    disabled={offlineForm.processing}
                                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:opacity-60"
                                >
                                    {offlineForm.processing ? 'Enviando...' : 'Enviar comprobante'}
                                </button>
                            </div>
                        </form>
                    </article>

                    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/70 md:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-900">Upgrade o downgrade</h2>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Elige el plan y ciclo que quieres solicitar. El equipo registra el ajuste con su cobro correspondiente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                                {['monthly', 'yearly'].map((cycle) => (
                                    <button
                                        key={cycle}
                                        type="button"
                                        onClick={() => planForm.setData('billing_cycle', cycle)}
                                        className={clsx(
                                            'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition',
                                            planForm.data.billing_cycle === cycle ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                                        )}
                                    >
                                        {cycleLabel(cycle)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            {plans.map((plan, index) => (
                                <PlanCard
                                    key={plan.code}
                                    plan={plan}
                                    index={index}
                                    cycle={planForm.data.billing_cycle}
                                    selected={planForm.data.plan_code === plan.code}
                                    current={(subscription?.plan_code || tenant?.plan_code) === plan.code}
                                    onSelect={() => planForm.setData('plan_code', plan.code)}
                                />
                            ))}
                        </div>

                        {recommendedPlan && (
                            <div className="mt-6 overflow-hidden rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/20">
                                <div className="grid gap-4 p-6 md:grid-cols-[1fr,auto] md:items-center">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <StatusPill label="Upgrade sugerido" tone="sky" />
                                            {planForm.data.billing_cycle === 'yearly' && annualSavings(recommendedPlan) > 0 && (
                                                <StatusPill label={`Ahorras $${annualSavings(recommendedPlan).toFixed(2)} al ano`} tone="emerald" />
                                            )}
                                        </div>
                                        <h3 className="mt-4 text-2xl font-semibold">{recommendedPlan.name}</h3>
                                        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
                                            Si necesitas mas margen operativo, este es el siguiente escalon natural sobre tu plan actual: mas capacidad, mejor colchón y menos riesgo de quedarte corto.
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/80">
                                            <span>{recommendedPlan.photos_per_month ?? 'Ilimitadas'} fotos/mes</span>
                                            <span>{recommendedPlan.storage_gb ?? 'Ilimitado'} GB</span>
                                            <span>{recommendedPlan.staff_limit ?? 'Ilimitado'} usuarios</span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => planForm.setData('plan_code', recommendedPlan.code)}
                                        className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:bg-slate-100"
                                    >
                                        Seleccionar este upgrade
                                    </button>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                planForm.post('/admin/subscription/plan-change');
                            }}
                            className="mt-6 rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5"
                        >
                            <div className="grid gap-4 md:grid-cols-[1fr,auto] md:items-center">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Solicitud actual</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <StatusPill label={selectedPlan?.name || planForm.data.plan_code || 'Sin plan'} tone="sky" />
                                        <StatusPill label={cycleLabel(planForm.data.billing_cycle)} tone="slate" />
                                        <StatusPill
                                            label={formatCurrency(
                                                planForm.data.billing_cycle === 'yearly' ? selectedPlan?.price_yearly : selectedPlan?.price_monthly,
                                                subscription?.currency || 'USD'
                                            )}
                                            tone="emerald"
                                        />
                                        {planForm.data.billing_cycle === 'yearly' && selectedSavings > 0 && (
                                            <StatusPill label={`Ahorro anual $${selectedSavings.toFixed(2)}`} tone="amber" />
                                        )}
                                    </div>
                                    <p className="mt-4 text-sm leading-6 text-slate-600">
                                        Si haces el cambio hoy, queda registrado para que administracion procese la diferencia de cobro o el nuevo ciclo.
                                    </p>
                                    {planForm.errors.plan_code && <p className="mt-2 text-sm text-rose-600">{planForm.errors.plan_code}</p>}
                                    {planForm.errors.billing_cycle && <p className="mt-2 text-sm text-rose-600">{planForm.errors.billing_cycle}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={planForm.processing}
                                    className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-60"
                                >
                                    {planForm.processing ? 'Enviando...' : 'Solicitar cambio'}
                                </button>
                            </div>
                        </form>
                    </article>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.8fr,1.2fr]">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/70 md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <Landmark className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Resumen de facturacion</h2>
                                <p className="mt-1 text-sm text-slate-600">Lo esencial para entender tu cuenta antes de pagar o pedir cambios.</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Que controla esta seccion</p>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                                    <li className="flex gap-3"><Check className="mt-1 h-4 w-4 text-emerald-600" />Ver estado del plan y fecha de vencimiento.</li>
                                    <li className="flex gap-3"><Check className="mt-1 h-4 w-4 text-emerald-600" />Reportar pagos offline con referencia y soporte.</li>
                                    <li className="flex gap-3"><Check className="mt-1 h-4 w-4 text-emerald-600" />Solicitar upgrade o downgrade del estudio.</li>
                                </ul>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Recomendacion operativa</p>
                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                    Si el pago es manual, envia referencia y comprobante el mismo dia para que el equipo valide antes del corte operativo.
                                </p>
                            </div>

                            {planForm.data.billing_cycle === 'yearly' && selectedSavings > 0 && (
                                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-600" />
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Comparativa anual</p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900">Ahorras ${selectedSavings.toFixed(2)} frente al pago mes a mes</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                                Si mantienes el plan <span className="font-semibold">{selectedPlan?.name || 'seleccionado'}</span> en anual, reduces friccion operativa y consolidas el cobro del estudio en una sola renovacion.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-900 p-5 text-white">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Estado rapido</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <StatusPill label={toTitle(subscription?.status || billing?.status || 'Sin estado')} tone={subscriptionTone} />
                                    <StatusPill label={`${billing?.days_remaining ?? 0} dias restantes`} tone="sky" />
                                </div>
                            </div>
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/70 md:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <RefreshCcw className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Historial reciente</h2>
                                <p className="mt-1 text-sm text-slate-600">Pagos reportados, solicitudes de cambio y movimientos de la suscripcion.</p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            {transactions.length > 0 ? transactions.map((transaction) => {
                                const tone = statusTone(transaction.status);

                                return (
                                    <div key={transaction.id} className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/70">
                                        <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-start md:justify-between">
                                            <div className="flex gap-4">
                                                <div className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl border', toneClasses(tone))}>
                                                    {transaction.type?.includes('plan_change')
                                                        ? <ArrowUpRight className="h-5 w-5" />
                                                        : transaction.type?.includes('payment')
                                                            ? <CircleDollarSign className="h-5 w-5" />
                                                            : <BadgeCheck className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold capitalize text-slate-900">{toTitle(transaction.type)}</p>
                                                        <StatusPill label={toTitle(transaction.status)} tone={tone} />
                                                    </div>
                                                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                                                        {formatDate(transaction.occurred_at)} · {transaction.reference || 'Sin referencia'}
                                                    </p>
                                                    {transaction.payload?.note && (
                                                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{transaction.payload.note}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="md:text-right">
                                                <p className="text-lg font-semibold text-slate-900">{formatCurrency(transaction.amount, transaction.currency)}</p>
                                                <p className="mt-1 text-sm text-slate-500">{toTitle(transaction.provider || 'manual')}</p>
                                                {transaction.payload?.receipt_url && (
                                                    <a
                                                        href={transaction.payload.receipt_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
                                                    >
                                                        Ver comprobante
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <EmptyState
                                    title="Aun no hay movimientos en esta suscripcion"
                                    description="Cuando reportes un pago, solicites un cambio de plan o el sistema registre una renovacion, aqui veras el historial con mejor contexto visual."
                                />
                            )}
                        </div>
                    </article>
                </section>
            </div>
        </AdminLayout>
    );
}
