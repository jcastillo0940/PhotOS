import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import AvailabilityCalendar from '@/Components/AvailabilityCalendar';
import { buildSlots } from '@/lib/availability';
import { ChevronLeft, Save, User, Mail, Phone, Calendar as CalendarIcon, Clock, MessageSquare, Stamp, Sparkles } from 'lucide-react';
import { Card, Input, Button, Badge } from '@/Components/UI';

export default function Create({ eventTypes = [], busyCalendarEvents = [], businessHours, availabilitySettings }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        event_type: eventTypes[0] || '',
        tentative_date: '',
        tentative_time: '',
        phone: '',
        client_document: '',
        message: '',
    });

    const availableSlots = React.useMemo(
        () => buildSlots(data.tentative_date, busyCalendarEvents, businessHours, availabilitySettings),
        [data.tentative_date, busyCalendarEvents, businessHours, availabilitySettings],
    );

    React.useEffect(() => {
        if (!availableSlots.includes(data.tentative_time)) {
            setData('tentative_time', availableSlots[0] || '');
        }
    }, [availableSlots]);

    const submit = (e) => {
        e.preventDefault();
        post('/admin/leads');
    };

    return (
        <AdminLayout>
            <Head title="Nuevo Lead Manual — CRM" />

            <div className="space-y-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-all">
                            <ChevronLeft className="h-3.5 w-3.5" /> Volver al CRM
                        </Link>
                        <h2 className="mt-2 text-2xl font-black text-slate-800 tracking-tight">Registro Manual de Lead</h2>
                        <p className="text-sm font-medium text-slate-500">Ingresa prospectos recibidos por canales externos.</p>
                    </div>
                    <Button onClick={submit} loading={processing} icon={Save}>
                        Registrar Prospecto
                    </Button>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Primary Info */}
                        <Card title="Información del Cliente" subtitle="Datos básicos de contacto e identificación">
                            <div className="grid gap-6 sm:grid-cols-2">
                                <Input 
                                    label="Nombre Completo" 
                                    icon={User}
                                    value={data.name} 
                                    onChange={v => setData('name', v.target.value)}
                                    error={errors.name}
                                    placeholder="Ej. Juan Pérez"
                                />
                                <Input 
                                    label="Correo Electrónico" 
                                    icon={Mail}
                                    type="email"
                                    value={data.email} 
                                    onChange={v => setData('email', v.target.value)}
                                    error={errors.email}
                                />
                                <Input 
                                    label="Teléfono / WhatsApp" 
                                    icon={Phone}
                                    value={data.phone} 
                                    onChange={v => setData('phone', v.target.value)}
                                    error={errors.phone}
                                />
                                <Input 
                                    label="Documento de Identidad" 
                                    icon={Stamp}
                                    value={data.client_document} 
                                    onChange={v => setData('client_document', v.target.value)}
                                    error={errors.client_document}
                                    placeholder="CIF, RUC, Cédula"
                                />
                            </div>
                        </Card>

                        {/* Event Details & Availability */}
                        <Card title="Agendamiento y Evento" subtitle="Define la fecha tentativa y tipo de servicio">
                             <div className="space-y-6">
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Servicio</label>
                                        <div className="relative group">
                                            <select 
                                                value={data.event_type}
                                                onChange={e => setData('event_type', e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:bg-white transition-all appearance-none"
                                            >
                                                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                                                <ChevronLeft className="h-4 w-4 -rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hora Tentativa</label>
                                        <div className="relative group">
                                            <select 
                                                disabled={!data.tentative_date || availableSlots.length === 0}
                                                value={data.tentative_time}
                                                onChange={e => setData('tentative_time', e.target.value)}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-primary focus:bg-white transition-all appearance-none disabled:opacity-50"
                                            >
                                                <option value="">{data.tentative_date ? 'Seleccionar hora' : 'Elige una fecha primero'}</option>
                                                {availableSlots.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                        {errors.tentative_time && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.tentative_time}</p>}
                                    </div>
                                </div>

                                <div className="rounded-[1.8rem] overflow-hidden border border-slate-100 shadow-sm">
                                    <AvailabilityCalendar
                                        value={data.tentative_date}
                                        onChange={v => setData('tentative_date', v)}
                                        busyEvents={busyCalendarEvents}
                                        businessHours={businessHours}
                                        availabilitySettings={availabilitySettings}
                                    />
                                </div>
                             </div>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        {/* Message / Notes */}
                        <Card title="Notas del Lead" subtitle="Detalles adicionales o requerimientos">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensaje de Referencia</span>
                                </div>
                                <textarea
                                    rows={8}
                                    value={data.message}
                                    onChange={e => setData('message', e.target.value)}
                                    className="w-full rounded-[1.8rem] border border-slate-200 bg-slate-50/50 px-6 py-5 text-sm font-medium text-slate-700 outline-none focus:border-primary focus:bg-white transition-all"
                                    placeholder="Describe lo conversado con el cliente..."
                                />
                                 {errors.message && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.message}</p>}
                            </div>
                        </Card>

                        {/* Status Preview */}
                        <Card noPadding className="bg-primary border-none shadow-2xl shadow-primary/20 text-white overflow-hidden">
                            <div className="p-6 relative">
                                <Sparkles className="absolute -right-4 -top-4 h-24 w-24 text-white/10 rotate-12" />
                                <Badge variant="white" className="mb-4 text-primary font-black uppercase tracking-[0.2em] text-[8px]">Próximo Paso</Badge>
                                <h4 className="text-lg font-black tracking-tight leading-snug">Una vez creado, podrás calificarlo o convertirlo en Proyecto.</h4>
                                <p className="mt-3 text-xs font-medium text-white/80 leading-relaxed italic">
                                    "El éxito de una sesión comienza con una gestión impecable del contacto inicial."
                                </p>
                            </div>
                            <div className="px-6 py-4 bg-white/10 backdrop-blur-sm border-t border-white/10">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span>Estado Inicial:</span>
                                    <Badge variant="white" className="text-[9px]">Nuevo Lead</Badge>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
