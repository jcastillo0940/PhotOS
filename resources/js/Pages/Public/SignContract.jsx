import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Eraser, PenTool, Printer, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export default function SignContract({ contract, renderedContent }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const { data, setData, post, processing } = useForm({
        signature_data: '',
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!ctx) return;

        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const pointFromEvent = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const source = event.touches?.[0] || event;

        return {
            x: source.clientX - rect.left,
            y: source.clientY - rect.top,
        };
    };

    const startDrawing = (event) => {
        setIsDrawing(true);
        const ctx = canvasRef.current.getContext('2d');
        const point = pointFromEvent(event);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
    };

    const draw = (event) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current.getContext('2d');
        const point = pointFromEvent(event);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setData('signature_data', canvasRef.current.toDataURL());
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setData('signature_data', '');
    };

    const submit = (event) => {
        event.preventDefault();
        post(`/sign/${contract.token}`);
    };

    return (
        <div className="min-h-screen bg-[#f6f3ee] px-6 py-10 text-slate-900 md:px-10">
            <Head title="Review and Sign Contract" />

            <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1.15fr_.85fr]">
                <section className="rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-12">
                    <div className="mb-10 flex items-center justify-between gap-4 border-b border-slate-200 pb-8">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">PhotOS Contracts</p>
                            <h1 className="mt-3 text-4xl font-serif text-slate-900">Service Agreement</h1>
                        </div>
                        <Link
                            href={`/sign/${contract.token}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-300"
                        >
                            <Printer className="h-4 w-4" />
                            Print / PDF
                        </Link>
                    </div>

                    <div className="mb-8 grid gap-4 rounded-[1.7rem] bg-slate-50 p-6 text-sm text-slate-600 md:grid-cols-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Client</p>
                            <p className="mt-2 font-medium text-slate-900">{contract.project?.lead?.name}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Project</p>
                            <p className="mt-2 font-medium text-slate-900">{contract.project?.name}</p>
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Status</p>
                            <p className="mt-2 font-medium text-slate-900">{contract.status}</p>
                        </div>
                    </div>

                    <div className="prose max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: renderedContent }} />
                </section>

                <aside className="rounded-[2.2rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Electronic signature</p>
                            <h2 className="mt-1 text-2xl font-semibold text-slate-900">Finalize agreement</h2>
                        </div>
                    </div>

                    <p className="text-sm leading-7 text-slate-500">
                        Review the contract, sign below, and keep a printable copy for your records.
                    </p>

                    <div className="mt-8 rounded-[1.8rem] border border-slate-200 bg-slate-50 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Signature</p>
                            <button type="button" onClick={clearSignature} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <Eraser className="h-3.5 w-3.5" />
                                Clear
                            </button>
                        </div>

                        <div className="relative overflow-hidden rounded-[1.4rem] border border-dashed border-slate-300 bg-white">
                            <canvas
                                ref={canvasRef}
                                width={520}
                                height={220}
                                className="h-[220px] w-full cursor-crosshair"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />

                            {!data.signature_data && (
                                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                    <PenTool className="mb-3 h-8 w-8" />
                                    <p className="text-[11px] uppercase tracking-[0.24em]">Sign here</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 rounded-[1.6rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        Your signature timestamp and contract token will be recorded for verification.
                    </div>

                    <form onSubmit={submit} className="mt-8">
                        <button
                            disabled={processing || !data.signature_data}
                            className={clsx(
                                'inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] transition',
                                processing || !data.signature_data
                                    ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                            )}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            {processing ? 'Signing...' : 'Sign contract'}
                        </button>
                    </form>
                </aside>
            </div>
        </div>
    );
}
