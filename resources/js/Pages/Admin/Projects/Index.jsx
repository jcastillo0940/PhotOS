import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Briefcase,
    Calendar,
    MapPin,
    Clock,
    ArrowRight,
    Plus,
    UploadCloud,
    BadgeCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const StatusBadge = ({ status }) => {
    const statuses = {
        active: 'bg-blue-50 text-blue-700 border-blue-100',
        pending_payment: 'bg-amber-50 text-amber-700 border-amber-100',
        editing: 'bg-purple-50 text-purple-700 border-purple-100',
        delivered: 'bg-green-50 text-green-700 border-green-100',
    };
    const labels = {
        active: 'Activo',
        pending_payment: 'Pago pendiente',
        editing: 'Edición',
        delivered: 'Entregado',
    };
    return (
        <span className={clsx('px-2.5 py-1 rounded-full text-xs font-medium border', statuses[status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
            {labels[status] || status.replace('_', ' ')}
        </span>
    );
};

export default function Index({ projects, installationPlan }) {
    const [showDirectForm, setShowDirectForm] = useState(false);
    const { data, setData, post, processing, reset } = useForm({ client_name: '', project_name: '' });

    const submitDirect = (e) => {
        e.preventDefault();
        post('/admin/projects', {
            onSuccess: () => {
                setShowDirectForm(false);
                reset();
            },
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col space-y-8">
                <Head title="Proyectos" />

                <div className="flex items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">Proyectos</h1>
                        <p className="text-sm text-slate-500">Plan activo: <span className="font-medium text-slate-700">{installationPlan?.name}</span></p>
                    </div>
                    <div className="px-4 py-2.5 rounded-xl bg-white border border-slate-100 shadow-sm text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Plan</p>
                        <p className="text-sm font-semibold text-slate-700">{installationPlan?.price_label}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center text-primary-600 transition-colors">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <StatusBadge status={project.status} />
                                </div>
                                <h3 className="text-base font-semibold text-slate-800 mb-3 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center text-slate-400 text-xs gap-2">
                                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                        {project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Fecha por definir'}
                                    </div>
                                    <div className="flex items-center text-slate-400 text-xs gap-2">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        {project.location || 'Sin ubicación'}
                                    </div>
                                    <div className="flex items-center text-slate-400 text-xs gap-2">
                                        <BadgeCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                        {installationPlan?.name}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center text-slate-400 text-xs gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {project.contract?.status === 'signed' ? 'Contrato firmado' : 'Firma pendiente'}
                                </div>
                                <Link href={`/admin/projects/${project.id}`} className="flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 gap-1">
                                    Ver <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}

                    <Link href="/admin/leads" className="border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all space-y-3 group min-h-[180px]">
                        <Plus className="w-6 h-6" />
                        <span className="text-xs font-medium">Desde un Lead</span>
                    </Link>

                    {showDirectForm ? (
                        <motion.form
                            onSubmit={submitDirect}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-6 bg-white rounded-2xl border border-primary-200 shadow-sm flex flex-col justify-center min-h-[180px]"
                        >
                            <h4 className="font-semibold text-slate-800 mb-5 flex items-center gap-2 text-sm">
                                <UploadCloud className="w-4 h-4 text-primary-500" /> Subida directa
                            </h4>
                            <div className="space-y-3 mb-5">
                                <input
                                    type="text"
                                    placeholder="Nombre del cliente"
                                    required
                                    value={data.client_name}
                                    onChange={e => setData('client_name', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all"
                                />
                                <input
                                    type="text"
                                    placeholder="Nombre del proyecto"
                                    required
                                    value={data.project_name}
                                    onChange={e => setData('project_name', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mb-4">Se asignará el plan: {installationPlan?.name}</p>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowDirectForm(false)} className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm text-slate-600 transition-all">Cancelar</button>
                                <button disabled={processing} type="submit" className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-sm text-white font-medium transition-all">
                                    {processing ? 'Creando...' : 'Crear'}
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <button onClick={() => setShowDirectForm(true)} className="border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-primary-300 hover:text-primary-500 hover:bg-primary-50/30 transition-all space-y-3 group min-h-[180px]">
                            <UploadCloud className="w-6 h-6" />
                            <div className="text-center">
                                <span className="block text-xs font-medium">Subida directa</span>
                                <span className="block text-[11px] text-slate-400 mt-0.5">Sin pipeline de lead</span>
                            </div>
                        </button>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
