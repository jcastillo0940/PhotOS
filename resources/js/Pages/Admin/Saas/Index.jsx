import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Globe2, Plus, ServerCog, ShieldCheck } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

function TenantCard({ tenant }) {
    return (
        <Link
            href={`/admin/saas/tenants/${tenant.id}`}
            className="rounded-[1.75rem] border border-[#e6e0d5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-lg font-semibold text-slate-900">{tenant.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{tenant.slug}</p>
                </div>
                <span className="rounded-full bg-[#f3eee6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {tenant.plan_code}
                </span>
            </div>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
                {tenant.domains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fbf9f6] px-3 py-2">
                        <span className="truncate">{domain.hostname}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{domain.cf_status || domain.type}</span>
                    </div>
                ))}
            </div>
        </Link>
    );
}

export default function Index({ tenants, cloudflare }) {
    const form = useForm({
        name: '',
        slug: '',
        primary_hostname: '',
        billing_email: '',
        plan_code: 'studio',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post('/admin/saas/tenants');
    };

    return (
        <AdminLayout>
            <Head title="SaaS" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="max-w-3xl">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">SaaS multidominio</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Tenants, subdominios y dominios propios desde un solo panel.</h2>
                            <p className="mt-3 text-sm leading-7 text-slate-500">
                                Aqui puedes crear estudios, asignar su dominio principal y preparar el onboarding para Cloudflare for SaaS sin tocar la base de datos manualmente.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white"><ServerCog className="h-5 w-5 text-slate-700" /></div>
                                <p className="mt-3 text-sm font-semibold text-slate-900">{tenants.length} tenants registrados</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">Cada estudio queda aislado por tenant y dominio.</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white"><ShieldCheck className="h-5 w-5 text-slate-700" /></div>
                                <p className="mt-3 text-sm font-semibold text-slate-900">{cloudflare.enabled ? 'Cloudflare listo' : 'Cloudflare pendiente'}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {cloudflare.enabled
                                        ? `CNAME administrado: ${cloudflare.managed_cname_target}`
                                        : 'Configura token, zone id y CNAME target para automatizar dominios custom.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
                    <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171411] text-white">
                                <Plus className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-900">Crear tenant</p>
                                <p className="text-sm text-slate-500">Un estudio nuevo queda listo con dominio principal y plan base.</p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <Field label="Nombre del estudio" error={form.errors.name}>
                                <input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="Mono Studio" />
                            </Field>
                            <Field label="Slug" error={form.errors.slug}>
                                <input value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="mono-studio" />
                            </Field>
                            <Field label="Dominio principal o subdominio" error={form.errors.primary_hostname}>
                                <input value={form.data.primary_hostname} onChange={(e) => form.setData('primary_hostname', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="mono.photos.pixelprocr.com" />
                            </Field>
                            <Field label="Correo de facturacion" error={form.errors.billing_email}>
                                <input type="email" value={form.data.billing_email} onChange={(e) => form.setData('billing_email', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="hola@monostudio.com" />
                            </Field>
                            <Field label="Plan" error={form.errors.plan_code}>
                                <select value={form.data.plan_code} onChange={(e) => form.setData('plan_code', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none">
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="studio">Studio</option>
                                </select>
                            </Field>

                            <button type="submit" disabled={form.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                <Plus className="h-4 w-4" />
                                Crear tenant
                            </button>
                        </form>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Globe2 className="h-5 w-5 text-slate-500" />
                            <h3 className="text-lg font-semibold text-slate-900">Tenants registrados</h3>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {tenants.map((tenant) => <TenantCard key={tenant.id} tenant={tenant} />)}
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}

function Field({ label, error, children }) {
    return (
        <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            {children}
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </label>
    );
}
