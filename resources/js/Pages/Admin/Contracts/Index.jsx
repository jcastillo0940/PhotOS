import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Copy, ExternalLink, Eye, FileText, Save, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export default function Index({ contracts, presets, variableCatalog }) {
    const { flash } = usePage().props;
    const [selectedId, setSelectedId] = React.useState(contracts[0]?.id ?? null);
    const selected = contracts.find((contract) => contract.id === selectedId) || contracts[0] || null;
    const { data, setData, put, processing, reset } = useForm({
        content: selected?.content || '',
        contract_data: selected?.contract_data || {
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
        status: selected?.status || 'pending',
    });

    React.useEffect(() => {
        if (selected) {
            reset({
                content: selected.content || '',
                contract_data: selected.contract_data || {
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
                status: selected.status || 'pending',
            });
        }
    }, [selectedId]);

    const previewHtml = React.useMemo(() => {
        if (!selected) return '';

        const dynamicOverrides = {
            '[city]': data.contract_data?.city || selected.variables?.['[city]'] || '',
            '[jurisdiction_country]': data.contract_data?.jurisdiction_country || selected.variables?.['[jurisdiction_country]'] || '',
            '[location]': data.contract_data?.location || selected.variables?.['[location]'] || '',
            '[photographer_business]': data.contract_data?.photographer_business || selected.variables?.['[photographer_business]'] || '',
            '[photographer_document]': data.contract_data?.photographer_document || selected.variables?.['[photographer_document]'] || '',
            '[client_document]': data.contract_data?.client_document || selected.variables?.['[client_document]'] || '',
            '[balance_due_date]': data.contract_data?.balance_due_date || selected.variables?.['[balance_due_date]'] || '',
            '[reservation_amount]': data.contract_data?.reservation_amount ? `B/. ${Number(data.contract_data.reservation_amount).toFixed(2)}` : selected.variables?.['[reservation_amount]'] || '',
            '[remaining_amount]': data.contract_data?.remaining_amount ? `B/. ${Number(data.contract_data.remaining_amount).toFixed(2)}` : selected.variables?.['[remaining_amount]'] || '',
            '[privacy_fee]': data.contract_data?.privacy_fee ? `B/. ${Number(data.contract_data.privacy_fee).toFixed(2)}` : selected.variables?.['[privacy_fee]'] || '',
        };

        return Object.entries({ ...(selected.variables || {}), ...dynamicOverrides }).reduce((html, [token, value]) => {
            return html.split(token).join(value);
        }, data.content || '');
    }, [data.content, data.contract_data, selected]);

    const submit = (event) => {
        event.preventDefault();
        if (!selected) return;
        put(`/admin/contracts/${selected.id}`, {
            preserveScroll: true,
        });
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
            <Head title="Contratos" />

            <div className="space-y-8">
                <div className="flex items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-heading font-black tracking-tight text-slate-900">Contratos</h1>
                        <p className="mt-2 text-sm text-slate-500">Editor central para revisar, modificar y abrir la versión pública de firma.</p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-8 xl:grid-cols-[330px_minmax(0,1fr)]">
                    <aside className="space-y-4">
                        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Leads y contratos</p>
                            <Link href="/admin/leads" className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                <Eye className="h-4 w-4" />
                                Administrar leads
                            </Link>
                        </div>

                        {contracts.map((contract) => (
                            <button
                                key={contract.id}
                                type="button"
                                onClick={() => setSelectedId(contract.id)}
                                className={clsx(
                                    'w-full rounded-[1.8rem] border p-5 text-left shadow-sm transition',
                                    selected?.id === contract.id
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                                )}
                            >
                                <p className={clsx('text-[11px] uppercase tracking-[0.25em]', selected?.id === contract.id ? 'text-white/55' : 'text-slate-400')}>
                                    {contract.project?.lead?.event_type || contract.status}
                                </p>
                                <h2 className="mt-3 text-lg font-semibold">{contract.project?.name}</h2>
                                <p className={clsx('mt-2 text-sm', selected?.id === contract.id ? 'text-white/70' : 'text-slate-500')}>
                                    {contract.project?.lead?.name}
                                </p>
                            </button>
                        ))}
                    </aside>

                    <section className="space-y-6">
                        {!selected ? (
                            <div className="rounded-[2rem] border border-slate-200 bg-white py-20 text-center text-slate-500 shadow-sm">No hay contratos disponibles.</div>
                        ) : (
                            <form onSubmit={submit} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Contrato activo</p>
                                        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{selected.project?.name}</h2>
                                        <p className="mt-2 text-sm text-slate-500">{selected.project?.lead?.name} · {selected.project?.lead?.email}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <Link
                                            href={`/admin/contracts/${selected.id}/print`}
                                            target="_blank"
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Print / PDF
                                        </Link>
                                        <Link
                                            href={`/sign/${selected.token}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Open public
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid gap-6 xl:grid-cols-[1fr_.95fr]">
                                    <div className="space-y-3">
                                        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-primary-500" />
                                                <p className="text-sm font-semibold text-slate-900">Plantillas por tipo de evento</p>
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
                                        </div>

                                        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Datos especificos del contrato</p>
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
                                        </div>

                                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">HTML content</label>
                                        <textarea
                                            rows={22}
                                            value={data.content}
                                            onChange={(event) => setData('content', event.target.value)}
                                            className="w-full rounded-[1.6rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live preview</label>
                                        <div className="min-h-[560px] rounded-[1.8rem] border border-slate-200 bg-white p-8 shadow-inner">
                                            <div className="mb-8 border-b border-slate-200 pb-6">
                                                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Minimal white contract</p>
                                                <h3 className="mt-3 text-3xl font-serif text-slate-900">Service Agreement</h3>
                                            </div>
                                            <div
                                                className="prose max-w-none prose-slate"
                                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                                            />
                                        </div>

                                        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Campos dinamicos disponibles</p>
                                            <div className="mt-4 space-y-3">
                                                {variableCatalog.map((item) => (
                                                    <div key={item.token} className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-white px-4 py-3">
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
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
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
                                        {processing ? 'Saving...' : 'Save contract'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />
        </label>
    );
}
