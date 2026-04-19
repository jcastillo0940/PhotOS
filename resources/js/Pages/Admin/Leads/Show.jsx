import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { clsx } from 'clsx';
import {
    AlertCircle,
    Calendar,
    ChevronLeft,
    ClipboardList,
    Copy,
    FileText,
    Mail,
    PencilLine,
    Send,
    Star,
    Type,
    Wallet,
} from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

const statusConfig = {
    lead: { label: 'Nuevo Lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    qualified: { label: 'Calificado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    project: { label: 'Proyecto', color: 'bg-green-50 text-green-700 border-green-200' },
    lost: { label: 'Archivado', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function QuestionField({ question, value, onChange }) {
    if (question.type === 'textarea') {
        return <textarea value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20" rows={4} />;
    }

    if (question.type === 'select') {
        return (
            <select value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20">
                <option value="">Seleccionar</option>
                {question.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        );
    }

    return <input type={question.type === 'number' ? 'number' : 'text'} value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20" />;
}

function Field({ label, children }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{label}</span>
            {children}
        </label>
    );
}

export default function Show({ lead, eventTypes = [] }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const currentStatus = statusConfig[lead.status] || statusConfig.lead;
    const briefingForm = useForm({ answers: lead.briefing_answers || {} });
    const leadForm = useForm({
        name: lead.name || '',
        email: lead.email || '',
        event_type: lead.event_type || '',
        tentative_date: lead.tentative_date || '',
        phone: lead.responses?.phone || '',
        message: lead.responses?.message || '',
        client_document: lead.responses?.client_document || '',
    });

    const updateStatus = (status) => router.put(`/admin/leads/${lead.id}/status`, { status });
    const updateBriefingAnswer = (key, value) => briefingForm.setData('answers', { ...briefingForm.data.answers, [key]: value });
    const copyLink = async (url) => { if (url) await navigator.clipboard.writeText(url); };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <Head title={`Lead: ${lead.name}`} />

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link href="/admin/leads" className="group flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900">
                        <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Volver a Leads
                    </Link>

                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => setIsEditing((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                            <PencilLine className="h-4 w-4" />
                            {isEditing ? 'Cerrar edicion' : 'Editar lead'}
                        </button>
                        <Link href={lead.project ? `/admin/projects/${lead.project.id}/management` : `/admin/leads/${lead.id}/accounting`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                            <Wallet className="h-4 w-4" />
                            {lead.project ? 'Crear / ver facturas' : 'Ver estado de cuenta'}
                        </Link>
                        <button type="button" onClick={() => router.post(`/admin/leads/${lead.id}/nps/send`)} className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2 text-sm font-semibold text-white">
                            <Star className="h-4 w-4" />
                            Enviar NPS
                        </button>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-2xl font-bold text-primary-700">
                                    {lead.name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{lead.name}</h1>
                                        <span className={clsx('rounded-full border px-3 py-1 text-xs font-semibold', currentStatus.color)}>{currentStatus.label}</span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600">Registrado el {new Date(lead.created_at).toLocaleDateString()} via sitio web.</p>
                                </div>
                            </div>

                            <div className="mt-8 grid gap-6 border-t border-slate-100 pt-8 sm:grid-cols-3">
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Email</p>
                                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Mail className="h-4 w-4 text-slate-500" /> <span className="truncate">{lead.email}</span></p>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Tipo de evento</p>
                                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Type className="h-4 w-4 text-slate-500" /> {lead.event_type}</p>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Fecha tentativa</p>
                                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Calendar className="h-4 w-4 text-slate-500" /> {lead.tentative_date ? new Date(lead.tentative_date).toLocaleDateString() : 'Por definir'}</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-6 sm:grid-cols-3">
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Telefono</p>
                                    <p className="text-sm font-medium text-slate-900">{lead.responses?.phone || 'No compartido'}</p>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Mensaje</p>
                                    <p className="text-sm leading-7 text-slate-800">{lead.responses?.message || 'Sin mensaje adicional.'}</p>
                                </div>
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Documento</p>
                                    <p className="text-sm font-medium text-slate-900">{lead.responses?.client_document || 'No registrado'}</p>
                                </div>
                            </div>
                        </section>

                        {isEditing && (
                            <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <PencilLine className="h-5 w-5 text-primary-600" />
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900">Editar lead</h2>
                                        <p className="mt-1 text-sm text-slate-600">Corrige tipo de evento, fecha y datos de contacto si el cliente lleno algo mal.</p>
                                    </div>
                                </div>

                                <form onSubmit={(e) => { e.preventDefault(); leadForm.put(`/admin/leads/${lead.id}`); }} className="mt-6 grid gap-5 md:grid-cols-2">
                                    <Field label="Nombre"><input value={leadForm.data.name} onChange={(e) => leadForm.setData('name', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></Field>
                                    <Field label="Email"><input type="email" value={leadForm.data.email} onChange={(e) => leadForm.setData('email', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></Field>
                                    <Field label="Tipo de evento">
                                        <select value={leadForm.data.event_type} onChange={(e) => leadForm.setData('event_type', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
                                            {eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Fecha tentativa"><input type="date" value={leadForm.data.tentative_date || ''} onChange={(e) => leadForm.setData('tentative_date', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></Field>
                                    <Field label="Telefono"><input value={leadForm.data.phone || ''} onChange={(e) => leadForm.setData('phone', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></Field>
                                    <Field label="Documento"><input value={leadForm.data.client_document || ''} onChange={(e) => leadForm.setData('client_document', e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" /></Field>
                                    <div className="md:col-span-2">
                                        <Field label="Mensaje">
                                            <textarea value={leadForm.data.message || ''} onChange={(e) => leadForm.setData('message', e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none" />
                                        </Field>
                                    </div>
                                    <div className="md:col-span-2">
                                        <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">Guardar cambios</button>
                                    </div>
                                </form>
                            </section>
                        )}

                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-5 text-sm font-semibold text-slate-900">Cambiar estado</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['lead', 'qualified', 'project', 'lost'].map((status) => (
                                        <button key={status} onClick={() => updateStatus(status)} className={clsx('rounded-xl border px-3 py-3 text-xs font-semibold transition-all', lead.status === status ? 'border-primary-500 bg-primary-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100')}>
                                            {statusConfig[status]?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="button" onClick={() => router.post(`/admin/leads/${lead.id}/convert`)} className="rounded-[1.8rem] bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-left shadow-sm">
                                <FileText className="mb-4 h-8 w-8 text-white/35" />
                                <h3 className="text-lg font-bold text-white">Convertir a proyecto</h3>
                                <p className="mt-2 text-sm leading-6 text-white/80">Si ya esta aprobado, conviertelo para habilitar contrato, facturas y gestion completa.</p>
                            </button>
                        </div>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Briefing del evento</p>
                                    <h3 className="mt-2 text-xl font-semibold text-slate-900">Formulario segun tipo de evento</h3>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">El briefing es opcional. Puedes enviarlo al cliente cuando lo necesites o manejarlo internamente desde el backoffice.</p>
                                </div>
                                {lead.briefing_url && (
                                    <button type="button" onClick={() => copyLink(lead.briefing_url)} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                        <Copy className="h-3.5 w-3.5" /> Copiar link
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-3">
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Estado</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{lead.briefing_completed_at ? 'Respondido' : lead.briefing_enabled ? 'Enviado / activo' : 'No enviado'}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tipo de plantilla</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{lead.event_type}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ultima respuesta</p>
                                    <p className="mt-2 text-lg font-semibold text-slate-900">{lead.briefing_completed_at ? new Date(lead.briefing_completed_at).toLocaleDateString() : 'Sin respuesta'}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button type="button" onClick={() => router.post(`/admin/leads/${lead.id}/briefing/send`)} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                    <Send className="h-4 w-4" /> Enviar briefing
                                </button>
                                <button type="button" onClick={() => router.post(`/admin/leads/${lead.id}/briefing/disable`)} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                    <AlertCircle className="h-4 w-4" /> Marcar como opcional
                                </button>
                            </div>

                            <div className="mt-8 grid gap-5 md:grid-cols-2">
                                {lead.briefing_template.map((question) => (
                                    <div key={question.key} className={question.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{question.label}{question.required ? ' *' : ''}</label>
                                        <QuestionField question={question} value={briefingForm.data.answers?.[question.key]} onChange={updateBriefingAnswer} />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <button type="button" onClick={() => briefingForm.put(`/admin/leads/${lead.id}/briefing`)} className="rounded-full bg-primary-600 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">Guardar briefing desde backend</button>
                                <p className="text-sm text-slate-700">{lead.briefing_completed_at ? `Respondido el ${new Date(lead.briefing_completed_at).toLocaleDateString()}` : 'Aun no recibido del cliente.'}</p>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
                            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Facturacion</h4>
                            <div className="mt-4 space-y-3 text-sm text-slate-800">
                                <p>Facturas: <span className="font-semibold">{lead.accounting?.invoices_count || 0}</span></p>
                                <p>Saldo abierto: <span className="font-semibold">${Number(lead.accounting?.open_balance || 0).toFixed(2)}</span></p>
                                {lead.project && <p>Proyecto activo: <span className="font-semibold">{lead.project.name}</span></p>}
                            </div>
                            <div className="mt-5 space-y-3">
                                <Link href={`/admin/leads/${lead.id}/accounting`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-800">
                                    <Wallet className="h-4 w-4" /> Abrir estado de cuenta
                                </Link>
                                {lead.project ? (
                                    <Link href={`/admin/projects/${lead.project.id}/management`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                        <FileText className="h-4 w-4" /> Crear factura desde gestion
                                    </Link>
                                ) : (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
                                        Para crear facturas primero convierte este lead en proyecto.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-[1.8rem] border border-amber-200 bg-amber-50 p-6">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <h4 className="mt-4 text-sm font-semibold text-amber-900">Que sigue aqui</h4>
                            <div className="mt-3 space-y-2 text-sm leading-6 text-amber-900/90">
                                <p>1. Corrige tipo de evento y fecha si el lead vino mal.</p>
                                <p>2. Decide si enviar briefing o manejarlo manualmente.</p>
                                <p>3. Convierte a proyecto para crear contrato y facturas.</p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
