import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Camera, Plus, Edit2, Trash2, X, Layout, Palette, Sparkles } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';

function TemplateModal({ template, onClose }) {
    const isEditing = !!template;
    const { data, setData, post, put, processing, errors } = useForm({
        code: template?.code || '',
        name: template?.name || '',
        tagline: template?.tagline || '',
        description: template?.description || '',
        layout: template?.layout || 'hero-overlay',
        mood: template?.mood || 'clean',
        accent_color: template?.accent_color || '#000000',
        is_active: template?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(`/admin/saas/templates/${template.id}`, { onSuccess: () => onClose() });
        } else {
            post('/admin/saas/templates', { onSuccess: () => onClose() });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-[2.5rem] border border-[#e6e0d5] bg-white p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Editar Plantilla' : 'Nueva Plantilla'}</h3>
                    <button onClick={onClose} className="rounded-2xl p-2 hover:bg-slate-100"><X className="h-5 w-5 text-slate-400" /></button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Codigo</span>
                            <input value={data.code} onChange={e => setData('code', e.target.value)} disabled={isEditing} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none disabled:opacity-50" placeholder="mi-layout" />
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Nombre</span>
                            <input value={data.name} onChange={e => setData('name', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none" placeholder="Minimalist Loft" />
                        </label>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Tagline</span>
                        <input value={data.tagline} onChange={e => setData('tagline', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none" placeholder="Un estilo limpio y moderno" />
                    </label>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Descripcion</span>
                        <textarea value={data.description} onChange={e => setData('description', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none h-20" />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Layout</span>
                            <select value={data.layout} onChange={e => setData('layout', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none">
                                <option value="hero-overlay">Hero Overlay</option>
                                <option value="framed-overlay">Framed Overlay</option>
                                <option value="split-hero">Split Hero</option>
                                <option value="minimal-banner">Minimal Banner</option>
                            </select>
                        </label>
                        <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Vibe/Mood</span>
                            <input value={data.mood} onChange={e => setData('mood', e.target.value)} className="w-full rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none" placeholder="dramatic, airy, clean" />
                        </label>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Color de acento</span>
                        <div className="flex gap-3 items-center">
                            <input type="color" value={data.accent_color} onChange={e => setData('accent_color', e.target.value)} className="h-11 w-20 rounded-xl border border-[#e6e0d5] bg-white p-1" />
                            <input value={data.accent_color} onChange={e => setData('accent_color', e.target.value)} className="flex-1 rounded-xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm outline-none uppercase" />
                        </div>
                    </label>

                    <div className="flex justify-end gap-3 pt-6">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-[#e6e0d5] text-sm font-semibold text-slate-600">Cancelar</button>
                        <button type="submit" disabled={processing} className="px-8 py-3 rounded-2xl bg-[#171411] text-sm font-semibold text-white hover:bg-black transition-all">
                            {isEditing ? 'Actualizar Plantilla' : 'Crear Plantilla'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Index({ templates }) {
    const [modalTemplate, setModalTemplate] = React.useState(null);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const { delete: destroy } = useForm();

    return (
        <AdminLayout>
            <Head title="SaaS - Plantillas de galerias" />
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Plantillas de galerias</h2>
                        <p className="text-sm text-slate-500">Administra estilos visuales para galerias de entrega. El front completo del tenant se asigna desde la pantalla Website de cada tenant.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black">
                        <Plus className="h-4 w-4" />
                        Nueva plantilla
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(tpl => (
                        <div key={tpl.id} className="group rounded-[2rem] border border-[#e6e0d5] bg-white p-6 shadow-sm hover:shadow-lg transition-all">
                            <div className="flex items-start justify-between">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbf9f6] border border-[#f3eee6]">
                                    <Layout className="h-6 w-6 text-slate-600" />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setModalTemplate(tpl)} className="p-2 rounded-xl hover:bg-slate-50 transition-colors"><Edit2 className="h-4 w-4 text-slate-400 hover:text-slate-900" /></button>
                                    <button onClick={() => confirm('Borrar?') && destroy(`/admin/saas/templates/${tpl.id}`)} className="p-2 rounded-xl hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-500" /></button>
                                </div>
                            </div>

                            <div className="mt-5">
                                <h3 className="text-lg font-bold text-slate-900">{tpl.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{tpl.code}</p>
                                <p className="mt-3 text-sm text-slate-500 leading-relaxed line-clamp-2">{tpl.description}</p>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                                    <Camera className="h-3 w-3" /> Galeria
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                    <Sparkles className="h-3 w-3" /> {tpl.mood}
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                    <Palette className="h-3 w-3" /> {tpl.layout.replace('-', ' ')}
                                </span>
                                <div className="h-5 w-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: tpl.accent_color }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {(isCreateOpen || modalTemplate) && (
                <TemplateModal
                    template={modalTemplate}
                    onClose={() => { setModalTemplate(null); setIsCreateOpen(false); }}
                />
            )}
        </AdminLayout>
    );
}
