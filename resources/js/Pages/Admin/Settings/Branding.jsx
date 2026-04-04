import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';
import { ImageIcon, Save, Stamp, Type } from 'lucide-react';

const Field = ({ label, value, onChange, placeholder }) => (
    <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        />
    </div>
);

const UploadField = ({ label, helper, current, onChange }) => (
    <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
        <input
            type="file"
            onChange={(event) => onChange(event.target.files?.[0] || null)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        />
        <p className="text-xs text-slate-400">{helper}</p>
        {current && <p className="text-xs text-slate-500">Actual: {current}</p>}
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
        app_logo: null,
        app_favicon: null,
        photographer_watermark: null,
    });

    return (
        <AdminLayout>
            <Head title="Branding" />

            <div className="space-y-8">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div>
                        <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-900">Volver a configuracion</Link>
                        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Branding y datos del fotografo</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                            Nombre del estudio, identidad visual y datos legales del fotografo en una sola pantalla.
                        </p>
                    </div>
                </div>

                <SettingsNavigation />

                <form onSubmit={(event) => {
                    event.preventDefault();
                    post('/admin/settings/branding', { forceFormData: true });
                }} className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
                    <div className="space-y-8">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-5">
                            <div className="flex items-center gap-3">
                                <Type className="h-5 w-5 text-slate-400" />
                                <h2 className="text-lg font-semibold text-slate-900">Identidad principal</h2>
                            </div>

                            <Field
                                label="Nombre del estudio"
                                value={data.app_name}
                                onChange={(value) => setData('app_name', value)}
                                placeholder="Nombre de la instalacion"
                            />
                            <Field
                                label="Tagline"
                                value={data.app_tagline}
                                onChange={(value) => setData('app_tagline', value)}
                                placeholder="Texto corto opcional"
                            />
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-5">
                            <div className="flex items-center gap-3">
                                <Stamp className="h-5 w-5 text-slate-400" />
                                <h2 className="text-lg font-semibold text-slate-900">Datos legales</h2>
                            </div>

                            <Field
                                label="Documento del fotografo"
                                value={data.photographer_document}
                                onChange={(value) => setData('photographer_document', value)}
                                placeholder="RUC, cedula o identificacion"
                            />
                            <Field
                                label="Ciudad legal"
                                value={data.legal_city}
                                onChange={(value) => setData('legal_city', value)}
                                placeholder="Ciudad"
                            />
                            <Field
                                label="Pais / jurisdiccion"
                                value={data.jurisdiction_country}
                                onChange={(value) => setData('jurisdiction_country', value)}
                                placeholder="Pais"
                            />
                            <Field
                                label="Texto de watermark"
                                value={data.platform_watermark_label}
                                onChange={(value) => setData('platform_watermark_label', value)}
                                placeholder="Texto corto para watermark"
                            />
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tipos de evento</label>
                                <textarea
                                    rows={7}
                                    value={data.event_types}
                                    onChange={(event) => setData('event_types', event.target.value)}
                                    placeholder={`Bodas\nQuinceaños\nSesiones\nEmpresarial`}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                                />
                                <p className="text-xs text-slate-400">Escribe un tipo por linea. Esta lista se usa en el lead manual y en el formulario publico.</p>
                            </div>
                        </section>
                    </div>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-5">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900">Archivos visuales</h2>
                        </div>

                        <UploadField
                            label="Logo"
                            helper="PNG, JPG, WEBP o SVG"
                            current={settings?.app_logo_path?.value}
                            onChange={(file) => setData('app_logo', file)}
                        />
                        <UploadField
                            label="Favicon"
                            helper="PNG, ICO, SVG o WEBP"
                            current={settings?.app_favicon_path?.value}
                            onChange={(file) => setData('app_favicon', file)}
                        />
                        <UploadField
                            label="Watermark del fotografo"
                            helper="PNG o WEBP con transparencia"
                            current={settings?.photographer_watermark_path?.value}
                            onChange={(file) => setData('photographer_watermark', file)}
                        />

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Guardando...' : 'Guardar branding'}
                        </button>
                    </section>
                </form>
            </div>
        </AdminLayout>
    );
}
