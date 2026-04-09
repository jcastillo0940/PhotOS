import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SettingsNavigation from '@/Pages/Admin/Settings/Partials/SettingsNavigation';

export default function Index() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title="Configuracion" />

                <section className="rounded-[2rem] border border-[#e4ddd2] bg-white p-7 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Configuracion</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Un centro de control mas claro para marca, integraciones y facturacion.</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                        En vez de apilar bloques sueltos, ahora la configuracion se divide por responsabilidad para que cada ajuste tenga contexto propio y sea mas facil de mantener.
                    </p>
                </section>

                <SettingsNavigation />
            </div>
        </AdminLayout>
    );
}
