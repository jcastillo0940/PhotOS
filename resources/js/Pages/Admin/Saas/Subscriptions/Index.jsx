import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { FileText, Plus, DollarSign, Calendar, Building2, ExternalLink, X, CreditCard, ChevronRight } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { clsx } from 'clsx';

function ManualPaymentModal({ subscription, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: subscription.amount || 0,
        reference: '',
        occurred_at: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(`/admin/saas/subscriptions/${subscription.id}/manual-payment`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-[2.5rem] border border-[#e6e0d5] bg-white p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Registrar Pago Manual</h3>
                        <p className="text-sm text-slate-500">Esto extenderá el periodo de {subscription.tenant?.name}.</p>
                    </div>
                    <button onClick={onClose} className="rounded-2xl p-2 hover:bg-slate-100 transition-colors">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Monto recibido</span>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input type="number" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] pl-11 pr-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors" />
                            </div>
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Fecha del pago</span>
                            <input type="date" value={data.occurred_at} onChange={e => setData('occurred_at', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors" />
                        </label>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Referencia / Comprobante</span>
                        <input value={data.reference} onChange={e => setData('reference', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors" placeholder="Ej. Transf 49302" />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Notas internas</span>
                        <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors h-24" placeholder="Cualquier detalle adicional..."></textarea>
                    </label>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-[#e6e0d5] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                        <button type="submit" disabled={processing} className="px-8 py-3 rounded-2xl bg-[#171411] text-sm font-semibold text-white hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                            {processing ? 'Registrando...' : 'Confirmar Pago y Extender'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SubscriptionModal({ subscription, tenants, plans, onClose }) {
    const isEditing = !!subscription;
    const { data, setData, post, put, processing, errors } = useForm({
        tenant_id: subscription?.tenant_id || '',
        plan_code: subscription?.plan_code || plans[0]?.code || '',
        billing_cycle: subscription?.billing_cycle || 'monthly',
        amount: subscription?.amount || 0,
        currency: subscription?.currency || 'USD',
        status: subscription?.status || 'active',
        current_period_ends_at: subscription?.current_period_ends_at?.split('T')[0] || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/admin/saas/subscriptions/${subscription.id}`, { onSuccess: () => onClose() });
        } else {
            post('/admin/saas/subscriptions', { onSuccess: () => onClose() });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-[2.5rem] border border-[#e6e0d5] bg-white p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Ajustar Suscripción' : 'Nueva Suscripción Manual'}</h3>
                    <button onClick={onClose} className="rounded-2xl p-2 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {!isEditing && (
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Tenant (Estudio)</span>
                            <select value={data.tenant_id} onChange={e => setData('tenant_id', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none">
                                <option value="">Selecciona un estudio...</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </label>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Plan</span>
                            <select value={data.plan_code} onChange={e => setData('plan_code', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none">
                                {plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </select>
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Ciclo</span>
                            <select value={data.billing_cycle} onChange={e => setData('billing_cycle', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none">
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Monto recurrente</span>
                            <input type="number" value={data.amount} onChange={e => setData('amount', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none" />
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Vence el</span>
                            <input type="date" value={data.current_period_ends_at} onChange={e => setData('current_period_ends_at', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none" />
                        </label>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Estado actual</span>
                        <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none">
                            <option value="active">Activa (Acceso total)</option>
                            <option value="pending">Pendiente de pago</option>
                            <option value="past_due">En mora (Restringida)</option>
                            <option value="canceled">Cancelada</option>
                        </select>
                    </label>

                    <div className="flex justify-end gap-3 pt-6">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-[#e6e0d5] text-sm font-semibold text-slate-600">Cancelar</button>
                        <button type="submit" disabled={processing} className="px-8 py-3 rounded-2xl bg-[#171411] text-sm font-semibold text-white hover:bg-black transition-all">
                            {isEditing ? 'Guardar Cambios' : 'Crear Suscripción'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ subscriptions, tenants, plans }) {
    const [modalSub, setModalSub] = React.useState(null);
    const [paymentSub, setPaymentSub] = React.useState(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-50 text-green-700 border-green-100';
            case 'past_due': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'canceled': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <AdminLayout>
            <Head title="SaaS - Suscripciones" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Gestión de Suscripciones</h2>
                        <p className="text-sm text-slate-500">Administra periodos, ciclos y cobros manuales de los tenants.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black">
                        <Plus className="h-4 w-4" />
                        Nueva suscripción manual
                    </button>
                </div>

                <div className="rounded-[2.5rem] border border-[#e6e0d5] bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#f3eee6] bg-[#fcfaf7]">
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Estudio / Tenant</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Plan / Recurrencia</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Estado</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Próximo cobro</th>
                                    <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f3eee6]">
                                {subscriptions.map((sub) => (
                                    <tr key={sub.id} className="group hover:bg-[#fcfaf7] transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1ebe1]"><Building2 className="h-4 w-4 text-slate-600" /></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{sub.tenant?.name}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                                                        <CreditCard className="h-3 w-3" /> {sub.provider} · {sub.payment_mode}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-sm font-bold text-slate-900 capitalize">{sub.plan_code}</p>
                                            <p className="text-xs text-slate-500">{sub.amount} {sub.currency} / {sub.billing_cycle === 'yearly' ? 'año' : 'mes'}</p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={clsx('inline-flex items-center rounded-xl border px-3 py-1 text-[11px] font-bold uppercase tracking-wider', getStatusColor(sub.status))}>
                                                {sub.status === 'past_due' ? 'En mora' : sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                {sub.current_period_ends_at ? new Date(sub.current_period_ends_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setPaymentSub(sub)} className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-100 transition-colors">
                                                    <DollarSign className="h-3 w-3" /> Registrar Pago
                                                </button>
                                                <button onClick={() => setModalSub(sub)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6e0d5] text-slate-600 hover:bg-white transition-colors">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {(isCreateOpen || modalSub) && (
                <SubscriptionModal 
                    subscription={modalSub} 
                    tenants={tenants} 
                    plans={plans} 
                    onClose={() => { setModalSub(null); setIsCreateOpen(false); }} 
                />
            )}

            {paymentSub && (
                <ManualPaymentModal 
                    subscription={paymentSub} 
                    onClose={() => setPaymentSub(null)} 
                />
            )}
        </AdminLayout>
    );
}

function Edit2(props) { return <Edit2Icon {...props} />; }
function Edit2Icon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    </svg>
  );
}
