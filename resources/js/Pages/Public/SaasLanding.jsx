import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, Camera, CircleCheck, Globe2, LayoutTemplate, ShieldCheck, Sparkles, Workflow } from 'lucide-react';

const scrollToTarget = (target) => {
    if (!target?.startsWith('#')) {
        return;
    }

    const element = document.querySelector(target);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function SaasLanding({ platform }) {
    return (
        <div className="min-h-screen bg-[#f5efe4] text-[#1f1813]">
            <Head title={`${platform.name} | Plataforma SaaS para fotografos`} />

            <section className="relative isolate overflow-hidden bg-[#17110d] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(224,164,97,.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,.14),transparent_20%),linear-gradient(135deg,#17110d_0%,#241912_45%,#3b2a1f_100%)]" />
                <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#d3a36d]/20 blur-3xl" />
                <div className="absolute -left-16 bottom-8 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
                    <div>
                        <p className="text-xl font-semibold uppercase tracking-[0.38em]">{platform.name}</p>
                    </div>
                    <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.24em] text-white/72 md:flex">
                        {platform.navigation.map((item) => (
                            <button key={item.label} type="button" onClick={() => scrollToTarget(item.target)} className="transition hover:text-white">
                                {item.label}
                            </button>
                        ))}
                    </nav>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="hidden rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 transition hover:bg-white/10 md:inline-flex">
                            Log In
                        </Link>
                        <Link href="/get-started" className="inline-flex items-center gap-2 rounded-full bg-[#d7a36d] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#1f1813] transition hover:bg-[#e0b27f]">
                            Get Started
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </header>

                <div className="relative z-10 mx-auto grid min-h-[88vh] max-w-7xl gap-14 px-6 pb-20 pt-10 md:px-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
                    <div className="max-w-3xl">
                        <p className="mb-5 text-[11px] uppercase tracking-[0.34em] text-[#d7a36d]">{platform.eyebrow}</p>
                        <h1 className="max-w-4xl text-5xl font-semibold leading-[0.92] md:text-7xl">
                            {platform.headline}
                        </h1>
                        <p className="mt-8 max-w-2xl text-base leading-8 text-white/72 md:text-lg">
                            {platform.subheadline}
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Link href="/get-started" className="inline-flex items-center gap-2 rounded-full bg-[#d7a36d] px-7 py-4 text-sm font-semibold text-[#1f1813] transition hover:bg-[#e0b27f]">
                                Crear mi estudio
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <button type="button" onClick={() => scrollToTarget('#pricing')} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 text-sm font-semibold text-white/88 transition hover:bg-white/8">
                                Ver planes
                            </button>
                        </div>

                        <div className="mt-12 grid gap-4 md:grid-cols-3">
                            {platform.feature_highlights.map((item) => (
                                <div key={item.title} className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                                    <p className="text-sm font-semibold text-white">{item.title}</p>
                                    <p className="mt-3 text-sm leading-7 text-white/68">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="rounded-[2.8rem] border border-white/10 bg-[rgba(255,255,255,.06)] p-5 shadow-[0_40px_120px_rgba(0,0,0,.25)] backdrop-blur-xl">
                            <div className="rounded-[2.2rem] border border-white/10 bg-[#f7f0e7] p-5 text-[#241912]">
                                <div className="flex items-center justify-between border-b border-[#eadfce] pb-4">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.24em] text-[#8e6e4b]">Dashboard de estudio</p>
                                        <p className="mt-2 text-2xl font-semibold">Todo tu negocio visual, conectado</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#241912] p-3 text-white">
                                        <Camera className="h-5 w-5" />
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <PreviewCard icon={Workflow} title="CRM + Agenda" copy="Leads, seguimiento y disponibilidad real desde un solo panel." />
                                    <PreviewCard icon={LayoutTemplate} title="White-label" copy="Cada estudio usa su dominio, branding y home sin duplicar codigo." />
                                    <PreviewCard icon={ShieldCheck} title="Portal cliente" copy="Facturas, galerias, contratos y acceso privado por proyecto." />
                                    <PreviewCard icon={Sparkles} title="IA y automatizacion" copy="Reconocimiento facial, tareas y flujos que crecen contigo." />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="product" className="px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-14 max-w-3xl">
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#a07047]">Producto</p>
                        <h2 className="text-4xl leading-tight md:text-6xl">La plataforma que unifica delivery, ventas y operacion del estudio.</h2>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-4">
                        {platform.products.map((item) => (
                            <article key={item.name} className="rounded-[2rem] border border-[#e7d8c7] bg-white p-7 shadow-[0_24px_60px_rgba(60,40,24,.06)]">
                                <div className="mb-5 inline-flex rounded-2xl bg-[#f4eadf] p-3 text-[#a07047]">
                                    <BadgeCheck className="h-5 w-5" />
                                </div>
                                <h3 className="text-2xl font-semibold">{item.name}</h3>
                                <p className="mt-4 text-sm leading-7 text-[#6b594c]">{item.copy}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="features" className="px-6 py-24 md:px-10" style={{ backgroundColor: '#fbf7f2' }}>
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#a07047]">Funciones</p>
                            <h2 className="text-4xl leading-tight md:text-6xl">Pensado para vender mejor y entregar mejor.</h2>
                        </div>
                        <p className="max-w-xl text-base leading-8 text-[#6b594c]">
                            No es solo una galeria. Es una capa comercial y operativa para estudios que quieren verse premium y trabajar con mas orden.
                        </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {[
                            'Dominios custom por tenant',
                            'Home y portafolio del fotografo',
                            'Galerias publicas y privadas',
                            'Favoritos, descargas y acceso cliente',
                            'Contratos y firma publica',
                            'Facturacion y estado de cuenta',
                            'Plantillas, branding y presets',
                            'Escalable a white-label SaaS',
                        ].map((item) => (
                            <div key={item} className="flex items-start gap-3 rounded-[1.8rem] border border-[#e7d8c7] bg-white p-5">
                                <CircleCheck className="mt-0.5 h-5 w-5 text-[#a07047]" />
                                <p className="text-sm leading-7 text-[#3b2a1f]">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="pricing" className="px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-14 max-w-3xl">
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#a07047]">Planes</p>
                        <h2 className="text-4xl leading-tight md:text-6xl">Empieza simple y escala hasta white-label completo.</h2>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {platform.plans.map((plan) => (
                            <article key={plan.name} className={`rounded-[2.4rem] border p-8 shadow-[0_24px_60px_rgba(60,40,24,.06)] ${plan.featured ? 'bg-[#201610] text-white border-[#201610]' : 'bg-white border-[#e7d8c7]'}`}>
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className={`text-[11px] uppercase tracking-[0.28em] ${plan.featured ? 'text-[#d7a36d]' : 'text-[#a07047]'}`}>{plan.name}</p>
                                        <p className="mt-3 text-5xl font-semibold">{plan.price}<span className={`ml-1 text-base font-normal ${plan.featured ? 'text-white/65' : 'text-[#7d6554]'}`}>/mes</span></p>
                                    </div>
                                    {plan.featured && <span className="rounded-full bg-[#d7a36d] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#201610]">Recomendado</span>}
                                </div>
                                <p className={`mt-5 text-sm leading-7 ${plan.featured ? 'text-white/72' : 'text-[#6b594c]'}`}>{plan.description}</p>
                                <div className="mt-8 space-y-3">
                                    {plan.items.map((item) => (
                                        <div key={item} className="flex items-start gap-3">
                                            <Globe2 className={`mt-0.5 h-4 w-4 ${plan.featured ? 'text-[#d7a36d]' : 'text-[#a07047]'}`} />
                                            <span className={`text-sm leading-7 ${plan.featured ? 'text-white/82' : 'text-[#3b2a1f]'}`}>{item}</span>
                                        </div>
                                    ))}
                                </div>
                                <Link href={`/get-started?plan=${plan.code}`} className={`mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${plan.featured ? 'bg-[#d7a36d] text-[#201610]' : 'bg-[#201610] text-white'}`}>
                                    Elegir plan
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="faq" className="px-6 py-24 md:px-10" style={{ backgroundColor: '#fbf7f2' }}>
                <div className="mx-auto max-w-5xl">
                    <div className="mb-12 max-w-3xl">
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#a07047]">FAQ</p>
                        <h2 className="text-4xl leading-tight md:text-6xl">Lo que normalmente te preguntarian antes de contratarlo.</h2>
                    </div>
                    <div className="space-y-5">
                        {platform.faq.map((item) => (
                            <article key={item.question} className="rounded-[2rem] border border-[#e7d8c7] bg-white p-7">
                                <h3 className="text-2xl font-semibold">{item.question}</h3>
                                <p className="mt-4 text-sm leading-8 text-[#6b594c]">{item.answer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

function PreviewCard({ icon: Icon, title, copy }) {
    return (
        <div className="rounded-[1.6rem] border border-[#eadfce] bg-white p-5">
            <div className="mb-4 inline-flex rounded-2xl bg-[#f4eadf] p-3 text-[#a07047]">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-lg font-semibold text-[#241912]">{title}</p>
            <p className="mt-3 text-sm leading-7 text-[#6b594c]">{copy}</p>
        </div>
    );
}