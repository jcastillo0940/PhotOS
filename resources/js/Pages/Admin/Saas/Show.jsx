import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Copy,
    CreditCard,
    ExternalLink,
    Globe2,
    Layers3,
    Palette,
    RefreshCw,
    ShieldCheck,
    UserRound,
    Users,
    Wallet,
} from 'lucide-react';
import { clsx } from 'clsx';
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

    const subscriptionStatus = tenant.subscription?.status || tenant.billing?.status || 'Sin suscripcion';
    const loginDomain = tenant.login_url?.replace(/^https?:\/\//, '').replace(/\/login$/, '') || 'Sin dominio';
    const transactionCount = tenant.subscription?.transactions?.length || 0;

    return (
        <AdminLayout>
            <Head title={`SaaS | ${tenant.name}`} />

            <div className="space-y-6">
                <section className="overflow-hidden rounded-[2rem] border border-[#e6e0d5] bg-white shadow-sm">
                    <div className="border-b border-[#efe8dc] bg-[radial-gradient(circle_at_top_left,_rgba(23,20,17,0.06),_transparent_42%),linear-gradient(135deg,#fff_0%,#fbf9f6_100%)] p-7">
                        <div className="flex flex-wrap items-start justify-between gap-5">
                            <div className="max-w-3xl">
                                <Link href="/admin/saas/tenants" className="text-sm font-semibold text-slate-500 transition hover:text-slate-900">
                                    Volver a tenants
                                </Link>
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{tenant.name}</h2>
                                    <StatusBadge label={tenant.status || 'Sin estado'} tone={statusTone(tenant.status)} />
                                    <StatusBadge label={tenant.plan_code || 'Sin plan'} tone="neutral" />
                                    <StatusBadge label={subscriptionStatus} tone={billingTone(subscriptionStatus)} />
                                </div>
                                <p className="mt-3 text-sm leading-7 text-slate-500">
                                    Administra el tenant desde una sola vista: identidad comercial, plan, acceso operativo, billing y dominios
                                    conectados al front publico.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <QuickAction href={tenant.website_edit_url} icon={Palette} title="Editar front" helper="White-label y contenido visual" />
                                <QuickAction href={tenant.login_url} icon={ExternalLink} title="Abrir login" helper={loginDomain} external />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
                        <KpiCard title="Plan activo" value={tenant.plan_code || 'Sin plan'} helper="Base comercial del tenant" icon={Layers3} />
                        <KpiCard title="Estado operativo" value={tenant.status || 'Sin estado'} helper="Controla acceso y restricciones" icon={ShieldCheck} />
                        <KpiCard title="Usuarios" value={String(tenant.users?.length || 0)} helper="Accesos asociados" icon={Users} />
                        <KpiCard title="Dominios" value={String(tenant.domains?.length || 0)} helper="Hosts configurados" icon={Globe2} />
                        <KpiCard title="Movimientos" value={String(transactionCount)} helper="Pagos o eventos de billing" icon={Wallet} />
                    </div>
                </section>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-6 lg:w-80">
                        <SummaryCard
                            title="Salud del tenant"
                            rows={[
                                ['Cloudflare for SaaS', cloudflare.enabled ? 'Activo' : 'Pendiente'],
                                ['Billing', tenant.billing?.status || 'Sin suscripcion'],
                                ['Login principal', loginDomain],
                                ['Dominio custom', tenant.custom_domain || 'No configurado'],
                            ]}
                        />

                        <SummaryCard
                            title="Proxima accion sugerida"
                            accent
                            rows={[
                                ['Si va a publicar', 'Revisar front y dominio'],
                                ['Si pago offline', 'Actualizar billing manual'],
                                ['Si cambia de plan', 'Guardar tenant antes de salir'],
                            ]}
                        />

                        <div className="rounded-[1.75rem] border border-[#e6e0d5] bg-white p-4 shadow-sm">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Navegacion</p>
                            <div className="mt-4 space-y-2">
                                <TabNavButton label="Resumen" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                                <TabNavButton label="Configuracion" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                                <TabNavButton label="Facturacion" active={activeTab === 'billing'} onClick={() => setActiveTab('billing')} />
                                <TabNavButton label={`Accesos (${tenant.users?.length || 0})`} active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                                <TabNavButton label={`Dominios (${tenant.domains?.length || 0})`} active={activeTab === 'domains'} onClick={() => setActiveTab('domains')} />
                            </div>
                        </div>
                    </aside>

                    <section className="min-w-0 flex-1 space-y-5">
                        {activeTab === 'overview' && (
                            <>
                                <PanelCard title="Vista general" description="Aqui ves lo mas importante del tenant sin entrar todavia a editar formularios.">
                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <InfoPanel title="Login URL" value={tenant.login_url} helper="Acceso principal del tenant para su propio dominio." />
                                        <InfoPanel
                                            title="Suscripcion actual"
                                            value={tenant.subscription ? `${tenant.subscription.provider} · ${tenant.subscription.plan_code} · ${tenant.subscription.billing_cycle}` : 'Sin suscripcion'}
                                            helper={tenant.subscription?.paypal_subscription_id || tenant.billing?.banner || 'Aun no existe una referencia externa de suscripcion.'}
                                        />
                                        <InfoPanel title="Vence en" value={tenant.subscription?.expires_at || 'Sin fecha'} helper="Fecha de corte para acceso normal y servicios restringidos." />
                                        <InfoPanel title="Correo de billing" value={tenant.billing_email || 'No configurado'} helper="Se usa para seguimiento comercial y notificaciones de cobro." />
                                    </div>
                                </PanelCard>

                                <PanelCard title="Actividad de billing" description="Ultimos movimientos reportados para este tenant.">
                                    {tenant.subscription?.transactions?.length > 0 ? (
                                        <div className="space-y-3">
                                            {tenant.subscription.transactions.map((transaction) => (
                                                <div key={transaction.id} className="rounded-[1.4rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4 text-sm text-slate-700">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <p className="font-semibold text-slate-900">{transaction.type}</p>
                                                        <StatusBadge label={transaction.status} tone={billingTone(transaction.status)} />
                                                    </div>
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        {transaction.reference || 'Sin referencia'} · {transaction.amount ? `$${transaction.amount} ${transaction.currency}` : 'Monto no reportado'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState title="Sin movimientos registrados" description="Todavia no hay pagos o eventos sincronizados en esta suscripcion." />
                                    )}
                                </PanelCard>
                            </>
                        )}

                        {activeTab === 'settings' && (
                            <PanelCard title="Configuracion del tenant" description="Edita identidad comercial, estado, plan y correo de facturacion en un solo bloque.">
                                <form onSubmit={submitTenant} className="grid gap-4 lg:grid-cols-2">
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
                                    <div className="lg:col-span-2">
                                        <Field label="Dominio custom preferido" error={tenantForm.errors.custom_domain}>
                                            <input value={tenantForm.data.custom_domain} onChange={(event) => tenantForm.setData('custom_domain', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="galeria.cliente.com" />
                                        </Field>
                                    </div>
                                    <div className="lg:col-span-2 flex justify-end">
                                        <button type="submit" disabled={tenantForm.processing} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                            Guardar tenant
                                        </button>
                                    </div>
                                </form>
                            </PanelCard>
                        )}

                        {activeTab === 'billing' && (
                            <>
                                <PanelCard title="Control de cobro" description="Activa, restringe o suspende el tenant manualmente cuando haga falta soporte comercial.">
                                    <form onSubmit={submitBilling} className="grid gap-4 lg:grid-cols-2">
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
                                        <div className="lg:col-span-2">
                                            <Field label="Nota interna" error={billingForm.errors.note}>
                                                <textarea value={billingForm.data.note} onChange={(event) => billingForm.setData('note', event.target.value)} className="min-h-[120px] w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="Ej: cliente pago offline por transferencia, reactivar 30 dias" />
                                            </Field>
                                        </div>
                                        <div className="lg:col-span-2 flex flex-wrap justify-end gap-3">
                                            <button type="button" onClick={() => billingForm.post(`/admin/saas/tenants/${tenant.id}/billing/setup-token`)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e6e0d5] px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                                <ShieldCheck className="h-4 w-4" />
                                                Crear setup token PayPal
                                            </button>
                                            <button type="submit" disabled={billingForm.processing} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                                <CreditCard className="h-4 w-4" />
                                                Actualizar billing
                                            </button>
                                        </div>
                                    </form>
                                </PanelCard>

                                <PanelCard title="Lectura rapida" description="Resumen comercial para evitar errores antes de tocar la suscripcion.">
                                    <div className="grid gap-4 lg:grid-cols-3">
                                        <InfoPanel title="Estado de billing" value={tenant.billing?.status || 'Sin suscripcion'} helper={tenant.billing?.is_read_only ? 'Modo restringido activo' : 'Operacion normal'} />
                                        <InfoPanel title="Modo de pago" value={tenant.subscription?.payment_mode || 'No definido'} helper={tenant.subscription?.provider || 'Sin proveedor activo'} />
                                        <InfoPanel title="Expiracion" value={tenant.subscription?.expires_at || 'Sin fecha'} helper="Usada por el motor operativo para acceso y limites." />
                                    </div>
                                </PanelCard>
                            </>
                        )}

                        {activeTab === 'users' && (
                            <PanelCard title="Accesos del tenant" description="Usuarios que pueden iniciar sesion dentro de este tenant y sus dominios asociados.">
                                <div className="space-y-3">
                                    {tenant.users?.map((user) => (
                                        <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-[#ece5d8] bg-[#fbf9f6] px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-700">
                                                    <UserRound className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <StatusBadge label={user.role} tone="neutral" />
                                        </div>
                                    ))}
                                    {tenant.users?.length === 0 && (
                                        <EmptyState title="Sin usuarios asociados" description="Este tenant aun no tiene accesos creados." />
                                    )}
                                </div>
                            </PanelCard>
                        )}

                        {activeTab === 'domains' && (
                            <>
                                <DomainIntegrationGuide tenant={tenant} cloudflare={cloudflare} />

                                <PanelCard title="Agregar dominio" description="Subdominio interno o dominio propio con onboarding guiado.">
                                    <form onSubmit={submitDomain} className="grid gap-4 lg:grid-cols-[1fr,220px,auto]">
                                        <Field label="Hostname" error={domainForm.errors.hostname}>
                                            <input value={domainForm.data.hostname} onChange={(event) => domainForm.setData('hostname', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" placeholder="galeria.monostudio.com" />
                                        </Field>
                                        <Field label="Tipo" error={domainForm.errors.type}>
                                            <select value={domainForm.data.type} onChange={(event) => domainForm.setData('type', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none">
                                                <option value="custom">Dominio propio</option>
                                                <option value="subdomain">Subdominio interno</option>
                                            </select>
                                        </Field>
                                        <div className="flex items-end">
                                            <button type="submit" disabled={domainForm.processing} className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">
                                                <Globe2 className="h-4 w-4" />
                                                Guardar dominio
                                            </button>
                                        </div>
                                    </form>
                                </PanelCard>

                                <PanelCard title="Pedidos y conexiones" description="Control manual para compras, conexion de dominios externos y overrides operativos.">
                                    {tenant.domain_orders?.length > 0 ? (
                                        <div className="space-y-4">
                                            {tenant.domain_orders.map((order) => (
                                                <DomainOrderCard key={order.id} tenantId={tenant.id} order={order} />
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState title="Sin pedidos de dominio" description="Todavia no hay compras o conexiones externas registradas para este tenant." />
                                    )}
                                </PanelCard>

                                {tenant.domains?.length > 0 ? (
                                    tenant.domains.map((domain) => (
                                        <PanelCard
                                            key={domain.id}
                                            title={domain.hostname}
                                            description={`${domain.type} · ${domain.cf_status || 'pending'}`}
                                            actions={
                                                <div className="flex flex-wrap gap-2">
                                                    {domain.type === 'custom' && (
                                                        <button type="button" onClick={() => domainForm.post(`/admin/saas/tenants/${tenant.id}/domains/${domain.id}/sync`, { preserveScroll: true })} className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                                            <RefreshCw className="h-4 w-4" />
                                                            {domain.cf_custom_hostname_id ? 'Verificar' : 'Crear/Reintentar en Cloudflare'}
                                                        </button>
                                                    )}
                                                    <button type="button" onClick={() => copy(domain.hostname)} className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                                        <Copy className="h-4 w-4" />
                                                        Copiar host
                                                    </button>
                                                </div>
                                            }
                                        >
                                            <div className="mb-4 flex flex-wrap items-center gap-2">
                                                {domain.is_primary && <StatusBadge label="Primario" tone="neutral" />}
                                                <StatusBadge label={domain.cf_status || 'pending'} tone={domain.cf_status === 'active' ? 'success' : 'warning'} />
                                            </div>
                                            <div className="grid gap-4 lg:grid-cols-2">
                                                <InstructionCard title="Registro principal" type={domain.instructions?.cname?.type} name={domain.instructions?.cname?.name} value={domain.instructions?.cname?.target} />
                                                <InstructionCard title="Validacion" type={domain.instructions?.txt?.type} name={domain.instructions?.txt?.name || 'Se completara cuando Cloudflare genere el registro'} value={domain.instructions?.txt?.value || 'Pendiente'} />
                                            </div>
                                        </PanelCard>
                                    ))
                                ) : (
                                    <PanelCard title="Dominios" description="Todavia no hay hosts configurados para este tenant.">
                                        <EmptyState title="Sin dominios configurados" description="Agrega un dominio propio o un subdominio interno para comenzar." />
                                    </PanelCard>
                                )}
                            </>
                        )}
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

function PanelCard({ title, description, actions, children }) {
    return (
        <article className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="break-words text-xl font-semibold text-slate-900">{title}</p>
                    {description && <p className="mt-1 break-words text-sm text-slate-500">{description}</p>}
                </div>
                {actions}
            </div>
            <div className="mt-5">{children}</div>
        </article>
    );
}

function KpiCard({ title, value, helper, icon: Icon }) {
    return (
        <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm">
                    <Icon className="h-4 w-4" />
                </div>
            </div>
            <p className="mt-3 break-words text-lg font-semibold text-slate-900">{value}</p>
            <p className="mt-1 break-words text-xs leading-5 text-slate-500">{helper}</p>
        </div>
    );
}

function QuickAction({ href, icon: Icon, title, helper, external = false }) {
    const commonClassName = 'min-w-0 rounded-[1.5rem] border border-[#e6e0d5] bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';

    if (external) {
        return (
            <a href={href} target="_blank" rel="noreferrer" className={commonClassName}>
                <ActionContent icon={Icon} title={title} helper={helper} />
            </a>
        );
    }

    return (
        <Link href={href} className={commonClassName}>
            <ActionContent icon={Icon} title={title} helper={helper} />
        </Link>
    );
}

function ActionContent({ icon: Icon, title, helper }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#171411] text-white">
                <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 break-all text-xs leading-5 text-slate-500">{helper}</p>
            </div>
        </div>
    );
}

function SummaryCard({ title, rows, accent = false }) {
    return (
        <div className={clsx('rounded-[1.75rem] border p-4 shadow-sm', accent ? 'border-[#171411] bg-[#171411] text-white' : 'border-[#e6e0d5] bg-white')}>
            <p className={clsx('text-[11px] font-semibold uppercase tracking-[0.22em]', accent ? 'text-white/55' : 'text-slate-400')}>{title}</p>
            <div className="mt-4 space-y-3">
                {rows.map(([label, value]) => (
                    <div key={`${label}-${value}`} className="space-y-1">
                        <p className={clsx('text-xs', accent ? 'text-white/65' : 'text-slate-500')}>{label}</p>
                        <p className={clsx('break-all text-sm font-semibold leading-5', accent ? 'text-white' : 'text-slate-900')}>{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TabNavButton({ label, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                'w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition',
                active ? 'bg-[#171411] text-white shadow-sm' : 'bg-[#fbf9f6] text-slate-600 hover:bg-[#f3eee6]'
            )}
        >
            {label}
        </button>
    );
}

function StatusBadge({ label, tone = 'neutral' }) {
    const tones = {
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        danger: 'bg-rose-50 text-rose-700 border-rose-200',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    };

    return (
        <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]', tones[tone] || tones.neutral)}>
            {label}
        </span>
    );
}

function InfoPanel({ title, value, helper }) {
    return (
        <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{title}</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
        </div>
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

function DomainIntegrationGuide({ tenant, cloudflare }) {
    const preferredDomain = tenant.custom_domain || tenant.domains?.find((domain) => domain.type === 'custom')?.hostname || '';
    const customDomain = tenant.domains?.find((domain) => domain.hostname === preferredDomain)
        || tenant.domains?.find((domain) => domain.type === 'custom');
    const cnameTarget = customDomain?.instructions?.cname?.target || cloudflare?.managed_cname_target || '';
    const validation = customDomain?.instructions?.txt;
    const isApex = preferredDomain && preferredDomain.split('.').length === 2;
    const loginUrl = preferredDomain ? `https://${preferredDomain}/login` : 'https://dominio-del-cliente.com/login';
    const fallbackDcvTarget = preferredDomain && cloudflare?.dcv_target
        ? `${preferredDomain}.${String(cloudflare.dcv_target).replace(/^\.+|\.+$/g, '')}`
        : cloudflare?.dcv_target;
    const validationValue = validation?.value || fallbackDcvTarget || '';
    const apiReady = Boolean(cloudflare?.enabled);
    const hostnameCreated = Boolean(customDomain?.cf_custom_hostname_id);
    const dnsReady = Boolean(apiReady && cnameTarget && validationValue && hostnameCreated);
    const namecheapHost = (host) => {
        if (!host) return 'Pendiente';
        const domain = preferredDomain || customDomain?.hostname || '';
        if (host === domain) return '@';
        if (domain && host.endsWith(`.${domain}`)) {
            return host.slice(0, -domain.length - 1);
        }

        return host;
    };

    return (
        <PanelCard title="Guia simple para conectar el dominio" description={`Objetivo final: ${loginUrl}`}>
            {!dnsReady && (
                <div className="mb-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                    <p className="font-semibold">Primero crea o verifica el dominio en Cloudflare desde esta misma pantalla.</p>
                    <p className="mt-2">
                        Si todavia no hay valores definitivos, pulsa <strong>Crear/Reintentar en Cloudflare</strong> en la tarjeta del dominio.
                        El sistema llamara la API, guardara el custom hostname y despues mostrara los registros DNS para Hostinger, cPanel, Namecheap o cualquier proveedor.
                        {!apiReady && ' Si ese boton falla, faltan el API token o el Zone ID de Cloudflare for SaaS en Configuracion global.'}
                    </p>
                </div>
            )}

            <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Que vamos a conectar</p>
                <p className="mt-2 break-all text-lg font-semibold text-slate-900">{preferredDomain || 'No configurado'}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    Si el cliente quiere exactamente {preferredDomain || 'cliente.com'}, usa la opcion dominio raiz.
                    Si Namecheap no permite ese registro o quieres algo mas simple, usa www y el login sera https://www.{preferredDomain || 'cliente.com'}/login.
                </p>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <UniversalDnsTable
                    title="Opcion A: usar dominio raiz"
                    helper={`Para que ${preferredDomain || 'cliente.com'} abra directamente el SaaS. En muchos paneles el Host del dominio raiz se escribe como @.`}
                    rows={[
                        {
                            type: isApex ? 'ALIAS Record' : 'CNAME Record',
                            host: isApex ? '@' : namecheapHost(preferredDomain),
                            value: cnameTarget || 'Se completara al provisionar Cloudflare',
                            ttl: 'Automatic',
                        },
                        {
                            type: validation?.type === 'TXT' ? 'TXT Record' : 'CNAME Record',
                            host: namecheapHost(validation?.name || (preferredDomain ? `_acme-challenge.${preferredDomain}` : '')),
                            value: validationValue || 'Pendiente: falta validacion de Cloudflare',
                            ttl: 'Automatic',
                        },
                    ]}
                />
                <UniversalDnsTable
                    title="Opcion B: usar www"
                    helper={`Mas facil si el dominio raiz da problemas. Login: https://www.${preferredDomain || 'cliente.com'}/login`}
                    rows={[
                        {
                            type: 'CNAME Record',
                            host: 'www',
                            value: cnameTarget || 'Se completara al provisionar Cloudflare',
                            ttl: 'Automatic',
                        },
                        {
                            type: validation?.type === 'TXT' ? 'TXT Record' : 'CNAME Record',
                            host: preferredDomain ? `_acme-challenge.www` : 'Pendiente',
                            value: validationValue ? validationValue.replace(preferredDomain, `www.${preferredDomain}`) : 'Pendiente: falta validacion de Cloudflare',
                            ttl: 'Automatic',
                        },
                    ]}
                />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[#e6e0d5] bg-white p-4">
                <p className="font-semibold text-slate-900">Paso a paso universal</p>
                <div className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 lg:grid-cols-4">
                    <GuideStep number="1" text="Entra al panel donde el cliente maneja DNS: Hostinger, cPanel, Namecheap, GoDaddy, Cloudflare, etc." />
                    <GuideStep number="2" text="Busca DNS Zone, Advanced DNS, Zone Editor, DNS Records o Administrar DNS." />
                    <GuideStep number="3" text="Elimina registros A, CNAME, ALIAS o Redirect que usen el mismo Host que vas a crear." />
                    <GuideStep number="4" text="Crea los registros de la tabla, espera propagacion y pulsa Verificar o DNS listo." />
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <ProviderHint
                    title="Hostinger"
                    text="Ve a Dominios > DNS / Nameservers > DNS Records. Usa Type, Name, Points to y TTL."
                />
                <ProviderHint
                    title="cPanel"
                    text="Ve a Domains > Zone Editor > Manage. Usa Add Record y coloca Type, Name, Record y TTL."
                />
                <ProviderHint
                    title="Namecheap"
                    text="Ve a Domain List > Manage > Advanced DNS > Host Records. Usa Type, Host, Value y TTL."
                />
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                <p className="font-semibold text-slate-900">Como traducir los campos segun el proveedor</p>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <p><strong>Host / Name / Nombre:</strong> es la parte izquierda del DNS. Para dominio raiz suele ser @. Para www suele ser www. Para validacion puede ser _acme-challenge.</p>
                    <p><strong>Value / Target / Points to / Record:</strong> es el destino que debe copiarse exactamente desde la tabla.</p>
                    <p><strong>Type / Tipo:</strong> puede ser CNAME, TXT o ALIAS/ANAME. Usa ALIAS/ANAME solo cuando sea dominio raiz y el panel lo permita.</p>
                    <p><strong>TTL:</strong> dejalo en Automatic, Default o 30 minutos si el panel pide elegir uno.</p>
                </div>
            </div>
        </PanelCard>
    );
}

function UniversalDnsTable({ title, helper, rows }) {
    return (
        <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-white p-4">
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#ece5d8]">
                <div className="grid grid-cols-4 bg-[#171411] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    <p>Type</p>
                    <p>Host / Name</p>
                    <p>Value / Target</p>
                    <p>TTL</p>
                </div>
                {rows.map((row, index) => (
                    <div key={`${row.type}-${row.host}-${index}`} className="grid grid-cols-4 gap-2 border-t border-[#ece5d8] bg-[#fbf9f6] px-3 py-3 text-sm">
                        <DnsCell value={row.type} />
                        <DnsCell value={row.host} />
                        <DnsCell value={row.value} />
                        <DnsCell value={row.ttl} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function DnsCell({ value }) {
    return (
        <div className="min-w-0">
            <p className="break-all font-semibold text-slate-900">{value}</p>
            <button type="button" onClick={() => copy(value)} className="mt-1 text-xs font-semibold text-slate-500 hover:text-black">
                Copiar
            </button>
        </div>
    );
}

function GuideRecordCard({ title, type, name, value }) {
    return (
        <div className="rounded-[1.5rem] border border-[#e6e0d5] bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
            <div className="mt-3 space-y-3 text-sm">
                <CopyRow label="Tipo" value={type} />
                <CopyRow label="Nombre" value={name} />
                <CopyRow label="Valor" value={value} />
            </div>
        </div>
    );
}

function CopyRow({ label, value }) {
    return (
        <div className="grid gap-2 rounded-2xl bg-[#fbf9f6] p-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                <button type="button" onClick={() => copy(value)} className="text-xs font-semibold text-slate-700 hover:text-black">
                    Copiar
                </button>
            </div>
            <p className="break-all font-semibold text-slate-900">{value}</p>
        </div>
    );
}

function ProviderHint({ title, text }) {
    return (
        <div className="rounded-[1.25rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
        </div>
    );
}

function GuideStep({ number, text }) {
    return (
        <div className="rounded-[1.25rem] border border-[#e6e0d5] bg-[#fbf9f6] p-4">
            <p className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#171411] text-xs font-bold text-white">{number}</p>
            <p className="break-words">{text}</p>
        </div>
    );
}

function DomainOrderCard({ tenantId, order }) {
    const form = useForm({
        status: order.manual_state || order.status || 'verifying',
        note: order.notes || '',
    });

    const submitOverride = (event) => {
        event.preventDefault();
        form.post(`/admin/saas/tenants/${tenantId}/domain-orders/${order.id}/override`, {
            preserveScroll: true,
        });
    };

    const retryOrder = () => {
        form.post(`/admin/saas/tenants/${tenantId}/domain-orders/${order.id}/retry`, {
            preserveScroll: true,
        });
    };

    const markDnsConfigured = () => {
        form.post(`/admin/saas/tenants/${tenantId}/domain-orders/${order.id}/dns-configured`, {
            preserveScroll: true,
        });
    };

    const cancelOrder = () => {
        form.post(`/admin/saas/tenants/${tenantId}/domain-orders/${order.id}/cancel`, {
            preserveScroll: true,
        });
    };

    return (
        <div className="rounded-[1.6rem] border border-[#e6e0d5] bg-[#fbf9f6] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all text-lg font-semibold text-slate-900">{order.domain_name}</p>
                        <StatusBadge label={order.type || 'pedido'} tone="neutral" />
                        <StatusBadge label={order.status || 'sin estado'} tone={domainOrderTone(order.status)} />
                        {order.manual_state && <StatusBadge label={`manual: ${order.manual_state}`} tone="warning" />}
                    </div>
                    <p className="mt-2 break-words text-sm text-slate-500">
                        {order.provider || 'Proveedor no definido'}
                        {order.amount !== null ? ` · ${order.currency || 'USD'} ${order.amount}` : ''}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={markDnsConfigured}
                        disabled={form.processing || order.status === 'active' || order.status === 'cancelled'}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        DNS listo
                    </button>
                    <button
                        type="button"
                        onClick={retryOrder}
                        disabled={form.processing || order.status === 'active' || order.status === 'cancelled'}
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reintentar
                    </button>
                    <button
                        type="button"
                        onClick={cancelOrder}
                        disabled={form.processing || order.status === 'active' || order.status === 'cancelled'}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <InfoPanel title="Intentos" value={String(order.verification_attempts || 0)} helper="Cantidad de verificaciones o sincronizaciones realizadas." />
                <InfoPanel title="Proxima revision" value={order.next_check_at || 'No programada'} helper="El job automatico la usa para seguir el flujo." />
                <InfoPanel title="Ultimo error" value={order.error_message || 'Sin error'} helper="Si algo fallo, aqui queda visible para soporte." />
            </div>

            <form onSubmit={submitOverride} className="mt-4 grid gap-4 lg:grid-cols-[240px,1fr,auto]">
                <Field label="Override de estado" error={form.errors.status}>
                    <select
                        value={form.data.status}
                        onChange={(event) => form.setData('status', event.target.value)}
                        className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    >
                        <option value="awaiting_dns">awaiting_dns</option>
                        <option value="verifying">verifying</option>
                        <option value="active">active</option>
                        <option value="failed">failed</option>
                        <option value="cancelled">cancelled</option>
                    </select>
                </Field>
                <Field label="Nota interna" error={form.errors.note}>
                    <textarea
                        value={form.data.note}
                        onChange={(event) => form.setData('note', event.target.value)}
                        className="min-h-[110px] w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                        placeholder="Ej: cliente ya actualizo DNS en su proveedor y soporte confirma que podemos forzar verifying."
                    />
                </Field>
                <div className="flex items-end">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
                    >
                        Guardar override
                    </button>
                </div>
            </form>

            {order.notes && (
                <div className="mt-4 rounded-2xl border border-[#ece5d8] bg-white px-4 py-3 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Notas guardadas</p>
                    <p className="mt-2 whitespace-pre-line">{order.notes}</p>
                </div>
            )}
        </div>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="rounded-[1.6rem] border border-dashed border-[#ddd3c5] bg-[#fbf9f6] px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
    );
}

function statusTone(status) {
    if (['active'].includes(status)) return 'success';
    if (['past_due', 'grace_period'].includes(status)) return 'warning';
    if (['suspended', 'blocked'].includes(status)) return 'danger';
    return 'neutral';
}

function billingTone(status) {
    const normalized = String(status || '').toLowerCase();
    if (['active', 'paid', 'completed'].includes(normalized)) return 'success';
    if (['pending', 'past_due', 'grace_period'].includes(normalized)) return 'warning';
    if (['failed', 'suspended', 'blocked', 'cancelled'].includes(normalized)) return 'danger';
    return 'neutral';
}

function domainOrderTone(status) {
    const normalized = String(status || '').toLowerCase();
    if (['active', 'registered', 'completed'].includes(normalized)) return 'success';
    if (['awaiting_dns', 'verifying', 'registering', 'creating_custom_hostname'].includes(normalized)) return 'warning';
    if (['failed', 'cancelled'].includes(normalized)) return 'danger';
    return 'neutral';
}
