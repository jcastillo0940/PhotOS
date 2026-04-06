import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Grip } from 'lucide-react';

export default function Portfolio({ homepage, projects, categories = [], selectedCategory = '', pagination }) {
    return (
        <div className="min-h-screen bg-[#f7f1e9] text-[#241b16]">
            <Head title={`Portafolio | ${homepage.brand.name}`} />

            <header className="border-b border-[#e4d8cb] bg-[#f7f1e9]/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] text-[#8b6d54]">Portfolio</p>
                        <h1 className="mt-3 text-4xl text-[#241b16] md:text-5xl" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
                            Featured projects
                        </h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6b594c]">
                            Historias publicadas para clientes que buscan una mirada editorial, humana y coherente con su tipo de evento.
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full border border-[#d9cabd] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b594c] transition hover:border-[#241b16] hover:text-[#241b16]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12 md:px-10">
                <div className="mb-10 flex flex-wrap gap-3">
                    <CategoryChip href="/portfolio" active={selectedCategory === ''}>Todos</CategoryChip>
                    {categories.map((category) => (
                        <CategoryChip
                            key={category}
                            href={`/portfolio?category=${encodeURIComponent(category)}`}
                            active={selectedCategory === category}
                        >
                            {category}
                        </CategoryChip>
                    ))}
                </div>

                {projects.data.length > 0 ? (
                    <>
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {projects.data.map((project) => (
                                <article
                                    key={project.id}
                                    className="overflow-hidden rounded-[2rem] border border-[#eadfd4] bg-white shadow-[0_22px_50px_rgba(60,40,24,.08)]"
                                >
                                    {project.image_url ? (
                                        <img src={project.image_url} alt={project.name} className="h-72 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-72 items-center justify-center bg-[#efe4d7] text-[#8b6d54]">
                                            Sin portada disponible
                                        </div>
                                    )}

                                    <div className="space-y-4 p-6">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="rounded-full bg-[#f5eee6] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b6d54]">
                                                {project.category}
                                            </span>
                                            <span className="text-xs text-[#8b6d54]">{project.photos_count} fotos</span>
                                        </div>

                                        <div>
                                            <h2 className="text-2xl text-[#241b16]" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
                                                {project.name}
                                            </h2>
                                            <p className="mt-3 text-sm leading-7 text-[#6b594c]">{project.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-2">
                                            <span className="text-xs uppercase tracking-[0.18em] text-[#b19278]">
                                                {project.event_date || 'Coleccion publicada'}
                                            </span>

                                            {project.gallery_url ? (
                                                <Link
                                                    href={project.gallery_url}
                                                    className="inline-flex items-center gap-2 rounded-full bg-[#241b16] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#3a2b22]"
                                                >
                                                    Ver galeria
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-[#8b6d54]">Sin enlace publico</span>
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
                                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                                page === pagination.current_page
                                                    ? 'bg-[#241b16] text-white'
                                                    : 'border border-[#d9cabd] text-[#6b594c] hover:border-[#241b16] hover:text-[#241b16]'
                                            }`}
                                        >
                                            {page}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-[2rem] border border-dashed border-[#d9cabd] bg-white/70 px-8 py-20 text-center">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-[#8b6d54]">Sin proyectos</p>
                        <h2 className="mt-4 text-3xl text-[#241b16]" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
                            Aun no hay proyectos publicados para esta categoria
                        </h2>
                        <p className="mt-4 text-sm leading-7 text-[#6b594c]">
                            Publica fotografias desde el panel admin y asigna su tipo de proyecto para mostrar colecciones aqui.
                        </p>
                    </div>
                )}
            </main>

            <footer className="border-t border-[#e4d8cb] bg-[#f7f1e9] px-6 py-8 md:px-10">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#7a6658] md:flex-row md:items-center md:justify-between">
                    <p>Desarrollado por PixelPRO</p>
                    <Link href="/login" className="inline-flex items-center gap-2 uppercase tracking-[0.22em] text-[#8b6d54] transition hover:text-[#241b16]">
                        <Grip className="h-4 w-4" />
                        Login
                    </Link>
                </div>
            </footer>
        </div>
    );
}

function CategoryChip({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                active
                    ? 'bg-[#241b16] text-white'
                    : 'border border-[#ddcdbf] text-[#6b594c] hover:border-[#241b16] hover:text-[#241b16]'
            }`}
        >
            {children}
        </Link>
    );
}

Portfolio.layout = (page) => page;
