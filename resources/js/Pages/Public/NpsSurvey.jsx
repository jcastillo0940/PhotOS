import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { clsx } from 'clsx';

export default function NpsSurvey({ lead, token }) {
    const form = useForm({
        score: lead.nps_score ?? '',
        comment: lead.nps_comment ?? '',
    });

    return (
        <div className="min-h-screen bg-[#f3efe8] px-6 py-10 md:px-10">
            <Head title="Encuesta de experiencia" />

            <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm md:p-12">
                <p className="text-[11px] uppercase tracking-[0.32em] text-stone-400">Encuesta de calificacion</p>
                <h1 className="mt-3 text-3xl font-semibold text-stone-900">¿Qué tan probable es que nos recomiendes?</h1>
                <p className="mt-4 text-sm leading-7 text-stone-500">
                    Tu respuesta nos ayuda a medir la experiencia completa del cliente y a detectar oportunidades de mejora reales.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); form.post(`/forms/nps/${token}`); }} className="mt-10 space-y-8">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Selecciona una nota de 0 a 10</p>
                        <div className="grid grid-cols-6 gap-3 md:grid-cols-11">
                            {Array.from({ length: 11 }).map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => form.setData('score', index)}
                                    className={clsx(
                                        'h-12 rounded-2xl border text-sm font-semibold transition',
                                        Number(form.data.score) === index
                                            ? 'border-stone-900 bg-stone-900 text-white'
                                            : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-400',
                                    )}
                                >
                                    {index}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Comentario adicional
                        </label>
                        <textarea
                            value={form.data.comment}
                            onChange={(e) => form.setData('comment', e.target.value)}
                            rows={5}
                            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-400"
                            placeholder="Que fue lo mejor del servicio y que podriamos mejorar"
                        />
                    </div>

                    <button type="submit" className="rounded-full bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        Enviar respuesta
                    </button>
                </form>
            </div>
        </div>
    );
}
