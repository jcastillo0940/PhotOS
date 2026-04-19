import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    BadgeDollarSign,
    Calendar,
    Cpu,
    Pencil,
    ReceiptText,
    Save,
    Trash2,
    Wrench,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, Button, Card, Chart, Input, StatsCard } from '@/Components/UI';

const emptyForm = {
    period_start: new Date().toISOString().slice(0, 7),
    provider: 'manual',
    service: '',
    cost_type: 'actual',
    amount_usd: '',
    source: 'manual',
    notes: '',
};

function toMonthInput(value) {
    return value ? String(value).slice(0, 7) : '';
}

export default function Index({ entries, stats, monthly, productOptions = [] }) {
    const [editingId, setEditingId] = React.useState(null);
    const form = useForm(emptyForm);

    const fmtUsd = (value, digits = 2) => `$${Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`;

    const chartOptions = {
        chart: { id: 'saas-costs-chart', fontFamily: 'inherit' },
        xaxis: { categories: [...monthly].reverse().map((row) => row.label) },
        dataLabels: { enabled: false },
        colors: ['#dc2626', '#f59e0b'],
        grid: { borderColor: '#f1f1f1' },
    };

    const chartSeries = [
        {
            name: 'Costo real',
            data: [...monthly].reverse().map((row) => Number(row.actual_usd || 0)),
        },
        {
            name: 'Costo estimado',
            data: [...monthly].reverse().map((row) => Number(row.estimated_usd || 0)),
        },
    ];

    const submit = (event) => {
        event.preventDefault();

        const payload = {
            ...form.data,
            period_start: `${form.data.period_start}-01`,
        };

        if (editingId) {
            form.transform(() => payload).put(`/admin/saas/costs/${editingId}`, {
                onSuccess: () => {
                    setEditingId(null);
                    form.setData(emptyForm);
                    form.transform((data) => data);
                },
            });
            return;
        }

        form.transform(() => payload).post('/admin/saas/costs', {
            onSuccess: () => {
                form.setData(emptyForm);
                form.transform((data) => data);
            },
        });
    };

    const startEdit = (entry) => {
        setEditingId(entry.id);
        form.setData({
            period_start: toMonthInput(entry.period_start),
            provider: entry.provider || 'manual',
            service: entry.service || '',
            cost_type: entry.cost_type || 'actual',
            amount_usd: entry.amount_usd ?? '',
            source: entry.source || 'manual',
            notes: entry.notes || '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        form.setData(emptyForm);
    };

    const applyProductOption = (value) => {
        const option = productOptions.find((item) => `${item.provider}::${item.service}` === value);

        if (!option) {
            return;
        }

        form.setData((data) => ({
            ...data,
            provider: option.provider,
            service: option.service,
        }));
    };

    return (
        <AdminLayout>
            <Head title="SaaS - Costos Mensuales" />

            <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800">Costos SaaS</h2>
                        <p className="text-sm font-medium text-slate-500">Registra costos mensuales reales o estimados cuando una integracion no entrega billing por API.</p>
                    </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <StatsCard title="Costo real total" value={fmtUsd(stats.actual_total_usd || 0, 4)} icon={BadgeDollarSign} color="danger" />
                    <StatsCard title="Costo estimado total" value={fmtUsd(stats.estimated_total_usd || 0, 4)} icon={Wrench} color="warning" />
                    <StatsCard title="Real este mes" value={fmtUsd(stats.current_month_actual_usd || 0, 4)} icon={ReceiptText} color="primary" />
                    <StatsCard title="Estimado este mes" value={fmtUsd(stats.current_month_estimated_usd || 0, 4)} icon={Calendar} color="info" />
                </div>

                <div className="grid gap-8 xl:grid-cols-3">
                    <Card className="xl:col-span-2" title="Costos Manuales por Mes" subtitle="Comparativo entre carga real y carga estimada">
                        <Chart options={chartOptions} series={chartSeries} height={300} />
                    </Card>

                    <Card title={editingId ? 'Editar costo' : 'Agregar costo mensual'} subtitle="Usa una fila por proveedor, servicio y mes">
                        <form onSubmit={submit} className="space-y-4">
                            <Input
                                label="Mes"
                                type="month"
                                value={form.data.period_start}
                                onChange={(event) => form.setData('period_start', event.target.value)}
                                error={form.errors.period_start}
                            />

                            <div className="space-y-1.5">
                                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Producto sugerido</label>
                                <select
                                    value=""
                                    onChange={(event) => {
                                        applyProductOption(event.target.value);
                                        event.target.value = '';
                                    }}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                >
                                    <option value="">Selecciona una categoria definida...</option>
                                    {productOptions.map((option) => (
                                        <option key={`${option.provider}-${option.service}`} value={`${option.provider}::${option.service}`}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label="Proveedor"
                                value={form.data.provider}
                                onChange={(event) => form.setData('provider', event.target.value)}
                                error={form.errors.provider}
                                placeholder="google, cloudflare, openai, manual..."
                            />

                            <Input
                                label="Servicio"
                                value={form.data.service}
                                onChange={(event) => form.setData('service', event.target.value)}
                                error={form.errors.service}
                                placeholder="compute engine, r2, cloudflare for saas, smtp..."
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Tipo</label>
                                    <select
                                        value={form.data.cost_type}
                                        onChange={(event) => form.setData('cost_type', event.target.value)}
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                    >
                                        <option value="actual">Real</option>
                                        <option value="estimated">Estimado</option>
                                    </select>
                                    {form.errors.cost_type && <p className="ml-1 text-[11px] font-bold text-red-500">{form.errors.cost_type}</p>}
                                </div>

                                <Input
                                    label="Monto USD"
                                    type="number"
                                    step="0.0001"
                                    min="0"
                                    value={form.data.amount_usd}
                                    onChange={(event) => form.setData('amount_usd', event.target.value)}
                                    error={form.errors.amount_usd}
                                />
                            </div>

                            <Input
                                label="Origen"
                                value={form.data.source}
                                onChange={(event) => form.setData('source', event.target.value)}
                                error={form.errors.source}
                                placeholder="manual, invoice, dashboard, export..."
                            />

                            <div className="space-y-1.5">
                                <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Notas</label>
                                <textarea
                                    value={form.data.notes}
                                    onChange={(event) => form.setData('notes', event.target.value)}
                                    className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                                    placeholder="Ej: factura de abril, costo base cloudflare, estimacion manual del VPS..."
                                />
                                {form.errors.notes && <p className="ml-1 text-[11px] font-bold text-red-500">{form.errors.notes}</p>}
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" variant="primary" icon={editingId ? Save : BadgeDollarSign} loading={form.processing}>
                                    {editingId ? 'Guardar cambios' : 'Agregar costo'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="outline" icon={Cpu} onClick={cancelEdit}>
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                <Card noPadding title="Registro de costos" subtitle="Cada fila corresponde a un costo mensual cargado manualmente">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mes</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Proveedor / Servicio</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Tipo</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Monto</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Origen</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notas</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entries.length ? entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-all">
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{toMonthInput(entry.period_start)}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-800">{entry.provider}</p>
                                            <p className="text-xs font-medium text-slate-400">{entry.service}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={entry.cost_type === 'actual' ? 'danger' : 'warning'}>
                                                {entry.cost_type === 'actual' ? 'Real' : 'Estimado'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-800">{fmtUsd(entry.amount_usd, 4)}</td>
                                        <td className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{entry.source || 'manual'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{entry.notes || 'Sin notas'}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" size="sm" variant="outline" icon={Pencil} onClick={() => startEdit(entry)}>
                                                    Editar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="danger"
                                                    icon={Trash2}
                                                    onClick={() => {
                                                        if (window.confirm('Esta accion eliminara el costo mensual seleccionado.')) {
                                                            router.delete(`/admin/saas/costs/${entry.id}`);
                                                        }
                                                    }}
                                                >
                                                    Borrar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-sm font-medium text-slate-400">
                                            Todavia no has registrado costos mensuales manuales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
