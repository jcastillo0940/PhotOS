import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProjectWorkspaceNav from '@/Pages/Admin/Projects/Partials/ProjectWorkspaceNav';
import { ChevronLeft, Copy, ExternalLink, Globe2, LayoutTemplate } from 'lucide-react';
import { clsx } from 'clsx';

export default function Design({ project, availableTemplates }) {
    const { flash } = usePage().props;
    const [templateCode, setTemplateCode] = React.useState(project.gallery_template_code || availableTemplates?.[0]?.code || '');
    const [websiteCategory, setWebsiteCategory] = React.useState(project.website_category || project.lead?.event_type || '');
    const [websiteDescription, setWebsiteDescription] = React.useState(project.website_description || '');
    const [copiedLink, setCopiedLink] = React.useState(false);
    const [copiedCode, setCopiedCode] = React.useState(false);

    const saveMeta = () => {
        router.put(`/admin/projects/${project.id}`, {
            gallery_template_code: templateCode,
            website_category: websiteCategory,
            website_description: websiteDescription,
        }, { preserveScroll: true, preserveState: true });
    };

    const copyPublicLink = async () => {
        if (!project.public_gallery_url) return;
        try {
            await navigator.clipboard.writeText(project.public_gallery_url);
            setCopiedLink(true);
            window.setTimeout(() => setCopiedLink(false), 2200);
        } catch (error) {
            window.prompt('Copia este enlace publico:', project.public_gallery_url);
        }
    };

    const copyAccessCode = async () => {
        if (!project.gallery_password) return;
        try {
            await navigator.clipboard.writeText(project.gallery_password);
            setCopiedCode(true);
            window.setTimeout(() => setCopiedCode(false), 2200);
        } catch (error) {
            window.prompt('Copia este codigo de acceso:', project.gallery_password);
        }
    };

    return (
        <AdminLayout>
            <Head title={`Diseno y Accesos: ${project.name}`} />

            <div className="space-y-8">
                <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900">
                    <ChevronLeft className="h-4 w-4" />
                    Volver a colecciones
                </Link>

                <ProjectWorkspaceNav project={project} current="design" />

                {(flash?.success || flash?.error) && (
                    <div className={`rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm ${flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {flash?.error || flash?.success}
                    </div>
                )}

                <section className="rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Diseno y Accesos</p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Plantilla y privacidad web</h2>
                        <p className="mt-2 text-sm leading-7 text-slate-500">Configura como lucira la galeria para el cliente final y como se comparte.</p>
                    </div>

                    <div className="mt-8 grid gap-6 md:grid-cols-2">
                        {/* Tarjeta de Compartir */}
                        <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-6 lg:p-8">
                            <div className="flex items-center gap-3 text-slate-600 mb-2">
                                <Globe2 className="h-5 w-5" />
                                <h3 className="text-lg font-bold text-slate-900">Compartir y Accesos</h3>
                            </div>
                            <p className="text-sm leading-6 text-slate-500">
                                Envia esta informacion al cliente para que acceda a visualizar y descargar su portafolio final.
                            </p>

                            <div className="mt-6 rounded-[1.3rem] border border-[#e6e0d5] bg-white px-5 py-4 shadow-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Enlace publico</p>
                                <p className="mt-2 break-all text-[13px] font-medium text-slate-700 select-all">{project.public_gallery_url}</p>
                                <button
                                    type="button"
                                    onClick={copyPublicLink}
                                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    {copiedLink ? 'Enlace copiado' : 'Copiar URL'}
                                </button>
                            </div>

                            <div className="mt-4 rounded-[1.3rem] border border-[#e6e0d5] bg-white px-5 py-4 shadow-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Contrasena de acceso</p>
                                <div className="mt-1 flex items-center justify-between gap-4">
                                    <p className="text-xl font-bold tracking-[0.2em] text-slate-900">{project.gallery_password || 'Ninguna'}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={copyAccessCode}
                                    disabled={!project.gallery_password}
                                    className={clsx(
                                        'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition',
                                        !project.gallery_password
                                            ? 'cursor-not-allowed bg-slate-50 text-slate-400'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    )}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                    {copiedCode ? 'Copiada' : 'Copiar contrasena'}
                                </button>
                            </div>

                            <a
                                href={project.public_gallery_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#171411] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Visualizar galeria live
                            </a>
                        </div>

                        {/* Tarjeta de Diseno */}
                        <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-6 lg:p-8">
                            <div className="flex items-center gap-3 text-slate-600 mb-2">
                                <LayoutTemplate className="h-5 w-5" />
                                <h3 className="text-lg font-bold text-slate-900">Configuracion Web</h3>
                            </div>
                            <p className="text-sm leading-6 text-slate-500">
                                Ajusta la plantilla y meta-descripcion que cargaran los clientes y los motores de busqueda.
                            </p>

                            <div className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">Plantilla Visual</label>
                                    <select 
                                        value={templateCode} 
                                        onChange={(event) => setTemplateCode(event.target.value)} 
                                        className="mt-2 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                    >
                                        {availableTemplates?.map((template) => (
                                            <option key={template.code} value={template.code}>{template.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">Categoria (Subtitulo)</label>
                                    <input 
                                        value={websiteCategory} 
                                        onChange={(event) => setWebsiteCategory(event.target.value)} 
                                        placeholder="Ej. Boda Civil, Sesion Familiar..."
                                        className="mt-2 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">Descripcion Corta</label>
                                    <textarea 
                                        rows={3} 
                                        value={websiteDescription} 
                                        onChange={(event) => setWebsiteDescription(event.target.value)} 
                                        placeholder="Unas breves palabras para contar la historia..."
                                        className="mt-2 w-full resize-none rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" 
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={saveMeta} 
                                className="mt-6 w-full rounded-2xl bg-[#171411] px-4 py-3.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
                            >
                                Refrescar diseno
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
