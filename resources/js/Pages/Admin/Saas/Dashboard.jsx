import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { BadgeDollarSign, Building2, Cpu, Cloud, CreditCard, Globe2, Layers3, ShieldEllipsis, UserRound, Wrench } from 'lucide-react';

function Stat({ label, value, helper, icon: Icon, tone = 'light' }) {
    const toneClass = tone === 'dark'
        ? 'border-[#171411] bg-[#171411] text-white'
        : 'border-[#e6e0d5] bg-white text-slate-900';

    return (
        <div className={`rounded-[1.7rem] border p-5 shadow-sm ${toneClass}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${tone === 'dark' ? 'text-white/55' : 'text-slate-400'}`}>{label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
                    <p className={`mt-2 text-sm ${tone === 'dark' ? 'text-white/70' : 'text-slate-500'}`}>{helper}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone === 'dark' ? 'bg-white/10' : 'bg-[#f4efe7]'}`}>
                    <Icon className={`h-5 w-5 ${tone === 'dark' ? 'text-white' : 'text-slate-700'}`} />
                </div>
            </div>
        </div>
    );
}

function Pill({ label, active, icon: Icon }) {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-4">
            <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-[#e6f7ef] text-[#16794f]' : 'bg-white text-slate-400'}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-400">{active ? 'Conectado' : 'Pendiente'}</p>
                </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${active ? 'bg-[#dff4e9] text-[#16794f]' : 'border border-[#e6e0d5] bg-white text-slate-500'}`}>
                {active ? 'OK' : 'Check'}
            </span>
        </div>
    );
}

export default function Dashboard({ stats, system, tenants, users, plans, registrations }) {
    return (
        <AdminLayout>
            <Head title="Control SaaS" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-[linear-gradient(135deg,#171411_0%,#25201b_55%,#312a22_100%)] px-7 py-7 text-white shadow-sm md:px-8 md:py-8">
                    <div className="grid gap-8 xl:grid-cols-[1.25fr_.75fr]">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">Console SaaS</p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Aqui administras la plataforma, no el estudio del cliente.</h2>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
                                Tenants, dominios, suscripciones, integraciones globales y salud operativa del sistema desde una sola consola.
                            </p>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <Link href="/admin/saas/tenants" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                                    <ShieldEllipsis className="h-4 w-4" />
                                    Ver tenants
                                </Link>
                                <Link href="/admin/saas/gemini-usage" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white">
                                    <Cpu className="h-4 w-4" />
                                    Tokens Gemini
                                </Link>
                                <Link href="/admin/settings" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white">
                                    <Wrench className="h-4 w-4" />
                                    Configuracion global
                                </Link>
                            </div>
                        </div>
                        <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">Cobro mensual estimado</p>
                            <p className="mt-4 text-4xl font-semibold tracking-tight">${Number(stats.monthly_recurring_revenue || 0).toLocaleString()}</p>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl bg-white/8 px-4 py-3">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Activas</p>
                                    <p className="mt-1 text-sm font-semibold">{stats.active_subscriptions}</p>
                                </div>
                                <div className="rounded-2xl bg-white/8 px-4 py-3">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">En mora</p>
                                    <p className="mt-1 text-sm font-semibold">{stats.past_due_subscriptions}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <Stat label="Tenants" value={stats.tenants_total} helper="Espacios SaaS registrados" icon={Building2} />
                    <Stat label="Usuarios" value={stats.users_total} helper="Accesos globales y de tenants" icon={UserRound} />
                    <Stat label="Dominios custom" value={stats.custom_domains_total} helper="Hostnames conectados por clientes" icon={Globe2} />
                    <Stat label="Suspensiones" value={stats.suspended_subscriptions} helper="Cuentas restringidas" icon={CreditCard} tone="dark" />
                </section>

                <section className="grid gap-8 xl:grid-cols-[1.05fr_.95fr]">
                    <div className="space-y-8">
                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tenants recientes</p>
                                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Espacios activos de clientes</h3>
                                </div>
                                <Link href="/admin/saas/tenants" className="text-sm font-semibold text-slate-700">Abrir panel completo</Link>
                            </div>
                            <div className="mt-6 space-y-3">
                                {tenants.map((tenant) => (
                                    <Link key={tenant.id} href={`/admin/saas/tenants/${tenant.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4 transition hover:bg-white">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{tenant.name}</p>
                                            <p className="mt-1 text-xs text-slate-500">{tenant.hostname || tenant.slug}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{tenant.plan_code}</p>
                                            <p className="mt-1 text-xs text-slate-500">{tenant.status}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Planes</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Distribucion por plan</h3>
                            <div className="mt-6 grid gap-4 md:grid-cols-3">
                                {plans.map((plan) => (
                                    <div key={plan.id} className="rounded-[1.5rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                                        <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{plan.code}</p>
                                        <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">{plan.tenants_count}</p>
                                        <p className="mt-2 text-xs text-slate-500">tenants usando este plan</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Infraestructura</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Integraciones globales</h3>
                            <div className="mt-6 space-y-3">
                                <Pill label="Cloudflare R2" active={system.r2_status} icon={Cloud} />
                                <Pill label="PayPal" active={system.paypal_status} icon={BadgeDollarSign} />
                                <Pill label="Alanube" active={system.alanube_status} icon={CreditCard} />
                                <Pill label="Cloudflare for SaaS" active={system.cloudflare_status} icon={Globe2} />
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Usuarios recientes</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Accesos creados</h3>
                            <div className="mt-6 space-y-3">
                                {users.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                                            <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{user.role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Onboarding</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Registros recientes</h3>
                            <div className="mt-6 space-y-3">
                                {registrations.map((registration) => (
                                    <div key={registration.id} className="rounded-2xl border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{registration.studio_name}</p>
                                                <p className="mt-1 text-xs text-slate-500">{registration.owner_email}</p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{registration.status}</span>
                                        </div>
                                        <p className="mt-3 text-xs text-slate-500">{registration.plan_code} · {registration.payment_gateway || 'manual'} · {registration.requested_domain || registration.provisioned_hostname}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}