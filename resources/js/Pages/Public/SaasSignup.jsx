import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BadgeCheck, CreditCard, Globe2, ShieldCheck } from 'lucide-react';

export default function SaasSignup({ plans = [], presets = [], paymentGateways = [], centralDomain, selectedPlanCode = 'starter' }) {
    const featuredPlan = plans.find((plan) => plan.code === selectedPlanCode)?.code || plans.find((plan) => plan.featured)?.code || plans[0]?.code || 'starter';
    const form = useForm({
        studio_name: '',
        slug: '',
        owner_name: '',
        owner_email: '',
        owner_phone: '',
        owner_password: '',
        plan_code: featuredPlan,
        billing_cycle: 'monthly',
        preset_key: presets[0]?.key || 'editorial-warm',
        requested_domain: '',
        payment_gateway: paymentGateways[0]?.code || 'tilopay',
        terms: false,
    });

    const selectedPlan = plans.find((plan) => plan.code === form.data.plan_code) || plans[0];
    const selectedPrice = form.data.billing_cycle === 'annual' ? selectedPlan?.annual_price : selectedPlan?.monthly_price;

    const submit = (event) => {
        event.preventDefault();
        form.post('/get-started');
    };

    return (
        <div className="min-h-screen bg-[#f5efe4] px-6 py-10 text-[#1f1813] md:px-10">
            <Head title="Get Started | PhotOS" />

            <div className="mx-auto max-w-7xl">
                <div className="mb-10 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] text-[#a07047]">Onboarding SaaS</p>
                        <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Crea tu estudio en PhotOS y elige tu plan.</h1>
                    </div>
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#dcc8b2] bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#3b2a1f]">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Link>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
                    <form onSubmit={submit} className="rounded-[2.4rem] border border-[#e5d6c3] bg-white p-8 shadow-[0_24px_60px_rgba(60,40,24,.08)]">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Nombre del estudio" value={form.data.studio_name} onChange={(value) => form.setData('studio_name', value)} error={form.errors.studio_name} placeholder="Misael David Studio" />
                            <Field label="Slug / subdominio" value={form.data.slug} onChange={(value) => form.setData('slug', value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} error={form.errors.slug} placeholder="misaeldavid" />
                            <Field label="Nombre del owner" value={form.data.owner_name} onChange={(value) => form.setData('owner_name', value)} error={form.errors.owner_name} placeholder="Misael David" />
                            <Field label="Email del owner" type="email" value={form.data.owner_email} onChange={(value) => form.setData('owner_email', value.toLowerCase())} error={form.errors.owner_email} placeholder="hola@estudio.com" />
                            <Field label="Telefono" value={form.data.owner_phone} onChange={(value) => form.setData('owner_phone', value)} error={form.errors.owner_phone} placeholder="+507 0000-0000" />
                            <Field label="Contrasena inicial" type="password" value={form.data.owner_password} onChange={(value) => form.setData('owner_password', value)} error={form.errors.owner_password} placeholder="********" />
                        </div>

                        <div className="mt-8 grid gap-5 md:grid-cols-2">
                            <SelectField label="Plan" value={form.data.plan_code} onChange={(value) => form.setData('plan_code', value)} error={form.errors.plan_code} options={plans.map((plan) => ({ value: plan.code, label: plan.name }))} />
                            <SelectField label="Ciclo de cobro" value={form.data.billing_cycle} onChange={(value) => form.setData('billing_cycle', value)} error={form.errors.billing_cycle} options={[{ value: 'monthly', label: 'Mensual' }, { value: 'annual', label: 'Anual' }]} />
                            <SelectField label="Preset visual" value={form.data.preset_key} onChange={(value) => form.setData('preset_key', value)} error={form.errors.preset_key} options={presets.map((preset) => ({ value: preset.key, label: preset.label }))} />
                            <SelectField label="Gateway de pago" value={form.data.payment_gateway} onChange={(value) => form.setData('payment_gateway', value)} error={form.errors.payment_gateway} options={paymentGateways.map((gateway) => ({ value: gateway.code, label: gateway.label }))} />
                        </div>

                        <div className="mt-5">
                            <Field label="Dominio propio (opcional)" value={form.data.requested_domain} onChange={(value) => form.setData('requested_domain', value.toLowerCase())} error={form.errors.requested_domain} placeholder="fotos.tudominio.com" />
                            <p className="mt-2 text-sm text-[#7d6554]">Si no conectas uno ahora, te dejamos listo un subdominio inicial en `{centralDomain}`. Los planes Pro, Business y Enterprise tambien pueden usar dominio propio.</p>
                        </div>

                        <label className="mt-6 flex items-start gap-3 rounded-[1.4rem] border border-[#eadbca] bg-[#faf5ef] px-4 py-4 text-sm text-[#5e4a3c]">
                            <input type="checkbox" checked={form.data.terms} onChange={(event) => form.setData('terms', event.target.checked)} className="mt-1 h-4 w-4" />
                            <span>Acepto iniciar el alta del estudio y la activacion del plan seleccionado.</span>
                        </label>
                        {form.errors.terms && <p className="mt-2 text-sm text-rose-600">{form.errors.terms}</p>}

                        <button type="submit" disabled={form.processing} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#201610] px-6 py-4 text-sm font-semibold text-white transition disabled:opacity-60">
                            {form.processing ? 'Creando estudio...' : 'Crear estudio y continuar'}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    <aside className="space-y-6">
                        <div className="rounded-[2.4rem] border border-[#e5d6c3] bg-[#201610] p-8 text-white shadow-[0_24px_60px_rgba(60,40,24,.08)]">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-[#d7a36d]">Resumen del plan</p>
                            <h2 className="mt-3 text-3xl font-semibold">{selectedPlan?.name}</h2>
                            <p className="mt-4 text-sm leading-7 text-white/72">{selectedPlan?.description}</p>
                            <p className="mt-6 text-5xl font-semibold">${selectedPrice}<span className="ml-1 text-base font-normal text-white/60">/{form.data.billing_cycle === 'annual' ? 'ano' : 'mes'}</span></p>
                            <div className="mt-6 space-y-3">
                                {selectedPlan?.items?.map((item) => (
                                    <div key={item} className="flex items-start gap-3 text-sm text-white/82">
                                        <BadgeCheck className="mt-0.5 h-4 w-4 text-[#d7a36d]" />
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2.2rem] border border-[#e5d6c3] bg-white p-7">
                            <div className="flex items-start gap-3">
                                <Globe2 className="mt-1 h-5 w-5 text-[#a07047]" />
                                <div>
                                    <p className="text-lg font-semibold">Tu estudio nace con dominio propio del SaaS</p>
                                    <p className="mt-2 text-sm leading-7 text-[#6b594c]">
                                        Apenas envias el formulario, el sistema te reserva un subdominio inicial y deja al tenant listo para personalizar branding, home y galerias.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2.2rem] border border-[#e5d6c3] bg-white p-7">
                            <div className="flex items-start gap-3">
                                <CreditCard className="mt-1 h-5 w-5 text-[#a07047]" />
                                <div>
                                    <p className="text-lg font-semibold">Listo para checkout</p>
                                    <p className="mt-2 text-sm leading-7 text-[#6b594c]">
                                        Este flujo ya captura plan, ciclo y gateway deseado. Puedes conectarlo despues al cobro real con Tilopay o PayPal sin rehacer el onboarding.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2.2rem] border border-[#e5d6c3] bg-white p-7">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-1 h-5 w-5 text-[#a07047]" />
                                <div>
                                    <p className="text-lg font-semibold">Acceso privado desde el primer minuto</p>
                                    <p className="mt-2 text-sm leading-7 text-[#6b594c]">
                                        Se crea el owner del tenant, su dominio inicial y la atmosfera visual base para que el estudio ya pueda entrar y comenzar a configurar su espacio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function Field({ label, error, onChange, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07047]">{label}</label>
            <input {...props} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[1.4rem] border border-[#eadbca] bg-[#faf5ef] px-4 py-3 text-sm text-[#201610] outline-none" />
            {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
    );
}

function SelectField({ label, value, onChange, options = [], error }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a07047]">{label}</label>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[1.4rem] border border-[#eadbca] bg-[#faf5ef] px-4 py-3 text-sm text-[#201610] outline-none">
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
            {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
    );
}

