import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Grip } from 'lucide-react';

const defaultTheme = {
    font_heading: 'Fraunces, Georgia, serif',
    palette: {
        surface: '#f7f1e9',
        surface_alt: '#f5eee6',
        text: '#241b16',
        muted: '#6b594c',
        accent: '#8b6d54',
        accent_soft: '#e4d8cb',
        surface_dark: '#241b16',
    },
};

export default function Portfolio({ homepage, theme = defaultTheme, projects, categories = [], selectedCategory = '', pagination }) {
    const palette = { ...defaultTheme.palette, ...(theme?.palette || {}) };
    const headingFont = theme?.font_heading || defaultTheme.font_heading;

    return (
        <div className="min-h-screen" style={{ backgroundColor: palette.surface, color: palette.text }}>
            <Head title={`Portafolio | ${homepage.brand.name}`} />

            <header className="border-b backdrop-blur" style={{ borderColor: palette.accent_soft, backgroundColor: `${palette.surface}f2` }}>
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: palette.accent }}>Portfolio</p>
                        <h1 className="mt-3 text-4xl md:text-5xl" style={{ fontFamily: headingFont }}>
                            Featured projects
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7" style={{ color: palette.muted }}>
                            Historias publicadas para clientes que buscan una mirada editorial, humana y coherente con su tipo de evento.
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition"
                        style={{ borderColor: palette.accent_soft, color: palette.muted }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12 md:px-10">
                <div className="mb-10 flex flex-wrap gap-3">
                    <CategoryChip href="/portfolio" active={selectedCategory === ''} palette={palette}>Todos</CategoryChip>
                    {categories.map((category) => (
                        <CategoryChip
                            key={category}
                            href={`/portfolio?category=${encodeURIComponent(category)}`}
                            active={selectedCategory === category}
                            palette={palette}
                        >
                            {category}
                        </CategoryChip>
                    ))}
                </div>

                {projects.data.length > 0 ? (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {projects.data.map((project) => (
                                <article key={project.id} className="overflow-hidden rounded-[2rem] border bg-white shadow-[0_22px_50px_rgba(60,40,24,.08)]" style={{ borderColor: palette.accent_soft }}>
                                    {project.image_url ? (
                                        <img src={project.image_url} alt={project.name} className="h-72 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-72 items-center justify-center" style={{ backgroundColor: palette.surface_alt, color: palette.accent }}>
                                            Sin portada disponible
                                        </div>
                                    )}

                                    <div className="space-y-4 p-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: palette.surface_alt, color: palette.accent }}>
                                                {project.category}
                                            </span>
                                            <span className="text-xs" style={{ color: palette.accent }}>{project.photos_count} fotos</span>
                                        </div>

                                        <div>
                                            <h2 className="text-2xl" style={{ fontFamily: headingFont }}>
                                                {project.name}
                                            </h2>
                                            <p className="mt-3 text-sm leading-7" style={{ color: palette.muted }}>{project.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-2">
                                            <span className="text-xs uppercase tracking-[0.18em]" style={{ color: palette.accent }}>
                                                {project.event_date || 'Coleccion publicada'}
                                            </span>

                                            {project.gallery_url ? (
                                                <Link
                                                    href={project.gallery_url}
                                                    className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition"
                                                    style={{ backgroundColor: palette.surface_dark }}
                                                >
                                                    Ver galeria
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs" style={{ color: palette.accent }}>Sin enlace publico</span>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {pagination.last_page > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-3">
                                {Array.from({ length: pagination.last_page }, (_, index) => {
                                    const page = index + 1;
                                    const params = new URLSearchParams();
                                    if (selectedCategory) params.set('category', selectedCategory);
                                    params.set('page', String(page));

                                    return (
                                        <Link
                                            key={page}
                                            href={`/portfolio?${params.toString()}`}
                                            className="rounded-full px-4 py-2 text-sm font-semibold transition"
                                            style={page === pagination.current_page
                                                ? { backgroundColor: palette.surface_dark, color: '#fff' }
                                                : { border: `1px solid ${palette.accent_soft}`, color: palette.muted }}
                                        >
                                            {page}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-[2rem] border border-dashed bg-white/70 px-8 py-20 text-center" style={{ borderColor: palette.accent_soft }}>
                        <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: palette.accent }}>Sin proyectos</p>
                        <h2 className="mt-4 text-3xl" style={{ fontFamily: headingFont }}>
                            Aun no hay proyectos publicados para esta categoria
                        </h2>
                        <p className="mt-4 text-sm leading-7" style={{ color: palette.muted }}>
                            Publica fotografias desde el panel admin y asigna su tipo de proyecto para mostrar colecciones aqui.
                        </p>
                    </div>
                )}
            </main>

            <footer className="border-t px-6 py-8 md:px-10" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface }}>
                <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between" style={{ color: palette.muted }}>
                    <p>Desarrollado por PixelPRO</p>
                    <Link href="/login" className="inline-flex items-center gap-2 uppercase tracking-[0.22em] transition" style={{ color: palette.accent }}>
                        <Grip className="h-4 w-4" />
                        Login
                    </Link>
                </div>
            </footer>
        </div>
    );
}

function CategoryChip({ href, active, children, palette }) {
    return (
        <Link
            href={href}
            className="rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition"
            style={active
                ? { backgroundColor: palette.surface_dark, color: '#fff' }
                : { border: `1px solid ${palette.accent_soft}`, color: palette.muted }}
        >
            {children}
        </Link>
    );
}

Portfolio.layout = (page) => page;
