import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ChevronLeft, Save } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        event_type: '',
        tentative_date: '',
        phone: '',
        client_document: '',
        message: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/admin/leads');
    };

    return (
        <AdminLayout>
            <Head title="Nuevo lead" />

            <div className="space-y-8">
                <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a leads
                </Link>

                <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="mb-8">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">CRM</p>
                        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Crear lead manual</h1>
                        <p className="mt-2 text-sm text-slate-500">Ideal para llamadas, referencias o contactos entrados fuera del formulario web.</p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Nombre" value={data.name} onChange={(value) => setData('name', value)} error={errors.name} />
                        <Field label="Email" type="email" value={data.email} onChange={(value) => setData('email', value)} error={errors.email} />
                        <Field label="Tipo de evento" value={data.event_type} onChange={(value) => setData('event_type', value)} error={errors.event_type} />
                        <Field label="Fecha tentativa" type="date" value={data.tentative_date} onChange={(value) => setData('tentative_date', value)} error={errors.tentative_date} />
                        <Field label="Telefono" value={data.phone} onChange={(value) => setData('phone', value)} error={errors.phone} />
                        <Field label="Documento cliente" value={data.client_document} onChange={(value) => setData('client_document', value)} error={errors.client_document} />
                    </div>

                    <div className="mt-5">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mensaje</label>
                        <textarea
                            rows={5}
                            value={data.message}
                            onChange={(event) => setData('message', event.target.value)}
                            className="w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                        />
                        {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message}</p>}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800 disabled:opacity-70"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Guardando...' : 'Crear lead'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

function Field({ label, value, onChange, error, type = 'text' }) {
    return (
        <label className="space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
        </label>
    );
}
