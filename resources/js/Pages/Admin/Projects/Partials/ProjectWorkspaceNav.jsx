import React from 'react';
import { Link } from '@inertiajs/react';
import { CalendarRange, FolderKanban, Images, LayoutTemplate, ReceiptText, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

export default function ProjectWorkspaceNav({ project, current }) {
    const items = [
        { key: 'details', label: 'Detalles', icon: FolderKanban, href: (projectId) => `/admin/projects/${projectId}/details`, visible: !!project.permissions?.can_manage_gallery },
        { key: 'gallery', label: 'Fotos', icon: Images, href: (projectId) => `/admin/projects/${projectId}/gallery`, visible: true },
        { key: 'design', label: 'Diseno', icon: LayoutTemplate, href: (projectId) => `/admin/projects/${projectId}/design`, visible: !!project.permissions?.can_manage_gallery },
        { key: 'ai', label: 'Procesar', icon: Sparkles, href: (projectId) => `/admin/projects/${projectId}/ai`, visible: !!project.permissions?.can_manage_gallery },
        { key: 'management', label: 'Gestion', icon: ReceiptText, href: (projectId) => `/admin/projects/${projectId}/management`, visible: !!project.permissions?.can_manage_finance },
    ].filter((item) => item.visible);

    return (
        <div className="rounded-[2rem] border border-[#e6e0d5] bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Workspace</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{project.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2"><CalendarRange className="h-4 w-4" />{project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Fecha por definir'}</span>
                        <span className="rounded-full bg-[#f3eee6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{project.status}</span>
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-5">
                {items.map(({ key, label, icon: Icon, href }) => (
                    <Link
                        key={key}
                        href={href(project.id)}
                        className={clsx(
                            'rounded-[1.5rem] border p-4 transition shadow-sm',
                            current === key
                                ? 'border-[#171411] bg-[#171411] text-white'
                                : 'border-[#e6e0d5] bg-[#fbf9f6] text-slate-700 hover:-translate-y-0.5 hover:shadow-md'
                        )}
                    >
                        <div className={clsx('flex h-11 w-11 items-center justify-center rounded-2xl', current === key ? 'bg-white/10' : 'bg-white')}>
                            <Icon className={clsx('h-5 w-5', current === key ? 'text-white' : 'text-slate-700')} />
                        </div>
                        <p className="mt-4 text-sm font-semibold">{label}</p>
                        <p className={clsx('mt-1 text-[11px] leading-4', current === key ? 'text-white/70' : 'text-slate-500')}>
                            {key === 'details' && 'Nombre y estado.'}
                            {key === 'gallery' && 'Subir fotos.'}
                            {key === 'design' && 'Plantilla y accesos.'}
                            {key === 'ai' && 'IA y procesamiento.'}
                            {key === 'management' && 'Cobros y PDF.'}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
