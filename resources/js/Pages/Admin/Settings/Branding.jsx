import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeft, ImageIcon, Save } from 'lucide-react';

export default function Branding({ settings }) {
    const { data, setData, post, processing } = useForm({
        app_name: settings?.app_name?.value || 'PhotOS',
        app_tagline: settings?.app_tagline?.value || '',
        app_logo: null,
        app_favicon: null,
    });

    return (
        <AdminLayout>
            <Head title="Branding" />

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/admin/settings" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="h-4 w-4" />
                            Volver a configuracion
                        </Link>
                        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Branding de la aplicacion</h1>
                        <p className="mt-2 text-sm text-slate-500">Personaliza nombre, logo y favicon para cada instalacion.</p>
                    </div>
                </div>

                <form onSubmit={(event) => {
                    event.preventDefault();
                    post('/admin/settings/branding', { forceFormData: true });
                }} className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-5">
                        <Field
                            label="Nombre de la aplicacion"
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

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Guardando...' : 'Guardar branding'}
                        </button>
                    </section>

                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <ImageIcon className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-900">Vista previa</h2>
                        </div>

                        <div className="mt-8 rounded-[1.8rem] border border-slate-200 bg-slate-50 p-6">
                            <div className="flex items-center gap-4">
                                {settings?.app_logo_path?.value ? (
                                    <img src={`/storage/${settings.app_logo_path.value}`} alt="Logo actual" className="h-12 w-12 rounded-2xl object-cover" />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                                        <ImageIcon className="h-5 w-5" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">{data.app_name || 'PhotOS'}</p>
                                    <p className="text-sm text-slate-500">{data.app_tagline || 'Admin platform'}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </form>
            </div>
        </AdminLayout>
    );
}

function Field({ label, value, onChange, placeholder }) {
    return (
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
}

function UploadField({ label, helper, current, onChange }) {
    return (
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
}
