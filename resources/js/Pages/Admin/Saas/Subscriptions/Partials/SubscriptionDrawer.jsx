import React from 'react';
import { useForm } from '@inertiajs/react';
import { Drawer, Input, Button } from '@/Components/UI';
import { Calendar, DollarSign, Activity } from 'lucide-react';

export default function SubscriptionDrawer({ subscription, tenants, plans, isOpen, onClose }) {
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
        <Drawer 
            isOpen={isOpen} 
            onClose={onClose} 
            title={isEditing ? 'Gestionar Suscripción' : 'Nueva Suscripción Manual'}
        >
            <form onSubmit={submit} className="space-y-6">
                {!isEditing && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Estudio / Tenant</label>
                        <select 
                            value={data.tenant_id} 
                            onChange={e => setData('tenant_id', e.target.value)} 
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                        >
                            <option value="">Selecciona un estudio...</option>
                            {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        {errors.tenant_id && <p className="text-xs text-red-500 font-bold mt-1 px-1">{errors.tenant_id}</p>}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Plan contratado</label>
                        <select 
                            value={data.plan_code} 
                            onChange={e => setData('plan_code', e.target.value)} 
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                        >
                            {plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Ciclo de cobro</label>
                        <select 
                            value={data.billing_cycle} 
                            onChange={e => setData('billing_cycle', e.target.value)} 
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all"
                        >
                            <option value="monthly">Mensual</option>
                            <option value="yearly">Anual</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Monto base" 
                        type="number" 
                        icon={DollarSign}
                        value={data.amount} 
                        onChange={e => setData('amount', e.target.value)}
                        error={errors.amount}
                    />
                    <Input 
                        label="Próximo vencimiento" 
                        type="date" 
                        icon={Calendar}
                        value={data.current_period_ends_at} 
                        onChange={e => setData('current_period_ends_at', e.target.value)}
                        error={errors.current_period_ends_at}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Estado de la cuenta</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'active', label: 'Activa', color: 'bg-green-500' },
                            { id: 'past_due', label: 'En mora', color: 'bg-amber-500' },
                            { id: 'canceled', label: 'Cancelada', color: 'bg-red-500' },
                            { id: 'pending', label: 'Pendiente', color: 'bg-slate-400' },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setData('status', s.id)}
                                className={clsx(
                                    'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold transition-all',
                                    data.status === s.id 
                                        ? 'border-primary bg-primary/5 text-primary' 
                                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                )}
                            >
                                <div className={clsx('h-1.5 w-1.5 rounded-full', s.color)} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6">
                    <Button 
                        type="submit" 
                        className="w-full" 
                        loading={processing}
                        icon={Activity}
                    >
                        {isEditing ? 'Actualizar Suscripción' : 'Activar Suscripción'}
                    </Button>
                </div>
            </form>
        </Drawer>
    );
}
