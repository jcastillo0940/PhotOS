import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, Printer, ShieldCheck } from 'lucide-react';
import { resolveTenantTheme } from '@/lib/tenantTheme';

export default function ContractSigned({ contract, renderedContent, theme = null }) {
    const page = usePage().props;
    const tenantTheme = resolveTenantTheme({ ...page, publicTheme: theme || page.publicTheme });
    const { palette, headingFont, bodyFont, studioName } = tenantTheme;

    return (
        <div className="min-h-screen px-6 py-10 text-slate-900 md:px-10" style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: bodyFont }}>
            <Head title={`Contrato firmado | ${studioName}`} />

            <div className="mx-auto max-w-3xl rounded-[2.4rem] border border-slate-200 bg-white p-8 text-center shadow-sm md:p-14">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: palette.accent_soft, color: palette.accent }}>
                    <CheckCircle2 className="h-10 w-10" />
                </div>

                <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: palette.accent }}>{studioName}</p>
                <h1 className="mt-4 text-4xl md:text-5xl" style={{ color: palette.text, fontFamily: headingFont }}>Acuerdo verificado</h1>
                <p className="mx-auto mt-6 max-w-xl text-base leading-8" style={{ color: palette.muted }}>
                    El contrato fue firmado correctamente y ya esta asociado a tu proyecto.
                </p>

                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <InfoCard icon={ShieldCheck} label="Contract token" value={`${contract.token.slice(0, 18)}...`} palette={palette} />
                    <InfoCard icon={Mail} label="Confirmation sent to" value={contract.project?.lead?.email || 'Client email'} palette={palette} />
                    <InfoCard icon={CheckCircle2} label="Status" value={contract.status} palette={palette} />
                </div>

                <div className="prose mx-auto mt-10 max-w-none rounded-[1.6rem] border p-8 text-left prose-slate" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
                    <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
                </div>

                <div className="mt-10 flex flex-col justify-center gap-3 md:flex-row">
                    <Link
                        href={`/sign/${contract.token}/print`}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition"
                        style={{ backgroundColor: palette.surface_dark }}
                    >
                        <Printer className="h-4 w-4" />
                        Print / Save PDF
                    </Link>
                    <Link
                        href={`/gallery/${contract.project?.gallery_token}`}
                        className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] transition"
                        style={{ borderColor: palette.accent_soft, color: palette.text }}
                    >
                        Open client gallery
                    </Link>
                </div>
            </div>
        </div>
    );
}

function InfoCard({ icon: Icon, label, value, palette }) {
    return (
        <div className="rounded-[1.5rem] border p-5" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
            <Icon className="mx-auto h-5 w-5" style={{ color: palette.accent }} />
            <p className="mt-3 text-[11px] uppercase tracking-[0.22em]" style={{ color: palette.accent }}>{label}</p>
            <p className="mt-2 text-sm font-medium" style={{ color: palette.text }}>{value}</p>
        </div>
    );
}
