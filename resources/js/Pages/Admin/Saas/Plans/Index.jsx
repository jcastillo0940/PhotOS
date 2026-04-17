import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Edit2, Plus, Tags, Upload, Users, Wand2, X } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { clsx } from 'clsx';

const FEATURE_FIELDS = [
    { key: 'storage_gb', label: 'Storage total (GB)', icon: Upload },
    { key: 'photos_per_month', label: 'Fotos por mes', icon: Upload },
    { key: 'ai_scans_monthly', label: 'Procesamientos IA por mes', icon: Wand2 },
    { key: 'staff_limit', label: 'Usuarios del equipo', icon: Users },
    { key: 'sponsor_selection_limit', label: 'Patrocinadores por evento', icon: Tags },
];

function normalizePlan(plan) {
    return {
        code: plan?.code || '',
        name: plan?.name || '',
        is_active: plan?.is_active ?? true,
        features: {
            storage_gb: plan?.features?.storage_gb ?? '',
            photos_per_month: plan?.features?.photos_per_month ?? '',
            ai_scans_monthly: plan?.features?.ai_scans_monthly ?? '',
            staff_limit: plan?.features?.staff_limit ?? '',
            sponsor_selection_limit: plan?.features?.sponsor_selection_limit ?? '',
            custom_domain: plan?.features?.custom_domain ?? false,
            ai_face_recognition: plan?.features?.ai_face_recognition ?? false,
            ai_sponsor_detection: plan?.features?.ai_sponsor_detection ?? false,
            requires_explicit_sponsors: plan?.features?.requires_explicit_sponsors ?? false,
            segment: plan?.segment ?? plan?.features?.segment ?? '',
            price_monthly: plan?.price_monthly ?? plan?.features?.price_monthly ?? 0,
            price_yearly: plan?.price_yearly ?? plan?.features?.price_yearly ?? 0,
            price_monthly_promo: plan?.price_monthly_promo ?? plan?.features?.price_monthly_promo ?? '',
            price_yearly_promo: plan?.price_yearly_promo ?? plan?.features?.price_yearly_promo ?? '',
        },
    };
}

function PlanModal({ plan, onClose }) {
    const isEditing = !!plan;
    const { data, setData, post, put, processing, errors } = useForm(normalizePlan(plan));

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/admin/saas/plans/${plan.id}`, { onSuccess: () => onClose() });
        } else {
            post('/admin/saas/plans', { onSuccess: () => onClose() });
        }
    };

    const setFeature = (key, value) => {
        setData('features', {
            ...data.features,
            [key]: value === '' ? null : Number(value),
        });
    };

    const setBooleanFeature = (key, checked) => {
        setData('features', {
            ...data.features,
            [key]: checked,
        });
    };

    const setTextFeature = (key, value) => {
        setData('features', {
            ...data.features,
            [key]: value,
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto rounded-[2.5rem] border border-[#e6e0d5] bg-white p-8 shadow-2xl">
                <div className="mb-8 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Editar plan' : 'Nuevo plan SaaS'}</h3>
                    <button onClick={onClose} className="rounded-2xl p-2 hover:bg-slate-100">
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-5 lg:grid-cols-3">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Codigo interno</span>
                            <input value={data.code} onChange={(e) => setData('code', e.target.value)} disabled={isEditing} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none disabled:opacity-50" />
                            {errors.code && <p className="text-sm text-rose-600">{errors.code}</p>}
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Nombre publico</span>
                            <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none" />
                            {errors.name && <p className="text-sm text-rose-600">{errors.name}</p>}
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Segmento</span>
                            <select value={data.features.segment ?? ''} onChange={(e) => setTextFeature('segment', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none">
                                <option value="">Sin definir</option>
                                <option value="b2c">B2C</option>
                                <option value="b2b">B2B</option>
                                <option value="custom">Custom</option>
                            </select>
                        </label>
                    </div>

                    <div className="rounded-[1.75rem] border border-[#f3eee6] bg-[#fcfaf7] p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Precios del plan</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <label className="block space-y-2">
                                <span className="text-xs font-semibold text-slate-600">Precio mensual (USD)</span>
                                <input type="number" min="0" step="0.01" value={data.features.price_monthly ?? ''} onChange={(e) => setFeature('price_monthly', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm outline-none" />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-xs font-semibold text-slate-600">Precio anual (USD)</span>
                                <input type="number" min="0" step="0.01" value={data.features.price_yearly ?? ''} onChange={(e) => setFeature('price_yearly', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm outline-none" />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-xs font-semibold text-slate-600">Promo mensual</span>
                                <input type="number" min="0" step="0.01" value={data.features.price_monthly_promo ?? ''} onChange={(e) => setFeature('price_monthly_promo', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm outline-none" placeholder="Opcional" />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-xs font-semibold text-slate-600">Promo anual</span>
                                <input type="number" min="0" step="0.01" value={data.features.price_yearly_promo ?? ''} onChange={(e) => setFeature('price_yearly_promo', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm outline-none" placeholder="Opcional" />
                            </label>
                        </div>
                    </div>

                    <div className="rounded-[1.75rem] border border-[#f3eee6] bg-[#fcfaf7] p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Limites operativos</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {FEATURE_FIELDS.map(({ key, label, icon: Icon }) => (
                                <label key={key} className="block space-y-2">
                                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                        <Icon className="h-3 w-3" />
                                        {label}
                                    </span>
                                    <input type="number" value={data.features[key] ?? ''} onChange={(e) => setFeature(key, e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm outline-none" placeholder="Dejar vacio = ilimitado" />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {[
                            ['custom_domain', 'Permite dominio propio'],
                            ['ai_face_recognition', 'Permite reconocimiento facial'],
                            ['ai_sponsor_detection', 'Permite patrocinadores'],
                            ['requires_explicit_sponsors', 'Exige patrocinadores explicitos'],
                        ].map(([key, label]) => (
                            <label key={key} className="flex items-center gap-3 rounded-2xl border border-[#f3eee6] bg-[#fcfaf7] px-4 py-3">
                                <input type="checkbox" checked={!!data.features[key]} onChange={(e) => setBooleanFeature(key, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400" />
                                <span className="text-sm font-medium text-slate-700">{label}</span>
                            </label>
                        ))}
                    </div>

                    <label className="flex cursor-pointer items-center gap-3">
                        <div className="relative">
                            <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="peer sr-only" />
                            <div className="h-6 w-11 rounded-full bg-slate-200 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-full"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">Plan visible para nuevos registros</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="rounded-2xl border border-[#e6e0d5] px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={processing} className="rounded-2xl bg-[#171411] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-black">
                            {isEditing ? 'Actualizar plan' : 'Crear plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function SummaryValue({ value, currency = false }) {
    if (value === null || value === undefined || value === '') {
        return 'Ilimitado';
    }

    if (currency) {
        return `$${Number(value).toFixed(0)}`;
    }

    return value;
}

export default function Index({ plans }) {
    const [modalPlan, setModalPlan] = React.useState(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const { delete: destroy } = useForm();

    return (
        <AdminLayout>
            <Head title="SaaS - Planes" />

            <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e3da] pb-8">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configuracion de planes</h2>
                        <p className="mt-2 text-lg text-slate-500">Edita en una sola pantalla precios, limites y capacidades reales de cada plan.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-black">
                        <Plus className="h-5 w-5" />
                        Agregar nuevo plan
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {plans.map((plan) => (
                        <div key={plan.id} className="group relative rounded-[2.5rem] border border-[#e6e0d5] bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                                        {plan.is_active && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{plan.code}</p>
                                </div>
                                <button onClick={() => setModalPlan(plan)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] text-slate-600 transition-all hover:bg-white hover:text-slate-900">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-[#f3eee6] bg-[#fbfaf8] px-4 py-3.5">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Mensual</p>
                                    <p className="mt-2 text-xl font-bold text-slate-900"><SummaryValue value={plan.price_monthly} currency /></p>
                                </div>
                                <div className="rounded-2xl border border-[#f3eee6] bg-[#fbfaf8] px-4 py-3.5">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Anual</p>
                                    <p className="mt-2 text-xl font-bold text-slate-900"><SummaryValue value={plan.price_yearly} currency /></p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {[
                                    ['storage_gb', 'Storage GB'],
                                    ['photos_per_month', 'Fotos por mes'],
                                    ['staff_limit', 'Usuarios equipo'],
                                    ['sponsor_selection_limit', 'Sponsors por evento'],
                                ].map(([key, label]) => (
                                    <div key={key} className="flex items-center justify-between rounded-2xl border border-[#f3eee6] bg-[#fbfaf8] px-4 py-3.5">
                                        <span className="text-sm font-medium text-slate-500">{label}</span>
                                        <span className="text-sm font-bold text-slate-900"><SummaryValue value={plan.features?.[key]} /></span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex items-center justify-between border-t border-[#f3eee6] pt-6">
                                <span className={clsx('rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest', plan.is_active ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600')}>
                                    {plan.is_active ? 'Plan publico' : 'Plan oculto'}
                                </span>
                                <button onClick={() => confirm('¿Eliminar plan?') && destroy(`/admin/saas/plans/${plan.id}`)} className="text-xs font-bold uppercase tracking-widest text-slate-300 transition-colors hover:text-rose-500">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {(isCreateOpen || modalPlan) && <PlanModal plan={modalPlan} onClose={() => { setModalPlan(null); setIsCreateOpen(false); }} />}
        </AdminLayout>
    );
}
