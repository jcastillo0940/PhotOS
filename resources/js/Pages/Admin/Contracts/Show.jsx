import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ChevronLeft, ExternalLink, PencilLine, Printer } from 'lucide-react';

export default function Show({ contract }) {
    return (
        <AdminLayout>
            <Head title={`Contrato: ${contract.project?.lead?.name}`} />

            <div className="space-y-8">
                <Link href="/admin/contracts" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a contratos
                </Link>

                <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Contrato</p>
                            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{contract.project?.lead?.name}</h1>
                            <p className="mt-2 text-sm text-slate-500">{contract.project?.name}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link href={`/admin/contracts/${contract.id}/edit`} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                <PencilLine className="h-4 w-4" />
                                Editar
                            </Link>
                            <Link href={`/admin/contracts/${contract.id}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                <Printer className="h-4 w-4" />
                                Imprimir
                            </Link>
                            <Link href={`/sign/${contract.token}`} target="_blank" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                                <ExternalLink className="h-4 w-4" />
                                Ver publico
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
                    <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-slate-900">Resumen</h2>
                        <div className="mt-6 grid gap-4">
                            <DataItem label="Cliente" value={contract.project?.lead?.name} />
                            <DataItem label="Email" value={contract.project?.lead?.email} />
                            <DataItem label="Tipo de evento" value={contract.project?.lead?.event_type} />
                            <DataItem label="Estado" value={contract.status} />
                            <DataItem label="Fecha del evento" value={contract.variables?.['[event_date]']} />
                            <DataItem label="Ubicacion" value={contract.variables?.['[location]']} />
                        </div>
                    </article>

                    <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Vista del contrato</p>
                        <div className="prose mt-6 max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: contract.rendered_content }} />
                    </article>
                </section>
            </div>
        </AdminLayout>
    );
}

function DataItem({ label, value }) {
    return (
        <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{value || 'No definido'}</p>
        </div>
    );
}
