import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Bot,
    Calendar,
    Camera,
    FileText,
    Gauge,
    Globe,
    Layers3,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    Target,
    Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const NavItem = ({ href, icon: Icon, label, active }) => (
    <Link
        href={href}
        className={clsx(
            'flex items-center rounded-xl px-4 py-3 transition-all duration-300 group',
            active
                ? 'bg-primary-50 text-primary-600 font-medium'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        )}
    >
        <Icon className={clsx('mr-3 h-5 w-5 transition-transform group-hover:scale-105', active && 'scale-105')} />
        <span className="text-sm tracking-wide">{label}</span>
    </Link>
);

export default function AdminLayout({ children }) {
    const { url, props } = usePage();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const user = props.auth?.user;
    const branding = props.branding || {};
    const isElevatedUser = ['developer', 'owner'].includes(user?.role);

    return (
        <div className="flex min-h-screen overflow-hidden bg-[#f8f9fa] font-sans text-slate-800">
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="relative z-20 hidden flex-col border-r border-slate-200 bg-white lg:flex"
            >
                <div className="mb-4 flex-shrink-0 p-6">
                    <div className="flex items-center">
                        {branding.app_logo_url ? (
                            <img src={branding.app_logo_url} alt={branding.app_name || 'App logo'} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500">
                                <Camera className="h-4 w-4 text-white" />
                            </div>
                        )}
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="ml-3 text-lg font-semibold tracking-tight text-slate-800"
                            >
                                {branding.app_name || 'PhotOS'}
                            </motion.span>
                        )}
                    </div>
                </div>

                <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-4">
                    <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" active={url === '/admin' || url === '/admin/dashboard'} />
                    <NavItem href="/admin/leads" icon={Target} label="Leads" active={url.startsWith('/admin/leads')} />
                    <NavItem href="/admin/projects" icon={Users} label="Colecciones" active={url.startsWith('/admin/projects')} />
                    <NavItem href="/admin/calendar" icon={Calendar} label="Agenda" active={url === '/admin/calendar'} />
                    <NavItem href="/admin/automations" icon={Bot} label="Automatizaciones" active={url.startsWith('/admin/automations')} />
                    <NavItem href="/admin/website" icon={Globe} label="Sitio web" active={url === '/admin/website'} />
                    <NavItem href="/admin/contracts" icon={FileText} label="Contratos" active={url.startsWith('/admin/contracts')} />
                    <NavItem href="/admin/limits" icon={Gauge} label="Limites" active={url === '/admin/limits'} />
                    {isElevatedUser && (
                        <NavItem href="/admin/templates" icon={Layers3} label="Plantillas" active={url.startsWith('/admin/templates')} />
                    )}
                    <NavItem href="/admin/settings" icon={Settings} label="Configuracion" active={url === '/admin/settings'} />
                </nav>

                <div className="flex-shrink-0 border-t border-slate-100 p-4">
                    <div className={clsx('rounded-xl bg-slate-50 p-3 transition-all', !isSidebarOpen && 'hidden')}>
                        <div className="mb-3 flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                                {user?.name?.slice(0, 2)?.toUpperCase() || 'ST'}
                            </div>
                            <div className="ml-2 overflow-hidden">
                                <p className="truncate text-sm font-medium text-slate-700">{user?.name || 'Studio User'}</p>
                                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{user?.role || 'user'}</p>
                            </div>
                        </div>
                        <Link href="/logout" method="post" as="button" className="flex w-full items-center justify-center py-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900">
                            <LogOut className="mr-2 h-3 w-3" /> Cerrar sesion
                        </Link>
                    </div>
                </div>
            </motion.aside>

            <main className="relative flex h-screen min-w-0 flex-1 flex-col bg-white md:bg-[#f8f9fa]">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/80 px-8 backdrop-blur-sm md:bg-transparent">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="mr-4 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 md:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600">
                            <Bell className="h-4 w-4" />
                        </button>
                        <Link href="/admin/projects" className="rounded-md bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600">
                            Crear coleccion
                        </Link>
                    </div>
                </header>

                <section className="no-scrollbar flex-1 overflow-y-auto px-4 pb-12 pt-4 md:px-12">
                    <div className="mx-auto w-full max-w-6xl">
                        {children}
                    </div>
                </section>
            </main>
        </div>
    );
}
