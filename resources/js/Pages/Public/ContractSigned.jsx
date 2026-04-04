import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Mail, Printer, ShieldCheck } from 'lucide-react';

export default function ContractSigned({ contract, renderedContent }) {
    return (
        <div className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-slate-900 md:px-10">
            <Head title="Contract Signed" />

            <div className="mx-auto max-w-3xl rounded-[2.4rem] border border-slate-200 bg-white p-8 text-center shadow-sm md:p-14">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-10 w-10" />
                </div>

                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Signature complete</p>
                <h1 className="mt-4 text-4xl font-serif text-slate-900 md:text-5xl">Agreement verified</h1>
                <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-500">
                    The contract has been signed successfully and is now attached to your project.
                </p>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <InfoCard icon={ShieldCheck} label="Contract token" value={`${contract.token.slice(0, 18)}...`} />
                    <InfoCard icon={Mail} label="Confirmation sent to" value={contract.project?.lead?.email || 'Client email'} />
                    <InfoCard icon={CheckCircle2} label="Status" value={contract.status} />
                </div>

                <div className="prose mx-auto mt-10 max-w-none rounded-[1.6rem] border border-slate-200 bg-slate-50 p-8 text-left prose-slate">
                    <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
                </div>

                <div className="mt-10 flex flex-col justify-center gap-3 md:flex-row">
                    <Link
                        href={`/sign/${contract.token}/print`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-slate-800"
                    >
                        <Printer className="h-4 w-4" />
                        Print / Save PDF
                    </Link>
                    <Link
                        href={`/gallery/${contract.project?.gallery_token}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300"
                    >
                        Open client gallery
                    </Link>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value }) {
    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <Icon className="mx-auto h-5 w-5 text-slate-500" />
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</p>
            <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
        </div>
    );
}
