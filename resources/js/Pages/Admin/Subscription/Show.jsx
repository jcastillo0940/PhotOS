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

    return { cycleDays, consumed, daysRemaining, percent };
}

function annualSavings(plan) {
    const monthly = Number(plan?.price_monthly || 0);
    const yearly = Number(plan?.price_yearly || 0);
    const baseline = monthly * 12;

    if (!baseline || !yearly || yearly >= baseline) return 0;

    return baseline - yearly;
}

function featuredUpgrade(plans, currentCode) {
    const currentIndex = plans.findIndex((plan) => plan.code === currentCode);
    const fallback = plans.find((plan) => plan.code !== currentCode) ?? null;

    if (currentIndex === -1) return fallback;

    return plans[currentIndex + 1] ?? fallback;
}

function StatusPill({ label, tone = 'slate' }) {
    return (
        <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', toneClasses(tone))}>
            {label}
        </span>
    );
}

function MetricCard({ icon: Icon, label, value, helper, tone = 'slate' }) {
    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', toneClasses(tone))}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
                    <p className="mt-2 truncate text-lg font-semibold text-slate-900">{value}</p>
                    {helper && <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>}
                </div>
            </div>
        </article>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-600">
                <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        </div>
    );
}

function PlanCard({ plan, selected, current, cycle, onSelect, index }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={clsx(
                'group relative overflow-hidden rounded-2xl border p-5 text-left transition',
                selected ? 'border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:shadow-lg'
            )}
        >
            <div className={clsx('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', planAccent(index))} />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold">{plan.name}</p>
                        {current && <StatusPill label="Plan actual" tone={selected ? 'slate' : 'sky'} />}
                    </div>
                    <p className={clsx('mt-1 text-sm', selected ? 'text-white/70' : 'text-slate-500')}>{plan.segment || 'Plan operativo'}</p>
                </div>
                <Gem className={clsx('h-5 w-5', selected ? 'text-white/80' : 'text-slate-300')} />
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                    <p className={clsx('text-3xl font-black tracking-tight', selected ? 'text-white' : 'text-slate-900')}>
                        ${Number(cycle === 'yearly' ? plan.price_yearly || 0 : plan.price_monthly || 0).toFixed(2)}
                    </p>
                    <p className={clsx('mt-1 text-xs font-semibold uppercase tracking-[0.16em]', selected ? 'text-white/60' : 'text-slate-500')}>
                        por {cycle === 'yearly' ? 'ano' : 'mes'}
                    </p>
                </div>
                <span className={clsx('rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', selected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600')}>
                    {cycleLabel(cycle)}
                </span>
            </div>

            <div className="mt-5 grid gap-2 text-sm">
                <PlanSpec selected={selected} label="Fotos / mes" value={plan.photos_per_month ?? 'Ilimitadas'} />
                <PlanSpec selected={selected} label="Storage" value={`${plan.storage_gb ?? 'Ilimitado'} GB`} />
                <PlanSpec selected={selected} label="Equipo" value={`${plan.staff_limit ?? 'Ilimitado'} usuarios`} />
                <PlanSpec selected={selected} label="Dominio propio" value={plan.custom_domain ? 'Incluido' : 'No incluido'} />
            </div>

            <div className={clsx('mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]', selected ? 'text-white' : 'text-slate-600')}>
                {selected ? 'Plan seleccionado' : 'Seleccionar plan'}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
        </button>
    );
}

function PlanSpec({ selected, label, value }) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className={selected ? 'text-white/70' : 'text-slate-500'}>{label}</span>
            <span className="font-semibold">{value}</span>
        </div>
    );
}

function SectionCard({ children, className }) {
    return (
        <article className={clsx('rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7', className)}>
            {children}
        </article>
    );
}

export default function Show({ tenant, billing, subscription, transactions = [], plans = [] }) {
    const { props } = usePage();
    const flash = props.flash || {};
    const [activeTab, setActiveTab] = React.useState('overview');
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
    const recommendedPlan = featuredUpgrade(plans, subscription?.plan_code || tenant?.plan_code);
    const selectedSavings = annualSavings(selectedPlan);

    const tabs = [
        { id: 'overview', label: 'Resumen', icon: ShieldCheck },
        { id: 'payments', label: 'Pagos', icon: FileUp },
        { id: 'plans', label: 'Planes', icon: Gem },
        { id: 'history', label: 'Historial', icon: RefreshCcw },
    ];

    return (
        <AdminLayout>
            <Head title="Suscripcion y pagos" />

            <div className="space-y-6">
                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm">
                        {flash.success}
                    </div>
                )}

                <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-wrap items-center gap-2">
                                <StatusPill label={toTitle(subscription?.status || billing?.status || tenant?.status || 'Sin estado')} tone={subscriptionTone} />
                                <StatusPill label={subscription?.payment_mode === 'offline' ? 'Pago offline' : toTitle(subscription?.payment_mode || 'Sin metodo')} tone={paymentTone} />
                                <StatusPill label={cycleLabel(subscription?.billing_cycle)} tone="slate" />
                            </div>

                            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Billing portal</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Suscripcion y pagos</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                                Gestiona el estado del plan, reporta pagos y solicita cambios desde un espacio mas compacto del backoffice.
                            </p>

                            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                <MiniStat label="Plan activo" value={current?.name || subscription?.plan_code || tenant?.plan_code || 'Sin plan'} helper={tenant?.name} />
                                <MiniStat label="Proximo corte" value={formatDate(subscription?.expires_at || billing?.expires_at)} helper={`${billing?.days_remaining ?? 0} dias restantes`} />
                                <MiniStat label="Monto actual" value={formatCurrency(subscription?.amount, subscription?.currency)} helper={`Facturacion ${cycleLabel(subscription?.billing_cycle).toLowerCase()}`} />
                            </div>
                        </div>

                        <div className="border-t border-slate-200 bg-slate-900 p-6 text-white xl:border-l xl:border-t-0">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">Ciclo actual</p>
                                    <p className="mt-3 text-5xl font-black tracking-tight">{cycleState.daysRemaining}</p>
                                    <p className="mt-2 text-sm text-white/60">dias restantes</p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                                    {cycleState.percent}% usado
                                </span>
                            </div>

                            <div className="mt-6">
                                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" style={{ width: `${Math.max(8, cycleState.percent)}%` }} />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm text-white/65">
                                    <span>{cycleState.consumed} dias transcurridos</span>
                                    <span>{cycleState.cycleDays} dias</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
                    <div className="grid gap-2 sm:grid-cols-4">
                        {tabs.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveTab(id)}
                                className={clsx(
                                    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition',
                                    activeTab === id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'overview' && (
                    <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
                        <div className="grid gap-4 md:grid-cols-2">
                            <MetricCard icon={CreditCard} label="Suscripcion" value={current?.name || toTitle(subscription?.plan_code || tenant?.plan_code)} helper={`Ciclo ${cycleLabel(subscription?.billing_cycle).toLowerCase()}`} tone="sky" />
                            <MetricCard icon={CalendarClock} label="Periodo activo" value={formatDate(subscription?.current_period_ends_at || subscription?.expires_at || billing?.expires_at)} helper="Fecha usada para renovacion y acceso." tone="emerald" />
                            <MetricCard icon={Wallet} label="Metodo de pago" value={toTitle(subscription?.payment_mode || 'No definido')} helper={`Proveedor ${subscription?.provider || 'manual'}`} tone="amber" />
                            <MetricCard icon={Receipt} label="Cobro estimado" value={formatCurrency(subscription?.amount, subscription?.currency)} helper="Monto asociado al plan actual." tone="slate" />
                        </div>

                        <SectionCard>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Landmark className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Resumen operativo</h2>
                                    <p className="mt-1 text-sm text-slate-600">Lo esencial antes de pagar o solicitar cambios.</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <ChecklistItem>Ver estado del plan y fecha de vencimiento.</ChecklistItem>
                                <ChecklistItem>Reportar pagos offline con referencia y soporte.</ChecklistItem>
                                <ChecklistItem>Solicitar upgrade o downgrade del estudio.</ChecklistItem>
                            </div>

                            {planForm.data.billing_cycle === 'yearly' && selectedSavings > 0 && (
                                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                                    <div className="flex items-start gap-3">
                                        <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-600" />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Ahorro anual ${selectedSavings.toFixed(2)}</p>
                                            <p className="mt-1 text-sm leading-6 text-slate-700">El ciclo anual reduce friccion operativa frente al pago mes a mes.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </SectionCard>
                    </section>
                )}

                {activeTab === 'payments' && (
                    <section className="grid gap-6 xl:grid-cols-[1fr_0.72fr]">
                        <SectionCard>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                                    <FileUp className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-slate-900">Reportar pago offline</h2>
                                    <p className="mt-1 text-sm text-slate-600">Para transferencias, deposito o efectivo.</p>
                                </div>
                            </div>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    offlineForm.post('/admin/subscription/offline-payment', { forceFormData: true });
                                }}
                                className="mt-6 grid gap-5 md:grid-cols-2"
                            >
                                <FormInput label="Monto" type="number" step="0.01" value={offlineForm.data.amount} onChange={(event) => offlineForm.setData('amount', event.target.value)} error={offlineForm.errors.amount} />
                                <FormInput label="Referencia" value={offlineForm.data.reference} onChange={(event) => offlineForm.setData('reference', event.target.value)} error={offlineForm.errors.reference} />

                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Nota de soporte</span>
                                    <textarea
                                        rows={4}
                                        value={offlineForm.data.note}
                                        onChange={(event) => offlineForm.setData('note', event.target.value)}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                                        placeholder="Ejemplo: transferencia realizada desde Banco General."
                                    />
                                    {offlineForm.errors.note && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.note}</p>}
                                </label>

                                <label className="block md:col-span-2">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Comprobante</span>
                                    <input
                                        type="file"
                                        onChange={(event) => offlineForm.setData('receipt', event.target.files?.[0] || null)}
                                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                                    />
                                    {offlineForm.errors.receipt && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.receipt}</p>}
                                </label>

                                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
                                    <p className="text-sm text-slate-600">El movimiento quedara registrado en historial para revision administrativa.</p>
                                    <button type="submit" disabled={offlineForm.processing} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 disabled:opacity-60">
                                        {offlineForm.processing ? 'Enviando...' : 'Enviar comprobante'}
                                    </button>
                                </div>
                            </form>
                        </SectionCard>

                        <SectionCard className="bg-slate-50">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Contexto del pago</p>
                            <div className="mt-5 grid gap-4">
                                <PaymentFact label="Monto sugerido" value={formatCurrency(subscription?.amount, subscription?.currency)} />
                                <PaymentFact label="Modo" value="Revision manual" />
                                <PaymentFact label="Resultado" value="Se registra en historial" />
                            </div>
                            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                <p className="text-sm font-semibold text-amber-800">Recomendacion</p>
                                <p className="mt-2 text-sm leading-6 text-amber-800">Envia referencia y comprobante el mismo dia para evitar bloqueos cerca del corte.</p>
                            </div>
                        </SectionCard>
                    </section>
                )}

                {activeTab === 'plans' && (
                    <section className="space-y-6">
                        <SectionCard>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-900">Upgrade o downgrade</h2>
                                        <p className="mt-1 text-sm text-slate-600">Elige plan y ciclo. Administracion procesa la solicitud.</p>
                                    </div>
                                </div>

                                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                                    {['monthly', 'yearly'].map((cycle) => (
                                        <button
                                            key={cycle}
                                            type="button"
                                            onClick={() => planForm.setData('billing_cycle', cycle)}
                                            className={clsx('rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition', planForm.data.billing_cycle === cycle ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
                                        >
                                            {cycleLabel(cycle)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
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
                        </SectionCard>

                        <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
                            {recommendedPlan && (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
                                    <StatusPill label="Upgrade sugerido" tone="sky" />
                                    <h3 className="mt-4 text-2xl font-semibold">{recommendedPlan.name}</h3>
                                    <p className="mt-2 text-sm leading-7 text-white/70">Siguiente escalon natural sobre tu plan actual: mas capacidad y mejor margen operativo.</p>
                                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/80">
                                        <span>{recommendedPlan.photos_per_month ?? 'Ilimitadas'} fotos/mes</span>
                                        <span>{recommendedPlan.storage_gb ?? 'Ilimitado'} GB</span>
                                        <span>{recommendedPlan.staff_limit ?? 'Ilimitado'} usuarios</span>
                                    </div>
                                    <button type="button" onClick={() => planForm.setData('plan_code', recommendedPlan.code)} className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-900 transition hover:bg-slate-100">
                                        Seleccionar este upgrade
                                    </button>
                                </div>
                            )}

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    planForm.post('/admin/subscription/plan-change');
                                }}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Solicitud actual</p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <StatusPill label={selectedPlan?.name || planForm.data.plan_code || 'Sin plan'} tone="sky" />
                                    <StatusPill label={cycleLabel(planForm.data.billing_cycle)} tone="slate" />
                                    <StatusPill label={formatCurrency(planForm.data.billing_cycle === 'yearly' ? selectedPlan?.price_yearly : selectedPlan?.price_monthly, subscription?.currency || 'USD')} tone="emerald" />
                                    {planForm.data.billing_cycle === 'yearly' && selectedSavings > 0 && <StatusPill label={`Ahorro anual $${selectedSavings.toFixed(2)}`} tone="amber" />}
                                </div>
                                <p className="mt-4 text-sm leading-6 text-slate-600">El cambio queda registrado para que administracion procese diferencia o nuevo ciclo.</p>
                                {planForm.errors.plan_code && <p className="mt-2 text-sm text-rose-600">{planForm.errors.plan_code}</p>}
                                {planForm.errors.billing_cycle && <p className="mt-2 text-sm text-rose-600">{planForm.errors.billing_cycle}</p>}
                                <button type="submit" disabled={planForm.processing} className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:opacity-60">
                                    {planForm.processing ? 'Enviando...' : 'Solicitar cambio'}
                                </button>
                            </form>
                        </section>
                    </section>
                )}

                {activeTab === 'history' && (
                    <SectionCard>
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <RefreshCcw className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-900">Historial reciente</h2>
                                <p className="mt-1 text-sm text-slate-600">Pagos reportados, solicitudes y movimientos de suscripcion.</p>
                            </div>
                        </div>

                        <div className="mt-6 max-h-[650px] space-y-4 overflow-y-auto pr-1">
                            {transactions.length > 0 ? transactions.map((transaction) => {
                                const tone = statusTone(transaction.status);

                                return (
                                    <div key={transaction.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                            <div className="flex gap-4">
                                                <div className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', toneClasses(tone))}>
                                                    {transaction.type?.includes('plan_change') ? <ArrowUpRight className="h-5 w-5" /> : transaction.type?.includes('payment') ? <CircleDollarSign className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold capitalize text-slate-900">{toTitle(transaction.type)}</p>
                                                        <StatusPill label={toTitle(transaction.status)} tone={tone} />
                                                    </div>
                                                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{formatDate(transaction.occurred_at)} - {transaction.reference || 'Sin referencia'}</p>
                                                    {transaction.payload?.note && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{transaction.payload.note}</p>}
                                                </div>
                                            </div>

                                            <div className="md:text-right">
                                                <p className="text-lg font-semibold text-slate-900">{formatCurrency(transaction.amount, transaction.currency)}</p>
                                                <p className="mt-1 text-sm text-slate-500">{toTitle(transaction.provider || 'manual')}</p>
                                                {transaction.payload?.receipt_url && (
                                                    <a href={transaction.payload.receipt_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                                                        Ver comprobante
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <EmptyState title="Aun no hay movimientos" description="Cuando reportes un pago, solicites un cambio o haya renovaciones, apareceran aqui." />
                            )}
                        </div>
                    </SectionCard>
                )}
            </div>
        </AdminLayout>
    );
}

function MiniStat({ label, value, helper }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-2 truncate text-lg font-semibold text-slate-900">{value}</p>
            {helper && <p className="mt-1 truncate text-sm text-slate-500">{helper}</p>}
        </div>
    );
}

function ChecklistItem({ children }) {
    return (
        <div className="flex gap-3 text-sm leading-6 text-slate-700">
            <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{children}</span>
        </div>
    );
}

function FormInput({ label, error, ...props }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{label}</span>
            <input className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900" {...props} />
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
        </label>
    );
}

function PaymentFact({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
        </div>
    );
}
