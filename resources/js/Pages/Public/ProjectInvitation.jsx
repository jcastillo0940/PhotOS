import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function ProjectInvitation({ invitation }) {
    const { flash } = usePage().props;
    const form = useForm({ access_code: '' });

    const submit = (event) => {
        event.preventDefault();
        form.post(`/project-invitations/${invitation.token}/accept`);
    };

    return (
        <div className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-900">
            <Head title={`Invitacion | ${invitation.project?.name || 'Proyecto'}`} />

            <div className="mx-auto max-w-2xl space-y-6">
                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-8 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Invitacion de proyecto</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">{invitation.project?.name || 'Proyecto sin nombre'}</h1>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                        Este acceso fue enviado a <strong>{invitation.invited_email}</strong>. Solo necesitas ingresar el codigo compartido para abrir el workspace del fotografo.
                    </p>

                    {flash?.success && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}
                    {flash?.error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{flash.error}</div>}

                    <form onSubmit={submit} className="mt-6 space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Codigo de acceso</label>
                            <input
                                value={form.data.access_code}
                                onChange={(event) => form.setData('access_code', event.target.value.toUpperCase())}
                                className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none"
                                placeholder="Ej. A1B2C3"
                            />
                            <p className="text-xs text-slate-500">{invitation.access_code_hint}</p>
                        </div>

                        <button type="submit" disabled={form.processing} className="rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white">
                            {form.processing ? 'Validando...' : 'Abrir workspace'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}
