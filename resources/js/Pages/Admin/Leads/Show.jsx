import React from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Mail, 
    Calendar, 
    Type, 
    ChevronLeft, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Zap, 
    AlertCircle, 
    ArrowRight
} from 'lucide-react';
import { clsx } from 'clsx';

const statusConfig = {
    lead: { label: 'Nuevo Lead', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    qualified: { label: 'Calificado', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    project: { label: 'Proyecto', color: 'bg-green-50 text-green-700 border-green-100' },
    lost: { label: 'Archivado', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function Show({ lead }) {
    const updateStatus = (status) => {
        router.put(`/admin/leads/${lead.id}/status`, { status });
    };

    const currentStatus = statusConfig[lead.status] || statusConfig.lead;

    return (
        <AdminLayout>
            <div className="flex flex-col space-y-8">
                <Head title={`Lead: ${lead.name}`} />
                
                {/* Back nav */}
                <div className="flex items-center justify-between">
                    <Link 
                        href="/admin/leads"
                        className="group flex items-center text-slate-500 hover:text-slate-900 transition-all text-sm font-medium"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver a Colecciones
                    </Link>

                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            Agregar nota
                        </button>
                        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all">
                            Agendar llamada
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left column */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Profile card */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                                    {lead.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{lead.name}</h1>
                                        <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-medium border", currentStatus.color)}>
                                            {currentStatus.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Registrado el {new Date(lead.created_at).toLocaleDateString()} vía sitio web
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-slate-50">
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Email</p>
                                    <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        <span className="truncate">{lead.email}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tipo de Evento</p>
                                    <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                        <Type className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        {lead.event_type}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Fecha Tentativa</p>
                                    <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                        {lead.tentative_date ? new Date(lead.tentative_date).toLocaleDateString() : 'Por definir'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status + Convert */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <Zap className="w-4 h-4 text-primary-500" />
                                    <h3 className="font-semibold text-sm text-slate-800">Cambiar Estado</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['lead', 'qualified', 'project', 'lost'].map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => updateStatus(s)}
                                            className={clsx(
                                                "py-2.5 rounded-xl text-xs font-medium transition-all",
                                                lead.status === s 
                                                    ? "bg-primary-500 text-white shadow-sm" 
                                                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                                            )}
                                        >
                                            {statusConfig[s]?.label || s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-sm p-6 flex flex-col justify-between group cursor-pointer">
                                <FileText className="w-8 h-8 text-white/30 mb-3" />
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Convertir a Proyecto</h3>
                                    <p className="text-white/70 text-sm mb-4">Genera contrato y portal de cliente.</p>
                                    <span className="inline-flex items-center text-white text-xs font-medium bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-all">
                                        Iniciar <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-slate-800">Historial del Lead</h3>
                                <div className="flex items-center text-primary-600 text-xs font-medium gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    En tiempo real
                                </div>
                            </div>
                            <div className="space-y-6 relative">
                                <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-100" />
                                
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-semibold text-slate-800 mb-0.5">Lead capturado vía sitio web</p>
                                        <p className="text-xs text-slate-500">Formulario completado. Notificación enviada automáticamente.</p>
                                        <p className="text-xs text-slate-400 mt-1.5">{new Date(lead.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                        <Clock className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-medium text-slate-500 mb-0.5">Encuesta de calificación</p>
                                        <p className="text-xs text-slate-400 italic">Esperando respuesta del cliente...</p>
                                        <button className="mt-2 text-primary-600 text-xs font-medium hover:underline">
                                            Reenviar cuestionario
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Notas Internas</h4>
                            <textarea 
                                placeholder="Agrega una nota interna..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm h-36 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 resize-none placeholder-slate-400 transition-all"
                            />
                            <button className="w-full mt-3 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-medium text-slate-600 transition-all">
                                Guardar nota
                            </button>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-sm text-amber-800 mb-2">Inactividad detectada</h4>
                            <p className="text-xs text-amber-700 leading-relaxed mb-4">
                                Este lead lleva 3 días sin interacción.
                            </p>
                            <button className="w-full py-2.5 bg-amber-500 text-white rounded-xl text-xs font-semibold hover:bg-amber-600 transition-colors">
                                Hacer seguimiento manual
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
