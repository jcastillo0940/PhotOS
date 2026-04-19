import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { clsx } from 'clsx';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, Card } from '@/Components/UI';
import { ArrowLeft, Check, ScanFace, Sparkles, UserPlus, X } from 'lucide-react';

export default function Learning({ unknownDetections = [], identities = [], sportsModeEnabled = false }) {
    return (
        <AdminLayout>
            <Head title="Laboratorio de aprendizaje" />

            <div className="space-y-8">
                <section className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a,#111827)] p-8 shadow-2xl shadow-primary/10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <Link href="/admin/face-detection" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60 transition hover:text-white">
                                <ArrowLeft className="h-4 w-4" />
                                Volver a deteccion facial
                            </Link>
                            <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-white/35">Learning lab</p>
                            <h1 className="mt-3 text-3xl font-black uppercase italic tracking-tight text-white">Laboratorio de aprendizaje facial</h1>
                            <p className="mt-4 text-sm leading-7 text-white/65">
                                Aqui se revisan solamente los rostros sin etiqueta para confirmar identidades, crear nuevas personas y seguir entrenando el motor del tenant.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Badge variant="primary" className="px-3 py-1 font-black">{unknownDetections.length} pendientes</Badge>
                            <Badge variant="slate" className="px-3 py-1 font-black">{sportsModeEnabled ? 'modo deportivo' : 'modo estudio'}</Badge>
                        </div>
                    </div>
                </section>

                {unknownDetections.length > 0 ? (
                    <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {unknownDetections.map((detection) => (
                            <UnknownFaceCard key={detection.id} detection={detection} identities={identities} />
                        ))}
                    </section>
                ) : (
                    <Card className="border-none bg-[linear-gradient(135deg,#f8fafc,#ffffff)] shadow-sm">
                        <div className="py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-sky-100 bg-sky-50 text-sky-600">
                                <Sparkles className="h-7 w-7" />
                            </div>
                            <h2 className="mt-5 text-xl font-semibold text-slate-900">No hay detecciones pendientes</h2>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                                Cuando el sistema encuentre rostros nuevos sin etiqueta, apareceran aqui para que el equipo confirme si corresponden a alguien existente o a una nueva identidad.
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}

function UnknownFaceCard({ detection, identities = [] }) {
    const [mode, setMode] = useState('existing');
    const [selectedIdentityId, setSelectedIdentityId] = useState(detection.best_match_identity_id ? String(detection.best_match_identity_id) : '');
    const [newName, setNewName] = useState('');
    const simPct = detection.best_confidence ? Math.round(detection.best_confidence * 100) : 0;

    const confirm = () => {
        if (!selectedIdentityId) return;
        router.post(`/admin/face-detection/unknowns/${detection.id}/confirm`, { face_identity_id: selectedIdentityId }, { preserveScroll: true });
    };

    const labelNew = () => {
        if (!newName.trim()) return;
        router.post(`/admin/face-detection/unknowns/${detection.id}/name`, { name: newName.trim() }, { preserveScroll: true });
    };

    return (
        <div className="group relative flex flex-col gap-4 rounded-[2.2rem] border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
            <div className="flex rounded-xl bg-slate-100 p-1 text-[8px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex-1 py-1 text-center">Detection</div>
                <div className="flex-1 rounded-lg border border-slate-200 bg-white py-1 text-center text-primary">Vector 512D</div>
                <div className="flex-1 py-1 text-center">Comparison</div>
            </div>

            <div className="group/img relative aspect-video overflow-hidden rounded-2xl bg-slate-100 shadow-inner">
                {detection.photo_url && <img src={detection.photo_url} className="h-full w-full object-cover opacity-75 transition-opacity duration-700 group-hover/img:opacity-100" />}
                {detection.bbox && (
                    <div
                        className="absolute rounded-xl border-2 border-primary shadow-[0_0_15px_rgba(23,184,255,0.45)]"
                        style={{ left: `${detection.bbox[0] * 100}%`, top: `${detection.bbox[1] * 100}%`, width: `${(detection.bbox[2] - detection.bbox[0]) * 100}%`, height: `${(detection.bbox[3] - detection.bbox[1]) * 100}%` }}
                    />
                )}
                <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
                    <Badge variant={simPct >= 60 ? 'success' : 'primary'} className="border-none px-1 py-0 text-[7px] font-black">
                        {simPct >= 60 ? `match ${simPct}%` : 'identity unknown'}
                    </Badge>
                    {detection.best_match_name && <p className="rounded-lg bg-black/60 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-white/75">Prob: {detection.best_match_name}</p>}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button onClick={() => setMode('existing')} className={clsx('flex-1 rounded-lg py-2 text-[9px] font-black uppercase tracking-widest transition-all', mode === 'existing' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700')}>Asociar</button>
                    <button onClick={() => setMode('new')} className={clsx('flex-1 rounded-lg py-2 text-[9px] font-black uppercase tracking-widest transition-all', mode === 'new' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-700')}>Nueva</button>
                </div>

                {mode === 'existing' ? (
                    <div className="flex gap-2">
                        <select
                            value={selectedIdentityId}
                            onChange={(e) => setSelectedIdentityId(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-700 outline-none transition-all focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Buscar...</option>
                            {identities.map((identity) => <option key={identity.id} value={identity.id}>{identity.name}</option>)}
                        </select>
                        <button onClick={confirm} disabled={!selectedIdentityId} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition-all hover:scale-105 disabled:opacity-30">
                            <Check className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            placeholder="NOMBRE"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && labelNew()}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-black uppercase text-slate-700 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20"
                        />
                        <button onClick={labelNew} disabled={!newName.trim()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition-all hover:scale-105 disabled:opacity-30">
                            <UserPlus className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <ScanFace className="h-3.5 w-3.5" />
                    aprendizaje pendiente
                </div>
                <button onClick={() => router.delete(`/admin/face-detection/unknowns/${detection.id}/reject`, { preserveScroll: true })} className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-all hover:scale-110">
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
