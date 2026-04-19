import React from 'react';
import { Head } from '@inertiajs/react';
import { clsx } from 'clsx';
import { 
    CreditCard, 
    DollarSign, 
    Search, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Terminal, 
    Building2,
    Calendar,
    Clock,
    Activity,
    Filter
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, StatsCard, Badge, Input, Tabs, Button } from '@/Components/UI';

function TransactionIcon({ type }) {
    if (type.includes('payment')) return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
    if (type.includes('refund')) return <ArrowUpRight className="h-5 w-5 text-rose-500" />;
    return <Terminal className="h-5 w-5 text-slate-400" />;
}

export default function Index({ transactions, stats }) {
    const [activeTab, setActiveTab] = React.useState('all');
    const [searchTerm, setSearchTerm] = React.useState('');

    const tabs = [
        { id: 'all', label: 'Todos los movimientos' },
        { id: 'paypal', label: 'Gateway PayPal' },
        { id: 'manual', label: 'Cobros Manuales' },
    ];

    const filteredTransactions = transactions.data.filter(tx => {
        const matchesTab = activeTab === 'all' || tx.provider === activeTab;
        const matchesSearch = tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              tx.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <AdminLayout>
            <Head title="SaaS — Pagos y Finanzas" />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Movimientos Financieros</h2>
                        <p className="text-sm font-medium text-slate-500">Historial completo de ingresos y reembolsos del ecosistema SaaS.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" icon={Filter}>Filtrar Fechas</Button>
                        <Button variant="secondary" icon={Activity}>Exportar Log</Button>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <StatsCard 
                        title="Total Recaudado" 
                        value={`$${stats.total_amount}`}
                        icon={DollarSign}
                        color="success"
                        trend="up"
                        trendValue="+14.2%"
                    />
                    <StatsCard 
                        title="Vía PayPal" 
                        value={`$${stats.paypal_total}`}
                        icon={CreditCard}
                        color="primary"
                    />
                    <StatsCard 
                        title="Recaudo Manual" 
                        value={`$${stats.manual_total}`}
                        icon={Terminal}
                        color="slate"
                    />
                </div>

                {/* Main Content */}
                <Card noPadding className="border-none shadow-xl shadow-slate-200/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 bg-white px-2">
                        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                        <div className="p-4 sm:w-80">
                            <Input 
                                placeholder="Buscar por referencia o estudio..." 
                                icon={Search}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Concepto / Tenant</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Proveedor</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Estado</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monto Final</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Fecha / Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-slate-50/80 transition-all">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm group-hover:border-primary group-hover:text-primary transition-all">
                                                    <TransactionIcon type={tx.type} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800 capitalize">{tx.type.replace('_', ' ')}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400">
                                                        <Building2 className="h-3 w-3" />
                                                        <span className="font-semibold">{tx.tenant?.name || 'Sistema'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Badge variant={tx.provider === 'paypal' ? 'primary' : 'slate'} className="px-3">
                                                    {tx.provider === 'paypal' ? 'PayPal Checkout' : 'Pago Manual'}
                                                </Badge>
                                                <span className="text-[10px] font-mono text-slate-400 tracking-tight">{tx.reference}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <Badge variant={tx.status === 'completed' ? 'success' : 'slate'} className="py-1 px-3">
                                                {tx.status}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={clsx(
                                                    "text-lg font-black tracking-tight",
                                                    tx.type.includes('refund') ? "text-red-500" : "text-green-600"
                                                )}>
                                                    {tx.type.includes('refund') ? '-' : '+'}${tx.amount}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{tx.currency}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                                    {new Date(tx.occurred_at || tx.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(tx.occurred_at || tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
