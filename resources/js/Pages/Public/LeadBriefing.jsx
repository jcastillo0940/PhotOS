import React from 'react';
import { Head, useForm } from '@inertiajs/react';

function Field({ question, value, onChange }) {
    if (question.type === 'textarea') {
        return <textarea value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} rows={4} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400" />;
    }

    if (question.type === 'select') {
        return (
            <select value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400">
                <option value="">Seleccionar</option>
                {question.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
        );
    }

    return <input type={question.type === 'number' ? 'number' : 'text'} value={value || ''} onChange={(e) => onChange(question.key, e.target.value)} className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400" />;
}

export default function LeadBriefing({ lead, token, questions }) {
    const form = useForm({ answers: lead.briefing_answers || {} });

    const updateAnswer = (key, value) => {
        form.setData('answers', { ...form.data.answers, [key]: value });
    };

    return (
        <div className="min-h-screen bg-[#f3efe8] px-6 py-10 md:px-10">
            <Head title="Formulario de evento" />

            <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 shadow-sm md:p-12">
                <p className="text-[11px] uppercase tracking-[0.32em] text-stone-400">Briefing</p>
                <h1 className="mt-3 text-3xl font-semibold text-stone-900">Cuéntanos más sobre tu {lead.event_type?.toLowerCase() || 'evento'}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-500">
                    Este formulario nos ayuda a preparar la sesión con contexto real, prioridades y detalles que el fotógrafo debe saber antes del evento.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); form.post(`/forms/briefing/${token}`); }} className="mt-10 space-y-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        {questions.map((question) => (
                            <div key={question.key} className={question.type === 'textarea' ? 'md:col-span-2' : ''}>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                                    {question.label}{question.required ? ' *' : ''}
                                </label>
                                <Field question={question} value={form.data.answers?.[question.key]} onChange={updateAnswer} />
                            </div>
                        ))}
                    </div>

                    <button type="submit" className="rounded-full bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        Guardar respuestas
                    </button>
                </form>
            </div>
        </div>
    );
}
