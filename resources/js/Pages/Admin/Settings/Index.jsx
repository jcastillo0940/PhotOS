import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CreditCard, FlaskConical, Palette, PlugZap } from 'lucide-react';

const cards = [
    {
        href: '/admin/settings/integrations',
        title: 'Integraciones',
        description: 'Cloudflare R2, PayPal, Tilopay, Alanube y SMTP.',
        icon: PlugZap,
    },
    {
        href: '/admin/settings/billing',
        title: 'Facturacion',
        description: 'ITBMS global, tasa de impuesto y activacion de factura electronica.',
        icon: CreditCard,
    },
    {
        href: '/admin/settings/branding',
        title: 'Branding',
        description: 'Nombre del estudio, datos legales, logo, favicon y watermark.',
        icon: Palette,
    },
    {
        href: '/admin/settings/tests',
        title: 'Centro de pruebas',
        description: 'Valida conectividad y configuracion de SMTP, Alanube, Tilopay y Cloudflare R2.',
        icon: FlaskConical,
    },
];

export default function Index() {
    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title="Configuracion" />

                <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Configuracion</p>
                    <h1 className="mt-3 text-3xl font-semibold text-slate-900">Centro de ajustes</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                        La configuracion ahora esta dividida en vistas separadas para que cada bloque tenga su propio espacio operativo.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
                    {cards.map(({ href, title, description, icon: Icon }) => (
                        <Link key={href} href={href} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                                <Icon className="h-6 w-6" />
                            </div>
                            <h2 className="mt-6 text-xl font-semibold text-slate-900">{title}</h2>
                            <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
                            <span className="mt-6 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                Configurar
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
