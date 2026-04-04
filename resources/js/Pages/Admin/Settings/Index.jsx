import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Cloud, CreditCard, Shield, CheckCircle2, Eye, EyeOff, Save, RotateCcw, Landmark, Mail,
} from 'lucide-react';

const SettingGroup = ({ title, subtitle, icon: Icon, children }) => (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 h-full">
        <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-slate-800">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            </div>
        </div>
        <div className="space-y-5">{children}</div>
    </div>
);

const SettingField = ({ label, value, onChange, isSecret = false, placeholder }) => {
    const [visible, setVisible] = React.useState(!isSecret);
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {label.replace(/_/g, ' ')}
            </label>
            <div className="relative">
                <input
                    type={visible ? 'text' : 'password'}
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all"
                />
                {isSecret && (
                    <button type="button" onClick={() => setVisible(!visible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-all">
                        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    );
};

const ToggleField = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
        <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                {label}
            </label>
            {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${checked ? 'bg-primary-500' : 'bg-slate-300'}`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);

const IntegrationProbeCard = ({ title, description, onClick }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        <button
            type="button"
            onClick={onClick}
            className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
        >
            Probar
        </button>
    </div>
);

export default function Index({ settings }) {
    const { flash } = usePage().props;
    const flatSettings = Object.values(settings).flat().map(s => ({ key: s.key, value: s.value ?? '' }));
    const { data, setData, put, processing, reset } = useForm({ settings: flatSettings, photographer_watermark: null });

    const updateValue = (key, val) => {
        setData('settings', data.settings.map(s => s.key === key ? { ...s, value: val } : s));
    };

    const getValue = (key, fallback = '') => data.settings.find(d => d.key === key)?.value ?? fallback;
    const getBoolean = (key, fallback = false) => ['1', 'true', true, 1].includes(getValue(key, fallback ? '1' : '0'));

    const submit = (e) => {
        e.preventDefault();
        put('/admin/settings', { forceFormData: true });
    };

    const runTest = (service) => {
        router.post(`/admin/settings/test/${service}`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <form onSubmit={submit} className="flex flex-col space-y-8">
                <Head title="Configuración" />

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">Configuración</h1>
                        <p className="text-sm text-slate-500">Integrations, almacenamiento y pasarelas de pago</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/settings/branding"
                            className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            Branding
                        </Link>
                        <button type="button" onClick={() => reset()}
                            className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5">
                            <RotateCcw className="w-3.5 h-3.5" /> Restablecer
                        </button>
                        <button disabled={processing}
                            className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium shadow-sm active:scale-95 transition-all flex items-center gap-1.5">
                            <Save className={processing ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                            {processing ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SettingGroup title="Almacenamiento" subtitle="Integración Cloudflare R2" icon={Cloud}>
                        {settings.storage?.map(s => (
                            <SettingField key={s.key} label={s.key}
                                value={data.settings.find(d => d.key === s.key)?.value}
                                onChange={(v) => updateValue(s.key, v)}
                                isSecret={s.is_secret}
                                placeholder={s.key === 'r2_endpoint' ? 'https://<account_id>.r2.cloudflarestorage.com' : ''}
                            />
                        ))}
                    </SettingGroup>

                    <SettingGroup title="Pagos" subtitle="Pasarelas de pago" icon={CreditCard}>
                        {settings.payment?.map(s => (
                            <SettingField key={s.key} label={s.key}
                                value={data.settings.find(d => d.key === s.key)?.value}
                                onChange={(v) => updateValue(s.key, v)}
                                isSecret={s.is_secret}
                            />
                        ))}
                    </SettingGroup>

                    <SettingGroup title="Facturacion" subtitle="ITBMS configurable por sistema" icon={Landmark}>
                        <ToggleField
                            label="ITBMS global"
                            description="Define si las nuevas facturas aplican 7% por defecto."
                            checked={getBoolean('tax_itbms_enabled', true)}
                            onChange={(next) => updateValue('tax_itbms_enabled', next ? '1' : '0')}
                        />
                        <SettingField
                            label="tax_itbms_rate"
                            value={getValue('tax_itbms_rate', '7')}
                            onChange={(v) => updateValue('tax_itbms_rate', v)}
                            placeholder="7"
                        />
                    </SettingGroup>

                    <SettingGroup title="Alanube" subtitle="Facturacion electronica opcional Panama" icon={Shield}>
                        <ToggleField
                            label="Facturacion electronica"
                            description="Activa Alanube como servicio disponible para facturas nuevas."
                            checked={getBoolean('alanube_enabled', false)}
                            onChange={(next) => updateValue('alanube_enabled', next ? '1' : '0')}
                        />
                        <SettingField
                            label="alanube_email"
                            value={getValue('alanube_email', '')}
                            onChange={(v) => updateValue('alanube_email', v)}
                            placeholder="usuario sandbox o reseller"
                        />
                        <SettingField
                            label="alanube_api_url"
                            value={getValue('alanube_api_url', '')}
                            onChange={(v) => updateValue('alanube_api_url', v)}
                            placeholder="https://sandbox-api.alanube.co/pan/v1"
                        />
                        <SettingField
                            label="alanube_api_key"
                            value={getValue('alanube_api_key', '')}
                            onChange={(v) => updateValue('alanube_api_key', v)}
                            isSecret
                            placeholder="JWT token"
                        />
                    </SettingGroup>

                    <SettingGroup title="SMTP" subtitle="Correos transaccionales para briefing y NPS" icon={Mail}>
                        <ToggleField
                            label="SMTP activo"
                            description="Si esta encendido, el sistema enviara correos reales desde tu servidor SMTP."
                            checked={getBoolean('smtp_enabled', false)}
                            onChange={(next) => updateValue('smtp_enabled', next ? '1' : '0')}
                        />
                        {settings.smtp?.filter(s => s.key !== 'smtp_enabled').map(s => (
                            <SettingField key={s.key} label={s.key}
                                value={data.settings.find(d => d.key === s.key)?.value}
                                onChange={(v) => updateValue(s.key, v)}
                                isSecret={s.is_secret}
                            />
                        ))}
                    </SettingGroup>

                    <SettingGroup title="Marca/Watermark" subtitle="Marca de agua para versiones web" icon={Shield}>
                        {settings.branding?.filter(s => s.key === 'platform_watermark_label').map(s => (
                            <SettingField key={s.key} label={s.key}
                                value={data.settings.find(d => d.key === s.key)?.value}
                                onChange={(v) => updateValue(s.key, v)}
                            />
                        ))}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                Archivo de watermark
                            </label>
                            <input type="file" accept="image/png,image/webp"
                                onChange={e => setData('photographer_watermark', e.target.files?.[0] || null)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none"
                            />
                            <p className="text-xs text-slate-400">PNG o WEBP con transparencia</p>
                            {!!settings.branding?.find(s => s.key === 'photographer_watermark_path')?.value && (
                                <p className="text-xs text-slate-500">
                                    Actual: {settings.branding.find(s => s.key === 'photographer_watermark_path')?.value}
                                </p>
                            )}
                        </div>
                    </SettingGroup>

                    <SettingGroup title="Datos legales" subtitle="Base para contratos dinamicos" icon={Landmark}>
                        {settings.legal?.map(s => (
                            <SettingField key={s.key} label={s.key}
                                value={data.settings.find(d => d.key === s.key)?.value}
                                onChange={(v) => updateValue(s.key, v)}
                                isSecret={s.is_secret}
                            />
                        ))}
                    </SettingGroup>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between gap-6 flex-wrap">
                        <div>
                            <h3 className="font-bold text-slate-800">Centro de pruebas</h3>
                            <p className="text-sm text-slate-500 mt-1">Valida conectividad y configuracion de SMTP, Alanube, Tilopay y Cloudflare R2.</p>
                        </div>
                        {flash?.integration_test && (
                            <div className={`rounded-2xl px-4 py-3 text-sm ${flash.integration_test.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                <span className="font-semibold uppercase tracking-[0.18em] text-[11px] mr-2">{flash.integration_test.service}</span>
                                {flash.integration_test.message}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mt-8">
                        <IntegrationProbeCard
                            title="SMTP"
                            description="Envia un correo de prueba al usuario autenticado o al from address."
                            onClick={() => runTest('smtp')}
                        />
                        <IntegrationProbeCard
                            title="Alanube"
                            description="Valida el token y la API URL configurada para facturacion electronica."
                            onClick={() => runTest('alanube')}
                        />
                        <IntegrationProbeCard
                            title="Tilopay"
                            description="Revisa si las credenciales necesarias ya estan cargadas en el sistema."
                            onClick={() => runTest('tilopay')}
                        />
                        <IntegrationProbeCard
                            title="Cloudflare R2"
                            description="Sube y elimina un archivo temporal para confirmar acceso al bucket."
                            onClick={() => runTest('cloudflare')}
                        />
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-500">
                        <Shield className="w-8 h-8 text-slate-300" />
                        <div>
                            <p className="font-semibold text-sm text-slate-700">Configuración operativa protegida</p>
                            <p className="text-xs text-slate-500 mt-0.5">Los planes y plantillas se administran en la consola developer. Aquí solo viven storage y pasarelas.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xs font-semibold">Listo</span>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
