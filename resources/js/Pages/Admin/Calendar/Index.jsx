import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Lock, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_STYLES = {
    session: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blocked: 'border-slate-200 bg-slate-100 text-slate-700',
    tentative: 'border-amber-200 bg-amber-50 text-amber-700',
};

export default function Index({ events, eventTypes = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null);
    const [selectedEventType, setSelectedEventType] = useState('Todos');

    const { data, setData, post, processing, reset } = useForm({
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
            if (date.getMonth() !== month || date.getFullYear() !== year) {
                return carry;
            }

            const day = date.getDate();
            carry[day] = carry[day] || [];
            carry[day].push(event);

            return carry;
        }, {});
    }, [filteredEvents, month, year]);

    const openCreateModal = (day) => {
        const start = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00`;
        const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T18:00`;

        setEditingEventId(null);
        setSelectedDay(day);
        setData({
            id: null,
            title: '',
            start,
            end,
            type: 'blocked',
        });
        setShowModal(true);
    };

    const openEditModal = (event) => {
        setEditingEventId(event.id);
        setSelectedDay(new Date(event.start).getDate());
        setData({
            id: event.id,
            title: event.title || '',
            start: toDateTimeLocal(event.start),
            end: toDateTimeLocal(event.end),
            type: event.type || 'blocked',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEventId(null);
        setSelectedDay(null);
        reset();
    };

    const submitEvent = (event) => {
        event.preventDefault();
        post('/admin/events', {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const deleteEvent = (eventId) => {
        if (!window.confirm('Delete this blocked date or session?')) return;

        router.delete(`/admin/events/${eventId}`, {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    return (
        <AdminLayout>
            <Head title="Agenda" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Calendar</p>
                            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Agenda del estudio</h1>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                                Desde aqui puedes bloquear fechas, editar reservas existentes y mantener una vista clara de disponibilidad
                                sin crear duplicados por accidente.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <select
                                value={selectedEventType}
                                onChange={(event) => setSelectedEventType(event.target.value)}
                                className="rounded-full border border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                            >
                                {['Todos', ...eventTypes].map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:text-slate-900">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <div className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900">
                                {MONTHS[month]} {year}
                            </div>
                            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:text-slate-900">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                            <button onClick={() => openCreateModal(new Date().getDate())} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                <Plus className="h-4 w-4" />
                                Bloquear fecha
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="py-4 text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {Array.from({ length: startingDay }).map((_, index) => (
                            <div key={`empty-${index}`} className="min-h-[150px] border-b border-r border-slate-100 bg-slate-50/60" />
                        ))}

                        {Array.from({ length: totalDays }).map((_, index) => {
                            const day = index + 1;
                            const dayEvents = eventsByDay[day] || [];
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                            return (
                                <div
                                    key={day}
                                    className={clsx(
                                        'min-h-[150px] border-b border-r border-slate-100 p-4 transition hover:bg-slate-50',
                                        isToday && 'bg-primary-50/60'
                                    )}
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <button
                                            onClick={() => openCreateModal(day)}
                                            className={clsx(
                                                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition',
                                                isToday ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-700'
                                            )}
                                        >
                                            {day}
                                        </button>
                                        <button onClick={() => openCreateModal(day)} className="text-slate-300 transition hover:text-slate-600">
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {dayEvents.map((event) => (
                                            <button
                                                key={event.id}
                                                onClick={() => openEditModal(event)}
                                                className={clsx(
                                                    'w-full rounded-[1rem] border px-3 py-2 text-left transition hover:shadow-sm',
                                                    EVENT_STYLES[event.type] || EVENT_STYLES.blocked
                                                )}
                                            >
                                                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em]">{event.type} · {event.status || 'pending'}</p>
                                                <p className="mt-1 truncate text-sm font-medium">{event.title}</p>
                                                <p className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] opacity-70">
                                                    {event.project?.lead?.event_type || 'Sin tipo'}
                                                </p>
                                                <p className="mt-1 text-xs opacity-70">{timeRange(event.start, event.end)}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-3">
                    <InfoCard icon={CalendarDays} title="Sesiones">
                        Los eventos ligados a proyectos pueden abrirse y editarse desde esta misma agenda.
                    </InfoCard>
                    <InfoCard icon={Lock} title="Bloqueos">
                        Los bloqueos manuales ya se actualizan sobre el mismo registro cuando editas uno existente.
                    </InfoCard>
                    <InfoCard icon={Clock3} title="Flujo">
                        Un click sobre el dia crea un evento nuevo. Un click sobre una tarjeta existente la edita.
                    </InfoCard>
                </section>
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-6 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl"
                        >
                            <div className="mb-8 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                                        {editingEventId ? 'Editar evento' : 'Nuevo evento'}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                                        {editingEventId ? 'Actualizar agenda' : `Bloqueo o reserva para el dia ${selectedDay}`}
                                    </h2>
                                </div>
                                <button onClick={closeModal} className="rounded-full border border-slate-200 p-3 text-slate-500 transition hover:text-slate-900">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <form onSubmit={submitEvent} className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Titulo
                                    </label>
                                    <input
                                        type="text"
                                        value={data.title}
                                        onChange={(event) => setData('title', event.target.value)}
                                        required
                                        className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary-300"
                                        placeholder="Wedding day coverage"
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Inicio
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.start}
                                            onChange={(event) => setData('start', event.target.value)}
                                            required
                                            className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Fin
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={data.end}
                                            onChange={(event) => setData('end', event.target.value)}
                                            required
                                            className="w-full rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-primary-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                        Tipo
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['session', 'blocked', 'tentative'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setData('type', type)}
                                                className={clsx(
                                                    'rounded-[1rem] border px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition',
                                                    data.type === type
                                                        ? 'border-slate-900 bg-slate-900 text-white'
                                                        : 'border-slate-200 bg-slate-50 text-slate-600'
                                                )}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                    {editingEventId ? (
                                        <button
                                            type="button"
                                            onClick={() => deleteEvent(editingEventId)}
                                            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </button>
                                    ) : <span />}

                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={closeModal} className="rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            {processing ? 'Guardando...' : editingEventId ? 'Actualizar' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}

function toDateTimeLocal(value) {
    if (!value) return '';

    const date = new Date(value);
    const pad = (part) => String(part).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function timeRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);

    return `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function InfoCard({ icon: Icon, title, children }) {
    return (
        <article className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">{children}</p>
        </article>
    );
}
