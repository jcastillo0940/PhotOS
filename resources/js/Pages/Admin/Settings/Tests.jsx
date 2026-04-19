import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, FlaskConical, LoaderCircle } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';

const serviceLabels = {
    smtp: 'SMTP',
    alanube: 'Alanube',
    tilopay: 'Tilopay',
    cloudflare: 'Cloudflare R2',
    cloudflare_saas: 'Cloudflare SaaS',
    paypal: 'PayPal',
};

const TestCard = ({ title, description, onClick, busy = false, lastRun = null }) => (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
            {lastRun && (
                <span
                    className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]',
                        lastRun.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    )}
                >
                    {lastRun.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {lastRun.ok ? 'OK' : 'Fallo'}
                </span>
            )}
        </div>
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        <button
            type="button"
            disabled={busy}
            onClick={onClick}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
            {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
            {busy ? 'Ejecutando...' : 'Ejecutar prueba'}
        </button>
    </div>
);

export default function Tests() {
    const { flash } = usePage().props;
    const [activeService, setActiveService] = React.useState(null);

    const latestResult = flash?.integration_test ?? null;

    const runTest = (service) => {
        router.post(`/admin/settings/test/${service}`, {}, {
            preserveScroll: true,
            onStart: () => setActiveService(service),
            onFinish: () => setActiveService(null),
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title="Centro de pruebas" />

                <div>
                    <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-900">Volver a configuracion</Link>
                    <h1 className="mt-4 text-3xl font-semibold text-slate-900">Centro de pruebas</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                        Esta vista ejecuta pruebas reales contra SMTP, Alanube, Tilopay, PayPal y Cloudflare. Cada boton deja el ultimo resultado visible para que no quede duda si paso o si fallo.
                    </p>
                </div>

                <SettingsNavigation />

                <section className="grid gap-4 lg:grid-cols-[1.5fr,1fr]">
                    <div
                        className={clsx(
                            'rounded-[1.8rem] border px-5 py-5 shadow-sm transition-all',
                            latestResult
                                ? latestResult.ok
                                    ? 'border-emerald-200 bg-emerald-50/80'
                                    : 'border-rose-200 bg-rose-50/80'
                                : 'border-slate-200 bg-white'
                        )}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={clsx(
                                    'flex h-11 w-11 items-center justify-center rounded-2xl',
                                    latestResult
                                        ? latestResult.ok
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-rose-100 text-rose-700'
                                        : 'bg-slate-100 text-slate-500'
                                )}
                            >
                                {latestResult ? (
                                    latestResult.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />
                                ) : (
                                    <FlaskConical className="h-5 w-5" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ultimo resultado</p>
                                <p className="mt-2 text-lg font-semibold text-slate-900">
                                    {latestResult ? serviceLabels[latestResult.service] ?? latestResult.service : 'Aun no se ha ejecutado ninguna prueba'}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {latestResult ? latestResult.message : 'Al ejecutar una prueba veras aqui si el servicio respondio bien, si falta una credencial o si ocurrio un error tecnico.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Como leer esta pantalla</p>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <p><span className="font-semibold text-emerald-700">OK:</span> la integracion respondio correctamente.</p>
                            <p><span className="font-semibold text-rose-700">Fallo:</span> falta una credencial o el servicio rechazo la conexion.</p>
                            <p><span className="font-semibold text-slate-900">Ejecutando:</span> el boton queda cargando hasta que regresa el resultado.</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <TestCard
                        title="SMTP"
                        description="Envia un correo de prueba al usuario autenticado o al from address configurado."
                        onClick={() => runTest('smtp')}
                        busy={activeService === 'smtp'}
                        lastRun={latestResult?.service === 'smtp' ? latestResult : null}
                    />
                    <TestCard
                        title="Alanube"
                        description="Valida la URL y el token cargado para facturacion electronica."
                        onClick={() => runTest('alanube')}
                        busy={activeService === 'alanube'}
                        lastRun={latestResult?.service === 'alanube' ? latestResult : null}
                    />
                    <TestCard
                        title="Tilopay"
                        description="Revisa si las credenciales necesarias ya estan registradas en el sistema."
                        onClick={() => runTest('tilopay')}
                        busy={activeService === 'tilopay'}
                        lastRun={latestResult?.service === 'tilopay' ? latestResult : null}
                    />
                    <TestCard
                        title="Cloudflare R2"
                        description="Sube y elimina un archivo temporal para confirmar acceso al bucket."
                        onClick={() => runTest('cloudflare')}
                        busy={activeService === 'cloudflare'}
                        lastRun={latestResult?.service === 'cloudflare' ? latestResult : null}
                    />
                    <TestCard
                        title="Cloudflare SaaS"
                        description="Valida la conectividad con la API de Cloudflare para Custom Hostnames."
                        onClick={() => runTest('cloudflare_saas')}
                        busy={activeService === 'cloudflare_saas'}
                        lastRun={latestResult?.service === 'cloudflare_saas' ? latestResult : null}
                    />
                    <TestCard
                        title="PayPal"
                        description="Intenta obtener un Access Token de la plataforma PayPal para validar credenciales."
                        onClick={() => runTest('paypal')}
                        busy={activeService === 'paypal'}
                        lastRun={latestResult?.service === 'paypal' ? latestResult : null}
                    />
                </div>

                <section className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700">
                            <FlaskConical className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Consejo operativo</h2>
                            <p className="text-sm text-slate-500">Primero guarda tus credenciales en Integraciones y luego vuelve aqui para ejecutar las pruebas.</p>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
