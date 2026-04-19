import React, { useMemo, useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Copy, 
    ExternalLink, 
    Eye, 
    FileText, 
    Save, 
    Sparkles, 
    ChevronLeft, 
    Code, 
    Layout, 
    Info, 
    FileSignature,
    Printer,
    ArrowUpRight,
    Search,
    Type
} from 'lucide-react';
import { Card, Badge, Button, Input, Drawer } from '@/Components/UI';
import { clsx } from 'clsx';

export default function Index({ contracts, presets, variableCatalog }) {
    const { flash } = usePage().props;
    const [selectedId, setSelectedId] = useState(contracts[0]?.id ?? null);
    const [activeTab, setActiveTab] = useState('data');
    const [isVariableDrawerOpen, setIsVariableDrawerOpen] = useState(false);
    
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

    useEffect(() => {
        if (selected) {
            reset({
                content: selected.content || '',
                contract_data: selected.contract_data || {
                    city: '', location: '', photographer_business: '', photographer_document: '',
                    client_document: '', jurisdiction_country: '', balance_due_date: '',
                    reservation_amount: '', remaining_amount: '', privacy_fee: '',
                },
                status: selected.status || 'pending',
            });
        }
    }, [selectedId]);

    const previewHtml = useMemo(() => {
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

    const submit = (e) => {
        e.preventDefault();
        if (!selected) return;
        put(`/admin/contracts/${selected.id}`, { preserveScroll: true });
    };

    const updateContractData = (key, value) => {
        setData('contract_data', { ...(data.contract_data || {}), [key]: value });
    };

    const copyToken = async (token) => {
        await navigator.clipboard.writeText(token);
        // Toast logic could go here
    };

    return (
        <AdminLayout>
            <Head title="Contratos — Editor Maestro" />

            <div className="flex flex-col h-full space-y-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Contratos</h2>
                        <p className="text-sm font-medium text-slate-500">Legaliza tus sesiones con validez jurídica y firma digital.</p>
                    </div>
                    <div className="flex gap-3">
                         <Link href="/admin/leads">
                            <Button variant="outline" icon={ChevronLeft}>Ver Leads</Button>
                        </Link>
                        <Button onClick={submit} loading={processing} icon={Save}>Guardar Todo</Button>
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
                    {/* Left Sidebar: Contract List */}
                    <aside className="space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            <input 
                                placeholder="Buscar contrato..." 
                                className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3 text-sm font-medium text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            {contracts.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    className={clsx(
                                        'w-full flex items-start gap-4 p-5 rounded-[1.8rem] transition-all duration-300 text-left border group',
                                        selected?.id === c.id 
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1' 
                                            : 'bg-white border-slate-100 text-slate-900 hover:border-primary/20 hover:bg-primary/5 hover:translate-x-1'
                                    )}
                                >
                                    <div className={clsx(
                                        'mt-1 h-9 w-9 flex items-center justify-center rounded-xl shrink-0 transition-colors',
                                        selected?.id === c.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-primary/10'
                                    )}>
                                        <FileSignature className={clsx('h-4.5 w-4.5', selected?.id === c.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary')} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1">
                                            <Badge variant={selected?.id === c.id ? 'primary' : 'slate'} className="text-[8px] px-1.5 py-0">
                                                {c.status === 'signed' ? 'FIRMADO' : 'PENDIENTE'}
                                            </Badge>
                                            <span className={clsx('text-[10px] font-black', selected?.id === c.id ? 'text-white/40' : 'text-slate-300')}>
                                                #{c.id}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-sm tracking-tight mb-0.5 truncate uppercase">
                                            {c.project?.name || 'Contrato sin nombre'}
                                        </h3>
                                        <p className={clsx('text-xs font-medium truncate', selected?.id === c.id ? 'text-white/60' : 'text-slate-500')}>
                                            {c.project?.lead?.name || 'Prospecto desconocido'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content: Editor */}
                    <div className="space-y-6">
                        {!selected ? (
                            <Card className="flex flex-col items-center justify-center py-32 text-slate-400 bg-slate-50/50 border-dashed border-2">
                                <FileSignature className="h-16 w-16 mb-6 opacity-10" />
                                <h3 className="text-xl font-black tracking-tight leading-none uppercase italic">Selecciona un contrato para editar</h3>
                            </Card>
                        ) : (
                            <div className="grid gap-8 xl:grid-cols-[1fr_450px]">
                                <div className="space-y-6">
                                    {/* Editor Header / Tabs */}
                                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 items-center justify-between">
                                        <div className="flex gap-1.5">
                                            {[
                                                { id: 'data', label: 'Datos Legales', icon: Layout },
                                                { id: 'content', label: 'Cuerpo HTML', icon: Code },
                                            ].map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setActiveTab(t.id)}
                                                    className={clsx(
                                                        'px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all',
                                                        activeTab === t.id ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                    )}
                                                >
                                                    <t.icon className="h-3.5 w-3.5" /> {t.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-3 px-2">
                                            <Link href={`/admin/contracts/${selected.id}/print`} target="_blank">
                                                <button className="text-slate-400 hover:text-primary transition-colors p-1"><Printer className="h-4 w-4" /></button>
                                            </Link>
                                            <Link href={`/sign/${selected.token}`} target="_blank">
                                                <button className="text-slate-400 hover:text-primary transition-colors p-1"><ExternalLink className="h-4 w-4" /></button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Editor Content */}
                                    {activeTab === 'data' && (
                                        <div className="space-y-6">
                                            <Card title="Plantillas Base" subtitle="Aplica una estructura predefinida">
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {presets.map((p) => (
                                                        <button
                                                            key={p.key}
                                                            type="button"
                                                            onClick={() => setData('content', p.content)}
                                                            className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                                        >
                                                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 group-hover:bg-primary/10 transition-colors">
                                                                <Type className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{p.label}</p>
                                                                <p className="text-xs text-slate-500 font-medium line-clamp-1">{p.description}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </Card>

                                            <Card title="Detalles del Documento" subtitle="Variables específicas del contrato">
                                                <div className="grid gap-6 sm:grid-cols-2">
                                                    <Input label="Ciudad Legal" value={data.contract_data?.city || ''} onChange={v => updateContractData('city', v.target.value)} />
                                                    <Input label="País / Jurisdicción" value={data.contract_data?.jurisdiction_country || ''} onChange={v => updateContractData('jurisdiction_country', v.target.value)} />
                                                    <Input label="Lugar del Evento" value={data.contract_data?.location || ''} onChange={v => updateContractData('location', v.target.value)} />
                                                    <Input label="Nombre Comercial" value={data.contract_data?.photographer_business || ''} onChange={v => updateContractData('photographer_business', v.target.value)} />
                                                    <Input label="Doc. Fotógrafo" value={data.contract_data?.photographer_document || ''} onChange={v => updateContractData('photographer_document', v.target.value)} />
                                                    <Input label="Doc. Cliente" value={data.contract_data?.client_document || ''} onChange={v => updateContractData('client_document', v.target.value)} />
                                                    <Input label="Monto Reserva" type="number" value={data.contract_data?.reservation_amount || ''} onChange={v => updateContractData('reservation_amount', v.target.value)} />
                                                    <Input label="Saldo Restante" type="number" value={data.contract_data?.remaining_amount || ''} onChange={v => updateContractData('remaining_amount', v.target.value)} />
                                                </div>
                                            </Card>
                                        </div>
                                    )}

                                    {activeTab === 'content' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contenido HTML</label>
                                                <button 
                                                    onClick={() => setIsVariableDrawerOpen(true)}
                                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:underline hover:scale-105 transition-all"
                                                >
                                                    <Sparkles className="h-3 w-3" /> Insertar Variables
                                                </button>
                                            </div>
                                            <textarea
                                                rows={28}
                                                value={data.content}
                                                onChange={e => setData('content', e.target.value)}
                                                className="w-full rounded-[1.8rem] border border-slate-200 bg-slate-900 px-8 py-6 text-sm font-mono leading-7 text-white/80 outline-none focus:ring-4 focus:ring-primary/10 transition-all custom-scrollbar"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Preview Side */}
                                <div className="space-y-6">
                                    <div className="sticky top-6">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vista Previa Real-Time</label>
                                            <Badge variant="success" className="animate-pulse">Live</Badge>
                                        </div>
                                        <div className="bg-slate-200 rounded-[2.2rem] p-8 shadow-inner min-h-[700px] flex justify-center">
                                            <div className="w-full bg-white shadow-2xl p-10 prose prose-slate max-w-none prose-sm prose-headings:font-black prose-p:font-medium prose-p:leading-relaxed prose-strong:text-slate-900 border-t-[6px] border-primary">
                                                <div className="mb-10 border-b border-slate-100 pb-8 flex flex-col items-center text-center">
                                                    <FileSignature className="h-10 w-10 text-primary mb-4 opacity-20" />
                                                    <h3 className="uppercase tracking-[0.3em] font-black text-slate-400 text-xs mb-2">Acuerdo de Servicios</h3>
                                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase italic">Service Contract</h2>
                                                </div>
                                                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                            </div>
                                        </div>

                                        <Card className="mt-8 bg-primary border-none text-white shadow-xl shadow-primary/20 p-6 overflow-hidden">
                                            <div className="relative z-10">
                                                <Badge variant="white" className="mb-4 text-primary font-black uppercase tracking-widest text-[8px]">Propiedad Intelectual</Badge>
                                                <p className="text-xs font-bold leading-relaxed">
                                                    Este contrato incluye cláusulas de protección de derechos de autor y uso comercial optimizadas para fotógrafos premium.
                                                </p>
                                            </div>
                                            <Sparkles className="absolute -right-6 -bottom-6 h-24 w-24 text-white/10" />
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Variable Catalog Drawer */}
            <Drawer 
                isOpen={isVariableDrawerOpen} 
                onClose={() => setIsVariableDrawerOpen(false)} 
                title="Catálogo de Variables"
                subtitle="Copia y pega estas etiquetas en tu HTML"
            >
                <div className="space-y-3">
                    {variableCatalog.map((v) => (
                        <div key={v.token} className="p-4 rounded-2xl border border-slate-100 bg-white group hover:border-primary transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                                    {v.token}
                                </span>
                                <button 
                                    onClick={() => copyToken(v.token)}
                                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-all"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{v.label}</p>
                            <p className="text-xs text-slate-400 italic">Ejemplo: "{v.token.replace('[', '').replace(']', '')} actual"</p>
                        </div>
                    ))}
                </div>
            </Drawer>
        </AdminLayout>
    );
}
