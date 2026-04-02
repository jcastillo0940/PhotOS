import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Layers3, PanelsTopLeft, Save, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export default function Index({ templates, currentTemplateCode, plans, currentPlanCode }) {
    const { data, setData, put, processing } = useForm({
        installation_plan: currentPlanCode,
        active_gallery_template: currentTemplateCode,
    });

    const submit = (event) => {
        event.preventDefault();
        put('/admin/templates');
    };

    return (
        <AdminLayout>
            <Head title="Plantillas y Plan Global" />

            <form onSubmit={submit} className="flex flex-col space-y-12">
                <div className="flex items-center justify-between gap-8">
                    <div>
                        <h1 className="text-4xl font-heading font-black tracking-tighter mb-2">Template <span className="text-primary-400">Control</span></h1>
                        <p className="text-[#666] font-medium tracking-wide italic">Solo developer puede cambiar el plan activo y la plantilla publica del cliente</p>
                    </div>
                    <button
                        disabled={processing}
                        className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all"
                    >
                        <Save className="w-4 h-4 inline mr-2" />
                        {processing ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <section className="p-10 bg-[#0d0d0d] rounded-[60px] border border-white/5 shadow-inner-xl">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                                <Layers3 className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading font-black tracking-tight">Plan Global</h2>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#555] mt-2">Aplica a toda la instalacion</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {plans.map((plan) => (
                                <button
                                    key={plan.code}
                                    type="button"
                                    onClick={() => setData('installation_plan', plan.code)}
                                    className={clsx(
                                        'text-left p-6 rounded-[32px] border transition-all',
                                        data.installation_plan === plan.code
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-white/5 bg-white/5 hover:border-white/20'
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary-400 mb-2">{plan.tagline}</p>
                                            <h3 className="text-xl font-heading font-black text-white">{plan.name}</h3>
                                        </div>
                                        <span className="text-xs font-black text-white">{plan.price_label}</span>
                                    </div>
                                    <p className="text-sm text-[#aaa] mb-4">{plan.audience}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.highlights?.map((item) => (
                                            <span key={item} className="px-3 py-1 rounded-full bg-black/20 border border-white/5 text-[10px] uppercase tracking-widest text-[#999] font-black">{item}</span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="p-10 bg-[#0d0d0d] rounded-[60px] border border-white/5 shadow-inner-xl">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
                                <PanelsTopLeft className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-heading font-black tracking-tight">Plantilla Publica</h2>
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-[#555] mt-2">Look que vera el cliente final</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {templates.map((template) => (
                                <button
                                    key={template.code}
                                    type="button"
                                    onClick={() => setData('active_gallery_template', template.code)}
                                    className={clsx(
                                        'text-left p-6 rounded-[32px] border transition-all',
                                        data.active_gallery_template === template.code
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-white/5 bg-white/5 hover:border-white/20'
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-4 mb-4">
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary-400 mb-2">{template.tagline}</p>
                                            <h3 className="text-xl font-heading font-black text-white">{template.name}</h3>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl border border-white/10" style={{ backgroundColor: template.accent }} />
                                    </div>
                                    <p className="text-sm text-[#aaa]">{template.description}</p>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="p-10 bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[60px] flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-[#222]">
                        <ShieldCheck className="w-12 h-12" />
                        <div>
                            <p className="font-heading font-black text-lg tracking-tight leading-none mb-2">Consola reservada al developer</p>
                            <p className="text-[10px] uppercase font-bold tracking-[0.2em] leading-relaxed">Desde aqui se controla la experiencia publica completa.<br/>Los fotografos no tocan el plan ni la plantilla global por accidente.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-black tracking-widest text-[#333]">Activos</p>
                        <p className="text-sm text-white font-black">{plans.find(plan => plan.code === data.installation_plan)?.name} · {templates.find(template => template.code === data.active_gallery_template)?.name}</p>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

