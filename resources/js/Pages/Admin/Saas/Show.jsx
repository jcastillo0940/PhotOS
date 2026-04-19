import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Copy, CreditCard, Globe2, Palette, RefreshCw, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

function copy(value) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(value);
    }
}

export default function Show({ tenant, cloudflare, planOptions = [] }) {
    const domainForm = useForm({ hostname: '', type: 'custom' });
    const billingForm = useForm({ action: 'activate_manual', note: '', paid_until: '' });
    const [activeTab, setActiveTab] = React.useState('overview');
    const tenantForm = useForm({
        name: tenant.name || '',
        status: tenant.status || 'active',
        plan_code: tenant.plan_code || planOptions[0]?.code || 'starter',
        billing_email: tenant.billing_email || '',
        custom_domain: tenant.custom_domain || '',
    });

    const submitDomain = (event) => {
        event.preventDefault();
        domainForm.post(`/admin/saas/tenants/${tenant.id}/domains`);
    };

    const submitBilling = (event) => {
        event.preventDefault();
        billingForm.post(`/admin/saas/tenants/${tenant.id}/billing/manual`);
    };

    const submitTenant = (event) => {
        event.preventDefault();
        tenantForm.put(`/admin/saas/tenants/${tenant.id}`);
    };

    return (
        <AdminLayout>
            <Head title={`SaaS | ${tenant.name}`} />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-white p-7 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-3xl">
                            <Link href="/admin/saas/tenants" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">Volver a tenants</Link>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{tenant.name}</h2>
                            <p className="mt-2 text-sm text-slate-500">{tenant.slug} · {tenant.plan_code} · {tenant.status}</p>
                            <p className="mt-4 text-sm leading-7 text-slate-500">Este tenant ya usa el catalogo SaaS v2 y puede mezclar dominio principal, dominio custom, facturacion desacoplada y retencion de originales en R2.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <InfoBox title="Cloudflare for SaaS" value={cloudflare.enabled ? 'Activo' : 'Pendiente'} helper={cloudflare.enabled ? `Managed CNAME target: ${cloudflare.managed_cname_target}` : 'Configura Cloudflare para automatizar dominios custom.'} />
                            <InfoBox title="Facturacion" value={tenant.billing?.status || 'Sin suscripcion'} helper={tenant.billing?.is_read_only ? 'Tenant en modo restringido' : 'Acceso operativo normal'} />
                            <Link href={tenant.website_edit_url} className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                <Palette className="h-4 w-4" />
                                Editar front white-label
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-4">
                    <QuickStat title="Plan activo" value={tenant.plan_code || 'Sin plan'} helper="Plan base operativo del tenant." />
                    <QuickStat title="Estado" value={tenant.status || 'Sin estado'} helper="Estado general para acceso y billing." />
                    <QuickStat title="Usuarios" value={String(tenant.users?.length || 0)} helper="Accesos asociados a este tenant." />
                    <QuickStat title="Dominios" value={String(tenant.domains?.length || 0)} helper="Hosts configurados y verificados." />
                </section>

                <div className="grid gap-6 xl:grid-cols-[420px,1fr]">
                    <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                        <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171411] text-white"><Palette className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">Editar tenant</p>
                                    <p className="text-sm text-slate-500">Nombre comercial, estado, plan, correo de facturacion y dominio custom preferido.</p>
                                </div>
                            </div>
                            <form onSubmit={submitTenant} className="mt-6 space-y-4">
                                <Field label="Nombre" error={tenantForm.errors.name}>
                                    <input value={tenantForm.data.name} onChange={(event) => tenantForm.setData('name', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" />
                                </Field>
                                <Field label="Estado" error={tenantForm.errors.status}>
                                    <select value={tenantForm.data.status} onChange={(event) => tenantForm.setData('status', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none">
                                        <option value="active">Activo</option>
                                        <option value="past_due">En mora</option>
                                        <option value="grace_period">Gracia</option>
                                        <option value="suspended">Suspendido</option>
                                        <option value="blocked">Bloqueado</option>
                                    </select>
                                </Field>
                                <Field label="Plan" error={tenantForm.errors.plan_code}>
                                    <select value={tenantForm.data.plan_code} onChange={(event) => tenantForm.setData('plan_code', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none">
                                        {planOptions.map((plan) => (
                                            <option key={plan.code} value={plan.code}>{plan.name}</option>
                                        ))}
                                    </select>
                                </Field>
                                <Field label="Correo de facturacion" error={tenantForm.errors.billing_email}>
                                    <input type="email" value={tenantForm.data.billing_email} onChange={(event) => tenantForm.setData('billing_email', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" />
                                </Field>
                                <Field label="Dominio custom preferido" error={tenantForm.errors.custom_domain}>
                                    <input value={tenantForm.data.custom_domain} onChange={(event) => tenantForm.setData('custom_domain', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="galeria.cliente.com" />
                                </Field>
                                <button type="submit" disabled={tenantForm.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                    Guardar tenant
                                </button>
                            </form>
                        </section>

                        <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171411] text-white"><Wallet className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">Control de cobro</p>
                                    <p className="text-sm text-slate-500">Activa, restringe o suspende el tenant manualmente. El motor operativo usa `expires_at` como fuente de verdad.</p>
                                </div>
                            </div>
                            <form onSubmit={submitBilling} className="mt-6 space-y-4">
                                <Field label="Accion" error={billingForm.errors.action}>
                                    <select value={billingForm.data.action} onChange={(event) => billingForm.setData('action', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none">
                                        <option value="activate_manual">Activar manualmente</option>
                                        <option value="mark_past_due">Marcar en mora</option>
                                        <option value="suspend_manual">Suspender tenant</option>
                                        <option value="resume_auto">Quitar override manual</option>
                                    </select>
                                </Field>
                                <Field label="Pagado hasta" error={billingForm.errors.paid_until}>
                                    <input type="date" value={billingForm.data.paid_until} onChange={(event) => billingForm.setData('paid_until', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" />
                                </Field>
                                <Field label="Nota interna" error={billingForm.errors.note}>
                                    <textarea value={billingForm.data.note} onChange={(event) => billingForm.setData('note', event.target.value)} className="min-h-[110px] w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="Ej: cliente pago offline por transferencia, reactivar 30 dias" />
                                </Field>
                                <button type="submit" disabled={billingForm.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                    <CreditCard className="h-4 w-4" />
                                    Actualizar billing
                                </button>
                            </form>
                            <button type="button" onClick={() => billingForm.post(`/admin/saas/tenants/${tenant.id}/billing/setup-token`)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                <ShieldCheck className="h-4 w-4" />
                                Crear setup token PayPal
                            </button>
                        </section>

                        <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171411] text-white"><Globe2 className="h-5 w-5" /></div>
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">Agregar dominio</p>
                                    <p className="text-sm text-slate-500">Subdominio interno o dominio propio con onboarding guiado.</p>
                                </div>
                            </div>
                            <form onSubmit={submitDomain} className="mt-6 space-y-4">
                                <Field label="Hostname" error={domainForm.errors.hostname}>
                                    <input value={domainForm.data.hostname} onChange={(event) => domainForm.setData('hostname', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="galeria.monostudio.com" />
                                </Field>
                                <Field label="Tipo" error={domainForm.errors.type}>
                                    <select value={domainForm.data.type} onChange={(event) => domainForm.setData('type', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none">
                                        <option value="custom">Dominio propio</option>
                                        <option value="subdomain">Subdominio interno</option>
                                    </select>
                                </Field>
                                <button type="submit" disabled={domainForm.processing} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                    <Globe2 className="h-4 w-4" />
                                    Guardar dominio
                                </button>
                            </form>
                        </section>
                    </div>

                    <section className="space-y-4">
                        <article className="rounded-[2rem] border border-[#e6e0d5] bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap gap-2">
                                <TabButton label="Resumen" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                                <TabButton label="Accesos" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                                <TabButton label={`Dominios (${tenant.domains?.length || 0})`} active={activeTab === 'domains'} onClick={() => setActiveTab('domains')} />
                            </div>
                        </article>

                        {activeTab === 'overview' && (
                            <article className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <InfoPanel title="Login URL" value={tenant.login_url} helper="Los accesos de este tenant solo deben usarse desde sus propios dominios." />
                                    <InfoPanel title="Suscripcion actual" value={tenant.subscription ? `${tenant.subscription.provider} · ${tenant.subscription.plan_code} · ${tenant.subscription.billing_cycle}` : 'Sin suscripcion'} helper={tenant.subscription?.paypal_subscription_id || tenant.billing?.banner || 'Aun no hay referencia de suscripcion externa.'} />
                                    <InfoPanel title="Vence en" value={tenant.subscription?.expires_at || 'Sin fecha'} helper="Cuando vence, el tenant entra en gracia y se bloquean nuevas subidas o procesamientos." />
                                    <InfoPanel title="Dominio custom" value={tenant.custom_domain || 'No configurado'} helper="Se usa como pista operativa adicional al resolver por host." />
                                </div>
                                {tenant.subscription?.transactions?.length > 0 && (
                                    <div className="mt-5 grid gap-3">
                                        {tenant.subscription.transactions.map((transaction) => (
                                            <div key={transaction.id} className="rounded-[1.4rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4 text-sm text-slate-700">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <p className="font-semibold text-slate-900">{transaction.type}</p>
                                                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{transaction.status}</span>
                                                </div>
                                                <p className="mt-2 text-xs text-slate-500">{transaction.reference || 'Sin referencia'} · {transaction.amount ? `$${transaction.amount} ${transaction.currency}` : 'Monto no reportado'}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>
                        )}

                        {activeTab === 'users' && (
                            <article className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900">Accesos del tenant</p>
                                        <p className="mt-1 text-sm text-slate-500">Estos usuarios solo pueden iniciar sesion en este dominio o en los dominios asociados a este tenant.</p>
                                    </div>
                                </div>
                                <div className="mt-5 space-y-3">
                                    {tenant.users?.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700"><UserRound className="h-4 w-4" /></div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{user.role}</span>
                                        </div>
                                    ))}
                                    {tenant.users?.length === 0 && (
                                        <div className="rounded-[1.4rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-5 text-sm text-slate-500">
                                            Este tenant aun no tiene usuarios asociados.
                                        </div>
                                    )}
                                </div>
                            </article>
                        )}

                        {activeTab === 'domains' && tenant.domains.map((domain) => (
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
                                            <button type="button" onClick={() => domainForm.post(`/admin/saas/tenants/${tenant.id}/domains/${domain.id}/sync`)} className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                                <RefreshCw className="h-4 w-4" />
                                                Verificar
                                            </button>
                                        )}
                                        <button type="button" onClick={() => copy(domain.hostname)} className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                            <Copy className="h-4 w-4" />
                                            Copiar host
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                    <InstructionCard title="Registro principal" type={domain.instructions?.cname?.type} name={domain.instructions?.cname?.name} value={domain.instructions?.cname?.target} />
                                    <InstructionCard title="Validacion" type={domain.instructions?.txt?.type} name={domain.instructions?.txt?.name || 'Se completara cuando Cloudflare genere el registro'} value={domain.instructions?.txt?.value || 'Pendiente'} />
                                </div>
                            </article>
                        ))}

                        {activeTab === 'domains' && tenant.domains.length === 0 && (
                            <article className="rounded-[2rem] border border-[#e6e0d5] bg-white p-8 text-sm text-slate-500 shadow-sm">
                                Este tenant aun no tiene dominios configurados.
                            </article>
                        )}
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}

function Field({ label, error, children }) {
    return <label className="block space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}{error && <p className="text-xs text-rose-500">{error}</p>}</label>;
}
function QuickStat({ title, value, helper }) {
    return <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-white p-4 shadow-sm"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p><p className="mt-2 text-lg font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p></div>;
}
function TabButton({ label, active, onClick }) {
    return <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${active ? 'bg-[#171411] text-white' : 'bg-[#fbf9f6] text-slate-600 hover:bg-[#f3eee6]'}`}>{label}</button>;
}
function InfoBox({ title, value, helper }) {
    return <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p><p className="mt-2 text-sm font-semibold text-slate-900">{value}</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{helper}</p></div>;
}
function InfoPanel({ title, value, helper }) {
    return <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4"><p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{title}</p><p className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p></div>;
}
function InstructionCard({ title, type, name, value }) {
    return <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p><div className="mt-3 space-y-2 text-sm"><div><p className="font-medium text-slate-500">Tipo</p><p className="font-semibold text-slate-900">{type || 'Pendiente'}</p></div><div><p className="font-medium text-slate-500">Nombre</p><p className="break-all font-semibold text-slate-900">{name || 'Pendiente'}</p></div><div><p className="font-medium text-slate-500">Valor / destino</p><p className="break-all font-semibold text-slate-900">{value || 'Pendiente'}</p></div></div></div>;
}
