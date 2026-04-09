import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { CreditCard, FlaskConical, Palette, PlugZap } from 'lucide-react';
import { clsx } from 'clsx';

const items = [
    { href: '/admin/settings/integrations', label: 'Integraciones', helper: 'R2, Alanube, pagos y SMTP', icon: PlugZap },
    { href: '/admin/settings/billing', label: 'Facturacion', helper: 'ITBMS, Alanube y disponibilidad', icon: CreditCard },
    { href: '/admin/settings/branding', label: 'Branding', helper: 'Nombre, logo, favicon y watermark', icon: Palette },
    { href: '/admin/settings/tests', label: 'Centro de pruebas', helper: 'Valida conexiones y servicios', icon: FlaskConical },
];

export default function SettingsNavigation() {
    const { url } = usePage();

    return (
        <div className="grid gap-3 lg:grid-cols-4">
            {items.map(({ href, label, helper, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className={clsx(
                        'rounded-[1.5rem] border p-4 transition shadow-sm',
                        url.startsWith(href)
                            ? 'border-[#171411] bg-[#171411] text-white'
                            : 'border-[#e6e0d5] bg-white text-slate-700 hover:-translate-y-0.5 hover:shadow-md'
                    )}
                >
                    <div className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl', url.startsWith(href) ? 'bg-white/10' : 'bg-[#f4efe7]')}>
                        <Icon className={clsx('h-5 w-5', url.startsWith(href) ? 'text-white' : 'text-slate-700')} />
                    </div>
                    <p className="mt-4 text-sm font-semibold">{label}</p>
                    <p className={clsx('mt-1 text-xs leading-5', url.startsWith(href) ? 'text-white/70' : 'text-slate-500')}>{helper}</p>
                </Link>
            ))}
        </div>
    );
}
