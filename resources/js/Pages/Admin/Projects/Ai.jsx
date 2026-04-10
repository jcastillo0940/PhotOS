import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { Bot, ChevronLeft, Trash2, UserRound, WandSparkles } from 'lucide-react';
import { clsx } from 'clsx';

export default function Ai({ project, faceRecognition }) {
    const { flash } = usePage().props;
    const identityForm = useForm({
        name: '',
        reference_image: null,
    });
    
    const [faceRecognitionEnabled, setFaceRecognitionEnabled] = React.useState(!!project.face_recognition_enabled);
    const canUseRecognition = !!faceRecognitionEnabled && !!faceRecognition?.service_configured && !!faceRecognition?.database_ready;
    const recognitionSummary = faceRecognition?.summary || {};

    const saveMeta = () => {
        router.put(`/admin/projects/${project.id}`, {
            face_recognition_enabled: faceRecognitionEnabled,
        }, { preserveScroll: true, preserveState: true });
    };

    const createIdentity = (event) => {
        event.preventDefault();
        identityForm.post(`/admin/projects/${project.id}/face-identities`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => identityForm.reset(),
        });
    };

    return (
        <AdminLayout>
            <Head title={`IA Rostros: ${project.name}`} />

            <div className="space-y-8">
                <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a colecciones
                </Link>

                <ProjectWorkspaceNav project={project} current="ai" />

                {(flash?.success || flash?.error) && (
                    <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Reconocimiento facial</p>
                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Personas a reconocer en esta galeria</h3>
                            <p className="mt-2 text-sm leading-7 text-slate-500">Activalo para detectar rostros y que los clientes puedan filtrar por personas.</p>
                        </div>
                        <Bot className="h-8 w-8 text-slate-300" />
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-4">
                            <label className="flex items-center justify-between rounded-[1.6rem] border border-[#e6e0d5] bg-[#fbf9f6] px-5 py-5 text-sm text-slate-700">
                                <div>
                                    <span className="font-semibold block">Activar IA para la galeria</span>
                                    <span className="text-xs text-slate-500 block mt-1">Registra personas en el modelo predictivo.</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={faceRecognitionEnabled}
                                    onChange={(event) => setFaceRecognitionEnabled(event.target.checked)}
                                    className="h-5 w-5 rounded border-slate-300 text-primary-600"
                                />
                            </label>

                            <form onSubmit={createIdentity} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5 space-y-3">
                                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mb-2">Registrar Persona</p>
                                <input
                                    type="text"
                                    value={identityForm.data.name}
                                    onChange={(event) => identityForm.setData('name', event.target.value)}
                                    placeholder="Nombre de la persona (Ej. Maria)"
                                    className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => identityForm.setData('reference_image', event.target.files?.[0] || null)}
                                    className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={identityForm.processing || !faceRecognitionEnabled || !faceRecognition?.service_configured}
                                    className={clsx(
                                        'w-full rounded-2xl px-4 py-3 text-sm font-semibold',
                                        identityForm.processing || !faceRecognitionEnabled || !faceRecognition?.service_configured
                                            ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                            : 'border border-[#171411] bg-[#171411] text-white'
                                    )}
                                >
                                    {identityForm.processing ? 'Registrando...' : 'Agregar persona'}
                                </button>
                            </form>

                            <div className="space-y-3">
                                {(faceRecognition?.identities || []).length > 0 ? faceRecognition.identities.map((identity) => (
                                    <div key={identity.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3">
                                        <div className="min-w-0 flex items-center gap-3">
                                            {identity.path_reference ? (
                                                <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-200">
                                                    <img src={'/storage/' + identity.path_reference} className="h-full w-full object-cover" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <UserRound className="h-4 w-4 text-slate-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{identity.name}</p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">{identity.processing_status === 'processed' ? 'Entrenado' : 'Pendiente'}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm(`Eliminar a ${identity.name} de esta galeria?`)) {
                                                    router.post(`/admin/projects/${project.id}/face-identities/${identity.id}`, { _method: 'delete' }, { preserveScroll: true });
                                                }
                                            }}
                                            className="rounded-full border border-[#e6e0d5] p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="rounded-2xl border border-dashed border-[#ddd5c9] px-4 py-8 text-center text-sm text-slate-400">
                                        Todavia no hay personas registradas para reconocer.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-6 lg:p-8">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Estado del Escaneo</p>
                            
                            {!faceRecognition?.service_configured && (
                                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                                    Motor IA no configurado. Faltan variables de Redis/colas.
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2 mt-6">
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fotos analizadas</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{recognitionSummary.photos_with_people || 0}</p>
                                </div>
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-5 py-5 shadow-sm">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Personas halladas</p>
                                    <p className="mt-2 text-3xl font-semibold text-slate-900">{recognitionSummary.people_detected_total || 0}</p>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Pendientes</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{recognitionSummary.photos_pending || 0}</p>
                                </div>
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Sin rostro</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{recognitionSummary.photos_without_face || 0}</p>
                                </div>
                                <div className="rounded-2xl border border-[#e6e0d5] bg-white px-4 py-4">
                                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fallidas</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-900">{recognitionSummary.photos_with_errors || 0}</p>
                                </div>
                            </div>

                            <div className="mt-8 h-3 overflow-hidden rounded-full bg-slate-200">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#171411] via-[#7c5d45] to-[#d1a673] transition-all duration-1000"
                                    style={{
                                        width: `${Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                ((recognitionSummary.photos_with_people || 0) / Math.max(1, (project.photos || []).length)) * 100
                                            )
                                        )}%`,
                                    }}
                                />
                            </div>
                            <p className="mt-3 text-sm text-slate-500 font-medium">
                                Progreso: {recognitionSummary.photos_with_people || 0} de {(project.photos || []).length} completadas.
                            </p>

                            <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.post(`/admin/projects/${project.id}/recognition/run`, {}, { preserveScroll: true })}
                                    disabled={!canUseRecognition}
                                    className={clsx(
                                        'flex-1 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-semibold',
                                        !canUseRecognition
                                            ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                            : 'bg-[#171411] text-white shadow-md transition hover:-translate-y-0.5'
                                    )}
                                >
                                    <WandSparkles className="h-4 w-4" />
                                    Escanear Galeria Completa
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={saveMeta}
                                    className="flex-1 rounded-2xl border border-[#ddd5c9] bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Guardar Preferencias
                                </button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() => router.post(`/admin/projects/${project.id}/recognition/test`, {}, { preserveScroll: true })}
                                    className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Probar conexion IA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (window.confirm('Limpiar todas las personas detectadas de la galeria?')) {
                                            router.post(`/admin/projects/${project.id}/recognition`, { _method: 'delete' }, { preserveScroll: true });
                                        }
                                    }}
                                    disabled={!project.photos?.some(p => p.recognition_status !== null)}
                                    className={clsx(
                                        'rounded-2xl px-4 py-2.5 text-xs font-semibold transition',
                                        !project.photos?.some(p => p.recognition_status !== null)
                                            ? 'cursor-not-allowed border border-[#ddd5c9] bg-slate-100 text-slate-400'
                                            : 'border border-[#f0d7d0] bg-white text-rose-600 hover:bg-rose-50'
                                    )}
                                >
                                    Restablecer fotos
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}

