import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { CreditCard, FlaskConical, Palette, PlugZap } from 'lucide-react';
import { clsx } from 'clsx';

const items = [
    { href: '/admin/settings/integrations', label: 'Integraciones', icon: PlugZap },
    { href: '/admin/settings/billing', label: 'Facturacion', icon: CreditCard },
    { href: '/admin/settings/branding', label: 'Branding', icon: Palette },
    { href: '/admin/settings/tests', label: 'Pruebas', icon: FlaskConical },
];

export default function SettingsNavigation() {
    const { url } = usePage();

    return (
        <div className="flex flex-wrap gap-3">
            {items.map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className={clsx(
                        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all',
                        url.startsWith(href)
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                    )}
                >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                </Link>
            ))}
        </div>
    );
}
