import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { resolveTenantTheme } from '@/lib/tenantTheme';

function Field({ question, value, onChange, palette }) {
    const sharedStyle = {
        borderColor: palette.accent_soft,
        backgroundColor: palette.surface_alt,
        color: palette.text,
    };

    if (question.type === 'textarea') {
        return <textarea value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} rows={4} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition" style={sharedStyle} />;
    }

    if (question.type === 'select') {
        return (
            <select value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition" style={sharedStyle}>
                <option value="">Seleccionar</option>
                {question.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        );
    }

    return <input type={question.type === 'number' ? 'number' : 'text'} value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition" style={sharedStyle} />;
}

export default function LeadBriefing({ lead, token, questions }) {
    const tenantTheme = resolveTenantTheme(usePage().props);
    const { palette, headingFont, bodyFont, studioName } = tenantTheme;
    const form = useForm({ answers: lead.briefing_answers || {} });

    const updateAnswer = (key, value) => {
        form.setData('answers', { ...form.data.answers, [key]: value });
    };

    return (
        <div className="min-h-screen px-6 py-10 md:px-10" style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: bodyFont }}>
            <Head title={`Briefing | ${studioName}`} />

            <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-sm md:p-12">
                <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: palette.accent }}>{studioName}</p>
                <h1 className="mt-3 text-3xl font-semibold" style={{ color: palette.text, fontFamily: headingFont }}>Cuentanos mas sobre tu {lead.event_type?.toLowerCase() || 'evento'}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7" style={{ color: palette.muted }}>
                    Este formulario nos ayuda a preparar la sesion con contexto real, prioridades y detalles que el fotografo debe saber antes del evento.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); form.post(`/forms/briefing/${token}`); }} className="mt-10 space-y-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        {questions.map((question) => (
                            <div key={question.key} className={question.type === 'textarea' ? 'md:col-span-2' : ''}>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.accent }}>
                                    {question.label}{question.required ? ' *' : ''}
                                </label>
                                <Field question={question} value={form.data.answers?.[question.key]} onChange={updateAnswer} palette={palette} />
                            </div>
                        ))}
                    </div>

                    <button type="submit" className="rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: palette.surface_dark }}>
                        Guardar respuestas
                    </button>
                </form>
            </div>
        </div>
    );
}
