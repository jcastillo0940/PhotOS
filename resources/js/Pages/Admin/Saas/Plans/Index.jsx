import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Layers3, Plus, Edit2, Trash2, X, CheckCircle2, Zap, CloudUpload } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

function PlanModal({ plan, onClose }) {
    const isEditing = !!plan;
    const { data, setData, post, put, processing, errors } = useForm({
        code: plan?.code || '',
        name: plan?.name || '',
        is_active: plan?.is_active ?? true,
        features: plan?.features || { ai_scans: 50, photo_uploads: 1000 },
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/admin/saas/plans/${plan.id}`, { onSuccess: () => onClose() });
        } else {
            post('/admin/saas/plans', { onSuccess: () => onClose() });
        }
    };

    const setFeature = (key, value) => {
        setData('features', { ...data.features, [key]: value === '' ? null : (isNaN(value) ? value : Number(value)) });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-[2.5rem] border border-[#e6e0d5] bg-white p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Editar Plan' : 'Nuevo Plan SaaS'}</h3>
                    <button onClick={onClose} className="rounded-2xl p-2 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Código interno</span>
                            <input value={data.code} onChange={e => setData('code', e.target.value)} disabled={isEditing} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none disabled:opacity-50" placeholder="basic-2024" />
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Nombre público</span>
                            <input value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none" placeholder="Starter / Pro / Studio" />
                        </label>
                    </div>

                    <div className="space-y-4 rounded-[1.75rem] border border-[#f3eee6] bg-[#fcfaf7] p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Limites y Features</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block space-y-2">
                                <span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Zap className="h-3 w-3" /> Escaneos IA</span>
                                <input type="number" value={data.features.ai_scans ?? ''} onChange={e => setFeature('ai_scans', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm outline-none" placeholder="Ilimitado = dejar vacio" />
                            </label>
                            <label className="block space-y-2">
                                <span className="flex items-center gap-2 text-xs font-semibold text-slate-600"><CloudUpload className="h-3 w-3" /> Fotos totales</span>
                                <input type="number" value={data.features.photo_uploads ?? ''} onChange={e => setFeature('photo_uploads', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-white px-3 py-2 text-sm outline-none" placeholder="Limite de subida" />
                            </label>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="peer sr-only" />
                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-green-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">Plan activo para nuevos registros</span>
                    </label>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-[#e6e0d5] text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                        <button type="submit" disabled={processing} className="px-8 py-3 rounded-2xl bg-[#171411] text-sm font-semibold text-white hover:bg-black transition-all flex items-center gap-2">
                            {isEditing ? 'Actualizar Plan' : 'Crear Plan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
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
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Configuración de Planes</h2>
                        <p className="mt-2 text-slate-500 text-lg">Define las cuotas, limites y el empaquetado del SaaS.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-6 py-4 text-sm font-bold text-white transition hover:bg-black shadow-lg shadow-slate-200">
                        <Plus className="h-5 w-5" />
                        Agregar nuevo plan
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {plans.map(plan => (
                        <div key={plan.id} className="relative group rounded-[2.5rem] border border-[#e6e0d5] bg-white p-7 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                                        {plan.is_active && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{plan.code}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setModalPlan(plan)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] text-slate-600 hover:text-slate-900 hover:bg-white transition-all">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 space-y-3">
                                {Object.entries(plan.features || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between rounded-2xl bg-[#fbfaf8] px-4 py-3.5 border border-[#f3eee6]">
                                        <span className="text-sm font-medium text-slate-500 capitalize">{key.replace('_', ' ')}</span>
                                        <span className="text-sm font-bold text-slate-900">{value === null ? 'Ilimitado' : value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-[#f3eee6] flex items-center justify-between">
                                <span className={clsx(
                                    'text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full',
                                    plan.is_active ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'
                                )}>
                                    {plan.is_active ? 'Plan Público' : 'Plan Oculto'}
                                </span>
                                <button 
                                    onClick={() => confirm('¿Eliminar plan?') && destroy(`/admin/saas/plans/${plan.id}`)}
                                    className="text-xs font-bold text-slate-300 hover:text-rose-500 uppercase tracking-widest transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {(isCreateOpen || modalPlan) && (
                <PlanModal 
                    plan={modalPlan} 
                    onClose={() => { setModalPlan(null); setIsCreateOpen(false); }} 
                />
            )}
        </AdminLayout>
    );
}
