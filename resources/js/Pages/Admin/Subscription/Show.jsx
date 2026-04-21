import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import clsx from 'clsx';
import {
    ArrowUpRight,
    BadgeCheck,
    CalendarClock,
    Check,
    ChevronRight,
    CircleDollarSign,
    CreditCard,
    FileUp,
    Landmark,
    Receipt,
    RefreshCcw,
    ShieldCheck,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

const formatDate = (value) => value
    ? new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium' }).format(new Date(value))
    : 'Sin fecha';

const formatCurrency = (amount, currency = 'USD') => new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
}).format(Number(amount || 0));

const toTitle = (value) => (value || 'sin dato')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const cycleLabel = (cycle) => cycle === 'yearly' ? 'Anual' : 'Mensual';

const statusTone = {
    active: 'success',
    trialing: 'success',
    paid: 'success',
    approved: 'success',
    completed: 'success',
    overdue: 'warning',
    pending: 'warning',
    pending_manual: 'warning',
    submitted: 'warning',
    requested: 'warning',
    canceled: 'danger',
    suspended: 'danger',
    failed: 'danger',
    expired: 'danger',
};

const toneClasses = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    neutral: 'border-slate-200 bg-slate-100 text-slate-600',
};

function StatusPill({ value }) {
    const tone = toneClasses[statusTone[value] || 'neutral'];

    return (
        <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]', tone)}>
            {toTitle(value)}
        </span>
    );
}

function SectionCard({ title, eyebrow, description, children, aside }) {
    return (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-100 pb-5">
                <div className="max-w-3xl">
                    {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>}
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
                    {description && <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>}
                </div>
                {aside && <div className="shrink-0">{aside}</div>}
            </div>
            <div className="pt-6">{children}</div>
        </section>
    );
}

function MetricCard({ icon: Icon, label, value, helper, accent = 'slate' }) {
    const accentClasses = {
        slate: 'bg-slate-100 text-slate-600',
        emerald: 'bg-emerald-100 text-emerald-700',
        blue: 'bg-blue-100 text-blue-700',
        amber: 'bg-amber-100 text-amber-700',
    };

    return (
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
                <div className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl', accentClasses[accent] || accentClasses.slate)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
                    {helper && <p className="mt-2 text-sm leading-6 text-slate-600">{helper}</p>}
                </div>
            </div>
        </article>
    );
}

function PlanSummaryCard({ plan, isCurrent, selectedCycle, onSelect, recommended }) {
    const amount = selectedCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    return (
        <button
            type="button"
            onClick={onSelect}
            className={clsx(
                'w-full rounded-[1.75rem] border p-5 text-left transition-all',
                isCurrent
                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className={clsx('text-lg font-semibold', isCurrent ? 'text-white' : 'text-slate-900')}>{plan.name}</p>
                        {recommended && !isCurrent && (
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                Recomendado
                            </span>
                        )}
                    </div>
                    <p className={clsx('mt-1 text-sm', isCurrent ? 'text-slate-300' : 'text-slate-500')}>{toTitle(plan.code)}</p>
                </div>
                {isCurrent && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        <Check className="h-3.5 w-3.5" />
                        Plan actual
                    </span>
                )}
            </div>

            <div className="mt-5 flex items-end gap-2">
                <span className={clsx('text-3xl font-semibold', isCurrent ? 'text-white' : 'text-slate-900')}>
                    {formatCurrency(amount)}
                </span>
                <span className={clsx('pb-1 text-sm', isCurrent ? 'text-slate-300' : 'text-slate-500')}>
                    / {cycleLabel(selectedCycle).toLowerCase()}
                </span>
            </div>

            <div className={clsx('mt-5 grid gap-3 text-sm sm:grid-cols-2', isCurrent ? 'text-slate-200' : 'text-slate-600')}>
                <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">Proyectos</p>
                    <p className="mt-2 font-semibold">{plan.projects_limit ?? 'Ilimitado'}</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">Storage</p>
                    <p className="mt-2 font-semibold">{plan.storage_gb ?? 'Ilimitado'} GB</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">Fotos por mes</p>
                    <p className="mt-2 font-semibold">{plan.photos_per_month ?? 'Ilimitado'}</p>
                </div>
                <div className="rounded-2xl border border-black/5 bg-black/[0.03] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-70">Usuarios</p>
                    <p className="mt-2 font-semibold">{plan.staff_limit ?? 'Ilimitado'}</p>
                </div>
            </div>
        </button>
    );
}

function EmptyState({ title, description, icon: Icon }) {
    return (
        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
        </div>
    );
}

function PortalNav({ activeTab, onChange }) {
    const items = [
        { id: 'overview', label: 'Tu cuenta, cobro y plan', helper: 'Estado general' },
        { id: 'offline', label: 'Reportar pago offline', helper: 'Sube comprobante' },
        { id: 'change', label: 'Upgrade o downgrade', helper: 'Solicitud de cambio' },
        { id: 'billing', label: 'Resumen de facturacion', helper: 'Cobro y vencimiento' },
        { id: 'history', label: 'Historial reciente', helper: 'Movimientos' },
    ];

    return (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {items.map((item) => {
                const active = item.id === activeTab;

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onChange(item.id)}
                        className={clsx(
                            'rounded-[1.6rem] border p-4 text-left transition-all',
                            active
                                ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                                : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'
                        )}
                    >
                        <p className={clsx('text-[11px] font-semibold uppercase tracking-[0.22em]', active ? 'text-slate-300' : 'text-slate-400')}>
                            {item.helper}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6">{item.label}</p>
                    </button>
                );
            })}
        </div>
    );
}

export default function Show({ tenant, billing, subscription, transactions = [], plans = [] }) {
    const [activeTab, setActiveTab] = React.useState('overview');
    const [selectedPlanCode, setSelectedPlanCode] = React.useState(subscription?.plan_code || tenant?.plan_code || plans[0]?.code || '');
    const [selectedCycle, setSelectedCycle] = React.useState(subscription?.billing_cycle || 'monthly');

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

    React.useEffect(() => {
        if (selectedPlanCode) {
            planForm.setData('plan_code', selectedPlanCode);
        }
    }, [selectedPlanCode]);

    React.useEffect(() => {
        if (selectedCycle) {
            planForm.setData('billing_cycle', selectedCycle);
        }
    }, [selectedCycle]);

    const currentPlan = plans.find((plan) => plan.code === (subscription?.plan_code || tenant?.plan_code)) || null;
    const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode) || currentPlan || plans[0] || null;
    const annualSavings = selectedPlan
        ? Math.max(0, (Number(selectedPlan.price_monthly || 0) * 12) - Number(selectedPlan.price_yearly || 0))
        : 0;
    const featuredUpgrade = plans.find((plan) => Number(plan.price_monthly || 0) > Number(currentPlan?.price_monthly || 0)) || null;

    const completedTransactions = transactions.filter((transaction) => ['completed', 'approved', 'paid'].includes(transaction.status));
    const submittedTransactions = transactions.filter((transaction) => ['submitted', 'pending', 'requested', 'pending_manual'].includes(transaction.status));

    const nextCharge = billing?.next_charge_amount || subscription?.amount || selectedPlan?.[selectedCycle === 'yearly' ? 'price_yearly' : 'price_monthly'] || 0;
    const currency = billing?.currency || subscription?.currency || 'USD';

    const submitOfflinePayment = (event) => {
        event.preventDefault();
        offlineForm.post('/admin/subscription/offline-payment', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const submitPlanChange = (event) => {
        event.preventDefault();
        planForm.post('/admin/subscription/plan-change', {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Suscripcion y pagos" />

            <div className="space-y-8">
                <section className="rounded-[2.5rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_45%),linear-gradient(135deg,#ffffff,#f8fafc)] p-7 shadow-sm md:p-9">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Portal de suscripcion</p>
                            <h1 className="mt-4 text-3xl font-semibold text-slate-900 md:text-4xl">Cada tarea importante en su propia vista</h1>
                            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
                                Esta pantalla ya no funciona como una pagina larga. Ahora tienes un menu interno para entrar directo a tu cuenta, pagos,
                                cambios de plan, resumen de facturacion e historial sin bajar hasta el final para encontrar lo importante.
                            </p>
                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <StatusPill value={billing?.status || subscription?.status || tenant?.status || 'pending'} />
                                <StatusPill value={subscription?.payment_mode || 'manual'} />
                                <StatusPill value={subscription?.billing_cycle || 'monthly'} />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3 xl:w-[420px] xl:grid-cols-1">
                            <MetricCard
                                icon={CircleDollarSign}
                                label="Proximo cobro"
                                value={formatCurrency(nextCharge, currency)}
                                helper={billing?.next_charge_at ? `Fecha objetivo: ${formatDate(billing.next_charge_at)}` : 'Sin fecha exacta configurada todavia.'}
                                accent="emerald"
                            />
                            <MetricCard
                                icon={CalendarClock}
                                label="Vencimiento"
                                value={billing?.expires_at ? formatDate(billing.expires_at) : 'Sin vencimiento'}
                                helper={billing?.days_remaining !== null && billing?.days_remaining !== undefined ? `${billing.days_remaining} dias restantes en el ciclo actual.` : 'No hay conteo visible para este ciclo.'}
                                accent="blue"
                            />
                            <MetricCard
                                icon={ShieldCheck}
                                label="Plan activo"
                                value={currentPlan?.name || toTitle(tenant?.plan_code)}
                                helper={tenant?.billing_email ? `Correo de cobro: ${tenant.billing_email}` : 'Aun no hay correo de facturacion definido.'}
                                accent="amber"
                            />
                        </div>
                    </div>
                </section>

                <PortalNav activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === 'overview' && (
                    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                        <SectionCard
                            eyebrow="Vista principal"
                            title="Tu cuenta, cobro y plan en una sola vista"
                            description="Este bloque concentra lo mas importante para un cliente: plan actual, modo de pago, monto del ciclo y fechas de renovacion."
                            aside={<StatusPill value={subscription?.status || billing?.status || 'pending'} />}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Cuenta</p>
                                    <p className="mt-3 text-xl font-semibold text-slate-900">{tenant?.name || 'Cuenta sin nombre'}</p>
                                    <dl className="mt-5 space-y-3 text-sm text-slate-600">
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Correo de cobro</dt>
                                            <dd className="font-medium text-slate-900">{tenant?.billing_email || 'No definido'}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Metodo</dt>
                                            <dd className="font-medium text-slate-900">{toTitle(subscription?.payment_mode || 'offline')}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Proveedor</dt>
                                            <dd className="font-medium text-slate-900">{toTitle(subscription?.provider || 'manual')}</dd>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <dt>Estado</dt>
                                            <dd><StatusPill value={billing?.status || tenant?.status || 'pending'} /></dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Plan y cobro</p>
                                    <p className="mt-3 text-xl font-semibold text-slate-900">{currentPlan?.name || 'Sin plan asignado'}</p>
                                    <p className="mt-1 text-sm text-slate-500">{cycleLabel(subscription?.billing_cycle || 'monthly')} · {formatCurrency(subscription?.amount || nextCharge, currency)}</p>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Renueva</p>
                                            <p className="mt-2 font-semibold text-slate-900">{formatDate(subscription?.current_period_ends_at || billing?.renews_at || billing?.next_charge_at)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Expira</p>
                                            <p className="mt-2 font-semibold text-slate-900">{formatDate(subscription?.expires_at || billing?.expires_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Situacion del ciclo"
                            title="Estado del ciclo"
                            description="Un resumen rapido para que el cliente entienda si esta al dia, cuanto ha pagado y si tiene algo pendiente por resolver."
                        >
                            <div className="space-y-4">
                                <MetricCard
                                    icon={Receipt}
                                    label="Pagos confirmados"
                                    value={`${completedTransactions.length}`}
                                    helper={completedTransactions.length ? `Ultimo confirmado: ${formatDate(completedTransactions[0]?.occurred_at)}` : 'Todavia no hay pagos confirmados en el historial.'}
                                    accent="emerald"
                                />
                                <MetricCard
                                    icon={RefreshCcw}
                                    label="Solicitudes pendientes"
                                    value={`${submittedTransactions.length}`}
                                    helper={submittedTransactions.length ? 'Incluye pagos offline enviados y solicitudes de cambio.' : 'No hay movimientos pendientes por revisar.'}
                                    accent="amber"
                                />
                                {featuredUpgrade && (
                                    <div className="rounded-[1.7rem] border border-blue-200 bg-blue-50 p-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">Upgrade sugerido</p>
                                        <p className="mt-3 text-xl font-semibold text-slate-900">{featuredUpgrade.name}</p>
                                        <p className="mt-2 text-sm leading-7 text-slate-600">
                                            Si ya te estas acercando a tus limites operativos, este es el siguiente plan natural dentro de la escalera comercial.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedPlanCode(featuredUpgrade.code);
                                                setActiveTab('change');
                                            }}
                                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                                        >
                                            Revisar upgrade
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'offline' && (
                    <SectionCard
                        eyebrow="Pago offline"
                        title="Reportar pago offline"
                        description="Esta vista solo sirve para subir un comprobante y dejar la referencia registrada. Asi el cliente no se distrae con historial ni cambios de plan mientras reporta su pago."
                    >
                        <form onSubmit={submitOfflinePayment} className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                            <div className="grid gap-5">
                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700">Monto pagado</span>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={offlineForm.data.amount}
                                        onChange={(event) => offlineForm.setData('amount', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                                    />
                                    {offlineForm.errors.amount && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.amount}</p>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700">Referencia</span>
                                    <input
                                        type="text"
                                        value={offlineForm.data.reference}
                                        onChange={(event) => offlineForm.setData('reference', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                                        placeholder="Transferencia, deposito o numero de recibo"
                                    />
                                    {offlineForm.errors.reference && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.reference}</p>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700">Nota opcional</span>
                                    <textarea
                                        rows="5"
                                        value={offlineForm.data.note}
                                        onChange={(event) => offlineForm.setData('note', event.target.value)}
                                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400"
                                        placeholder="Puedes indicar fecha, banco, nombre del emisor o cualquier contexto util."
                                    />
                                    {offlineForm.errors.note && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.note}</p>}
                                </label>

                                <label className="block">
                                    <span className="text-sm font-semibold text-slate-700">Comprobante</span>
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                                        onChange={(event) => offlineForm.setData('receipt', event.target.files?.[0] || null)}
                                        className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600"
                                    />
                                    {offlineForm.errors.receipt && <p className="mt-2 text-sm text-rose-600">{offlineForm.errors.receipt}</p>}
                                </label>

                                <button
                                    type="submit"
                                    disabled={offlineForm.processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <FileUp className="h-4 w-4" />
                                    {offlineForm.processing ? 'Enviando...' : 'Enviar comprobante'}
                                </button>
                            </div>

                            <div className="space-y-4 rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                                <div className="rounded-[1.4rem] border border-white bg-white p-4 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Monto sugerido</p>
                                    <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(subscription?.amount || nextCharge, currency)}</p>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">Usa este valor como referencia si estas pagando el ciclo actual completo.</p>
                                </div>
                                <div className="rounded-[1.4rem] border border-white bg-white p-4 shadow-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Que pasa despues</p>
                                    <p className="mt-2 text-sm leading-7 text-slate-600">Administracion revisa la referencia, valida el comprobante y luego aplica el cobro al ciclo del tenant.</p>
                                </div>
                            </div>
                        </form>
                    </SectionCard>
                )}

                {activeTab === 'change' && (
                    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                        <SectionCard
                            eyebrow="Cambio de plan"
                            title="Upgrade o downgrade"
                            description="Aqui el cliente compara opciones y manda la solicitud sin mezclarla con pagos ni con historial. La navegacion queda enfocada en una sola decision."
                            aside={
                                <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                                    {['monthly', 'yearly'].map((cycle) => (
                                        <button
                                            key={cycle}
                                            type="button"
                                            onClick={() => setSelectedCycle(cycle)}
                                            className={clsx(
                                                'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition',
                                                selectedCycle === cycle ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                                            )}
                                        >
                                            {cycleLabel(cycle)}
                                        </button>
                                    ))}
                                </div>
                            }
                        >
                            <div className="space-y-4">
                                {plans.map((plan) => (
                                    <PlanSummaryCard
                                        key={plan.code}
                                        plan={plan}
                                        selectedCycle={selectedCycle}
                                        isCurrent={plan.code === (subscription?.plan_code || tenant?.plan_code)}
                                        recommended={featuredUpgrade?.code === plan.code}
                                        onSelect={() => setSelectedPlanCode(plan.code)}
                                    />
                                ))}
                            </div>

                            <form onSubmit={submitPlanChange} className="mt-6 rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Solicitud lista</p>
                                        <p className="mt-2 text-lg font-semibold text-slate-900">{selectedPlan?.name || 'Selecciona un plan'}</p>
                                        <p className="mt-1 text-sm text-slate-600">{cycleLabel(selectedCycle)} · {formatCurrency(selectedPlan?.[selectedCycle === 'yearly' ? 'price_yearly' : 'price_monthly'], currency)}</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={planForm.processing || !selectedPlanCode}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                        {planForm.processing ? 'Enviando...' : 'Solicitar cambio'}
                                    </button>
                                </div>
                            </form>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Apoyo comercial"
                            title="Mejor contexto para decidir"
                            description="Mostramos ayuda comercial y ahorro anual fuera del comparador para que la eleccion sea mas intuitiva."
                        >
                            <div className="space-y-4">
                                <MetricCard
                                    icon={TrendingUp}
                                    label="Plan seleccionado"
                                    value={selectedPlan?.name || 'Sin seleccion'}
                                    helper={selectedPlan ? `${selectedPlan.photos_per_month ?? 'Ilimitadas'} fotos por mes y ${selectedPlan.storage_gb ?? 'Ilimitado'} GB de almacenamiento.` : 'Elige una opcion para ver su resumen.'}
                                    accent="blue"
                                />
                                <MetricCard
                                    icon={Wallet}
                                    label="Ahorro anual"
                                    value={annualSavings > 0 ? formatCurrency(annualSavings, currency) : formatCurrency(0, currency)}
                                    helper={annualSavings > 0 ? 'Pagando anual reduces el costo frente a pagar los 12 meses por separado.' : 'Este plan no tiene descuento anual adicional.'}
                                    accent="emerald"
                                />
                                <div className="rounded-[1.7rem] border border-amber-200 bg-amber-50 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">Siguiente paso</p>
                                    <p className="mt-3 text-sm leading-7 text-slate-700">
                                        La solicitud queda registrada para que administracion aplique el ajuste de cobro y la activacion del nuevo plan.
                                    </p>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                        <SectionCard
                            eyebrow="Facturacion"
                            title="Resumen de facturacion"
                            description="El cliente entra aqui solo para entender cuanto se cobra, cuando vence y cual es su forma actual de pago. Ya no compite con formularios ni historial abajo."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Monto del ciclo</p>
                                    <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(subscription?.amount || nextCharge, currency)}</p>
                                    <p className="mt-2 text-sm text-slate-600">Cobro {cycleLabel(subscription?.billing_cycle || 'monthly').toLowerCase()} del plan actual.</p>
                                </div>
                                <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Modo de pago</p>
                                    <p className="mt-3 text-2xl font-semibold text-slate-900">{toTitle(subscription?.payment_mode || 'offline')}</p>
                                    <p className="mt-2 text-sm text-slate-600">Proveedor: {toTitle(subscription?.provider || 'manual')}</p>
                                </div>
                                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Renovacion prevista</p>
                                    <p className="mt-3 text-xl font-semibold text-slate-900">{formatDate(subscription?.current_period_ends_at || billing?.next_charge_at)}</p>
                                </div>
                                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Vigencia</p>
                                    <p className="mt-3 text-xl font-semibold text-slate-900">{formatDate(subscription?.expires_at || billing?.expires_at)}</p>
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Salud de cobro"
                            title="Estado financiero actual"
                            description="Tarjetas rapidas para entender si la cuenta esta al dia o si hay algo pendiente por confirmar."
                        >
                            <div className="space-y-4">
                                <MetricCard
                                    icon={CreditCard}
                                    label="Estado de la suscripcion"
                                    value={toTitle(subscription?.status || billing?.status || 'pending')}
                                    helper="Este estado resume si la cuenta esta activa, pendiente o requiere seguimiento manual."
                                    accent="blue"
                                />
                                <MetricCard
                                    icon={Landmark}
                                    label="Pagos enviados"
                                    value={`${transactions.length}`}
                                    helper={transactions.length ? 'Incluye pagos confirmados, solicitudes y movimientos manuales.' : 'Todavia no hay registros de facturacion.'}
                                    accent="amber"
                                />
                            </div>
                        </SectionCard>
                    </div>
                )}

                {activeTab === 'history' && (
                    <SectionCard
                        eyebrow="Actividad"
                        title="Historial reciente"
                        description="El historial queda solo en esta vista para que el cliente revise movimientos sin interferir con las acciones principales."
                    >
                        {transactions.length ? (
                            <div className="space-y-3">
                                {transactions.map((transaction) => (
                                    <article key={transaction.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <p className="text-base font-semibold text-slate-900">{toTitle(transaction.type)}</p>
                                                    <StatusPill value={transaction.status} />
                                                </div>
                                                <p className="mt-2 text-sm text-slate-600">{formatDate(transaction.occurred_at)} · {toTitle(transaction.provider)}</p>
                                                {transaction.reference && <p className="mt-1 text-sm text-slate-500">Referencia: {transaction.reference}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-semibold text-slate-900">{formatCurrency(transaction.amount, transaction.currency)}</p>
                                                {transaction.payload?.receipt_url && (
                                                    <a
                                                        href={transaction.payload.receipt_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
                                                    >
                                                        Ver comprobante
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={BadgeCheck}
                                title="Todavia no hay movimientos recientes"
                                description="Cuando se registren cobros, solicitudes de cambio o pagos offline, apareceran aqui en orden cronologico."
                            />
                        )}
                    </SectionCard>
                )}
            </div>
        </AdminLayout>
    );
}
