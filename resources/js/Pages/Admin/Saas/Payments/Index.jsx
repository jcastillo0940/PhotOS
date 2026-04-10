import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CreditCard, DollarSign, Calendar, Building2, Search, ArrowUpRight, ArrowDownLeft, Terminal } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { clsx } from 'clsx';

function TransactionIcon({ type }) {
    if (type.includes('payment')) return <ArrowDownLeft className="h-5 w-5 text-green-500" />;
    if (type.includes('refund')) return <ArrowUpRight className="h-5 w-5 text-rose-500" />;
    return <Terminal className="h-5 w-5 text-slate-400" />;
}

export default function Index({ transactions, stats }) {
    return (
        <AdminLayout>
            <Head title="SaaS - Pagos PayPal" />
            <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Total recaudado</p>
                        <p className="mt-3 text-3xl font-bold text-slate-900">${stats.total_amount}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            Historico completo
                        </div>
                    </div>
                    <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">PayPal Gateway</p>
                        <p className="mt-3 text-3xl font-bold text-[#0070ba]">${stats.paypal_total}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-[#0070ba]"></span>
                            Transacciones automáticas
                        </div>
                    </div>
                    <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Pagos Manuales</p>
                        <p className="mt-3 text-3xl font-bold text-slate-700">${stats.manual_total}</p>
                        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                            Transferencias / Efectivo
                        </div>
                    </div>
                </div>

                <div className="rounded-[2.5rem] border border-[#e6e0d5] bg-white overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-[#f3eee6] flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Historial de Transacciones</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input className="rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] pl-10 pr-4 py-2 text-sm outline-none w-64" placeholder="Buscar por referencia..." />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#fcfaf7] border-b border-[#f3eee6]">
                                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Concepto / Tenant</th>
                                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Proveedor</th>
                                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Estado</th>
                                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Monto</th>
                                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f3eee6]">
                                {transactions.data.map((tx) => (
                                    <tr key={tx.id} className="group hover:bg-[#fcfaf7] transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-[#e6e0d5] shadow-sm">
                                                    <TransactionIcon type={tx.type} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 capitalize">{tx.type.replace('_', ' ')}</p>
                                                    <p className="text-xs text-slate-500">{tx.tenant?.name || 'Sistema'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                {tx.provider === 'paypal' ? (
                                                    <span className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-[#0070ba]">
                                                        <CreditCard className="h-3 w-3" /> PayPal
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-slate-600">
                                                        Manual
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-mono text-slate-400">{tx.reference}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={clsx(
                                                'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
                                                tx.status === 'completed' ? 'text-green-600' : 'text-slate-400'
                                            )}>
                                                {tx.status === 'completed' && <span className="h-1 w-1 rounded-full bg-green-600"></span>}
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold text-slate-900">${tx.amount} {tx.currency}</p>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <p className="text-sm font-medium text-slate-900">{new Date(tx.occurred_at || tx.created_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(tx.occurred_at || tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
