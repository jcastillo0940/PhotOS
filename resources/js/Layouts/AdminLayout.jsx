import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Bot,
    BriefcaseBusiness,
    CalendarRange,
    Camera,
    CirclePlus,
    FileText,
    FolderKanban,
    Gauge,
    Globe2,
    Layers3,
    LayoutDashboard,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Settings2,
    Sparkles,
    Target,
    X,
} from 'lucide-react';
import { clsx } from 'clsx';

const sections = [
    {
        label: 'Operacion',
        items: [
            { href: '/admin', icon: LayoutDashboard, label: 'Resumen', match: ['/admin', '/admin/dashboard'] },
            { href: '/admin/leads', icon: Target, label: 'Leads', match: ['/admin/leads'] },
            { href: '/admin/projects', icon: FolderKanban, label: 'Colecciones', match: ['/admin/projects'] },
            { href: '/admin/calendar', icon: CalendarRange, label: 'Agenda', match: ['/admin/calendar'] },
        ],
    },
    {
        label: 'Publicacion',
        items: [
            { href: '/admin/website', icon: Globe2, label: 'Sitio web', match: ['/admin/website'] },
            { href: '/admin/contracts', icon: FileText, label: 'Contratos', match: ['/admin/contracts'] },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { href: '/admin/automations', icon: Bot, label: 'Automatizaciones', match: ['/admin/automations'] },
            { href: '/admin/limits', icon: Gauge, label: 'Limites', match: ['/admin/limits'] },
            { href: '/admin/templates', icon: Layers3, label: 'Plantillas', match: ['/admin/templates'], roles: ['developer', 'owner'] },
            { href: '/admin/settings', icon: Settings2, label: 'Configuracion', match: ['/admin/settings'] },
        ],
    },
];

const pageTitles = [
    { match: ['/admin', '/admin/dashboard'], title: 'Resumen del estudio', description: 'Tus operaciones, colecciones e ingresos en un solo lugar.' },
    { match: ['/admin/leads'], title: 'Leads y oportunidades', description: 'Organiza consultas, briefings y conversiones sin salir del flujo.' },
    { match: ['/admin/projects'], title: 'Colecciones y entregas', description: 'Administra galerias, material, contratos y facturacion.' },
    { match: ['/admin/calendar'], title: 'Agenda del estudio', description: 'Fechas, sesiones y disponibilidad del equipo.' },
    { match: ['/admin/website'], title: 'Sitio web', description: 'Edita el home, el portafolio y la presentacion publica.' },
    { match: ['/admin/contracts'], title: 'Contratos', description: 'Control legal y firma de cada proyecto.' },
    { match: ['/admin/automations'], title: 'Automatizaciones', description: 'Reglas, tareas y recordatorios por tipo de evento.' },
    { match: ['/admin/limits'], title: 'Limites y consumo', description: 'Monitorea uso y restricciones operativas del plan.' },
    { match: ['/admin/templates'], title: 'Plantillas', description: 'Configuracion avanzada de galerias y planes.' },
    { match: ['/admin/settings'], title: 'Configuracion central', description: 'Integraciones, branding, facturacion y pruebas del sistema.' },
];

function isActive(url, match) {
    return match.some((path) => url === path || url.startsWith(`${path}/`));
}

function currentPageMeta(url) {
    return pageTitles.find((item) => isActive(url, item.match)) ?? pageTitles[0];
}

function NavLink({ href, icon: Icon, label, active, compact, onNavigate }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={clsx(
                'group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-all',
                active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white hover:text-slate-900',
                compact && 'justify-center px-0'
            )}
        >
            <Icon className={clsx('h-4 w-4 flex-shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700')} />
            {!compact && <span className="truncate font-medium">{label}</span>}
        </Link>
    );
}

export default function AdminLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const branding = props.branding || {};
    const [compact, setCompact] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const pageMeta = currentPageMeta(url);
    const userInitials = user?.name
        ? user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
        : 'ST';

    const renderSidebar = (mobile = false) => (
        <aside
            className={clsx(
                'flex h-full flex-col border-r border-[#e8e3da] bg-[#f7f3ec]',
                compact && !mobile ? 'w-[92px]' : 'w-[292px]',
                mobile && 'w-full max-w-[320px]'
            )}
        >
            <div className="border-b border-[#e8e3da] px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                    <Link href="/admin" className="flex min-w-0 items-center gap-3">
                        {branding.app_logo_url ? (
                            <img src={branding.app_logo_url} alt={branding.app_name || 'Studio logo'} className="h-11 w-11 rounded-2xl object-cover shadow-sm" />
                        ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#13110f] text-white shadow-sm">
                                <Camera className="h-5 w-5" />
                            </div>
                        )}
                        {!compact && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{branding.app_name || 'PhotOS'}</p>
                                <p className="truncate text-xs text-slate-500">{branding.app_tagline || 'Backoffice del estudio'}</p>
                            </div>
                        )}
                    </Link>

                    {mobile ? (
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e8e3da] bg-white text-slate-500"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setCompact((value) => !value)}
                            className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-[#e8e3da] bg-white text-slate-500 transition hover:text-slate-900 lg:flex"
                        >
                            {compact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                        </button>
                    )}
                </div>
            </div>

            <div className="border-b border-[#e8e3da] px-4 py-4">
                <div className={clsx('grid gap-3', compact && !mobile ? 'grid-cols-1' : 'grid-cols-2')}>
                    <Link
                        href="/admin/projects"
                        onClick={() => setMobileOpen(false)}
                        className={clsx(
                            'inline-flex items-center justify-center gap-2 rounded-2xl bg-[#13110f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black',
                            compact && !mobile && 'px-0'
                        )}
                    >
                        <CirclePlus className="h-4 w-4" />
                        {!compact && 'Nueva coleccion'}
                    </Link>
                    <Link
                        href="/admin/leads/create"
                        onClick={() => setMobileOpen(false)}
                        className={clsx(
                            'inline-flex items-center justify-center gap-2 rounded-2xl border border-[#d9d1c4] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50',
                            compact && !mobile && 'px-0'
                        )}
                    >
                        <Sparkles className="h-4 w-4" />
                        {!compact && 'Nuevo lead'}
                    </Link>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-5">
                <div className="space-y-6">
                    {sections.map((section) => {
                        const visibleItems = section.items.filter((item) => !item.roles || item.roles.includes(user?.role));

                        return (
                            <div key={section.label}>
                                {!compact && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{section.label}</p>}
                                <div className="space-y-1">
                                    {visibleItems.map((item) => (
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
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-[#e8e3da] p-4">
                <div className={clsx('rounded-[1.6rem] border border-[#e5ddd1] bg-white p-4 shadow-sm', compact && !mobile && 'px-3')}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f1ebe1] text-xs font-bold text-slate-700">
                            {userInitials}
                        </div>
                        {!compact && (
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">{user?.name || 'Studio user'}</p>
                                <p className="truncate text-xs uppercase tracking-[0.18em] text-slate-400">{user?.role || 'owner'}</p>
                            </div>
                        )}
                    </div>

                    {!compact && (
                        <div className="mt-4 rounded-2xl bg-[#f7f3ec] px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Acceso rapido</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">Todo el estudio se maneja desde este panel.</p>
                        </div>
                    )}

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className={clsx(
                            'mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e5ddd1] px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50',
                            compact && !mobile && 'px-0'
                        )}
                    >
                        <LogOut className="h-4 w-4" />
                        {!compact && 'Cerrar sesion'}
                    </Link>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex min-h-screen bg-[#f2ede4] text-slate-800">
            <div className="hidden lg:flex">{renderSidebar(false)}</div>

            <AnimateMobileSidebar open={mobileOpen}>
                {renderSidebar(true)}
            </AnimateMobileSidebar>

            <main className="flex min-h-screen min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 border-b border-[#e8e3da] bg-[#f2ede4]/95 px-4 py-4 backdrop-blur md:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ddd5c9] bg-white text-slate-600 lg:hidden"
                            >
                                <Menu className="h-4 w-4" />
                            </button>

                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Backoffice</p>
                                <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-900">{pageMeta.title}</h1>
                                <p className="mt-1 max-w-2xl text-sm text-slate-500">{pageMeta.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin/calendar"
                                className="hidden items-center gap-2 rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:inline-flex"
                            >
                                <CalendarRange className="h-4 w-4" />
                                Agenda
                            </Link>
                            <Link
                                href="/admin/settings"
                                className="hidden items-center gap-2 rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:inline-flex"
                            >
                                <Settings2 className="h-4 w-4" />
                                Configuracion
                            </Link>
                            <button
                                type="button"
                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ddd5c9] bg-white text-slate-500 transition hover:text-slate-900"
                            >
                                <Bell className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </header>

                <section className="flex-1 px-4 py-6 md:px-8 md:py-8">
                    <div className="mx-auto w-full max-w-[1440px]">{children}</div>
                </section>
            </main>
        </div>
    );
}

function AnimateMobileSidebar({ open, children }) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex bg-slate-900/35 backdrop-blur-sm lg:hidden">
            {children}
            <div className="flex-1" />
        </div>
    );
}
