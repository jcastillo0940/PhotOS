import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';

export default function Index() {
    const { props } = usePage();
    const isSystemOwner = ['developer', 'owner'].includes(props.auth?.user?.role);

    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title="Configuracion" />

                <section className="rounded-[2rem] border border-[#e4ddd2] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Configuracion</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                        {isSystemOwner ? 'Centro de control global del SaaS.' : 'Branding y presencia visual del estudio.'}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                        {isSystemOwner
                            ? 'Aqui viven exclusivamente las integraciones globales, cobro, facturacion electronica y ajustes tecnicos de la plataforma.'
                            : 'Aqui el fotografo solo ajusta nombre, logo, favicon y elementos visuales sin tocar integraciones centrales del sistema.'}
                    </p>
                </section>

                <SettingsNavigation />
            </div>
        </AdminLayout>
    );
}
