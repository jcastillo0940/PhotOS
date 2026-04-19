import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';
import { ImageIcon, Save, Sparkles, Stamp, Type, ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { Card, Input, Button, Badge } from '@/Components/UI';

const FilePreview = ({ label, currentPath, onChange, icon: Icon }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{label}</label>
        <div className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-primary/20">
            <input
                type="file"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 group-hover:text-primary transition-all">
                    {currentPath ? (
                        <div className="h-full w-full p-1"><img src={`/storage/${currentPath}`} className="h-full w-full object-contain" /></div>
                    ) : (
                        <Icon className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800">Subir archivo</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Formatos: PNG, JPG, SVG o WEBP</p>
                </div>
                {currentPath && <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />}
            </div>
        </div>
    </div>
);

export default function Branding({ settings }) {
    const { data, setData, post, processing } = useForm({
        app_name: settings?.app_name?.value || 'PhotOS',
        app_tagline: settings?.app_tagline?.value || '',
        photographer_document: settings?.photographer_document?.value || '',
        legal_city: settings?.legal_city?.value || '',
        jurisdiction_country: settings?.jurisdiction_country?.value || '',
        platform_watermark_label: settings?.platform_watermark_label?.value || '',
        event_types: settings?.event_types?.value || '',
        ai_sports_mode_enabled: settings?.ai_sports_mode_enabled?.value === '1',
        app_logo: null,
        app_favicon: null,
        photographer_watermark: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/settings/branding', { forceFormData: true });
    };

    return (
        <AdminLayout>
            <Head title="Ajustes de Branding" />

            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <Link href="/admin/settings" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
                            <ArrowLeft className="h-3.5 w-3.5" /> Volver a Ajustes
                        </Link>
                        <h2 className="mt-2 text-2xl font-black text-slate-800 tracking-tight">Identidad del Estudio</h2>
                        <p className="text-sm font-medium text-slate-500">Define cómo se proyecta tu marca ante los clientes.</p>
                    </div>
                    <Button onClick={submit} loading={processing} icon={Save}>
                        Guardar Cambios
                    </Button>
                </div>

                <SettingsNavigation />

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Identity Section */}
                        <Card title="Identidad de Marca" subtitle="Personaliza el nombre y eslogan del estudio">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <Input 
                                    label="Nombre comercial" 
                                    icon={Type}
                                    value={data.app_name} 
                                    onChange={v => setData('app_name', v.target.value)}
                                    placeholder="Ej. Raw Pixel Studio"
                                />
                                <Input 
                                    label="Tagline / Eslogan" 
                                    value={data.app_tagline} 
                                    onChange={v => setData('app_tagline', v.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>
                        </Card>

                        {/* Legal Data Section */}
                        <Card title="Presencia Legal" subtitle="Información para contratos y facturación">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <Input 
                                    label="Documento Fotógrafo" 
                                    icon={Stamp}
                                    value={data.photographer_document} 
                                    onChange={v => setData('photographer_document', v.target.value)}
                                    placeholder="RUC, Cédula o ID"
                                />
                                <Input 
                                    label="Ciudad Legal" 
                                    value={data.legal_city} 
                                    onChange={v => setData('legal_city', v.target.value)}
                                />
                                <Input 
                                    label="País / Jurisdicción" 
                                    value={data.jurisdiction_country} 
                                    onChange={v => setData('jurisdiction_country', v.target.value)}
                                />
                                <Input 
                                    label="Etiqueta Watermark" 
                                    value={data.platform_watermark_label} 
                                    onChange={v => setData('platform_watermark_label', v.target.value)}
                                    placeholder="Texto para marca de agua"
                                />
                            </div>
                            <div className="mt-6 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipos de Evento Admitidos</label>
                                <textarea
                                    rows={5}
                                    value={data.event_types}
                                    onChange={(e) => setData('event_types', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-primary focus:bg-white transition-all"
                                    placeholder={`Bodas\nQuinceaños\nSesiones`}
                                />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Un tipo por línea.</p>
                            </div>
                        </Card>

                        {/* IA & Special Features */}
                        <Card noPadding title="Configuración de IA Booth" subtitle="Experiencia inteligente personalizada">
                            <div className="p-6">
                                <div className="flex items-start justify-between gap-6 p-6 rounded-[1.5rem] border border-slate-100 bg-slate-50/50 transition-all hover:bg-white hover:border-primary/20 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="primary">IA Enhanced</Badge>
                                            <p className="text-sm font-black text-slate-800">Modo Deportivo (AI Sports)</p>
                                        </div>
                                        <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">
                                            Optimiza el reconocimiento para dorsales, uniformes y entrega inmediata en eventos atléticos.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                                        <input 
                                            type="checkbox" 
                                            checked={!!data.ai_sports_mode_enabled}
                                            onChange={e => setData('ai_sports_mode_enabled', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* Files Section */}
                        <Card title="Recursos Visuales" subtitle="Dimensiones recomendadas">
                            <div className="space-y-6">
                                <FilePreview 
                                    label="Logo Principal" 
                                    icon={ImageIcon} 
                                    currentPath={settings?.app_logo_path?.value}
                                    onChange={file => setData('app_logo', file)}
                                />
                                <FilePreview 
                                    label="Favicon (Icono de pestaña)" 
                                    icon={Upload} 
                                    currentPath={settings?.app_favicon_path?.value}
                                    onChange={file => setData('app_favicon', file)}
                                />
                                <FilePreview 
                                    label="Watermark de Imagen" 
                                    icon={Stamp} 
                                    currentPath={settings?.photographer_watermark_path?.value}
                                    onChange={file => setData('photographer_watermark', file)}
                                />
                            </div>
                        </Card>

                        {/* Tips Card */}
                        <Card className="bg-slate-900 border-none text-white shadow-2xl shadow-slate-900/20" title="Tips de Branding">
                             <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-5 w-5 shrink-0 rounded bg-white/10 flex items-center justify-center text-[10px] font-black italic">!</div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">Utiliza archivos <span className="text-white font-bold">SVG</span> para el logo para asegurar máxima nitidez en todas las pantallas.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-5 w-5 shrink-0 rounded bg-white/10 flex items-center justify-center text-[10px] font-black italic">!</div>
                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">El watermark debe tener baja opacidad y transparencia <span className="text-white font-bold">(PNG-24)</span>.</p>
                                </div>
                             </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
