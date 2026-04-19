import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    ArrowRight,
    BadgeCheck,
    CalendarRange,
    CirclePlus,
    FolderKanban,
    MapPin,
    Search,
    UploadCloud,
    Workflow,
    ChevronRight,
    Plus,
    Filter,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { Card, StatsCard, Badge, Button, Input } from '@/Components/UI';
import CreateProjectDrawer from './Partials/CreateProjectDrawer';

const statusStyles = {
    active: 'primary',
    pending_payment: 'warning',
    editing: 'info',
    delivered: 'success',
};

const statusLabels = {
    active: 'Activo',
    pending_payment: 'Caja Pendiente',
    editing: 'En Edición',
    delivered: 'Entregado',
};

export default function Index({ projects, installationPlan, eventTypes = [] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEventType, setSelectedEventType] = useState('Todos');
    const [search, setSearch] = useState('');

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => {
            const matchesType = selectedEventType === 'Todos' || project.lead?.event_type === selectedEventType;
            const haystack = [
                project.name,
                project.location,
                project.website_category,
                project.lead?.name,
                project.lead?.event_type,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return matchesType && haystack.includes(search.toLowerCase());
        });
    }, [projects, search, selectedEventType]);

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        delivered: projects.filter(p => p.status === 'delivered').length,
        portfolio: projects.filter(p => (p.photos || []).some(ph => ph.show_on_website)).length,
    };

    return (
        <AdminLayout>
            <Head title="Proyectos — Colecciones" />

            <div className="space-y-8">
                {/* Header Actions */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Colecciones</h2>
                        <p className="text-sm font-medium text-slate-500">Gestión de flujo fotográfico y entregas al cliente.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/leads">
                            <Button variant="outline" icon={Workflow}>Desde Leads</Button>
                        </Link>
                        <Button onClick={() => setIsCreateOpen(true)} icon={Plus}>Nueva Colección</Button>
                    </div>
                </div>

                {/* KPI Overview */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard title="Proyectos Totales" value={stats.total} icon={FolderKanban} color="info" />
                    <StatsCard title="En Producción" value={stats.active} icon={Clock} color="primary" />
                    <StatsCard title="Entregadas" value={stats.delivered} icon={CheckCircle2} color="success" />
                    <StatsCard title="En Portafolio" value={stats.portfolio} icon={BadgeCheck} color="warning" />
                </div>

                {/* Filter & Search Bar */}
                <Card noPadding className="border-none shadow-xl shadow-slate-200/40">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4">
                        <div className="flex-1 max-w-2xl">
                            <Input 
                                placeholder="Buscar por nombre, cliente, lugar..." 
                                icon={Search}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Categoría:</span>
                                <select 
                                    className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0"
                                    value={selectedEventType}
                                    onChange={e => setSelectedEventType(e.target.value)}
                                >
                                    <option value="Todos">Todos</option>
                                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <Badge variant="primary" className="py-2.5 px-4 rounded-xl border border-primary/10">
                                Plan: {installationPlan?.name}
                            </Badge>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="grid gap-6 p-6 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredProjects.map((project) => (
                                <Link
                                    key={project.id}
                                    href={`/admin/projects/${project.id}`}
                                    className="group flex flex-col justify-between rounded-[1.8rem] border border-slate-100 bg-white p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-slate-200/60"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                                <FolderKanban className="h-6 w-6" />
                                            </div>
                                            <Badge variant={statusStyles[project.status] || 'slate'} className="uppercase font-black text-[9px] tracking-widest">
                                                {statusLabels[project.status] || project.status}
                                            </Badge>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-800 tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                                            {project.name}
                                        </h3>
                                        <p className="mt-1 text-xs font-bold text-slate-400 uppercase tracking-tight">
                                            {project.lead?.name || 'Cliente Directo'}
                                        </p>

                                        <div className="mt-6 flex flex-wrap gap-2">
                                            <InfoLabel icon={CalendarRange} text={project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Pendiente'} />
                                            <InfoLabel icon={MapPin} text={project.location || 'Sin Ubicación'} />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${project.contract?.status === 'signed' ? 'bg-green-500' : 'bg-slate-200'}`} />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {project.contract?.status === 'signed' ? 'Contrato OK' : 'Firma Pendiente'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-black text-primary flex items-center gap-1 group-hover:translate-x-1 transition-all">
                                            ADMINISTRAR <ChevronRight className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                </Link>
                            ))}

                            {filteredProjects.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                    <FolderKanban className="h-10 w-10 text-slate-200 mx-auto" />
                                    <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron colecciones</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <CreateProjectDrawer 
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
        </AdminLayout>
    );
}

function InfoLabel({ icon: Icon, text }) {
    return (
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-50/50 px-2.5 py-1.5 border border-slate-100/50">
            <Icon className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">{text}</span>
        </div>
    );
}

function InfoPill({ icon: Icon, label, value }) {
    return (
        <div className="rounded-2xl border border-[#e8e1d5] bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-slate-400">
                <Icon className="h-3.5 w-3.5" />
                <p className="text-[11px] uppercase tracking-[0.18em]">{label}</p>
            </div>
            <p className="mt-2 truncate text-sm font-medium text-slate-800">{value}</p>
        </div>
    );
}
