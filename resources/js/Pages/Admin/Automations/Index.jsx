import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Bot, 
    CheckCircle2, 
    Clock3, 
    Mail, 
    Plus, 
    Save, 
    Trash2, 
    Webhook, 
    Zap, 
    Activity, 
    History, 
    Settings2, 
    ChevronRight,
    PlayCircle,
    Power,
    MessageSquare,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import { Card, Badge, Button, Input, Drawer } from '@/Components/UI';
import { clsx } from 'clsx';

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

const ACTION_ICONS = {
    task: CheckCircle2,
    email: Mail,
    webhook: Webhook,
};

export default function Index({ rules = [], tasks = [], runs = [], eventTypes = [], triggerOptions = [], actionOptions = [] }) {
    const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
    
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

    const submit = (e) => {
        e.preventDefault();
        post('/admin/automations', {
            onSuccess: () => {
                reset();
                setIsCreateDrawerOpen(false);
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Automatizaciones CRM — PhotOS" />

            <div className="flex flex-col h-full space-y-8">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Zap className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Motor de Automatización</h2>
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            Orquesta flujos de trabajo inteligentes para tus leads, proyectos y ventas.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            icon={Bot}
                            onClick={() => router.post('/admin/automations/run')}
                        >
                            Ejecutar Ahora
                        </Button>
                        <Button onClick={() => setIsCreateDrawerOpen(true)} icon={Plus}>
                            Nueva Regla
                        </Button>
                    </div>
                </div>

                <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
                    <div className="space-y-8">
                        {/* Summary Stats */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <StatCard 
                                icon={Activity} 
                                label="Reglas Activas" 
                                value={rules.filter(r => r.is_active).length} 
                                detail={`${rules.length} reglas configuradas`}
                                color="cyan"
                            />
                            <StatCard 
                                icon={CheckCircle2} 
                                label="Tareas Pendientes" 
                                value={tasks.filter(t => t.status !== 'completed').length} 
                                detail="Acciones CRM por ejecutar"
                                color="indigo"
                            />
                            <StatCard 
                                icon={History} 
                                label="Ejecuciones" 
                                value={runs.length} 
                                detail="Últimas 24 horas"
                                color="slate"
                            />
                        </div>

                        {/* Rules Section */}
                        <Card 
                            title="Lógica de Negocio" 
                            subtitle="Flujos inteligentes de respuesta y seguimiento"
                            decoration={<Plus className="h-24 w-24 text-primary/5 absolute -right-6 -bottom-6" />}
                        >
                            <div className="grid gap-4">
                                {rules.length > 0 ? rules.map((rule) => (
                                    <RuleCard key={rule.id} rule={rule} />
                                )) : (
                                    <div className="py-16 text-center">
                                        <Bot className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sin reglas activas</p>
                                        <button 
                                            onClick={() => setIsCreateDrawerOpen(true)}
                                            className="mt-4 text-xs font-bold text-primary hover:underline"
                                        >
                                            Crea tu primera automatización
                                        </button>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Recent Tasks */}
                        <Card title="Cola de Tareas CRM" subtitle="Acciones manuales generadas por el motor">
                            <div className="grid gap-4 md:grid-cols-2">
                                {tasks.length > 0 ? tasks.map((task) => (
                                    <TaskCard key={task.id} task={task} />
                                )) : (
                                    <div className="col-span-full py-12 text-center text-slate-400">
                                         <p className="text-[10px] font-black uppercase tracking-widest">No hay tareas pendientes</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Operational Sidebar */}
                    <div className="space-y-6">
                        <Card title="Historial de Motor" subtitle="Logs recientes de ejecución">
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {runs.length > 0 ? runs.map((run) => (
                                    <RunItem key={run.id} run={run} />
                                )) : (
                                    <div className="py-8 text-center text-slate-300">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Sin registros recientes</p>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-slate-50">
                                    <button className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                                        Ver logs completos
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-slate-900 border-none shadow-xl shadow-slate-900/10">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-white tracking-tight leading-none uppercase italic text-sm mb-2">PhotOS Neural</h4>
                                    <p className="text-[11px] text-white/50 font-medium leading-relaxed italic">
                                        Usa variables dinámicas {'{client_name}'} para personalizar correos y tareas.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Create Drawer */}
            <Drawer 
                isOpen={isCreateDrawerOpen} 
                onClose={() => setIsCreateDrawerOpen(false)}
                title="Nueva Automatización"
                subtitle="Define el disparador y la acción automática"
            >
                <form onSubmit={submit} className="space-y-6 pb-20">
                    <Input 
                        label="Nombre de la Regla" 
                        placeholder="Ej. Confirmación de Boda Automática"
                        value={data.name}
                        onChange={v => setData('name', v.target.value)}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Evento</label>
                            <select 
                                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                value={data.event_type}
                                onChange={v => setData('event_type', v.target.value)}
                            >
                                <option value="">Todos los eventos</option>
                                {eventTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Disparador</label>
                            <select 
                                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                value={data.trigger_type}
                                onChange={v => setData('trigger_type', v.target.value)}
                            >
                                {triggerOptions.map(opt => <option key={opt} value={opt}>{triggerLabels[opt] || opt}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Acción</label>
                            <select 
                                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                value={data.action_type}
                                onChange={v => setData('action_type', v.target.value)}
                            >
                                {actionOptions.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <Input 
                            label="Días de Offset" 
                            type="number"
                            value={data.trigger_offset_days}
                            onChange={v => setData('trigger_offset_days', v.target.value)}
                        />
                    </div>

                    <div className="pt-4 border-t border-slate-50 space-y-4">
                        {data.action_type === 'task' && (
                            <>
                                <Input label="Título de Tarea" placeholder="Ej. Confirmar hora con {client_name}" value={data.task_title} onChange={v => setData('task_title', v.target.value)} />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción</label>
                                    <textarea 
                                        rows={3}
                                        value={data.task_description}
                                        onChange={v => setData('task_description', v.target.value)}
                                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                    />
                                </div>
                            </>
                        )}

                        {data.action_type === 'email' && (
                            <>
                                <Input label="Asunto del Correo" value={data.email_subject} onChange={v => setData('email_subject', v.target.value)} />
                                <Input label="Recipient (Opcional)" value={data.recipient_email} onChange={v => setData('recipient_email', v.target.value)} />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cuerpo del Mensaje</label>
                                    <textarea 
                                        rows={5}
                                        value={data.email_body}
                                        onChange={v => setData('email_body', v.target.value)}
                                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none resize-none"
                                    />
                                </div>
                            </>
                        )}

                        {data.action_type === 'webhook' && (
                            <Input label="Webhook URL" value={data.webhook_url} onChange={v => setData('webhook_url', v.target.value)} />
                        )}
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-50">
                        <Button fullWidth type="submit" loading={processing}>Activar Automatización</Button>
                    </div>
                </form>
            </Drawer>
        </AdminLayout>
    );
}

function StatCard({ icon: Icon, label, value, detail, color = 'cyan' }) {
    const colors = {
        cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        slate: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    };
    
    return (
        <div className="p-6 rounded-[1.8rem] bg-white border border-slate-100 group hover:translate-y-[-4px] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${colors[color]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-2">{label}</p>
            <h4 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{value}</h4>
            <p className="text-[11px] font-medium text-slate-500 truncate">{detail}</p>
        </div>
    );
}

function RuleCard({ rule }) {
    const ActionIcon = ACTION_ICONS[rule.action_type] || Bot;

    return (
        <div className="p-5 rounded-[1.8rem] bg-white border border-slate-100 hover:border-primary/20 transition-all group flex items-start gap-4 shadow-sm hover:shadow-lg hover:shadow-primary/5">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                <ActionIcon className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <h5 className="font-black text-sm text-slate-800 truncate uppercase tracking-tight italic">{rule.name}</h5>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => router.put(`/admin/automations/${rule.id}`, { is_active: !rule.is_active })}
                            className={clsx(
                                'h-8 w-8 rounded-xl flex items-center justify-center transition-all',
                                rule.is_active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'
                            )}
                        >
                            <Power className="h-4 w-4" />
                        </button>
                        <button 
                             onClick={() => { if(window.confirm('Eliminar regla?')) router.delete(`/admin/automations/${rule.id}`); }}
                             className="h-8 w-8 rounded-xl bg-rose-50 text-rose-300 hover:text-rose-500 flex items-center justify-center transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="primary" className="text-[8px] font-black px-1.5 py-0 uppercase">
                        {triggerLabels[rule.trigger_type] || rule.trigger_type}
                    </Badge>
                     <div className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">
                        {rule.event_type || 'GLOBAL'} · {rule.action_type.toUpperCase()}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className={clsx(
                        'text-[10px] font-black uppercase tracking-widest italic',
                        rule.is_active ? 'text-primary animate-pulse' : 'text-slate-400'
                    )}>
                        {rule.is_active ? 'Monitoreando' : 'Pausado'}
                    </span>
                </div>
            </div>
        </div>
    );
}

function TaskCard({ task }) {
    return (
         <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:bg-white transition-all group">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                    <h6 className="font-black text-sm text-slate-800 truncate uppercase tracking-tight">{task.title}</h6>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {task.project_name || task.lead_name || 'CRM'}
                    </p>
                </div>
                {task.status !== 'completed' ? (
                     <button
                        onClick={() => router.put(`/admin/crm-tasks/${task.id}/complete`)}
                        className="h-8 w-8 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 flex items-center justify-center transition-all shadow-sm"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                    </button>
                ) : <Badge variant="success">OK</Badge>}
            </div>
            {task.description && (
                <p className="text-xs text-slate-500 font-medium leading-relaxed bg-white/50 p-3 rounded-xl border border-white">
                    {task.description}
                </p>
            )}
        </div>
    );
}

function RunItem({ run }) {
    const isError = run.status === 'error';

    return (
        <div className="flex items-start gap-3 group">
            <div className={clsx(
                "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all",
                isError ? "bg-rose-50 text-rose-500" : "bg-primary/5 text-primary"
            )}>
                {run.trigger_type.includes('email') ? <Mail className="h-3.5 w-3.5" /> : run.trigger_type.includes('webhook') ? <Webhook className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
                 <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tight">{run.rule_name}</p>
                    <p className="text-[9px] font-medium text-slate-400 uppercase shrink-0">
                        {run.executed_at ? new Date(run.executed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                    </p>
                 </div>
                 <p className={clsx(
                     "text-[9px] font-bold leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all uppercase tracking-wide",
                     isError ? "text-rose-500" : "text-slate-500"
                 )}>
                     {run.message || (isError ? 'Error en ejecución flow' : 'Acción ejecutada correctamente')}
                 </p>
            </div>
        </div>
    );
}
;
}
