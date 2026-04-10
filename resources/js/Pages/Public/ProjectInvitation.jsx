import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function ProjectInvitation({ invitation, authState }) {
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
                        Este acceso fue enviado a <strong>{invitation.invited_email}</strong>. Necesitas entrar con ese correo y confirmar el codigo para activar tu acceso.
                    </p>

                    {flash?.success && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div>}
                    {flash?.error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{flash.error}</div>}

                    {!authState?.is_authenticated ? (
                        <div className="mt-6 rounded-[1.5rem] border border-[#ece5d8] bg-[#fbf9f6] p-5">
                            <p className="text-sm text-slate-600">Primero inicia sesion como fotografo para aceptar la invitacion.</p>
                            <Link href={authState?.login_url || '/login'} className="mt-4 inline-flex rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white">
                                Iniciar sesion
                            </Link>
                        </div>
                    ) : !authState?.is_photographer ? (
                        <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                            Esta invitacion solo puede ser aceptada por un usuario con rol photographer.
                        </div>
                    ) : !authState?.email_matches ? (
                        <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
                            Iniciaste sesion con otro correo. Debes usar el correo invitado: {invitation.invited_email}
                        </div>
                    ) : (
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
                                {form.processing ? 'Activando...' : 'Aceptar invitacion'}
                            </button>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
}
