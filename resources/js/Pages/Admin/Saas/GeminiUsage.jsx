import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Cpu, Hash, TrendingUp, Zap } from 'lucide-react';

function fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function cost(tokens) {
    // gemini-flash: ~$0.075 / 1M input tokens (rough estimate, blended)
    return ((tokens / 1_000_000) * 0.075).toFixed(4);
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

                {/* Header */}
                <section className="rounded-[2rem] border border-[#e4ddd2] bg-[linear-gradient(135deg,#171411_0%,#25201b_55%,#312a22_100%)] px-7 py-7 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">IA · Gemini</p>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Consumo de tokens por tenant</h2>
                            <p className="mt-2 text-sm leading-6 text-white/65">
                                Tokens gastados en análisis visual por fotografia. Cada foto procesada consume tokens de Gemini para detectar sponsors, dorsales y acciones.
                            </p>
                        </div>
                        <Link
                            href="/admin/saas"
                            className="shrink-0 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            ← Volver
                        </Link>
                    </div>
                </section>

                {/* Totals */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Fotos analizadas" value={totals.photos_count.toLocaleString()} icon={Hash} />
                    <StatCard label="Tokens totales" value={fmt(totals.total_tokens)} icon={Cpu} />
                    <StatCard label="Costo estimado" value={`$${cost(totals.total_tokens)}`} icon={TrendingUp} />
                </div>

                {/* Table */}
                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white shadow-sm overflow-hidden">
                    <div className="px-7 py-5 border-b border-[#e6e0d5]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#f4efe7]">
                                <Zap className="h-4 w-4 text-slate-700" />
                            </div>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Desglose</p>
                                <p className="text-sm font-semibold text-slate-900">Uso por tenant</p>
                            </div>
                        </div>
                    </div>

                    {rows.length === 0 ? (
                        <div className="px-7 py-12 text-center text-sm text-slate-400">
                            Aún no hay datos de tokens. Procesa algunas fotos con Gemini activo.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[#f0ebe3]">
                                        <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tenant</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Fotos</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Tokens totales</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Promedio / foto</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Máximo</th>
                                        <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Costo est.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.tenant_id} className="border-b border-[#f8f5f0] last:border-0 hover:bg-[#fdfbf8] transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900">{row.tenant_name}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{row.photos_count.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-semibold text-slate-900">{fmt(row.total_tokens)}</span>
                                                <span className="ml-1 text-xs text-slate-400">{row.total_tokens.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-600">{row.avg_tokens.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right text-slate-600">{row.max_tokens.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="rounded-full bg-[#f0ebe3] px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                    ${cost(row.total_tokens)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {rows.length > 0 && (
                        <div className="px-6 py-4 border-t border-[#f0ebe3] bg-[#fdfbf8]">
                            <p className="text-xs text-slate-400">
                                Costo estimado basado en ~$0.075 por 1M tokens (gemini-flash). El costo real puede variar según el modelo y región.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
