import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';
import { FlaskConical } from 'lucide-react';

const TestCard = ({ title, description, onClick }) => (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        <button
            type="button"
            onClick={onClick}
            className="mt-6 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
        >
            Ejecutar prueba
        </button>
    </div>
);

export default function Tests() {
    const { flash } = usePage().props;

    const runTest = (service) => {
        router.post(`/admin/settings/test/${service}`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title="Centro de pruebas" />

                <div>
                    <Link href="/admin/settings" className="text-sm text-slate-500 hover:text-slate-900">Volver a configuracion</Link>
                    <h1 className="mt-4 text-3xl font-semibold text-slate-900">Centro de pruebas</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                        Esta vista esta dedicada por completo a validar conectividad y configuracion de SMTP, Alanube, Tilopay y Cloudflare R2.
                    </p>
                </div>

                <SettingsNavigation />

                {flash?.integration_test && (
                    <div className={`rounded-2xl px-5 py-4 text-sm ${flash.integration_test.ok ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-700'}`}>
                        <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.18em]">{flash.integration_test.service}</span>
                        {flash.integration_test.message}
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <TestCard
                        title="SMTP"
                        description="Envia un correo de prueba al usuario autenticado o al from address configurado."
                        onClick={() => runTest('smtp')}
                    />
                    <TestCard
                        title="Alanube"
                        description="Valida la URL y el token cargado para facturacion electronica."
                        onClick={() => runTest('alanube')}
                    />
                    <TestCard
                        title="Tilopay"
                        description="Revisa si las credenciales necesarias ya estan registradas en el sistema."
                        onClick={() => runTest('tilopay')}
                    />
                    <TestCard
                        title="Cloudflare R2"
                        description="Sube y elimina un archivo temporal para confirmar acceso al bucket."
                        onClick={() => runTest('cloudflare')}
                    />
                    <TestCard
                        title="Cloudflare SaaS"
                        description="Valida la conectividad con la API de Cloudflare para Custom Hostnames."
                        onClick={() => runTest('cloudflare_saas')}
                    />
                    <TestCard
                        title="PayPal"
                        description="Intenta obtener un Access Token de la plataforma PayPal para validar credenciales."
                        onClick={() => runTest('paypal')}
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
