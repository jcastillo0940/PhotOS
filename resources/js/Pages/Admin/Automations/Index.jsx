import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Bot, CheckCircle2, Clock3, Mail, Plus, Save, Trash2, Webhook } from 'lucide-react';

const triggerLabels = {
    lead_created: 'Lead entrante',
    project_created: 'Proyecto creado',
    gallery_published: 'Galeria publicada',
    days_before_event: 'Dias antes del evento',
    day_of_event: 'Dia del evento',
    days_after_event: 'Dias despues del evento',
    first_anniversary: 'Primer aniversario',
    invoice_overdue: 'Factura vencida',
};

export default function Index({ rules = [], tasks = [], runs = [], eventTypes = [], triggerOptions = [], actionOptions = [] }) {
    const { data, setData, post, processing, reset } = useForm({
        name: '',
        is_active: true,
        event_type: '',
        trigger_type: triggerOptions[0] || 'lead_created',
        trigger_offset_days: 0,
        action_type: actionOptions[0] || 'task',
        task_title: '',
        task_description: '',
        email_subject: '',
        email_body: '',
        recipient_email: '',
        webhook_url: '',
        priority: 'normal',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/admin/automations', {
            onSuccess: () => reset(),
        });
    };

    return (
        <AdminLayout>
            <Head title="Automatizaciones" />

            <div className="space-y-8">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Automatizaciones CRM</h1>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                            Reglas configurables estilo Kommo para tareas, correos y webhooks segun el tipo de evento y momentos clave del cliente.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/admin/automations/run')}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
                    >
                        <Bot className="h-4 w-4" />
                        Ejecutar ahora
                    </button>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
                    <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
                                <Plus className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">Nueva automatizacion</h2>
                                <p className="text-xs text-slate-500">Ejemplo: confirmar boda, avisar galeria publicada, enviar NPS, felicitar aniversario.</p>
                            </div>
                        </div>

                        <Field label="Nombre" value={data.name} onChange={(value) => setData('name', value)} />

                        <div className="grid gap-4 md:grid-cols-2">
                            <SelectField label="Tipo de evento" value={data.event_type} onChange={(value) => setData('event_type', value)} options={['', ...eventTypes]} blankLabel="Todos" />
                            <SelectField label="Disparador" value={data.trigger_type} onChange={(value) => setData('trigger_type', value)} options={triggerOptions.map((key) => ({ value: key, label: triggerLabels[key] || key }))} />
                            <SelectField label="Accion" value={data.action_type} onChange={(value) => setData('action_type', value)} options={actionOptions.map((key) => ({ value: key, label: key }))} />
                            <Field label="Dias offset" type="number" value={data.trigger_offset_days} onChange={(value) => setData('trigger_offset_days', value)} />
                        </div>

                        {data.action_type === 'task' && (
                            <>
                                <Field label="Titulo de tarea" value={data.task_title} onChange={(value) => setData('task_title', value)} placeholder="Confirmar hora con {client_name}" />
                                <TextArea label="Descripcion de tarea" value={data.task_description} onChange={(value) => setData('task_description', value)} placeholder="Proyecto: {project_name}" />
                            </>
                        )}

                        {data.action_type === 'email' && (
                            <>
                                <Field label="Asunto email" value={data.email_subject} onChange={(value) => setData('email_subject', value)} placeholder="Tus fotos de {event_type} ya estan listas" />
                                <Field label="Correo destino opcional" value={data.recipient_email} onChange={(value) => setData('recipient_email', value)} placeholder="Si se deja vacio usa el del cliente" />
                                <TextArea label="Cuerpo email" value={data.email_body} onChange={(value) => setData('email_body', value)} placeholder="Hola {client_name}, ya publicamos tu galeria..." />
                            </>
                        )}

                        {data.action_type === 'webhook' && (
                            <Field label="Webhook URL" value={data.webhook_url} onChange={(value) => setData('webhook_url', value)} placeholder="https://kommo-o-whatsapp.example/hook" />
                        )}

                        <p className="text-xs text-slate-400">Variables: {'{client_name} {client_email} {project_name} {event_type} {event_date} {invoice_number} {invoice_balance_due}'}</p>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Guardando...' : 'Crear automatizacion'}
                        </button>
                    </form>

                    <div className="space-y-6">
                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <h2 className="font-semibold text-slate-900">Reglas activas</h2>
                            <div className="mt-5 space-y-4">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">{triggerLabels[rule.trigger_type] || rule.trigger_type} · {rule.action_type} · {rule.event_type || 'Todos los eventos'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => router.put(`/admin/automations/${rule.id}`, { is_active: !rule.is_active })}
                                                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                                                >
                                                    {rule.is_active ? 'Activa' : 'Pausada'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => router.delete(`/admin/automations/${rule.id}`)}
                                                    className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <h2 className="font-semibold text-slate-900">Tareas generadas</h2>
                            <div className="mt-5 space-y-3">
                                {tasks.map((task) => (
                                    <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">{task.project_name || task.lead_name || 'CRM'}</p>
                                                {task.description && <p className="mt-2 text-sm text-slate-600">{task.description}</p>}
                                            </div>
                                            {task.status !== 'completed' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => router.put(`/admin/crm-tasks/${task.id}/complete`)}
                                                    className="rounded-full border border-slate-200 bg-white p-2 text-slate-600"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Completa</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <h2 className="font-semibold text-slate-900">Ultimas ejecuciones</h2>
                            <div className="mt-5 space-y-3">
                                {runs.map((run) => (
                                    <div key={run.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        {run.trigger_type.includes('gallery') ? <Webhook className="mt-0.5 h-4 w-4 text-slate-400" /> : run.trigger_type.includes('event') ? <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" /> : <Mail className="mt-0.5 h-4 w-4 text-slate-400" />}
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{run.rule_name}</p>
                                            <p className="mt-1 text-xs text-slate-500">{run.status} · {run.executed_at ? new Date(run.executed_at).toLocaleString() : 'Sin fecha'}</p>
                                            {run.message && <p className="mt-2 text-sm text-slate-600">{run.message}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            />
        </div>
    );
}

function TextArea({ label, value, onChange, placeholder = '' }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            <textarea
                rows={4}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options = [], blankLabel = null }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            >
                {blankLabel !== null && <option value="">{blankLabel}</option>}
                {options.map((option) => {
                    const normalized = typeof option === 'string' ? { value: option, label: option } : option;
                    return <option key={normalized.value} value={normalized.value}>{normalized.label}</option>;
                })}
            </select>
        </div>
    );
}
