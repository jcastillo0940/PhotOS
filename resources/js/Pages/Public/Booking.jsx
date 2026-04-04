import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { CalendarDays, Clock3, ShieldCheck } from 'lucide-react';

export default function Booking({ events = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        event_type: 'Portrait',
        start: '',
        end: '',
        message: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/booking');
    };

    return (
        <div className="min-h-screen bg-[#f7f3ee] px-6 py-10 text-[#241b16] md:px-10">
            <Head title="Booking" />

            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_.9fr]">
                <section className="rounded-[2rem] bg-white p-8 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-[#8b6d54]">Booking</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight">Reserva una sesion sin bloquear el horario hasta confirmar</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b594c]">
                        El horario que elijas queda como pendiente. Solo se bloquea cuando el estudio confirma la sesion o el pago.
                    </p>

                    <form onSubmit={submit} className="mt-8 space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Nombre" value={data.name} onChange={(value) => setData('name', value)} error={errors.name} />
                            <Field label="Email" type="email" value={data.email} onChange={(value) => setData('email', value)} error={errors.email} />
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Telefono" value={data.phone} onChange={(value) => setData('phone', value)} error={errors.phone} />
                            <Field label="Tipo de sesion" value={data.event_type} onChange={(value) => setData('event_type', value)} error={errors.event_type} />
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Inicio" type="datetime-local" value={data.start} onChange={(value) => setData('start', value)} error={errors.start} />
                            <Field label="Fin" type="datetime-local" value={data.end} onChange={(value) => setData('end', value)} error={errors.end} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6d54]">Detalles</label>
                            <textarea
                                value={data.message}
                                onChange={(event) => setData('message', event.target.value)}
                                rows={5}
                                className="w-full rounded-[1.5rem] border border-[#e6dbcf] bg-[#faf6f1] px-4 py-4 text-sm outline-none"
                                placeholder="Cuéntanos el tipo de sesion, locacion o idea general."
                            />
                            {errors.message && <p className="text-sm text-rose-600">{errors.message}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-[#241b16] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#3a2b22] disabled:opacity-60"
                        >
                            {processing ? 'Enviando...' : 'Solicitar horario'}
                        </button>
                    </form>
                </section>

                <section className="space-y-6">
                    <article className="rounded-[2rem] bg-[#241b16] p-8 text-white shadow-sm">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-[#d8b48b]" />
                            <p className="text-xs uppercase tracking-[0.28em] text-white/70">Estado de reserva</p>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-white/80">
                            Todas las solicitudes del formulario entran en estado pendiente. No se bloquea el calendario público hasta que el estudio confirme.
                        </p>
                    </article>

                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="h-5 w-5 text-[#8b6d54]" />
                            <h2 className="text-lg font-semibold">Horarios ya confirmados</h2>
                        </div>
                        <div className="mt-6 space-y-4">
                            {events.length > 0 ? events.map((event) => (
                                <div key={event.id} className="rounded-[1.4rem] border border-[#eadfd4] bg-[#faf6f1] px-4 py-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b6d54]">{event.status}</p>
                                    <p className="mt-1 font-semibold">{event.title}</p>
                                    <p className="mt-1 text-sm text-[#6b594c]">
                                        {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleTimeString()}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-sm text-[#6b594c]">Aun no hay sesiones confirmadas en el rango visible.</p>
                            )}
                        </div>
                        <div className="mt-6 flex items-start gap-3 rounded-[1.3rem] border border-dashed border-[#eadfd4] px-4 py-4 text-sm text-[#6b594c]">
                            <Clock3 className="mt-0.5 h-4 w-4 text-[#8b6d54]" />
                            <p>Si ves un horario libre aqui, aun puede solicitarse. La confirmacion final se hace manualmente.</p>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
}

function Field({ label, error, onChange, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6d54]">{label}</label>
            <input
                {...props}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-[1.5rem] border border-[#e6dbcf] bg-[#faf6f1] px-4 py-4 text-sm outline-none"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
    );
}
