import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    BadgeDollarSign,
    Building2,
    Camera,
    CreditCard,
    FileText,
    Gauge,
    Globe2,
    LayoutDashboard,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings2,
    Sparkles,
    UserRound,
    X,
} from 'lucide-react';
import { clsx } from 'clsx';

const NAV_SECTIONS = [
    {
        label: 'Plataforma',
        items: [
            { href: '/saas', icon: LayoutDashboard, label: 'Resumen SaaS', match: ['/saas', '/saas/dashboard'] },
            { href: '/saas/tenants', icon: Building2, label: 'Tenants', match: ['/saas/tenants'] },
            { href: '/saas/users', icon: UserRound, label: 'Usuarios', match: ['/saas/users'] },
        ],
    },
    {
        label: 'Comercial',
        items: [
            { href: '/saas/plans', icon: Gauge, label: 'Planes', match: ['/saas/plans'] },
            { href: '/saas/subscriptions', icon: FileText, label: 'Suscripciones', match: ['/saas/subscriptions'] },
            { href: '/saas/payments', icon: CreditCard, label: 'Pagos PayPal', match: ['/saas/payments'] },
            { href: '/saas/costs', icon: BadgeDollarSign, label: 'Costos operativos', match: ['/saas/costs'] },
        ],
    },
    {
        label: 'Contenido',
        items: [
            { href: '/saas/templates', icon: Camera, label: 'Plantillas', match: ['/saas/templates'] },
            { href: '/saas/gemini-usage', icon: Sparkles, label: 'Uso Gemini', match: ['/saas/gemini-usage'] },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { href: '/saas/settings', icon: Settings2, label: 'Integraciones', match: ['/saas/settings'] },
            { href: '/saas/domains', icon: Globe2, label: 'Dominios', match: ['/saas/domains'] },
        ],
    },
];

function isActive(url, match) {
    return match.some((path) => url === path || url.startsWith(`${path}/`));
}

function NavLink({ href, icon: Icon, label, active, compact, onNavigate }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={clsx(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                active
                    ? 'bg-violet-600/10 text-violet-600'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                compact && 'justify-center px-0'
            )}
        >
            <Icon className={clsx('h-4 w-4 flex-shrink-0', active ? 'text-violet-500' : 'text-slate-500 group-hover:text-slate-300')} />
            {!compact && <span className={clsx('truncate font-medium', active ? 'text-violet-600' : '')}>{label}</span>}
        </Link>
    );
}

export default function SaasLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const [compact, setCompact] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const userInitials = user?.name
        ? user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
        : 'DV';

    const renderSidebar = (mobile = false) => (
        <aside
            className={clsx(
                'flex h-screen flex-col overflow-hidden border-r border-slate-800 bg-slate-950 transition-all duration-300',
                compact && !mobile ? 'w-[70px]' : 'w-[250px]',
                mobile && 'w-full max-w-[280px]'
            )}
        >
            <div className="flex h-16 items-center flex-shrink-0 px-6">
                <Link href="/saas" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-600/30 text-white">
                        <Camera className="h-5 w-5" />
                    </div>
                    {!compact && (
                        <span className="text-xl font-black tracking-tight text-slate-100">
                            Phot<span className="text-violet-400 text-2xl">OS</span>
                            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-500/70">SaaS</span>
                        </span>
                    )}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4 custom-scrollbar">
                <div className="space-y-7">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            {!compact && (
                                <p className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                                    {section.label}
                                </p>
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <NavLink
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        compact={compact && !mobile}
                                        active={isActive(url, item.match)}
                                        onNavigate={() => setMobileOpen(false)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-800 p-4">
                <div className={clsx(
                    'flex items-center gap-3 rounded-xl bg-slate-900 p-3 transition-all',
                    compact && !mobile && 'justify-center p-2'
                )}>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-violet-400">
                        {userInitials}
                    </div>
                    {!compact && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-200">{user?.name}</p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-violet-500">developer</p>
                        </div>
                    )}
                    {!compact && (
                        <Link href="/logout" method="post" data={{ _surface: 'saas' }} as="button" className="text-slate-600 hover:text-red-400 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
            <div className="hidden lg:flex">{renderSidebar(false)}</div>

            {mobileOpen && (
                <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300 lg:hidden">
                    <div className="absolute inset-0 bg-slate-950/70" onClick={() => setMobileOpen(false)} />
                    <div className="relative animate-in slide-in-from-left duration-300">
                        {renderSidebar(true)}
                    </div>
                </div>
            )}

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 md:px-8 flex-shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setCompact(!compact)}
                            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-400 hover:text-violet-400 transition-colors lg:flex"
                        >
                            {compact ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                        </button>

                        <div className="h-6 w-[1px] bg-slate-700 mx-2 hidden md:block" />

                        <div className="hidden md:block">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <span>SaaS Panel</span>
                                <span className="text-slate-700">/</span>
                                <span className="text-slate-300">{url.split('/')[2] ?? 'Resumen'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700 px-3 py-1.5">
                            <div className="h-7 w-7 rounded-lg bg-violet-600/20 border border-violet-600/30 flex items-center justify-center text-[10px] font-bold text-violet-400">
                                {userInitials}
                            </div>
                            <span className="text-sm font-bold text-slate-300 hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar bg-slate-900">
                    <div className="mx-auto w-full max-w-7xl animate-in fade-in duration-300">
                        {children}
                    </div>
                    <footer className="mt-12 py-6 text-center text-[11px] font-bold uppercase tracking-widest text-slate-700">
                        PhotOS SaaS Panel — Developer Access Only
                    </footer>
                </div>
            </main>
        </div>
    );
}
