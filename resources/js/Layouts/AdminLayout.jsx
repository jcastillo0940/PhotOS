import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Bot,
    Building2,
    CalendarRange,
    Camera,
    CreditCard,
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
    ShieldEllipsis,
    Sparkles,
    Target,
    UserRound,
    Wrench,
    X,
    ScanFace,
} from 'lucide-react';
import { clsx } from 'clsx';

function getSections(userRole) {
    const isSystemOwner = userRole === 'developer';
    const isTenantAdmin = ['owner', 'operator'].includes(userRole);

    if (userRole === 'photographer') {
        return [
            {
                label: 'Trabajo',
                items: [
                    { href: '/admin/projects', icon: FolderKanban, label: 'Mis proyectos', match: ['/admin/projects'] },
                ],
            },
        ];
    }

    if (isSystemOwner) {
        return [
            {
                label: 'Plataforma',
                items: [
                    { href: '/admin', icon: LayoutDashboard, label: 'Resumen SaaS', match: ['/admin', '/admin/dashboard'] },
                    { href: '/admin/saas/tenants', icon: Building2, label: 'Tenants', match: ['/admin/saas/tenants'] },
                    { href: '/admin/saas/users', icon: UserRound, label: 'Usuarios', match: ['/admin/saas/users'] },
                    { href: '/admin/saas/plans', icon: Layers3, label: 'Planes SaaS', match: ['/admin/saas/plans'] },
                    { href: '/admin/saas/subscriptions', icon: FileText, label: 'Suscripciones', match: ['/admin/saas/subscriptions'] },
                    { href: '/admin/saas/payments', icon: CirclePlus, label: 'Pagos PayPal', match: ['/admin/saas/payments'] },
                    { href: '/admin/saas/templates', icon: Camera, label: 'Fronts de tenants', match: ['/admin/saas/templates'] },
                    { href: '/admin/settings', icon: Settings2, label: 'Configuracion global', match: ['/admin/settings'] },
                ],
            },
        ];
    }

    return [
        {
            label: 'Operacion',
            items: [
                { href: '/admin', icon: LayoutDashboard, label: 'Resumen', match: ['/admin', '/admin/dashboard'] },
                { href: '/admin/leads', icon: Target, label: 'Leads', match: ['/admin/leads'] },
                { href: '/admin/projects', icon: FolderKanban, label: 'Colecciones', match: ['/admin/projects'] },
                { href: '/admin/calendar', icon: CalendarRange, label: 'Agenda', match: ['/admin/calendar'] },
                { href: '/admin/face-detection', icon: ScanFace, label: 'Deteccion facial', match: ['/admin/face-detection'] },
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
                { href: '/admin/subscription', icon: CreditCard, label: 'Suscripcion', match: ['/admin/subscription'] },
                { href: '/admin/settings', icon: Settings2, label: 'Branding', match: ['/admin/settings'] },
            ].filter((item) => isTenantAdmin || item.href !== '/admin/settings'),
        },
    ];
}

function getPageTitles(userRole) {
    const isSystemOwner = userRole === 'developer';

    return [
        { match: ['/admin', '/admin/dashboard'], title: isSystemOwner ? 'Control SaaS' : 'Resumen del estudio', description: userRole === 'photographer' ? 'Tus accesos operativos por proyecto.' : (isSystemOwner ? 'Tenants, cobro, integraciones globales y salud operativa de la plataforma.' : 'Tus operaciones, colecciones e ingresos en un solo lugar.') },
        { match: ['/admin/leads'], title: 'Leads y oportunidades', description: 'Organiza consultas, briefings y conversiones sin salir del flujo.' },
        { match: ['/admin/projects'], title: userRole === 'photographer' ? 'Proyectos asignados' : 'Colecciones y entregas', description: userRole === 'photographer' ? 'Solo ves los proyectos donde tienes acceso.' : 'Administra galerias, material, contratos y facturacion.' },
        { match: ['/admin/calendar'], title: 'Agenda del estudio', description: 'Fechas, sesiones y disponibilidad del equipo.' },
        { match: ['/admin/face-detection'], title: 'Deteccion facial', description: 'Rostros globales, modo IA por galeria y ejecucion masiva.' },
        { match: ['/admin/website'], title: 'Sitio web', description: 'Edita el home, el portafolio y la presentacion publica.' },
        { match: ['/admin/contracts'], title: 'Contratos', description: 'Control legal y firma de cada proyecto.' },
        { match: ['/admin/automations'], title: 'Automatizaciones', description: 'Reglas, tareas y recordatorios por tipo de evento.' },
        { match: ['/admin/limits'], title: 'Limites y consumo', description: 'Monitorea uso y restricciones operativas del plan.' },
        { match: ['/admin/subscription'], title: 'Suscripcion y pagos', description: 'Plan activo, dias restantes, comprobantes y cambios de plan.' },
        { match: ['/admin/templates'], title: 'Planes y presets', description: 'Plantillas base, planes y configuracion avanzada del SaaS.' },
        { match: ['/admin/saas/tenants'], title: 'Tenants y dominios', description: 'Clientes, suscripciones, onboarding y dominios custom.' },
        { match: ['/admin/saas/users'], title: 'Usuarios del sistema', description: 'Gestiona fotÃ³grafos, dueÃ±os de estudio y administradores globales.' },
        { match: ['/admin/saas/plans'], title: 'Planes SaaS', description: 'Define precios, limites, cuotas IA y capacidades comerciales de cada plan.' },
        { match: ['/admin/saas/subscriptions'], title: 'Suscripciones y cobros', description: 'Control de periodos, pagos manuales y estados de cuenta.' },
        { match: ['/admin/saas/payments'], title: 'Historial de pagos PayPal', description: 'Seguimiento de transacciones recibidas por el gateway.' },
        { match: ['/admin/saas/templates'], title: 'Fronts de tenants', description: 'Administra los estilos visuales y layouts que los tenants pueden usar en su front publico.' },
        { match: ['/admin/settings'], title: isSystemOwner ? 'Configuracion global' : 'Branding del estudio', description: isSystemOwner ? 'R2, PayPal, Alanube, Cloudflare y parametros centrales del sistema.' : 'Nombre, logo, favicon y elementos visuales del estudio.' },
    ];
}

function isActive(url, match) {
    return match.some((path) => url === path || url.startsWith(`${path}/`));
}

function currentPageMeta(url, userRole) {
    const pageTitles = getPageTitles(userRole);
    return pageTitles.find((item) => isActive(url, item.match)) ?? pageTitles[0];
}

function NavLink({ href, icon: Icon, label, active, compact, onNavigate }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={clsx(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                active
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                compact && 'justify-center px-0'
            )}
        >
            <Icon className={clsx('h-4 w-4 flex-shrink-0', active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600')} />
            {!compact && <span className={clsx('truncate font-medium', active ? 'text-primary' : 'text-slate-600')}> {label}</span>}
        </Link>
    );
}

export default function AdminLayout({ children }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const branding = props.branding || {};
    const [compact, setCompact] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const sections = getSections(user?.role);
    const pageMeta = currentPageMeta(url, user?.role);
    const userInitials = user?.name
        ? user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
        : 'AD';

    const renderSidebar = (mobile = false) => (
        <aside
            className={clsx(
                'flex h-screen flex-col overflow-hidden border-r border-slate-200 bg-white transition-all duration-300',
                compact && !mobile ? 'w-[70px]' : 'w-[250px]',
                mobile && 'w-full max-w-[280px]'
            )}
        >
            <div className="flex h-16 items-center flex-shrink-0 px-6">
                <Link href="/admin" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 text-white">
                        <Camera className="h-5 w-5" />
                    </div>
                    {!compact && (
                        <span className="text-xl font-black tracking-tight text-slate-800">
                            Phot<span className="text-primary text-2xl">OS</span>
                        </span>
                    )}
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-4 custom-scrollbar">
                <div className="space-y-7">
                    {sections.map((section) => (
                        <div key={section.label}>
                            {!compact && (
                                <p className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
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

            <div className="border-t border-slate-100 p-4">
                <div className={clsx(
                    'flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-all',
                    compact && !mobile && 'justify-center p-2'
                )}>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm">
                        {userInitials}
                    </div>
                    {!compact && (
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">{user?.name}</p>
                            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-primary">{user?.role}</p>
                        </div>
                    )}
                    {!compact && (
                        <Link href="/logout" method="post" as="button" className="text-slate-400 hover:text-red-500 transition-colors">
                            <LogOut className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#f5f6f8] text-slate-800 font-sans">
            <div className="hidden lg:flex">{renderSidebar(false)}</div>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-[100] flex animate-in fade-in duration-300 lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="relative animate-in slide-in-from-left duration-300">
                        {renderSidebar(true)}
                    </div>
                </div>
            )}

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 flex-shrink-0 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setMobileOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setCompact(!compact)}
                            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-primary transition-colors lg:flex"
                        >
                            {compact ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                        </button>

                        <div className="h-6 w-[1px] bg-slate-200 mx-2 hidden md:block" />

                        <div className="hidden md:block">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <span>Admin</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-800">{pageMeta.title}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-primary relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary border-2 border-white" />
                        </button>
                        <div className="h-10 w-[1px] bg-slate-200 mx-1 hidden sm:block" />
                        <button className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 hover:bg-slate-100 transition-colors">
                            <div className="h-7 w-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                                {userInitials}
                            </div>
                            <span className="text-sm font-bold text-slate-700 hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar">
                    <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                    <footer className="mt-12 py-6 text-center text-[11px] font-bold uppercase tracking-widest text-slate-300">
                        © {new Date().getFullYear()} PhotOS — Modern Studio OS
                    </footer>
                </div>
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


