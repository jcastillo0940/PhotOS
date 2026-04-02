import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    Users, 
    Calendar, 
    FileText, 
    Settings, 
    Search, 
    Bell, 
    LogOut, 
    Menu, 
    Plus, 
    ChevronRight, 
    Camera,
    PanelsTopLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const NavItem = ({ href, icon: Icon, label, active }) => (
    <Link
        href={href}
        className={clsx(
            "flex items-center px-4 py-3 rounded-xl transition-all duration-300 group",
            active 
                ? "bg-primary-50 text-primary-600 font-medium" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        )}
    >
        <Icon className={clsx("w-5 h-5 mr-3 transition-transform group-hover:scale-105", active && "scale-105")} />
        <span className="text-sm tracking-wide">{label}</span>
    </Link>
);

export default function AdminLayout({ children }) {
    const { url, props } = usePage();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const user = props.auth?.user;
    const isDeveloper = user?.role === 'developer';

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-slate-800 flex overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <motion.aside 
                initial={false}
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="hidden lg:flex flex-col border-r border-slate-200 bg-white relative z-20"
            >
                <div className="p-6 mb-4 flex-shrink-0">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-white" />
                        </div>
                        {isSidebarOpen && (
                            <motion.span 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="ml-3 font-semibold text-lg tracking-tight text-slate-800"
                            >
                                Client Gallery
                            </motion.span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
                    <NavItem href="/admin" icon={LayoutDashboard} label="Página principal" active={url === '/admin'} />
                    <NavItem href="/admin/projects" icon={Users} label="Colecciones" active={url.startsWith('/admin/projects')} />
                    <NavItem href="/admin/calendar" icon={Calendar} label="Destacados" active={url === '/admin/calendar'} />
                    <NavItem href="/admin/contracts" icon={FileText} label="Facturación" active={url === '/admin/contracts'} />
                    <NavItem href="/admin/settings" icon={Settings} label="Configuración" active={url === '/admin/settings'} />
                </nav>

                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <div className={clsx("p-3 bg-slate-50 rounded-xl transition-all", !isSidebarOpen && "hidden")}>
                        <div className="flex items-center mb-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                {user?.name?.slice(0, 2)?.toUpperCase() || 'ST'}
                            </div>
                            <div className="ml-2 overflow-hidden">
                                <p className="text-sm font-medium text-slate-700 truncate">{user?.name || 'Studio User'}</p>
                            </div>
                        </div>
                        <Link href="/logout" method="post" as="button" className="w-full flex items-center justify-center py-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                            <LogOut className="w-3 h-3 mr-2" /> Cerrar Sesión
                        </Link>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative h-screen bg-white md:bg-[#f8f9fa]">
                {/* Header/TopBar */}
                <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-30 md:bg-transparent">
                    <div className="flex items-center">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="mr-4 w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all md:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
                            <Bell className="w-4 h-4" />
                        </button>
                        <Link href="/admin/projects" className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Crear colección
                        </Link>
                    </div>
                </header>

                {/* Content Area */}
                <section className="flex-1 overflow-y-auto px-4 md:px-12 pb-12 pt-4 no-scrollbar">
                    <div className="max-w-5xl mx-auto w-full">
                        {children}
                    </div>
                </section>
            </main>
        </div>
    );
}
