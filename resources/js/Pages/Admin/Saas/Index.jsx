import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    CreditCard, 
    Globe2, 
    Plus, 
    ServerCog, 
    ShieldCheck, 
    Search, 
    Building2, 
    ChevronRight,
    ExternalLink,
    Zap,
    Layout,
    Activity
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, StatsCard, Badge, Button, Input, Tabs } from '@/Components/UI';
import CreateTenantDrawer from './Partials/CreateTenantDrawer';

export default function Index({ tenants, registrations = [], users = [], plans = [], cloudflare, presets = [] }) {
    const [activeTab, setActiveTab] = React.useState('tenants');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const tabs = [
        { id: 'tenants', label: 'Gestión de Estudios' },
        { id: 'onboarding', label: 'Altas Recientes' },
        { id: 'system', label: 'Estado del Sistema' },
    ];

    const filteredTenants = tenants.filter(t => 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <Head title="SaaS — Gestión Multitenante" />

            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ecosistema SaaS</h2>
                        <p className="text-sm font-medium text-slate-500">Administra el ciclo de vida de los tenants y dominios conectados.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} icon={Plus}>
                        Crear Tenant Manual
                    </Button>
                </div>

                {/* Sub-Header KPI Section */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard title="Total Studios" value={tenants.length} icon={Building2} color="primary" />
                    <StatsCard title="Altas Pendientes" value={registrations.filter(r => r.status === 'pending').length} icon={Activity} color="warning" />
                    <StatsCard title="Cloudflare SaaS" value={cloudflare.enabled ? 'Activo' : 'Off'} icon={ShieldCheck} color={cloudflare.enabled ? "success" : "slate"} />
                    <StatsCard title="Dominios Custom" value={tenants.filter(t => t.custom_domain).length} icon={Globe2} color="info" />
                </div>

                <Card noPadding className="border-none shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-white px-2">
                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                        <div className="p-4 sm:w-80">
                            {activeTab !== 'system' && (
                                <Input 
                                    placeholder="Nombre del estudio..." 
                                    icon={Search}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="min-h-[400px]">
                        {activeTab === 'tenants' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estudio / Slug</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Planes y Nodos</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Cloudflare</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredTenants.map((tenant) => (
                                            <tr key={tenant.id} className="group hover:bg-slate-50/80 transition-all">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                            <Building2 className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <Link href={`/admin/saas/tenants/${tenant.id}`} className="text-sm font-bold text-slate-800 hover:text-primary transition-colors">{tenant.name}</Link>
                                                            <p className="text-xs text-slate-400 mt-0.5">/{tenant.slug}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="primary" className="text-[10px] uppercase font-black">{tenant.plan_code}</Badge>
                                                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">{tenant.domains?.[0]?.hostname}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <Badge variant={tenant.custom_domain ? 'success' : 'slate'} className="gap-1.5">
                                                        <Globe2 className="h-3 w-3" />
                                                        {tenant.custom_domain ? 'Custom' : 'Stock'}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <Link href={`/admin/saas/tenants/${tenant.id}`}>
                                                        <Button variant="outline" size="sm" icon={ChevronRight}>Configurar</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'onboarding' && (
                            <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
                                {registrations.map((reg) => (
                                    <article key={reg.id} className="group flex flex-col justify-between rounded-[1.5rem] border border-slate-100 bg-white p-6 transition-all hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50">
                                        <div>
                                            <div className="flex items-start justify-between">
                                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                    <Zap className="h-5 w-5" />
                                                </div>
                                                <Badge variant={reg.status === 'success' ? 'success' : 'warning'}>{reg.status}</Badge>
                                            </div>
                                            <h4 className="mt-4 text-lg font-black text-slate-800 tracking-tight">{reg.studio_name}</h4>
                                            <p className="text-xs font-semibold text-slate-400">{reg.owner_email}</p>
                                            
                                            <div className="mt-6 space-y-2 border-t border-slate-50 pt-4">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-slate-400 uppercase tracking-widest">Plan Solicitado</span>
                                                    <span className="text-slate-700">{reg.plan_code}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-slate-400 uppercase tracking-widest">Gateway</span>
                                                    <span className="text-slate-700">{reg.payment_gateway || 'manual'} ({reg.billing_cycle})</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-slate-400 uppercase tracking-widest">Subdominio</span>
                                                    <span className="text-primary">{reg.provisioned_hostname}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {reg.tenant_login_url && (
                                            <div className="mt-6">
                                                <a href={reg.tenant_login_url} target="_blank" className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-800 hover:text-white transition-all">
                                                    Abrir acceso tenant <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                    </article>
                                ))}
                                {registrations.length === 0 && (
                                    <div className="col-span-full py-20 text-center">
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay registros recientes</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="p-8 space-y-8 max-w-4xl mx-auto">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <Card noPadding className="border-slate-100">
                                        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                                            <ShieldCheck className="h-5 w-5 text-primary" />
                                            <h4 className="font-black text-slate-800">Cloudflare For SaaS</h4>
                                        </div>
                                        <div className="p-6 space-y-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 font-medium">Estado del Driver:</span>
                                                <Badge variant={cloudflare.enabled ? 'success' : 'danger'}>{cloudflare.enabled ? 'Configurado' : 'Pendiente'}</Badge>
                                            </div>
                                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                                <div className="rounded-xl bg-slate-50 p-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target CNAME Administrado</p>
                                                    <code className="text-xs font-mono text-primary break-all">{cloudflare.managed_cname_target || 'N/A'}</code>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed italic">
                                                    Para dominios personalizados, el cliente debe apuntar un CNAME a esta dirección para que el sistema emita el certificado SSL automáticamente.
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card noPadding className="border-slate-100">
                                        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                                            <ServerCog className="h-5 w-5 text-primary" />
                                            <h4 className="font-black text-slate-800">Parámetros Críticos</h4>
                                        </div>
                                        <div className="p-6 space-y-4">
                                             <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                                                <span>Central Database</span>
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700">
                                                <span>R2 Storage Hub</span>
                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <CreateTenantDrawer 
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                plans={plans}
                presets={presets}
            />
        </AdminLayout>
    );
}

}
