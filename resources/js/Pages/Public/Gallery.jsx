import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Heart,
    Maximize2,
    X,
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
    Camera,
    Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const TEMPLATE_STYLES = {
    'cinematic-dark': {
        page: 'bg-[#050505] text-white',
        header: 'text-white',
        heroOverlay: 'bg-gradient-to-t from-black via-black/45 to-transparent',
        heroHeight: 'h-[76vh] md:h-[92vh]',
        title: 'text-5xl md:text-8xl tracking-tight text-white',
        subtitle: 'text-primary-200/80',
        filterActive: 'bg-white text-black border-white',
        filterIdle: 'bg-white/5 text-[#777] border-white/5 hover:text-white hover:bg-white/10',
        card: 'bg-[#151515] border border-white/5',
        footer: 'text-[#222]',
    },
    'editorial-frame': {
        page: 'bg-[#e9e1d6] text-[#1f1914]',
        header: 'text-[#f5efe7]',
        heroOverlay: 'bg-[linear-gradient(to_top,rgba(24,18,14,0.35),rgba(24,18,14,0.08),rgba(24,18,14,0.18))]',
        heroHeight: 'h-[74vh] md:h-[88vh]',
        title: 'text-5xl md:text-7xl tracking-tight text-[#fff8f2]',
        subtitle: 'text-[#efe5d7]',
        filterActive: 'bg-[#1f1914] text-white border-[#1f1914]',
        filterIdle: 'bg-white/60 text-[#6c5d53] border-[#d7cabd] hover:bg-white hover:text-[#1f1914]',
        card: 'bg-[#f8f3ed] border border-[#dfd4c8]',
        footer: 'text-[#8c7d70]',
    },
    'split-story': {
        page: 'bg-[#f7f3eb] text-[#171717]',
        header: 'text-[#171717]',
        heroOverlay: 'bg-transparent',
        heroHeight: 'h-[52vh] md:h-[68vh]',
        title: 'text-4xl md:text-6xl tracking-tight text-[#171717]',
        subtitle: 'text-[#78684d]',
        filterActive: 'bg-[#b59c6b] text-white border-[#b59c6b]',
        filterIdle: 'bg-white text-[#8f8068] border-[#e3d8c6] hover:border-[#b59c6b] hover:text-[#171717]',
        card: 'bg-white border border-[#ebe2d6]',
        footer: 'text-[#b9ab97]',
    },
    'minimal-grid': {
        page: 'bg-[#f8f8f6] text-[#111111]',
        header: 'text-[#111111]',
        heroOverlay: 'bg-gradient-to-t from-white/80 via-transparent to-transparent',
        heroHeight: 'h-[44vh] md:h-[58vh]',
        title: 'text-4xl md:text-6xl tracking-tight text-[#111111]',
        subtitle: 'text-[#555555]',
        filterActive: 'bg-[#111111] text-white border-[#111111]',
        filterIdle: 'bg-white text-[#666666] border-[#e4e4e1] hover:border-[#111111] hover:text-[#111111]',
        card: 'bg-white border border-[#ecebe7]',
        footer: 'text-[#b7b7b2]',
    },
    'mono-story': {
        page: 'bg-[#111111] text-white',
        header: 'text-white',
        heroOverlay: 'bg-gradient-to-t from-black via-black/40 to-transparent',
        heroHeight: 'h-[76vh] md:h-[90vh]',
        title: 'text-5xl md:text-8xl tracking-tight text-white',
        subtitle: 'text-white/70',
        filterActive: 'bg-white text-black border-white',
        filterIdle: 'bg-white/5 text-[#999] border-white/10 hover:text-white hover:bg-white/10',
        card: 'bg-[#181818] border border-white/10',
        footer: 'text-[#444]',
    },
    'sunset-split': {
        page: 'bg-[#fcf6ef] text-[#22160f]',
        header: 'text-[#22160f]',
        heroOverlay: 'bg-transparent',
        heroHeight: 'h-[52vh] md:h-[68vh]',
        title: 'text-4xl md:text-6xl tracking-tight text-[#22160f]',
        subtitle: 'text-[#8b5c34]',
        filterActive: 'bg-[#d89a57] text-white border-[#d89a57]',
        filterIdle: 'bg-white text-[#8c6c54] border-[#eddac5] hover:border-[#d89a57] hover:text-[#22160f]',
        card: 'bg-white border border-[#efdfcc]',
        footer: 'text-[#c49b73]',
    },
};

const PhotoCard = ({ photo, onClick, onToggleHeart, cardClass, showDarkChrome }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className={clsx('group relative overflow-hidden rounded-[24px] cursor-zoom-in w-full shadow-xl', cardClass)}
    >
        <img
            src={photo.url}
            alt="Gallery Shot"
            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 block"
            onClick={onClick}
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
        />
        <div className={clsx(
            'absolute inset-x-0 bottom-0 py-6 px-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between',
            showDarkChrome ? 'bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white' : 'bg-gradient-to-t from-white/90 via-white/60 to-transparent text-[#111]'
        )}>
            <div className="flex items-center space-x-3">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleHeart(photo); }}
                    className={clsx(
                        'p-3 rounded-full backdrop-blur-md transition-all',
                        photo.is_selected
                            ? 'bg-accent/80 text-white'
                            : showDarkChrome
                                ? 'bg-white/10 text-white hover:bg-white/20'
                                : 'bg-black/10 text-[#111] hover:bg-black/15'
                    )}
                >
                    <Heart className={clsx('w-4 h-4', photo.is_selected && 'fill-current')} />
                </button>
                <button className={clsx('p-3 rounded-full backdrop-blur-md transition-all', showDarkChrome ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/10 text-[#111] hover:bg-black/15')}>
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
            <div className="text-right">
                <p className={clsx('text-[10px] uppercase font-bold tracking-widest leading-none', showDarkChrome ? 'text-white/50' : 'text-black/40')}>Photo ID</p>
                <p className="text-xs font-mono font-bold leading-none mt-1">#{photo.id}</p>
            </div>
        </div>
        {photo.is_selected && (
            <div className="absolute top-4 left-4 p-2 bg-accent shadow-xl shadow-accent/20 rounded-full text-white">
                <Heart className="w-4 h-4 fill-current" />
            </div>
        )}
    </motion.div>
);

function GalleryHero({ templateCode, styles, heroPhoto, project, shareGallery }) {
    if (!heroPhoto) return null;

    if (templateCode === 'split-story' || templateCode === 'sunset-split') {
        return (
            <section className="px-8 md:px-16 pt-12 md:pt-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <div className="bg-white border border-[#ebe2d6] rounded-[40px] p-10 md:p-16 flex flex-col justify-center shadow-[0_20px_80px_rgba(181,156,107,0.12)]">
                        <div className="w-14 h-14 rounded-2xl bg-[#f0e6d6] border border-[#e1d3bc] flex items-center justify-center mb-8">
                            <Camera className="w-6 h-6 text-[#8c7340]" />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.35em] font-black text-[#8f8068] mb-4">{project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Galeria privada'}</p>
                        <h1 className={clsx('font-heading font-black mb-4', styles.title)}>{project.name}</h1>
                        <p className={clsx('text-sm md:text-base leading-relaxed max-w-xl', styles.subtitle)}>Explora la galeria completa. Las descargas de alta calidad se gestionan de forma privada con tu fotografo.</p>
                        <button onClick={shareGallery} className={clsx('mt-8 inline-flex w-fit items-center px-6 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl', templateCode === 'sunset-split' ? 'bg-[#d89a57]' : 'bg-[#b59c6b]')}>
                            <Share2 className="w-4 h-4 mr-2" /> Compartir galeria
                        </button>
                    </div>
                    <div className="bg-[#f3ede2] rounded-[40px] p-6 md:p-8 shadow-[0_20px_80px_rgba(181,156,107,0.12)]">
                        <div className="overflow-hidden rounded-[28px] h-full min-h-[320px]">
                            <img
                                src={heroPhoto.url}
                                alt="Gallery Cover"
                                className="w-full h-full object-cover"
                                style={{ objectPosition: `${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}` }}
                            />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (templateCode === 'minimal-grid') {
        return (
            <section className="px-8 md:px-16 pt-10 md:pt-14">
                <div className="overflow-hidden rounded-[34px] border border-[#e9e9e3] bg-white">
                    <div className={clsx('relative overflow-hidden', styles.heroHeight)}>
                        <img
                            src={heroPhoto.url}
                            alt="Gallery Cover"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}` }}
                        />
                        <div className={clsx('absolute inset-0', styles.heroOverlay)} />
                    </div>
                    <div className="px-8 md:px-12 py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-[#7a7a73] mb-3">{project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Galeria privada'}</p>
                            <h1 className={clsx('font-heading font-black mb-3', styles.title)}>{project.name}</h1>
                            <p className={clsx('text-sm md:text-base leading-relaxed max-w-2xl', styles.subtitle)}>Explora la galeria completa. Las descargas de alta calidad se gestionan de forma privada con tu fotografo.</p>
                        </div>
                        <button onClick={shareGallery} className="inline-flex items-center px-6 py-3 rounded-2xl border border-[#111111] text-[#111111] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#111111] hover:text-white transition-all">
                            <Share2 className="w-4 h-4 mr-2" /> Compartir galeria
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={clsx('relative w-full overflow-hidden border-b', styles.heroHeight, templateCode === 'editorial-frame' ? 'border-[#d9cdbf]' : 'border-white/5')}>
            <img
                src={heroPhoto.url}
                alt="Gallery Cover"
                className="w-full h-full object-cover"
                style={{ objectPosition: `${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}` }}
            />
            <div className={clsx('absolute inset-0', styles.heroOverlay)} />
            {templateCode === 'editorial-frame' && <div className="absolute inset-6 md:inset-10 border border-[#efe5d7]/70" />}

            <div className="absolute inset-0 px-8 md:px-16 flex flex-col items-center justify-center text-center">
                <p className={clsx('font-black text-[10px] uppercase tracking-[0.4em] mb-4', styles.subtitle)}>{project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Exclusive Gallery'}</p>
                <h1 className={clsx('font-heading font-black drop-shadow-2xl', styles.title)}>{project.name}</h1>
                <p className={clsx('mt-6 max-w-2xl mx-auto text-sm md:text-base font-medium tracking-wide', styles.subtitle)}>Explora la galeria completa. Las descargas de alta calidad se gestionan de forma privada con tu fotografo.</p>
                <button onClick={shareGallery} className={clsx('mt-8 inline-flex items-center px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all', templateCode === 'editorial-frame' ? 'border-[#f5efe7] text-[#f5efe7] hover:bg-[#f5efe7] hover:text-[#1f1914]' : 'border-white/20 bg-black/20 text-white hover:bg-black/40')}>
                    <Share2 className="w-4 h-4 mr-2" /> Compartir galeria
                </button>
            </div>
        </section>
    );
}

export default function Gallery({ project, photos, galleryTemplate }) {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [filter, setFilter] = useState('All');
    const templateCode = galleryTemplate?.code || 'cinematic-dark';
    const styles = TEMPLATE_STYLES[templateCode] || TEMPLATE_STYLES['cinematic-dark'];
    const categories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.tags?.length ? photo.tags : [photo.category]).filter(Boolean))], [photos]);
    const heroPhoto = photos.find(photo => photo.id === project.hero_photo_id) || photos[0];
    const isDarkChrome = ['cinematic-dark', 'editorial-frame', 'mono-story'].includes(templateCode);

    useEffect(() => {
        const preventDownloads = (event) => {
            const blockedCombo =
                event.key === 'PrintScreen' ||
                ((event.ctrlKey || event.metaKey) && ['s', 'u', 'p'].includes(event.key.toLowerCase()));

            if (blockedCombo) {
                event.preventDefault();
            }
        };

        const preventContextMenu = (event) => {
            event.preventDefault();
        };

        window.addEventListener('keydown', preventDownloads);
        window.addEventListener('contextmenu', preventContextMenu);

        return () => {
            window.removeEventListener('keydown', preventDownloads);
            window.removeEventListener('contextmenu', preventContextMenu);
        };
    }, []);

    const toggleHeart = (photo) => {
        router.post(`/gallery/photo/${photo.id}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const shareGallery = async () => {
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({ title: project.name, url });
                return;
            } catch (error) {
            }
        }

        await navigator.clipboard.writeText(url);
        window.alert('Link de la galeria copiado.');
    };

    const filteredPhotos = filter === 'All'
        ? photos
        : photos.filter(photo => (photo.tags?.length ? photo.tags : [photo.category]).includes(filter));

    const nextPhoto = () => {
        const index = photos.findIndex(p => p.id === selectedPhoto.id);
        if (index < photos.length - 1) setSelectedPhoto(photos[index + 1]);
    };

    const prevPhoto = () => {
        const index = photos.findIndex(p => p.id === selectedPhoto.id);
        if (index > 0) setSelectedPhoto(photos[index - 1]);
    };

    return (
        <div className={clsx('min-h-screen selection:bg-accent/30 selection:text-white pb-24', styles.page)}>
            <Head title={`Gallery: ${project.name}`} />

            <header className="px-8 md:px-16 py-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center border', isDarkChrome ? 'bg-white/10 border-white/10' : 'bg-white border-black/5')}>
                        <Camera className={clsx('w-5 h-5', isDarkChrome ? 'text-white' : 'text-[#171717]')} />
                    </div>
                    <div className="flex flex-col">
                        <span className={clsx('font-heading font-black text-[10px] uppercase tracking-[0.3em] leading-none mb-1', isDarkChrome ? 'text-white/50' : 'text-black/35')}>{galleryTemplate?.name || 'Portfolio'}</span>
                        <span className={clsx('text-xs', isDarkChrome ? 'text-white/70' : 'text-[#666]')}>{project.event_date ? new Date(project.event_date).toLocaleDateString() : project.name}</span>
                    </div>
                </div>

                <button onClick={shareGallery} className={clsx('flex items-center px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border', isDarkChrome ? 'bg-black/30 border-white/10 text-[#ddd] hover:text-white hover:bg-black/50' : 'bg-white border-black/10 text-[#444] hover:border-black/30 hover:text-[#111]')}>
                    <Share2 className="w-3.5 h-3.5 mr-2" /> Share
                </button>
            </header>

            {photos.length > 0 && heroPhoto && (
                <GalleryHero
                    templateCode={templateCode}
                    styles={styles}
                    heroPhoto={heroPhoto}
                    project={project}
                    shareGallery={shareGallery}
                />
            )}

            <section className="pt-12 px-8 md:px-16 pb-10 flex items-center justify-center space-x-3 overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={clsx(
                            'px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap',
                            filter === cat ? styles.filterActive : styles.filterIdle
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </section>

            <main className="px-8 md:px-16 mt-4">
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6 space-y-4 md:space-y-6">
                    <AnimatePresence mode="popLayout">
                        {filteredPhotos.map((photo) => (
                            <div key={photo.id} className="break-inside-avoid">
                                <PhotoCard
                                    photo={photo}
                                    onClick={() => setSelectedPhoto(photo)}
                                    onToggleHeart={toggleHeart}
                                    cardClass={styles.card}
                                    showDarkChrome={isDarkChrome}
                                />
                            </div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredPhotos.length === 0 && (
                    <div className="py-40 text-center">
                        <LayoutGrid className="w-16 h-16 text-[#c9c1b7] mx-auto mb-6" />
                        <p className="font-black uppercase tracking-[0.4em] text-xs text-[#a59886]">No hay fotos en este filtro</p>
                    </div>
                )}
            </main>

            <footer className={clsx('mt-24 px-16 text-center', styles.footer)}>
                <p className="text-[10px] uppercase font-black tracking-[0.6em] mb-4 italic">Artisan Processing and Delivery Platform</p>
                <div className={clsx('w-12 h-[1px] mx-auto', isDarkChrome ? 'bg-white/5' : 'bg-black/10')} />
            </footer>

            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-[#000]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8"
                    >
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all group"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </button>

                        <div className="absolute top-1/2 left-8 -translate-y-1/2 hidden md:block">
                            <button onClick={prevPhoto} className="p-6 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden md:block">
                            <button onClick={nextPhoto} className="p-6 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all">
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>

                        <motion.div layoutId={selectedPhoto.id} className="relative w-full max-w-6xl aspect-[3/2] flex items-center justify-center">
                            <img
                                src={selectedPhoto.url}
                                alt="Master Visualization"
                                className="max-h-[80vh] max-w-full rounded-[3px] shadow-4xl pointer-events-none select-none"
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                            />
                        </motion.div>

                        <div className="mt-12 flex items-center space-x-12">
                            <div className="text-center">
                                <p className="text-[10px] text-[#444] uppercase font-black tracking-widest mb-1 italic">Date Taken</p>
                                <p className="text-white text-sm font-heading font-black tabular-nums">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="w-[1px] h-10 bg-white/10" />
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => toggleHeart(selectedPhoto)}
                                    className={clsx(
                                        'px-8 py-3 rounded-full flex items-center transition-all font-black text-xs uppercase tracking-widest',
                                        selectedPhoto.is_selected ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                    )}
                                >
                                    <Heart className={clsx('w-4 h-4 mr-2', selectedPhoto.is_selected && 'fill-current')} />
                                    {selectedPhoto.is_selected ? 'In Selection' : 'Add to Selection'}
                                </button>
                                <a
                                    href={selectedPhoto.high_res_available ? `/gallery/photo/${selectedPhoto.id}/download` : undefined}
                                    onClick={(event) => {
                                        if (!selectedPhoto.high_res_available) {
                                            event.preventDefault();
                                        }
                                    }}
                                    className={clsx(
                                        'px-8 py-3 rounded-full flex items-center transition-all font-black text-xs uppercase tracking-widest',
                                        selectedPhoto.high_res_available
                                            ? 'bg-white text-black hover:bg-[#f3f3f3]'
                                            : 'bg-white/5 text-[#666] border border-white/10 cursor-not-allowed'
                                    )}
                                >
                                    {selectedPhoto.high_res_available ? 'Descargar original' : 'Periodo de descarga finalizado'}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

