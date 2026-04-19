import React from 'react';
import { Head } from '@inertiajs/react';
import { 
    Plus, 
    DollarSign, 
    Calendar, 
    Building2, 
    CreditCard, 
    Users,
    TrendingUp,
    Search,
    Edit3,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Activity
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, StatsCard, Badge, Button, Input, Tabs } from '@/Components/UI';
import SubscriptionDrawer from './Partials/SubscriptionDrawer';
import ManualPaymentDrawer from './Partials/ManualPaymentDrawer';

export default function Index({ subscriptions, tenants, plans, stats }) {
    const [activeTab, setActiveTab] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [editingSub, setEditingSub] = React.useState(null);
    const [payingSub, setPayingSub] = React.useState(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const tabs = [
        { id: 'all', label: 'Todas' },
        { id: 'active', label: 'Activas' },
        { id: 'past_due', label: 'En Mora' },
        { id: 'canceled', label: 'Canceladas' },
        { id: 'pending', label: 'Pendientes' },
    ];

    const filteredSubscriptions = subscriptions.filter(sub => {
        const matchesTab = activeTab === 'all' || sub.status === activeTab;
        const matchesSearch = sub.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              sub.plan_code?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'active': return { label: 'Activa', variant: 'success', icon: CheckCircle2 };
            case 'past_due': return { label: 'En Mora', variant: 'danger', icon: AlertCircle };
            case 'canceled': return { label: 'Cancelada', variant: 'slate', icon: XCircle };
            case 'pending': return { label: 'Pendiente', variant: 'warning', icon: Clock };
            default: return { label: status, variant: 'slate', icon: Activity };
        }
    };

    return (
        <AdminLayout>
            <Head title="SaaS — Suscripciones" />

            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Suscripciones</h2>
                        <p className="text-sm font-medium text-slate-500">Supervisa periodos de facturación y salud de los estudios.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} icon={Plus} size="lg">
                        Nueva Suscripción
                    </Button>
                </div>

                {/* KPI Section */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard 
                        title="Suscripciones Activas" 
                        value={stats?.active_count || subscriptions.filter(s => s.status === 'active').length}
                        trend="up"
                        trendValue="+12.5%"
                        icon={Users}
                        color="primary"
                    />
                    <StatsCard 
                        title="MRR (Ingresos Mes)" 
                        value={`$${stats?.mrr || '4,250'}`}
                        trend="up"
                        trendValue="+8.2%"
                        icon={DollarSign}
                        color="success"
                    />
                    <StatsCard 
                        title="En Mora" 
                        value={subscriptions.filter(s => s.status === 'past_due').length}
                        icon={AlertCircle}
                        color="danger"
                    />
                    <StatsCard 
                        title="Tasa de Renovación" 
                        value="94.2%"
                        trend="up"
                        trendValue="+2.1%"
                        icon={TrendingUp}
                        color="info"
                    />
                </div>

                {/* Main Content Area */}
                <Card noPadding className="border-none shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-white px-2">
                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                        <div className="p-4 sm:w-80">
                            <Input 
                                placeholder="Buscar estudio o plan..." 
                                icon={Search}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estudio / Tenant</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Detalles del Plan</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vencimiento</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredSubscriptions.map((sub) => {
                                    const status = getStatusStyle(sub.status);
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr key={sub.id} className="group hover:bg-slate-50/80 transition-all">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-500 group-hover:bg-white group-hover:text-primary transition-all">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{sub.tenant?.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <CreditCard className="h-3 w-3 text-slate-400" />
                                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                                {sub.provider} · {sub.payment_mode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800 capitalize">{sub.plan_code}</span>
                                                    <Badge variant="primary" className="text-[8px]">{sub.billing_cycle}</Badge>
                                                </div>
                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                    {sub.amount} {sub.currency} <span className="font-medium text-slate-400">/ {sub.billing_cycle === 'yearly' ? 'año' : 'mes'}</span>
                                                </p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <Badge variant={status.variant} className="gap-1.5 py-1 px-3">
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-300" />
                                                    {sub.current_period_ends_at ? new Date(sub.current_period_ends_at).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setPayingSub(sub)} 
                                                        title="Registrar Pago"
                                                        className="flex h-9 items-center gap-2 rounded-lg bg-green-50 px-4 text-xs font-black text-green-700 hover:bg-green-100 transition-all border border-green-100"
                                                    >
                                                        <DollarSign className="h-4 w-4" />
                                                        <span className="hidden xl:inline">Pagar</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingSub(sub)} 
                                                        title="Editar Suscripción"
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-primary hover:border-primary transition-all shadow-sm"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredSubscriptions.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center">
                                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-300">
                                                <Search className="h-10 w-10" />
                                            </div>
                                            <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron suscripciones</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Side Drawers */}
            <SubscriptionDrawer 
                isOpen={isCreateOpen || !!editingSub}
                subscription={editingSub}
                tenants={tenants}
                plans={plans}
                onClose={() => { setEditingSub(null); setIsCreateOpen(false); }}
            />

            <ManualPaymentDrawer 
                isOpen={!!payingSub}
                subscription={payingSub}
                onClose={() => setPayingSub(null)}
            />
        </AdminLayout>
    );
}
