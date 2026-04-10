import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, CircleCheck, CreditCard, Globe2, LockKeyhole, Sparkles } from 'lucide-react';

export default function SaasSignupSuccess({ registration, plan, paypalEnabled = false }) {
    const startPayPal = () => {
        router.post(`/get-started/${registration.id}/paypal/subscribe`);
    };

    return (
        <div className="min-h-screen bg-[#f5efe4] px-6 py-10 text-[#1f1813] md:px-10">
            <Head title={`Alta creada | ${registration.studio_name}`} />

            <div className="mx-auto max-w-4xl rounded-[2.6rem] border border-[#e5d6c3] bg-white p-8 shadow-[0_24px_60px_rgba(60,40,24,.08)] md:p-12">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#f4eadf] text-[#a07047]">
                    <CircleCheck className="h-10 w-10" />
                </div>

                <div className="text-center">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-[#a07047]">Alta creada</p>
                    <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{registration.studio_name} ya tiene espacio dentro del SaaS.</h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#6b594c]">
                        Tu tenant, owner inicial y subdominio base ya quedaron creados. Ahora puedes completar el cobro automatico con PayPal o gestionarlo manualmente si trabajas con cobro offline.
                    </p>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-2">
                    <InfoCard icon={Sparkles} label="Plan" value={`${plan?.name || registration.plan_code} · ${registration.billing_cycle === 'annual' ? 'Anual' : 'Mensual'}`} />
                    <InfoCard icon={CreditCard} label="Monto estimado" value={registration?.metadata?.selected_price ? `$${registration.metadata.selected_price} USD` : 'Pendiente de definir'} />
                    <InfoCard icon={Globe2} label="Subdominio inicial" value={registration.provisioned_hostname} />
                    <InfoCard icon={LockKeyhole} label="Login" value={registration.login_url} compact />
                </div>

                {registration.requested_domain && (
                    <div className="mt-8 rounded-[1.8rem] border border-[#eadbca] bg-[#faf5ef] p-6">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#a07047]">Dominio solicitado</p>
                        <p className="mt-2 text-lg font-semibold">{registration.requested_domain}</p>
                        <p className="mt-2 text-sm leading-7 text-[#6b594c]">
                            Puedes conectarlo despues desde el panel SaaS y el onboarding de Cloudflare for SaaS ya esta preparado para eso.
                        </p>
                    </div>
                )}

                <div className="mt-8 rounded-[1.8rem] border border-[#eadbca] bg-[#faf5ef] p-6">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#a07047]">Siguientes pasos</p>
                    <div className="mt-4 grid gap-3 text-sm leading-7 text-[#5f4a3a] md:grid-cols-3">
                        <p>1. Completa el cobro automatico o confirma el pago offline del plan.</p>
                        <p>2. Entra al tenant para personalizar branding, home y galerias.</p>
                        <p>3. Si quieres dominio propio, conectalo despues desde el modulo SaaS.</p>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 md:flex-row md:flex-wrap">
                    {registration.payment_gateway === 'paypal' && paypalEnabled && (
                        <button type="button" onClick={startPayPal} className="inline-flex items-center gap-2 rounded-full bg-[#201610] px-6 py-4 text-sm font-semibold text-white transition">
                            Activar suscripcion en PayPal
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                    <a href={registration.login_url} className="inline-flex items-center gap-2 rounded-full border border-[#dcc8b2] bg-white px-6 py-4 text-sm font-semibold text-[#3b2a1f] transition">
                        Entrar al estudio
                    </a>
                    <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-[#dcc8b2] bg-white px-6 py-4 text-sm font-semibold text-[#3b2a1f] transition">
                        Volver al landing
                    </Link>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value, compact = false }) {
    return (
        <div className="rounded-[1.7rem] border border-[#eadbca] bg-[#faf5ef] p-5">
            <Icon className="h-5 w-5 text-[#a07047]" />
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#a07047]">{label}</p>
            <p className={`mt-2 font-semibold text-[#1f1813] ${compact ? 'break-all text-sm' : 'text-base'}`}>{value}</p>
        </div>
    );
}