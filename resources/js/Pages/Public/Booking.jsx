import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import SeoHead from '@/Components/SeoHead';
import { ArrowLeft, CalendarDays, Clock3, ShieldCheck } from 'lucide-react';

const defaultTheme = {
    font_heading: 'Fraunces, Georgia, serif',
    palette: {
        surface: '#f7f3ee',
        surface_alt: '#faf6f1',
        surface_dark: '#241b16',
        text: '#241b16',
        muted: '#6b594c',
        accent: '#8b6d54',
        accent_soft: '#e6dbcf',
    },
};

export default function Booking({ homepage, theme = defaultTheme, seo = null, events = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        event_type: 'Portrait',
        start: '',
        end: '',
        message: '',
    });
    const palette = { ...defaultTheme.palette, ...(theme?.palette || {}) };
    const headingFont = theme?.font_heading || defaultTheme.font_heading;

    const submit = (event) => {
        event.preventDefault();
        post('/booking');
    };

    return (
        <div className="min-h-screen px-6 py-10 md:px-10" style={{ backgroundColor: palette.surface, color: palette.text }}>
            <SeoHead seo={seo} fallbackTitle={`Booking | ${homepage?.brand?.name || 'Studio'}`} fallbackDescription={homepage?.brand?.tagline} />

            <div className="mx-auto mb-8 flex max-w-7xl items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: palette.accent }}>{homepage?.brand?.name || 'Studio'}</p>
                    <h1 className="mt-3 text-3xl md:text-4xl" style={{ fontFamily: headingFont }}>
                        Reserva una sesion con la identidad de tu estudio
                    </h1>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition"
                    style={{ borderColor: palette.accent_soft, color: palette.muted }}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio
                </Link>
            </div>

            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_.9fr]">
                <section className="rounded-[2rem] bg-white p-8 shadow-sm">
                    <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: palette.accent }}>Booking</p>
                    <h2 className="mt-4 text-4xl font-semibold leading-tight" style={{ fontFamily: headingFont }}>
                        Reserva una sesion sin bloquear el horario hasta confirmar
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7" style={{ color: palette.muted }}>
                        El horario que elijas queda como pendiente. Solo se bloquea cuando el estudio confirma la sesion o el pago.
                    </p>

                    <form onSubmit={submit} className="mt-8 space-y-5">
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Nombre" value={data.name} onChange={(value) => setData('name', value)} error={errors.name} palette={palette} />
                            <Field label="Email" type="email" value={data.email} onChange={(value) => setData('email', value)} error={errors.email} palette={palette} />
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Telefono" value={data.phone} onChange={(value) => setData('phone', value)} error={errors.phone} palette={palette} />
                            <Field label="Tipo de sesion" value={data.event_type} onChange={(value) => setData('event_type', value)} error={errors.event_type} palette={palette} />
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="Inicio" type="datetime-local" value={data.start} onChange={(value) => setData('start', value)} error={errors.start} palette={palette} />
                            <Field label="Fin" type="datetime-local" value={data.end} onChange={(value) => setData('end', value)} error={errors.end} palette={palette} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: palette.accent }}>Detalles</label>
                            <textarea
                                value={data.message}
                                onChange={(event) => setData('message', event.target.value)}
                                rows={5}
                                className="w-full rounded-[1.5rem] border px-4 py-4 text-sm outline-none"
                                style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}
                                placeholder="Cuentanos el tipo de sesion, locacion o idea general."
                            />
                            {errors.message && <p className="text-sm text-rose-600">{errors.message}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full px-7 py-4 text-sm font-semibold text-white transition disabled:opacity-60"
                            style={{ backgroundColor: palette.surface_dark }}
                        >
                            {processing ? 'Enviando...' : 'Solicitar horario'}
                        </button>
                    </form>
                </section>

                <section className="space-y-6">
                    <article className="rounded-[2rem] p-8 text-white shadow-sm" style={{ backgroundColor: palette.surface_dark }}>
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5" style={{ color: palette.accent }} />
                            <p className="text-xs uppercase tracking-[0.28em] text-white/70">Estado de reserva</p>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-white/80">
                            Todas las solicitudes del formulario entran en estado pendiente. No se bloquea el calendario publico hasta que el estudio confirme.
                        </p>
                    </article>

                    <article className="rounded-[2rem] bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="h-5 w-5" style={{ color: palette.accent }} />
                            <h2 className="text-lg font-semibold">Horarios ya confirmados</h2>
                        </div>
                        <div className="mt-6 space-y-4">
                            {events.length > 0 ? events.map((event) => (
                                <div key={event.id} className="rounded-[1.4rem] border px-4 py-4" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: palette.accent }}>{event.status}</p>
                                    <p className="mt-1 font-semibold">{event.title}</p>
                                    <p className="mt-1 text-sm" style={{ color: palette.muted }}>
                                        {new Date(event.start).toLocaleString()} - {new Date(event.end).toLocaleTimeString()}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-sm" style={{ color: palette.muted }}>Aun no hay sesiones confirmadas en el rango visible.</p>
                            )}
                        </div>
                        <div className="mt-6 flex items-start gap-3 rounded-[1.3rem] border border-dashed px-4 py-4 text-sm" style={{ borderColor: palette.accent_soft, color: palette.muted }}>
                            <Clock3 className="mt-0.5 h-4 w-4" style={{ color: palette.accent }} />
                            <p>Si ves un horario libre aqui, aun puede solicitarse. La confirmacion final se hace manualmente.</p>
                        </div>
                    </article>
                </section>
            </div>
        </div>
    );
}

function Field({ label, error, onChange, palette, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: palette.accent }}>{label}</label>
            <input
                {...props}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-[1.5rem] border px-4 py-4 text-sm outline-none"
                style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
    );
}
