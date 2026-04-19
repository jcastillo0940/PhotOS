import React from 'react';
import { useForm } from '@inertiajs/react';
import { Drawer, Input, Button } from '@/Components/UI';
import { Building2, Globe2, Mail, Lock, Layout, CreditCard, Plus } from 'lucide-react';

export default function CreateTenantDrawer({ isOpen, onClose, plans, presets }) {
    const defaultPlanCode = plans[0]?.code || 'starter';
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        slug: '',
        primary_hostname: '',
        billing_email: '',
        plan_code: defaultPlanCode,
        owner_name: '',
        owner_email: '',
        owner_password: '',
        custom_domain: '',
        preset_key: presets[0]?.key || 'editorial-warm',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/saas/tenants', {
            onSuccess: () => onClose(),
        });
    };

    return (
        <Drawer 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Aprovisionar Nuevo Estudio"
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Identidad del Estudio</p>
                    <Input 
                        label="Nombre comercial" 
                        icon={Building2}
                        value={data.name} 
                        onChange={e => setData('name', e.target.value)}
                        error={errors.name}
                        placeholder="Ej. Raw Pixel Studio"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Identificador (Slug)" 
                            value={data.slug} 
                            onChange={e => setData('slug', e.target.value)}
                            error={errors.slug}
                            placeholder="raw-pixel"
                        />
                        <Input 
                            label="Email de facturación" 
                            icon={Mail}
                            type="email"
                            value={data.billing_email} 
                            onChange={e => setData('billing_email', e.target.value)}
                            error={errors.billing_email}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Infraestructura y Red</p>
                    <Input 
                        label="Dominio principal (o subdominio)" 
                        icon={Globe2}
                        value={data.primary_hostname} 
                        onChange={e => setData('primary_hostname', e.target.value)}
                        error={errors.primary_hostname}
                        placeholder="raw.photos.tuapp.com"
                    />
                    <Input 
                        label="Dominio custom (opcional)" 
                        value={data.custom_domain} 
                        onChange={e => setData('custom_domain', e.target.value)}
                        error={errors.custom_domain}
                        placeholder="fotos.rawpixel.com"
                    />
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Acceso Administrador</p>
                    <Input 
                        label="Nombre completo" 
                        value={data.owner_name} 
                        onChange={e => setData('owner_name', e.target.value)}
                        error={errors.owner_name}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            label="Email root" 
                            icon={Mail}
                            value={data.owner_email} 
                            onChange={e => setData('owner_email', e.target.value)}
                            error={errors.owner_email}
                        />
                        <Input 
                            label="Password temporal" 
                            icon={Lock}
                            type="password"
                            value={data.owner_password} 
                            onChange={e => setData('owner_password', e.target.value)}
                            error={errors.owner_password}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Plan inicial</label>
                        <select 
                            value={data.plan_code} 
                            onChange={e => setData('plan_code', e.target.value)} 
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                        >
                            {plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">Diseño (Preset)</label>
                        <select 
                            value={data.preset_key} 
                            onChange={e => setData('preset_key', e.target.value)} 
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                        >
                             {presets.map((preset) => (
                                <option key={preset.key} value={preset.key}>
                                    {preset.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="pt-4">
                    <Button 
                        type="submit" 
                        className="w-full" 
                        loading={processing}
                        icon={Plus}
                    >
                        Activar Estudio
                    </Button>
                </div>
            </form>
        </Drawer>
    );
}
