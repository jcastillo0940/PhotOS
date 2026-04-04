import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ChevronLeft, Copy, Printer, Save, Sparkles } from 'lucide-react';

export default function Edit({ contract, presets, variableCatalog }) {
    const { data, setData, put, processing } = useForm({
        content: contract.content || '',
        contract_data: contract.contract_data || {
            city: '',
            location: '',
            photographer_business: '',
            photographer_document: '',
            client_document: '',
            jurisdiction_country: '',
            balance_due_date: '',
            reservation_amount: '',
            remaining_amount: '',
            privacy_fee: '',
        },
        status: contract.status || 'pending',
    });

    const previewHtml = React.useMemo(() => {
        const dynamicOverrides = {
            '[city]': data.contract_data?.city || contract.variables?.['[city]'] || '',
            '[jurisdiction_country]': data.contract_data?.jurisdiction_country || contract.variables?.['[jurisdiction_country]'] || '',
            '[location]': data.contract_data?.location || contract.variables?.['[location]'] || '',
            '[photographer_business]': data.contract_data?.photographer_business || contract.variables?.['[photographer_business]'] || '',
            '[photographer_document]': data.contract_data?.photographer_document || contract.variables?.['[photographer_document]'] || '',
            '[client_document]': data.contract_data?.client_document || contract.variables?.['[client_document]'] || '',
            '[balance_due_date]': data.contract_data?.balance_due_date || contract.variables?.['[balance_due_date]'] || '',
            '[reservation_amount]': data.contract_data?.reservation_amount ? `B/. ${Number(data.contract_data.reservation_amount).toFixed(2)}` : contract.variables?.['[reservation_amount]'] || '',
            '[remaining_amount]': data.contract_data?.remaining_amount ? `B/. ${Number(data.contract_data.remaining_amount).toFixed(2)}` : contract.variables?.['[remaining_amount]'] || '',
            '[privacy_fee]': data.contract_data?.privacy_fee ? `B/. ${Number(data.contract_data.privacy_fee).toFixed(2)}` : contract.variables?.['[privacy_fee]'] || '',
        };

        return Object.entries({ ...(contract.variables || {}), ...dynamicOverrides }).reduce((html, [token, value]) => {
            return html.split(token).join(value);
        }, data.content || '');
    }, [contract.variables, data.content, data.contract_data]);

    const submit = (event) => {
        event.preventDefault();
        put(`/admin/contracts/${contract.id}`);
    };

    const applyPreset = (preset) => {
        setData('content', preset.content);
    };

    const updateContractData = (key, value) => {
        setData('contract_data', {
            ...(data.contract_data || {}),
            [key]: value,
        });
    };

    const copyToken = async (token) => {
        await navigator.clipboard.writeText(token);
        window.alert(`Variable copied: ${token}`);
    };

    return (
        <AdminLayout>
            <Head title={`Editar contrato: ${contract.project?.lead?.name}`} />

            <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/admin/contracts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
                        <ChevronLeft className="h-4 w-4" />
                        Volver a contratos
                    </Link>
                    <Link href={`/admin/contracts/${contract.id}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Link>
                </div>

                <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                    <section className="space-y-6">
                        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary-500" />
                                <h2 className="text-lg font-semibold text-slate-900">Plantillas por tipo de evento</h2>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.key}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 hover:bg-white"
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{preset.label}</p>
                                        <p className="mt-2 text-sm text-slate-600">{preset.description}</p>
                                    </button>
                                ))}
                            </div>
                        </article>

                        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Datos del contrato</h2>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <ContractField label="Ciudad legal" value={data.contract_data?.city || ''} onChange={(value) => updateContractData('city', value)} />
                                <ContractField label="Pais / jurisdiccion" value={data.contract_data?.jurisdiction_country || ''} onChange={(value) => updateContractData('jurisdiction_country', value)} />
                                <ContractField label="Ubicacion del evento" value={data.contract_data?.location || ''} onChange={(value) => updateContractData('location', value)} />
                                <ContractField label="Nombre comercial" value={data.contract_data?.photographer_business || ''} onChange={(value) => updateContractData('photographer_business', value)} />
                                <ContractField label="Documento fotografo" value={data.contract_data?.photographer_document || ''} onChange={(value) => updateContractData('photographer_document', value)} />
                                <ContractField label="Documento cliente" value={data.contract_data?.client_document || ''} onChange={(value) => updateContractData('client_document', value)} />
                                <ContractField label="Monto reserva" type="number" value={data.contract_data?.reservation_amount || ''} onChange={(value) => updateContractData('reservation_amount', value)} />
                                <ContractField label="Saldo restante" type="number" value={data.contract_data?.remaining_amount || ''} onChange={(value) => updateContractData('remaining_amount', value)} />
                                <ContractField label="Cargo privacidad" type="number" value={data.contract_data?.privacy_fee || ''} onChange={(value) => updateContractData('privacy_fee', value)} />
                                <ContractField label="Fecha limite de pago" value={data.contract_data?.balance_due_date || ''} onChange={(value) => updateContractData('balance_due_date', value)} />
                            </div>
                        </article>

                        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Texto del contrato</label>
                            <textarea
                                rows={22}
                                value={data.content}
                                onChange={(event) => setData('content', event.target.value)}
                                className="mt-4 w-full rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                            />

                            <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <span>Estado</span>
                                    <select
                                        value={data.status}
                                        onChange={(event) => setData('status', event.target.value)}
                                        className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="signed">Signed</option>
                                    </select>
                                </div>

                                <button
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:opacity-70"
                                >
                                    <Save className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                                    {processing ? 'Guardando...' : 'Guardar contrato'}
                                </button>
                            </div>
                        </article>
                    </section>

                    <section className="space-y-6">
                        <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Vista previa</p>
                            <div className="prose mt-6 max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </article>

                        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Campos dinamicos disponibles</p>
                            <div className="mt-4 space-y-3">
                                {variableCatalog.map((item) => (
                                    <div key={item.token} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3">
                                        <div>
                                            <p className="font-mono text-sm font-semibold text-slate-900">{item.token}</p>
                                            <p className="text-xs text-slate-500">{item.label}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copyToken(item.token)}
                                            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:text-slate-900"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </section>
                </form>
            </div>
        </AdminLayout>
    );
}

function ContractField({ label, value, onChange, type = 'text' }) {
    return (
        <label className="space-y-1.5">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
            />
        </label>
    );
}
