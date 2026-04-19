import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';
import { CalendarClock, Landmark, Receipt, Save } from 'lucide-react';

const ToggleField = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
        <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${checked ? 'bg-primary-500' : 'bg-slate-300'}`}
        >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
);

export default function Billing({ settings }) {
    const { data, setData, post, processing } = useForm({
        tax_itbms_enabled: ['1', 1, true, 'true'].includes(settings.tax_itbms_enabled?.value ?? '1'),
        tax_itbms_rate: settings.tax_itbms_rate?.value ?? '7',
        alanube_enabled: ['1', 1, true, 'true'].includes(settings.alanube_enabled?.value ?? '0'),
        lead_schedule_blocks_hours: ['1', 1, true, 'true'].includes(settings.lead_schedule_blocks_hours?.value ?? '1'),
        lead_parallel_capacity: settings.lead_parallel_capacity?.value ?? '1',
        _method: 'put',
    });

    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title="Facturacion" />

                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div>
                        <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-900">Volver a configuracion</Link>
                        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Facturacion</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                            Aqui se controlan impuestos, factura electronica y la politica de bloqueo horario del formulario de leads.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => post('/admin/settings/billing')}
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

                <SettingsNavigation />

                <section className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Que controla esta pantalla</p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            Aqui defines reglas globales del sistema, no cobros individuales de clientes.
                        </p>
                    </div>
                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Afecta</p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            Facturas nuevas, activacion de factura electronica y disponibilidad del formulario de leads.
                        </p>
                    </div>
                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">No afecta</p>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                            No cambia pagos ya registrados ni suscripciones SaaS existentes de tenants.
                        </p>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-3">
                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                                <Landmark className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">ITBMS</h2>
                                <p className="text-xs text-slate-500">Configuracion fiscal global</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <ToggleField
                                label="ITBMS global"
                                description="Define si las nuevas facturas nacen con el 7% activo por defecto."
                                checked={data.tax_itbms_enabled}
                                onChange={(value) => setData('tax_itbms_enabled', value)}
                            />

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tasa ITBMS</label>
                                <input
                                    value={data.tax_itbms_rate}
                                    onChange={(event) => setData('tax_itbms_rate', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="7"
                                />
                                <p className="text-xs text-slate-500">Porcentaje por defecto que se propone al crear nuevas facturas o cobros internos.</p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">Factura electronica</h2>
                                <p className="text-xs text-slate-500">Activacion funcional del servicio</p>
                            </div>
                        </div>

                        <ToggleField
                            label="Alanube habilitado"
                            description="Activa o desactiva el uso de factura electronica en nuevas facturas emitidas desde la plataforma."
                            checked={data.alanube_enabled}
                            onChange={(value) => setData('alanube_enabled', value)}
                        />
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                                <CalendarClock className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">Disponibilidad de leads</h2>
                                <p className="text-xs text-slate-500">Control de cupos y bloqueos horarios del calendario visual.</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <ToggleField
                                label="Bloquear horas ocupadas"
                                description="Si esta activo, el formulario solo permite fechas y horas con disponibilidad real."
                                checked={data.lead_schedule_blocks_hours}
                                onChange={(value) => setData('lead_schedule_blocks_hours', value)}
                            />

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Capacidad simultanea</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={data.lead_parallel_capacity}
                                    onChange={(event) => setData('lead_parallel_capacity', event.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
                                    placeholder="1"
                                />
                                <p className="text-xs text-slate-500">Usa 1 si solo cubres un evento por hora. Si trabajas con varios equipos, aumenta este valor.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
