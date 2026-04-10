import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { clsx } from 'clsx';
import { resolveTenantTheme } from '@/lib/tenantTheme';

export default function NpsSurvey({ lead, token }) {
    const tenantTheme = resolveTenantTheme(usePage().props);
    const { palette, headingFont, bodyFont, studioName } = tenantTheme;
    const form = useForm({
        score: lead.nps_score ?? '',
        comment: lead.nps_comment ?? '',
    });

    return (
        <div className="min-h-screen px-6 py-10 md:px-10" style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: bodyFont }}>
            <Head title={`Encuesta | ${studioName}`} />

            <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-sm md:p-12">
                <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: palette.accent }}>{studioName}</p>
                <h1 className="mt-3 text-3xl font-semibold" style={{ color: palette.text, fontFamily: headingFont }}>Que tan probable es que nos recomiendes?</h1>
                <p className="mt-4 text-sm leading-7" style={{ color: palette.muted }}>
                    Tu respuesta nos ayuda a medir la experiencia completa del cliente y a detectar oportunidades de mejora reales.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); form.post(`/forms/nps/${token}`); }} className="mt-10 space-y-8">
                    <div>
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.accent }}>Selecciona una nota de 0 a 10</p>
                        <div className="grid grid-cols-6 gap-3 md:grid-cols-11">
                            {Array.from({ length: 11 }).map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => form.setData('score', index)}
                                    className={clsx(
                                        'h-12 rounded-2xl border text-sm font-semibold transition',
                                        Number(form.data.score) === index ? 'text-white' : ''
                                    )}
                                    style={Number(form.data.score) === index
                                        ? { borderColor: palette.surface_dark, backgroundColor: palette.surface_dark }
                                        : { borderColor: palette.accent_soft, backgroundColor: palette.surface_alt, color: palette.muted }}
                                >
                                    {index}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.accent }}>
                            Comentario adicional
                        </label>
                        <textarea
                            value={form.data.comment}
                            onChange={(e) => form.setData('comment', e.target.value)}
                            rows={5}
                            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
                            style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt, color: palette.text }}
                            placeholder="Que fue lo mejor del servicio y que podriamos mejorar"
                        />
                    </div>

                    <button type="submit" className="rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white" style={{ backgroundColor: palette.surface_dark }}>
                        Enviar respuesta
                    </button>
                </form>
            </div>
        </div>
    );
}
