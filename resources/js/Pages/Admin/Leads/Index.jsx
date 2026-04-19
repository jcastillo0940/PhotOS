import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Users, 
    Calendar, 
    Mail, 
    Filter, 
    ArrowRight,
    LayoutGrid, 
    ListFilter, 
    Plus,
    Search,
    ChevronRight,
    Clock,
    MoreVertical
} from 'lucide-react';
import { Card, Badge, Button, Input } from '@/Components/UI';

const statusConfig = {
    lead: { label: 'Nueva Consulta', variant: 'primary', dot: 'bg-primary' },
    qualified: { label: 'Calificado', variant: 'warning', dot: 'bg-warning' },
    project: { label: 'En Producción', variant: 'success', dot: 'bg-success' },
    lost: { label: 'Archivado', variant: 'slate', dot: 'bg-slate-300' }
};

const LeadCard = ({ lead }) => (
    <div className="group relative bg-white border border-slate-100 p-5 rounded-[1.8rem] transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-slate-200/40 cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 font-black text-xs group-hover:bg-primary/10 group-hover:text-primary transition-all">
                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <Badge variant={statusConfig[lead.status]?.variant || 'slate'} className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5">
                {statusConfig[lead.status]?.label || lead.status}
            </Badge>
        </div>

        <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight group-hover:text-primary transition-colors">
                {lead.name}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {lead.event_type}
            </p>
        </div>

        <div className="mt-5 grid gap-2">
            <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="h-3 w-3" />
                <span className="text-[10px] font-bold tracking-tight">
                    {lead.tentative_date ? new Date(lead.tentative_date).toLocaleDateString() : 'FECHA PENDIENTE'}
                </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-3 w-3" />
                <span className="text-[10px] font-bold tracking-tight truncate uppercase">{lead.email}</span>
            </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
             <Link 
                href={`/admin/leads/${lead.id}`}
                className="text-[10px] font-black text-primary flex items-center gap-1 group-hover:translate-x-1 transition-all uppercase tracking-widest"
            >
                Detalles <ChevronRight className="h-3 w-3" />
            </Link>
            <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-300">
                <MoreVertical className="h-3.5 w-3.5" />
            </button>
        </div>
    </div>
);

const Column = ({ title, leads, status }) => (
    <div className="flex flex-col min-w-[320px] max-w-[320px] h-full">
        <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${statusConfig[status]?.dot || 'bg-slate-200'}`} />
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{title}</h2>
                <span className="flex h-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[10px] font-black text-slate-400">
                    {leads.length}
                </span>
            </div>
        </div>
        <div className="flex-1 space-y-4 px-1 pb-10 overflow-y-auto custom-scrollbar">
            {leads.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
            ))}
            
            <button className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-100 rounded-[1.8rem] text-slate-300 hover:border-primary/20 hover:text-primary hover:bg-primary/5 transition-all text-[10px] font-black uppercase tracking-widest group">
                <Plus className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> Agregar Lead
            </button>
        </div>
    </div>
);

export default function Index({ leads, eventTypes = [] }) {
    const [selectedEventType, setSelectedEventType] = useState('Todos');
    const [search, setSearch] = useState('');

    const columns = [
        { title: 'Nuevos', status: 'lead' },
        { title: 'Calificados', status: 'qualified' },
        { title: 'Proyectos', status: 'project' },
        { title: 'Archivados', status: 'lost' }
    ];

    const filteredLeads = useMemo(() => {
        return leads.filter((lead) => {
            const matchesType = selectedEventType === 'Todos' || lead.event_type === selectedEventType;
            const haystack = `${lead.name} ${lead.email} ${lead.event_type}`.toLowerCase();
            const matchesSearch = !search || haystack.includes(search.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [leads, selectedEventType, search]);

    return (
        <AdminLayout>
            <Head title="CRM — Gestión de Leads" />

            <div className="flex flex-col h-full space-y-8">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">CRM <span className="text-primary not-italic">& Pipeline</span></h2>
                        <p className="text-sm font-medium text-slate-500">Transforma prospectos en sesiones exitosas.</p>
                    </div>
                    <div className="flex gap-3">
                         <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
                            <button className="px-5 py-2.5 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-primary shadow-sm flex items-center gap-2">
                                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                            </button>
                            <button className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 hover:text-slate-600 transition-colors">
                                <ListFilter className="h-3.5 w-3.5" /> Lista
                            </button>
                        </div>
                        <Link href="/admin/leads/create">
                            <Button icon={Plus}>Manual Lead</Button>
                        </Link>
                    </div>
                </div>

                {/* Filters Row */}
                <Card noPadding className="border-none shadow-xl shadow-slate-200/40">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 gap-4">
                         <div className="flex-1 max-w-xl">
                            <Input 
                                placeholder="Buscar prospectos por nombre o email..." 
                                icon={Search}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo:</span>
                                <select 
                                    className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0"
                                    value={selectedEventType}
                                    onChange={e => setSelectedEventType(e.target.value)}
                                >
                                    <option value="Todos">Todos</option>
                                    {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="h-4 w-px bg-slate-200 mx-2 hidden lg:block" />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                Total <span className="text-primary">{filteredLeads.length}</span> activos
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Kanban Board Container */}
                <div className="flex-1 flex gap-8 overflow-x-auto pb-10 min-h-[600px] custom-scrollbar">
                    {columns.map(col => (
                        <Column 
                            key={col.status} 
                            title={col.title} 
                            status={col.status}
                            leads={filteredLeads.filter(l => l.status === col.status)}
                        />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
