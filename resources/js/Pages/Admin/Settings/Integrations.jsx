import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';
import { Cloud, CreditCard, Eye, EyeOff, Mail, Save, Shield } from 'lucide-react';

const Section = ({ title, subtitle, icon: Icon, children }) => (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h2 className="font-semibold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
        </div>
        <div className="space-y-5">{children}</div>
    </section>
);

const Field = ({ label, value, onChange, isSecret = false, placeholder }) => {
    const [visible, setVisible] = React.useState(!isSecret);

    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label.replace(/_/g, ' ')}</label>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    autoComplete={isSecret ? 'off' : undefined}
                    value={value || ''}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
                />
                {isSecret && (
                    <button type="button" onClick={() => setVisible(!visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default function Integrations({ settings }) {
    const flatSettings = Object.values(settings).flat().map((s) => ({ key: s.key, value: s.value ?? '' }));
    const { data, setData, put, processing } = useForm({ settings: flatSettings });

    const updateValue = (key, value) => {
        setData('settings', data.settings.map((item) => item.key === key ? { ...item, value } : item));
    };

    const valueFor = (key, fallback = '') => data.settings.find((item) => item.key === key)?.value ?? fallback;

    return (
        <AdminLayout>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    put('/admin/settings/integrations');
                }}
                className="space-y-8"
            >
                <Head title="Integraciones" />

                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div>
                        <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-900">Volver a configuracion</Link>
                        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Integraciones</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                            Credenciales, almacenamiento y correo del sistema en una vista operativa separada.
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                    >
                        <Save className="h-4 w-4" />
                        {processing ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>

                <SettingsNavigation />

                <div className="grid gap-6 xl:grid-cols-2">
                    <Section title="Cloudflare R2" subtitle="Almacenamiento seguro de galerias y originales" icon={Cloud}>
                        {settings.storage?.map((setting) => (
                            <Field
                                key={setting.key}
                                label={setting.key}
                                value={valueFor(setting.key)}
                                onChange={(value) => updateValue(setting.key, value)}
                                isSecret={setting.is_secret}
                                placeholder={setting.key === 'r2_endpoint' ? 'https://<account_id>.r2.cloudflarestorage.com' : ''}
                            />
                        ))}
                    </Section>

                    <Section title="Pagos" subtitle="Credenciales para PayPal y Tilopay" icon={CreditCard}>
                        {settings.payment?.map((setting) => (
                            <Field
                                key={setting.key}
                                label={setting.key}
                                value={valueFor(setting.key)}
                                onChange={(value) => updateValue(setting.key, value)}
                                isSecret={setting.is_secret}
                            />
                        ))}
                    </Section>

                    <Section title="Alanube" subtitle="API y credenciales de facturacion electronica" icon={Shield}>
                        {settings.einvoice?.filter((setting) => setting.key !== 'alanube_enabled').map((setting) => (
                            <Field
                                key={setting.key}
                                label={setting.key}
                                value={valueFor(setting.key)}
                                onChange={(value) => updateValue(setting.key, value)}
                                isSecret={setting.is_secret}
                            />
                        ))}
                    </Section>

                    <Section title="SMTP" subtitle="Servidor de correo para flujos transaccionales" icon={Mail}>
                        {settings.smtp?.map((setting) => (
                            <Field
                                key={setting.key}
                                label={setting.key}
                                value={valueFor(setting.key)}
                                onChange={(value) => updateValue(setting.key, value)}
                                isSecret={setting.is_secret}
                            />
                        ))}
                    </Section>
                </div>
            </form>
        </AdminLayout>
    );
}
