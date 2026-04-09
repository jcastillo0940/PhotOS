import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Copy, ExternalLink, Globe2, RefreshCw, ShieldCheck } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

function copy(value) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(value);
    }
}

export default function Show({ tenant, cloudflare }) {
    const form = useForm({
        hostname: '',
        type: 'custom',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(`/admin/saas/tenants/${tenant.id}/domains`);
    };

    return (
        <AdminLayout>
            <Head title={`SaaS | ${tenant.name}`} />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <Link href="/admin/saas/tenants" className="text-sm font-medium text-slate-500 hover:text-slate-900">Volver a tenants</Link>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{tenant.name}</h2>
                            <p className="mt-2 text-sm text-slate-500">{tenant.slug} · {tenant.plan_code} · {tenant.status}</p>
                        </div>
                        <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Cloudflare for SaaS</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{cloudflare.enabled ? 'Activo' : 'Pendiente de configurar'}</p>
                            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                                {cloudflare.enabled ? `Managed CNAME target: ${cloudflare.managed_cname_target}` : 'Agrega token, zone id y CNAME target en .env para automatizar custom hostnames.'}
                            </p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
                    <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171411] text-white">
                                <Globe2 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-slate-900">Agregar dominio</p>
                                <p className="text-sm text-slate-500">Subdominio interno o dominio propio con onboarding guiado.</p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <Field label="Hostname" error={form.errors.hostname}>
                                <input value={form.data.hostname} onChange={(e) => form.setData('hostname', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="galeria.monostudio.com" />
                            </Field>
                            <Field label="Tipo" error={form.errors.type}>
                                <select value={form.data.type} onChange={(e) => form.setData('type', e.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none">
                                    <option value="custom">Dominio propio</option>
                                    <option value="subdomain">Subdominio interno</option>
                                </select>
                            </Field>
                            <button type="submit" disabled={form.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                <Globe2 className="h-4 w-4" />
                                Guardar dominio
                            </button>
                        </form>
                    </section>

                    <section className="space-y-4">
                        {tenant.domains.map((domain) => (
                            <article key={domain.id} className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-lg font-semibold text-slate-900">{domain.hostname}</p>
                                            {domain.is_primary && <span className="rounded-full bg-[#f3eee6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">Primario</span>}
                                        </div>
                                        <p className="mt-1 text-sm text-slate-500">{domain.type} · {domain.cf_status || 'pending'}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {domain.cf_custom_hostname_id && (
                                            <button
                                                type="button"
                                                onClick={() => form.post(`/admin/saas/tenants/${tenant.id}/domains/${domain.id}/sync`)}
                                                className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Verificar
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => copy(domain.hostname)}
                                            className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            <Copy className="h-4 w-4" />
                                            Copiar host
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                    <InstructionCard
                                        title="Registro principal"
                                        type={domain.instructions?.cname?.type}
                                        name={domain.instructions?.cname?.name}
                                        value={domain.instructions?.cname?.target}
                                    />
                                    <InstructionCard
                                        title="Validacion"
                                        type={domain.instructions?.txt?.type}
                                        name={domain.instructions?.txt?.name || 'Se completara cuando Cloudflare genere el registro'}
                                        value={domain.instructions?.txt?.value || 'Pendiente'}
                                    />
                                </div>

                                <div className="mt-5 rounded-[1.5rem] bg-[#fbf9f6] p-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-slate-500" />
                                        <p className="text-sm font-semibold text-slate-900">Paso a paso para el cliente</p>
                                    </div>
                                    <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                                        <li>1. Crear el registro {domain.instructions?.cname?.type || 'CNAME'} con destino `{domain.instructions?.cname?.target || 'pendiente'}`.</li>
                                        <li>2. Si ves un TXT arriba, agregarlo tambien en el DNS.</li>
                                        <li>3. Esperar propagacion y pulsar `Verificar`.</li>
                                        <li>4. Cuando el estado pase a activo, el tenant ya podra usarse con ese dominio.</li>
                                    </ol>
                                </div>
                            </article>
                        ))}
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

function InstructionCard({ title, type, name, value }) {
    return (
        <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
            <div className="mt-3 space-y-2 text-sm">
                <div>
                    <p className="font-medium text-slate-500">Tipo</p>
                    <p className="font-semibold text-slate-900">{type || 'Pendiente'}</p>
                </div>
                <div>
                    <p className="font-medium text-slate-500">Nombre</p>
                    <p className="break-all font-semibold text-slate-900">{name || 'Pendiente'}</p>
                </div>
                <div>
                    <p className="font-medium text-slate-500">Valor / destino</p>
                    <p className="break-all font-semibold text-slate-900">{value || 'Pendiente'}</p>
                </div>
            </div>
        </div>
    );
}
