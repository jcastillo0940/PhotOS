import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
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
    ArrowRight,
    Wallet,
    Send,
    ClipboardList,
    Star,
    Copy,
} from 'lucide-react';
import { clsx } from 'clsx';

const statusConfig = {
    lead: { label: 'Nuevo Lead', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    qualified: { label: 'Calificado', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    project: { label: 'Proyecto', color: 'bg-green-50 text-green-700 border-green-100' },
    lost: { label: 'Archivado', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function QuestionField({ question, value, onChange }) {
    if (question.type === 'textarea') {
        return (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(question.key, e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
                rows={4}
            />
        );
    }

    if (question.type === 'select') {
        return (
            <select
                value={value || ''}
                onChange={(e) => onChange(question.key, e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
            >
                <option value="">Seleccionar</option>
                {question.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        );
    }

    return (
        <input
            type={question.type === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(question.key, e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
        />
    );
}

export default function Show({ lead }) {
    const currentStatus = statusConfig[lead.status] || statusConfig.lead;
    const briefingForm = useForm({ answers: lead.briefing_answers || {} });

    const updateStatus = (status) => {
        router.put(`/admin/leads/${lead.id}/status`, { status });
    };

    const updateBriefingAnswer = (key, value) => {
        briefingForm.setData('answers', { ...briefingForm.data.answers, [key]: value });
    };

    const copyLink = async (url) => {
        if (!url) return;
        await navigator.clipboard.writeText(url);
    };

    return (
        <AdminLayout>
            <div className="flex flex-col space-y-8">
                <Head title={`Lead: ${lead.name}`} />

                <div className="flex items-center justify-between">
                    <Link
                        href="/admin/leads"
                        className="group flex items-center text-slate-500 hover:text-slate-900 transition-all text-sm font-medium"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver a Leads
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/admin/leads/${lead.id}/accounting`}
                            className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm inline-flex items-center gap-2"
                        >
                            <Wallet className="w-4 h-4" /> Ver facturacion / estado de cuenta
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.post(`/admin/leads/${lead.id}/briefing/send`)}
                            className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm inline-flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" /> Enviar briefing
                        </button>
                        <button
                            type="button"
                            onClick={() => router.post(`/admin/leads/${lead.id}/nps/send`)}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-all inline-flex items-center gap-2"
                        >
                            <Star className="w-4 h-4" /> Enviar NPS
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-600">
                                    {lead.name[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{lead.name}</h1>
                                        <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium border', currentStatus.color)}>
                                            {currentStatus.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        Registrado el {new Date(lead.created_at).toLocaleDateString()} via sitio web
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Telefono</p>
                                    <p className="text-sm font-medium text-slate-800">{lead.responses?.phone || 'No compartido'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Mensaje</p>
                                    <p className="text-sm text-slate-600 leading-7">{lead.responses?.message || 'Sin mensaje adicional.'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Documento</p>
                                    <p className="text-sm font-medium text-slate-800">{lead.responses?.client_document || 'No registrado'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <Zap className="w-4 h-4 text-primary-500" />
                                    <h3 className="font-semibold text-sm text-slate-800">Cambiar Estado</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {['lead', 'qualified', 'project', 'lost'].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => updateStatus(s)}
                                            className={clsx(
                                                'py-2.5 rounded-xl text-xs font-medium transition-all',
                                                lead.status === s
                                                    ? 'bg-primary-500 text-white shadow-sm'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200',
                                            )}
                                        >
                                            {statusConfig[s]?.label || s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => router.post(`/admin/leads/${lead.id}/convert`)}
                                className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-sm p-6 flex flex-col justify-between group cursor-pointer text-left"
                            >
                                <FileText className="w-8 h-8 text-white/30 mb-3" />
                                <div>
                                    <h3 className="text-white font-bold text-lg mb-1">Convertir a Proyecto</h3>
                                    <p className="text-white/70 text-sm mb-4">Genera contrato y portal de cliente.</p>
                                    <span className="inline-flex items-center text-white text-xs font-medium bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-all">
                                        Iniciar <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
                                    </span>
                                </div>
                            </button>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Briefing avanzado</p>
                                    <h3 className="mt-2 font-bold text-slate-800">Formulario segun tipo de evento</h3>
                                </div>
                                {lead.briefing_url && (
                                    <button
                                        type="button"
                                        onClick={() => copyLink(lead.briefing_url)}
                                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> Copiar link
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                {lead.briefing_template.map((question) => (
                                    <div key={question.key} className={question.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                            {question.label}{question.required ? ' *' : ''}
                                        </label>
                                        <QuestionField
                                            question={question}
                                            value={briefingForm.data.answers?.[question.key]}
                                            onChange={updateBriefingAnswer}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => briefingForm.put(`/admin/leads/${lead.id}/briefing`)}
                                    className="rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                                >
                                    Guardar desde backend
                                </button>
                                <p className="text-xs text-slate-500">
                                    {lead.briefing_completed_at
                                        ? `Respondido el ${new Date(lead.briefing_completed_at).toLocaleDateString()}`
                                        : 'Aun no recibido del cliente'}
                                </p>
                            </div>
                        </div>

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
                                        <p className="text-sm font-semibold text-slate-800 mb-0.5">Lead capturado via sitio web</p>
                                        <p className="text-xs text-slate-500">Formulario basico completado y listo para seguimiento.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-medium text-slate-700 mb-0.5">Formulario de briefing</p>
                                        <p className="text-xs text-slate-500">
                                            {lead.briefing_completed_at ? 'El cliente ya envio sus respuestas.' : 'Pendiente por completar.'}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-3">
                                            <button onClick={() => router.post(`/admin/leads/${lead.id}/briefing/send`)} className="text-primary-600 text-xs font-medium hover:underline">
                                                Reenviar cuestionario
                                            </button>
                                            {lead.briefing_url && (
                                                <button onClick={() => copyLink(lead.briefing_url)} className="text-slate-500 text-xs font-medium hover:underline">
                                                    Copiar link
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                        <Star className="w-5 h-5" />
                                    </div>
                                    <div className="pt-1">
                                        <p className="text-sm font-medium text-slate-700 mb-0.5">Encuesta de calificacion</p>
                                        <p className="text-xs text-slate-500">
                                            {lead.nps_completed_at
                                                ? `Respondida con ${lead.nps_score}/10`
                                                : 'Esperando respuesta del cliente...'}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-3">
                                            <button onClick={() => router.post(`/admin/leads/${lead.id}/nps/send`)} className="text-primary-600 text-xs font-medium hover:underline">
                                                Reenviar cuestionario
                                            </button>
                                            {lead.nps_url && (
                                                <button onClick={() => copyLink(lead.nps_url)} className="text-slate-500 text-xs font-medium hover:underline">
                                                    Copiar link
                                                </button>
                                            )}
                                        </div>
                                        {lead.nps_comment && (
                                            <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{lead.nps_comment}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Facturacion</h4>
                            <div className="space-y-3 text-sm text-slate-600">
                                <p>Facturas: <span className="font-semibold text-slate-800">{lead.accounting?.invoices_count || 0}</span></p>
                                <p>Saldo abierto: <span className="font-semibold text-slate-800">${Number(lead.accounting?.open_balance || 0).toFixed(2)}</span></p>
                                {lead.project && (
                                    <p>Proyecto activo: <span className="font-semibold text-slate-800">{lead.project.name}</span></p>
                                )}
                            </div>
                            <Link
                                href={`/admin/leads/${lead.id}/accounting`}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
                            >
                                <Wallet className="w-4 h-4" /> Abrir estado de cuenta
                            </Link>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-4">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <h4 className="font-semibold text-sm text-amber-800 mb-2">Seguimiento recomendado</h4>
                            <p className="text-xs text-amber-700 leading-relaxed mb-4">
                                Usa el briefing para cerrar datos importantes del evento y el NPS para medir la experiencia despues de entregar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
