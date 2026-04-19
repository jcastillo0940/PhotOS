import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Cpu, Database, Hash, Layers3, TrendingUp, Zap } from 'lucide-react';

function fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function fmtGb(bytes) {
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtUsd(value) {
    return `$${Number(value || 0).toFixed(4)}`;
}

function StatCard({ label, value, icon: Icon }) {
    return (
        <div className="rounded-[1.7rem] border border-[#e6e0d5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f4efe7]">
                    <Icon className="h-5 w-5 text-slate-700" />
                </div>
            </div>
        </div>
    );
}

export default function GeminiUsage({ rows, totals }) {
    return (
        <AdminLayout>
            <Head title="Uso Gemini por Tenant" />

            <div className="space-y-8">
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-[linear-gradient(135deg,#171411_0%,#25201b_55%,#312a22_100%)] px-7 py-7 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">IA · Gemini</p>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Consumo y almacenamiento por tenant</h2>
                            <p className="mt-2 text-sm leading-6 text-white/65">
                                El panel ahora separa fotos reales, peticiones efectivas a Gemini y peso total de originales en R2. Un mosaico 2x2 cuenta como una sola peticion para hasta 4 fotos.
                            </p>
                        </div>
                        <Link
                            href="/admin/saas"
                            className="shrink-0 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Volver
                        </Link>
                    </div>
                </section>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Fotos analizadas" value={(totals.photos_count || 0).toLocaleString()} icon={Hash} />
                    <StatCard label="Peticiones Gemini" value={(totals.gemini_requests_count || 0).toLocaleString()} icon={Layers3} />
                    <StatCard label="Tokens totales" value={fmt(totals.total_tokens || 0)} icon={Cpu} />
                    <StatCard label="Originales R2" value={fmtGb(totals.original_storage_bytes || 0)} icon={Database} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Costo entrada" value={fmtUsd(totals.input_cost_usd)} icon={TrendingUp} />
                    <StatCard label="Costo salida" value={fmtUsd(totals.output_cost_usd)} icon={TrendingUp} />
                    <StatCard label="Costo total real" value={fmtUsd(totals.total_cost_usd)} icon={TrendingUp} />
                    <StatCard label="Fotos por peticion" value={(totals.gemini_requests_count || 0) > 0 ? ((totals.photos_count || 0) / totals.gemini_requests_count).toFixed(2) : '0.00'} icon={Zap} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard label="Costo exacto" value={fmtUsd(totals.exact_cost_usd)} icon={TrendingUp} />
                    <StatCard label="Costo estimado legacy" value={fmtUsd(totals.estimated_cost_usd)} icon={TrendingUp} />
                </div>

                <section className="overflow-hidden rounded-[2rem] border border-[#e6e0d5] bg-white shadow-sm">
                    <div className="border-b border-[#e6e0d5] px-7 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f4efe7]">
                                <Zap className="h-4 w-4 text-slate-700" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Desglose</p>
                                <p className="text-sm font-semibold text-slate-900">Uso real por tenant</p>
                            </div>
                        </div>
                    </div>

                    {rows.length === 0 ? (
                        <div className="px-7 py-12 text-center text-sm text-slate-400">
                            Aun no hay datos de tokens ni de almacenamiento original para mostrar.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#f0ebe3]">
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tenant</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Fotos</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Peticiones</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Fotos / peticion</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Prompt</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Salida</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tokens</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">R2 originales</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Exacto</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Estimado</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Costo real</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.tenant_id} className="border-b border-[#f8f5f0] last:border-0 transition-colors hover:bg-[#fdfbf8]">
                                            <td className="px-6 py-4 font-medium text-slate-900">{row.tenant_name}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{row.photos_count.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{row.gemini_requests_count.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{row.photos_per_request.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{fmt(row.prompt_tokens)}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{fmt(row.candidate_tokens)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-slate-900">{fmt(row.total_tokens)}</span>
                                                <span className="ml-1 text-xs text-slate-400">{row.total_tokens.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">{fmtGb(row.original_storage_bytes)}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {row.exact_requests_count} · {fmtUsd(row.exact_cost_usd)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">
                                                {row.estimated_requests_count} · {fmtUsd(row.estimated_cost_usd)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="rounded-full bg-[#f0ebe3] px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    {fmtUsd(row.total_cost_usd)}
                                                </span>
                                                {row.models?.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                                                        {row.models.map((item) => (
                                                            <span key={`${row.tenant_id}-${item.model}`} className="rounded-full border border-[#e6e0d5] bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                                                {item.model} · {item.requests}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {rows.length > 0 && (
                        <div className="border-t border-[#f0ebe3] bg-[#fdfbf8] px-6 py-4">
                            <p className="text-xs text-slate-400">
                                El costo exacto sale de `gemini_usage_records` con tokens de entrada y salida reales. El historico legacy se puede reconstruir como estimado y se muestra aparte para no mezclar contabilidad exacta con contabilidad inferida.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}

