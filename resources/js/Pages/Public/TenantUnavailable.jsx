import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';

export default function TenantUnavailable({ tenant }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5efe4] px-6 py-12 text-[#1f1813]">
            <Head title="No encontrado" />

            <div className="w-full max-w-2xl rounded-[2.4rem] border border-[#e6d8c8] bg-white p-10 text-center shadow-[0_24px_60px_rgba(60,40,24,.08)]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f4eadf] text-[#a07047]">
                    <Search className="h-9 w-9" />
                </div>
                <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-[#a07047]">404</p>
                <h1 className="mt-3 text-4xl font-semibold">Ups, no encontramos lo que buscas.</h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#6b594c]">
                    Este espacio no esta disponible en este momento. Si perteneces a {tenant?.name || 'este estudio'}, intenta nuevamente mas tarde o vuelve al acceso privado.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-[#201610] px-6 py-4 text-sm font-semibold text-white">
                        Ir al acceso privado
                    </Link>
                    <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-full border border-[#dcc8b2] bg-white px-6 py-4 text-sm font-semibold text-[#3b2a1f]">
                        <ArrowLeft className="h-4 w-4" />
                        Regresar
                    </button>
                </div>
            </div>
        </div>
    );
}