import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    CalendarDays, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    Lock, 
    Plus, 
    Trash2, 
    X, 
    Calendar as CalendarIcon,
    Filter,
    FolderKanban,
    Sparkles,
    CheckCircle2,
    CalendarCheck
} from 'lucide-react';
import { Card, Badge, Button, Input, Drawer, StatsCard } from '@/Components/UI';

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const EVENT_STYLES = {
    session: 'primary',
    blocked: 'slate',
    tentative: 'warning',
};

export default function Index({ events, eventTypes = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [selectedEventType, setSelectedEventType] = useState('Todos');

    const { data, setData, post, processing, reset, errors } = useForm({
        id: null,
        title: '',
        start: '',
        end: '',
        type: 'blocked',
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startingDay = new Date(year, month, 1).getDay();

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const label = event.project?.lead?.event_type || event.title || '';
            return selectedEventType === 'Todos' || label.includes(selectedEventType);
        });
    }, [events, selectedEventType]);

    const eventsByDay = useMemo(() => {
        return filteredEvents.reduce((carry, event) => {
            const date = new Date(event.start);
            if (date.getMonth() !== month || date.getFullYear() !== year) return carry;
            const day = date.getDate();
            carry[day] = carry[day] || [];
            carry[day].push(event);
            return carry;
        }, {});
    }, [filteredEvents, month, year]);

    const openCreate = (day) => {
        const d = day || new Date().getDate();
        const start = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T10:00`;
        const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}T18:00`;
        setEditingEventId(null);
        setData({ id: null, title: '', start, end, type: 'blocked' });
        setIsDrawerOpen(true);
    };

    const openEdit = (event) => {
        setEditingEventId(event.id);
        setData({
            id: event.id,
            title: event.title || '',
            start: toDateTimeLocal(event.start),
            end: toDateTimeLocal(event.end),
            type: event.type || 'blocked',
        });
        setIsDrawerOpen(true);
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setEditingEventId(null);
        reset();
    };

    const submitEvent = (e) => {
        e.preventDefault();
        post('/admin/events', {
            preserveScroll: true,
            onSuccess: () => closeDrawer(),
        });
    };

    const handleDelete = () => {
        if (!confirm('¿Eliminar este registro de la agenda?')) return;
        router.delete(`/admin/events/${editingEventId}`, {
            preserveScroll: true,
            onSuccess: () => closeDrawer(),
        });
    };

    return (
        <AdminLayout>
            <Head title="Agenda del Estudio" />

            <div className="space-y-8">
                {/* Header Navigation */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Agenda Global</h2>
                        <p className="text-sm font-medium text-slate-500">Gestión de sesiones, bloqueos y disponibilidad.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} icon={ChevronLeft} />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-700 min-w-[140px] text-center">
                            {MONTHS[month]} {year}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} icon={ChevronRight} />
                        <div className="h-6 w-px bg-slate-100 mx-2" />
                        <Button onClick={() => openCreate()} icon={Plus} size="sm">Bloquear Fecha</Button>
                    </div>
                </div>

                {/* Calendar Layout */}
                <div className="grid gap-8 lg:grid-cols-4">
                    <div className="lg:col-span-3">
                        <Card noPadding className="border-none shadow-2xl shadow-slate-200/40 overflow-hidden">
                             {/* Week Headers */}
                            <div className="grid grid-cols-7 bg-slate-900 border-b border-white/5">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                                    <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Days */}
                            <div className="grid grid-cols-7">
                                {Array.from({ length: startingDay }).map((_, i) => (
                                    <div key={`empty-${i}`} className="min-h-[140px] border-b border-r border-slate-50 bg-slate-50/30" />
                                ))}

                                {Array.from({ length: totalDays }).map((_, i) => {
                                    const day = i + 1;
                                    const dayEvents = eventsByDay[day] || [];
                                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                                    return (
                                        <div
                                            key={day}
                                            onClick={() => openCreate(day)}
                                            className={clsx(
                                                'min-h-[140px] border-b border-r border-slate-50 p-3 transition-all duration-300 hover:bg-primary/5 cursor-pointer group',
                                                isToday && 'bg-primary/5 shadow-inner shadow-primary/10'
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className={clsx(
                                                    'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition-all',
                                                    isToday ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/20' : 'text-slate-400 group-hover:text-primary group-hover:scale-110'
                                                )}>
                                                    {day}
                                                </span>
                                                <Plus className="h-3 w-3 text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>

                                            <div className="space-y-1.5">
                                                {dayEvents.map((ev) => (
                                                    <div
                                                        key={ev.id}
                                                        onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                                                        className={clsx(
                                                            'rounded-xl border p-2 shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer',
                                                            ev.type === 'session' ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-100'
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <Badge variant={EVENT_STYLES[ev.type]} className="text-[7.5px] px-1.5 py-0">
                                                                {ev.type === 'session' ? 'SESIÓN' : 'BLOQUEO'}
                                                            </Badge>
                                                            <span className="text-[8px] font-black text-slate-400">{new Date(ev.start).getHours()}:00</span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-800 tracking-tight leading-tight line-clamp-2">
                                                            {ev.title}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card title="Filtros & Vista" subtitle="Personaliza tu perspectiva">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Evento</label>
                                <div className="space-y-2">
                                    {['Todos', ...eventTypes].map(t => (
                                        <button 
                                            key={t}
                                            onClick={() => setSelectedEventType(t)}
                                            className={clsx(
                                                'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all',
                                                selectedEventType === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                            )}
                                        >
                                            {t}
                                            <CalendarIcon className="h-3 w-3 opacity-40" />
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </Card>

                        <Card className="bg-slate-900 border-none text-white overflow-hidden p-0">
                            <div className="p-6">
                                <Sparkles className="h-8 w-8 text-primary mb-4" />
                                <h4 className="text-lg font-black tracking-tight leading-tight">Tu tiempo es tu activo más valioso.</h4>
                                <p className="mt-2 text-xs font-medium text-slate-400 leading-relaxed italic">
                                    Bloquea fechas personales para evitar reservas automáticas en la web.
                                </p>
                            </div>
                            <div className="px-6 py-4 bg-white/5 flex items-center gap-3">
                                <CalendarCheck className="h-4 w-4 text-green-500" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Disponibilidad Sincronizada</span>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Event Management Drawer */}
            <Drawer 
                isOpen={isDrawerOpen} 
                onClose={closeDrawer} 
                title={editingEventId ? 'Actualizar Agenda' : 'Nuevo Registro'}
            >
                <form onSubmit={submitEvent} className="space-y-6">
                    <Input 
                        label="Título / Descripción" 
                        value={data.title}
                        onChange={e => setData('title', e.target.value)}
                        placeholder="Ej. Sesión en playa o Vacaciones"
                        error={errors.title}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input 
                            type="datetime-local" 
                            label="Inicio" 
                            value={data.start}
                            onChange={e => setData('start', e.target.value)}
                            error={errors.start}
                        />
                        <Input 
                            type="datetime-local" 
                            label="Fin" 
                            value={data.end}
                            onChange={e => setData('end', e.target.value)}
                            error={errors.end}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Registro</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['session', 'blocked', 'tentative'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setData('type', t)}
                                    className={clsx(
                                        'rounded-xl border py-3 text-[10px] font-black uppercase tracking-[0.1em] transition-all',
                                        data.type === t ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                    )}
                                >
                                    {t === 'session' ? 'Sesión' : t === 'blocked' ? 'Bloqueo' : 'Tentativa'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                        {editingEventId ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Eliminar
                            </button>
                        ) : <div />}
                        
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={closeDrawer} type="button">Cancelar</Button>
                            <Button type="submit" loading={processing} icon={CalendarCheck}>
                                {editingEventId ? 'Actualizar' : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Drawer>
        </AdminLayout>
    );
}

function toDateTimeLocal(value) {
    if (!value) return '';
    const date = new Date(value);
    const pad = (part) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
