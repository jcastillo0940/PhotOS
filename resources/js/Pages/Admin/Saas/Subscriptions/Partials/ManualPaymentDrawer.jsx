import React from 'react';
import { useForm } from '@inertiajs/react';
import { Drawer, Input, Button } from '@/Components/UI';
import { DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export default function ManualPaymentDrawer({ subscription, isOpen, onClose }) {
    if (!subscription) return null;

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
        <Drawer 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Registrar Pago de Estudio"
        >
            <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Estudio Destino</p>
                <p className="text-sm font-bold text-slate-800">{subscription.tenant?.name}</p>
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Plan actual:</span>
                    <span className="inline-flex rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">{subscription.plan_code}</span>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Input 
                        label="Monto recibido" 
                        type="number" 
                        step="0.01"
                        icon={DollarSign}
                        value={data.amount} 
                        onChange={e => setData('amount', e.target.value)}
                        error={errors.amount}
                    />
                    <Input 
                        label="Fecha efectiva" 
                        type="date" 
                        icon={Calendar}
                        value={data.occurred_at} 
                        onChange={e => setData('occurred_at', e.target.value)}
                        error={errors.occurred_at}
                    />
                </div>

                <Input 
                    label="Referencia / Comprobante" 
                    icon={CheckCircle2}
                    value={data.reference} 
                    onChange={e => setData('reference', e.target.value)}
                    placeholder="Ej. Transferencia Banco..."
                    error={errors.reference}
                />

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Notas de conciliación</label>
                    <textarea 
                        value={data.notes} 
                        onChange={e => setData('notes', e.target.value)} 
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white transition-all h-28 resize-none"
                        placeholder="Detalles sobre el origen del pago..."
                    />
                </div>

                <div className="pt-4">
                    <Button 
                        type="submit" 
                        className="w-full" 
                        loading={processing}
                        variant="success"
                        icon={FileText}
                    >
                        Confirmar y Extender Periodo
                    </Button>
                </div>
            </form>
        </Drawer>
    );
}
