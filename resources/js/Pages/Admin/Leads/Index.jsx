import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Users, 
    MoreHorizontal, 
    Calendar, 
    Mail, 
    Filter, 
    ArrowRight,
    LayoutGrid, 
    ListFilter, 
    Plus,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const StatusBadge = ({ status }) => {
    const statuses = {
        lead: 'bg-blue-50 text-blue-600 border border-blue-100',
        qualified: 'bg-amber-50 text-amber-600 border border-amber-100',
        project: 'bg-green-50 text-green-700 border border-green-100',
        lost: 'bg-slate-100 text-slate-500 border border-slate-200'
    };
    const labels = {
        lead: 'Nuevo',
        qualified: 'Calificado',
        project: 'Proyecto',
        lost: 'Archivado'
    };
    return (
        <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium", statuses[status])}>
            {labels[status] || status}
        </span>
    );
};

const LeadCard = ({ lead }) => (
    <motion.div 
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
    >
        <div className="flex items-start justify-between mb-4">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <StatusBadge status={lead.status} />
        </div>

        <div className="flex-1 space-y-1 mb-4">
            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">{lead.name}</h3>
            <p className="text-xs text-slate-500">{lead.event_type}</p>
        </div>

        <div className="flex flex-col space-y-2 pt-4 border-t border-slate-50">
            <div className="flex items-center text-slate-400 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                <span>{lead.tentative_date ? new Date(lead.tentative_date).toLocaleDateString() : 'Fecha por definir'}</span>
            </div>
            <div className="flex items-center text-slate-400 text-xs">
                <Mail className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
            </div>
        </div>

        <Link 
            href={`/admin/leads/${lead.id}`}
            className="mt-4 w-full flex items-center justify-center py-2 text-xs font-medium text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
        >
            Ver detalles <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
    </motion.div>
);

const Column = ({ title, leads, status, dotColor }) => (
    <div className="flex flex-col min-w-[300px] max-w-[300px] h-full">
        <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center space-x-2">
                <div className={clsx("w-2 h-2 rounded-full", dotColor)} />
                <h2 className="font-semibold text-sm text-slate-700">{title}</h2>
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-medium">
                    {leads.length}
                </span>
            </div>
            <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-all">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-1 pb-10">
            <AnimatePresence>
                {leads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} />
                ))}
            </AnimatePresence>
            <button className="w-full h-12 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:border-primary-300 hover:text-primary-500 transition-all text-sm font-medium gap-1.5">
                <Plus className="w-4 h-4" /> Agregar
            </button>
        </div>
    </div>
);

export default function Index({ leads }) {
    const columns = [
        { title: 'Nuevos Leads', status: 'lead', dotColor: 'bg-blue-500' },
        { title: 'Calificados', status: 'qualified', dotColor: 'bg-amber-500' },
        { title: 'Proyecto Activo', status: 'project', dotColor: 'bg-green-500' },
        { title: 'Archivados', status: 'lost', dotColor: 'bg-slate-400' }
    ];

    return (
        <AdminLayout>
            <div className="flex flex-col h-full space-y-6">
                <Head title="Colecciones" />
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">Colecciones</h1>
                        <p className="text-sm text-slate-500">Administra tu pipeline de ventas y clientes</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                            <button className="px-3 py-1.5 bg-white rounded-md text-sm font-medium shadow-sm text-slate-700 flex items-center gap-1.5">
                                <LayoutGrid className="w-3.5 h-3.5 text-primary-500" /> Kanban
                            </button>
                            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                <ListFilter className="w-3.5 h-3.5" /> Lista
                            </button>
                        </div>
                        <Link href="/admin/leads/create" className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5">
                            <Plus className="w-4 h-4" /> Nuevo
                        </Link>
                    </div>
                </div>

                {/* Filters bar */}
                <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-5 px-2">
                        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                            <Filter className="w-4 h-4" />
                            <span className="text-xs font-medium">Filtrar</span>
                        </button>
                        <button className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium">Por fecha</span>
                        </button>
                        <div className="w-px h-4 bg-slate-200" />
                        <span className="text-xs text-slate-400 font-medium">Total: {leads.length} leads</span>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input 
                            type="text"
                            placeholder="Buscar..." 
                            className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all w-48"
                        />
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 flex space-x-5 overflow-x-auto no-scrollbar pb-6">
                    {columns.map(col => (
                        <Column 
                            key={col.status} 
                            title={col.title} 
                            status={col.status}
                            dotColor={col.dotColor}
                            leads={leads.filter(l => l.status === col.status)}
                        />
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
