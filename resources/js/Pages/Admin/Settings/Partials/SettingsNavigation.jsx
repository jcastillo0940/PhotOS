import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { CreditCard, FlaskConical, Palette, PlugZap, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const items = [
    { href: '/admin/settings/branding', label: 'Estudio & Branding', helper: 'Logo, identidad y datos legales', icon: Palette },
    { href: '/admin/settings/integrations', label: 'Infraestructura', helper: 'R2, Alanube y paginas API', icon: PlugZap, developerOnly: true },
    { href: '/admin/settings/billing', label: 'Finanzas Config', helper: 'Impuestos y facturación', icon: CreditCard, developerOnly: true },
    { href: '/admin/settings/tests', label: 'Centro de Diagnóstico', helper: 'Valida servicios y conexiones', icon: FlaskConical, developerOnly: true },
];

export default function SettingsNavigation() {
    const { url, props } = usePage();
    const isSystemOwner = props.auth?.user?.role === 'developer';
    const visibleItems = items.filter((item) => !item.developerOnly || isSystemOwner);

    return (
        <div className="flex flex-wrap gap-4">
            {visibleItems.map(({ href, label, helper, icon: Icon }) => {
                const isActive = url.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={clsx(
                            'group flex-1 min-w-[240px] rounded-2xl border p-5 transition-all duration-300',
                            isActive
                                ? 'border-primary/20 bg-primary/5 shadow-lg shadow-primary/5'
                                : 'border-slate-100 bg-white hover:border-primary/20 hover:bg-slate-50/50'
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className={clsx(
                                'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300',
                                isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <ChevronRight className={clsx('h-4 w-4 transition-all', isActive ? 'text-primary' : 'text-slate-200 group-hover:text-primary')} />
                        </div>
                        <div className="mt-4">
                            <p className={clsx('text-sm font-black tracking-tight', isActive ? 'text-primary' : 'text-slate-800')}>{label}</p>
                            <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">{helper}</p>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
