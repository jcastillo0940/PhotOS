import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Check,
    Download,
    Heart,
    Maximize2,
    X,
    LayoutGrid,
    ChevronLeft,
    ChevronRight,
    Camera,
    Share2,
    UserRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const TEMPLATE_STYLES = {
    'cinematic-dark': {
        page: 'bg-[#030303] text-white selection:bg-white/20',
        header: 'text-white',
        heroOverlay: 'bg-gradient-to-t from-[#030303] via-[#030303]/40 to-[rgba(3,3,3,0)]',
        heroHeight: 'h-[80vh] md:h-[95vh]',
        title: 'text-6xl md:text-9xl font-black tracking-tighter leading-[0.9]',
        subtitle: 'text-white/60 font-medium tracking-wide',
        filterActive: 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]',
        filterIdle: 'bg-white/5 text-white/40 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10',
        card: 'bg-[#0a0a0a] border border-white/5 ring-1 ring-white/5',
        footer: 'text-white/20',
    },
    'editorial-frame': {
        page: 'bg-[#fcfaf7] text-[#1a1612] selection:bg-[#1a1612]/10',
        header: 'text-[#1a1612]',
        heroOverlay: 'bg-gradient-to-t from-[#1a1612]/20 via-[rgba(26,22,18,0)] to-[rgba(26,22,18,0)]',
        heroHeight: 'h-[75vh] md:h-[90vh]',
        title: 'text-5xl md:text-8xl font-black tracking-tight leading-tight',
        subtitle: 'text-[#1a1612]/60 font-serif italic',
        filterActive: 'bg-[#1a1612] text-white border-[#1a1612] shadow-xl',
        filterIdle: 'bg-white text-[#1a1612]/40 border-[#e5dfd9] hover:bg-[#1a1612]/5 hover:text-[#1a1612]',
        card: 'bg-white border border-[#e5dfd9] shadow-sm',
        footer: 'text-[#1a1612]/20',
    },
    'split-story': {
        page: 'bg-[#faf9f6] text-[#171717] selection:bg-[#b59c6b]/20',
        header: 'text-[#171717]',
        heroOverlay: 'bg-transparent',
        heroHeight: 'h-[60vh] md:h-[75vh]',
        title: 'text-5xl md:text-7xl font-black tracking-tight',
        subtitle: 'text-[#78684d] font-medium leading-relaxed',
        filterActive: 'bg-[#b59c6b] text-white border-[#b59c6b] shadow-lg shadow-[#b59c6b]/20',
        filterIdle: 'bg-white text-[#8f8068] border-[#e3d8c6] hover:border-[#b59c6b] hover:text-[#b59c6b]',
        card: 'bg-white border border-[#ebe2d6] shadow-sm',
        footer: 'text-[#b9ab97]',
    },
    'minimal-grid': {
        page: 'bg-white text-[#111111] selection:bg-black/10',
        header: 'text-[#111111]',
        heroOverlay: 'bg-gradient-to-t from-white via-[rgba(255,255,255,0)] to-[rgba(255,255,255,0)]',
        heroHeight: 'h-[50vh] md:h-[65vh]',
        title: 'text-5xl md:text-8xl font-black tracking-tighter',
        subtitle: 'text-[#666] font-normal leading-relaxed',
        filterActive: 'bg-[#111111] text-white border-[#111111]',
        filterIdle: 'bg-white text-[#666] border-[#eee] hover:border-[#111111] hover:text-[#111111]',
        card: 'bg-white border border-[#f0f0f0] shadow-sm',
        footer: 'text-[#ccc]',
    },
    'mono-story': {
        page: 'bg-black text-white selection:bg-white/10',
        header: 'text-white',
        heroOverlay: 'bg-gradient-to-t from-black via-[rgba(0,0,0,0)] to-[rgba(0,0,0,0)]',
        heroHeight: 'h-[80vh] md:h-[95vh]',
        title: 'text-6xl md:text-9xl font-black tracking-tight uppercase',
        subtitle: 'text-white/50 tracking-[0.2em] font-light',
        filterActive: 'bg-white text-black border-white',
        filterIdle: 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white',
        card: 'bg-[#080808] border border-white/10',
        footer: 'text-white/10',
    },
    'sunset-split': {
        page: 'bg-[#fffcf9] text-[#2d1b0e] selection:bg-[#d89a57]/20',
        header: 'text-[#2d1b0e]',
        heroOverlay: 'bg-transparent',
        heroHeight: 'h-[60vh] md:h-[75vh]',
        title: 'text-5xl md:text-8xl font-black tracking-tight text-[#2d1b0e]',
        subtitle: 'text-[#8c6c54] font-medium italic',
        filterActive: 'bg-[#d89a57] text-white border-[#d89a57] shadow-lg shadow-[#d89a57]/20',
        filterIdle: 'bg-white text-[#8c6c54] border-[#f3e5d8] hover:border-[#d89a57] hover:text-[#d89a57]',
        card: 'bg-white border border-[#f3e5d8] shadow-sm',
        footer: 'text-[#d89a57]/30',
    },
};

const galleryFilterLabel = (value) => value === 'All' ? 'Todos' : value;

function Lightbox({ photo, isSelected, onClose, onPrev, onNext, onToggleHeart, access }) {
    const touchStartX = React.useRef(null);

    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? onNext() : onPrev();
        touchStartX.current = null;
    };

    React.useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onNext, onPrev, onClose]);

    const canDownload = photo.high_res_available && access?.can_download_originals;
    const canFavorite = !!access?.can_select_favorites;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col" style={{ WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Top bar */}
            <div className="flex items-center justify-between px-3 pt-3 pb-1 md:px-6 md:pt-5 shrink-0">
                <button
                    onClick={onClose}
                    className="p-2.5 bg-white/8 hover:bg-white/15 active:bg-white/20 rounded-full text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <span className="text-[10px] text-white/25 font-black uppercase tracking-[0.3em]">
                    {photo.id.toString().padStart(4, '0')}
                </span>

                {/* Mobile: prev / next arrows in top-right */}
                <div className="flex items-center gap-1.5 md:hidden">
                    <button onClick={onPrev} className="p-2.5 bg-white/8 hover:bg-white/15 active:bg-white/20 rounded-full text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={onNext} className="p-2.5 bg-white/8 hover:bg-white/15 active:bg-white/20 rounded-full text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Desktop: invisible spacer to balance the close btn */}
                <div className="hidden md:block w-10" />
            </div>

            {/* Image area — flex-1 fills available space */}
            <div className="relative flex-1 flex items-center justify-center px-2 md:px-20 min-h-0">
                {/* Desktop prev/next */}
                <button
                    onClick={onPrev}
                    className="absolute left-3 z-10 p-4 bg-white/5 hover:bg-white/12 rounded-full text-white transition-colors hidden md:flex"
                >
                    <ChevronLeft className="w-7 h-7" />
                </button>

                <img
                    src={photo.url}
                    alt=""
                    className="max-h-full max-w-full object-contain rounded pointer-events-none select-none"
                    style={{ maxHeight: 'calc(100svh - 140px)' }}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                />

                <button
                    onClick={onNext}
                    className="absolute right-3 z-10 p-4 bg-white/5 hover:bg-white/12 rounded-full text-white transition-colors hidden md:flex"
                >
                    <ChevronRight className="w-7 h-7" />
                </button>
            </div>

            {/* Bottom action bar */}
            <div className="shrink-0 px-3 pb-5 pt-3 md:px-8 md:pb-7 flex items-center gap-2">
                {canFavorite && (
                    <motion.button
                        onClick={() => onToggleHeart(photo)}
                        whileTap={{ scale: 0.92 }}
                        className={clsx(
                            'flex-1 md:flex-none py-3 px-4 md:px-7 rounded-full flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest transition-colors',
                            isSelected
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-white/8 text-white border border-white/12 hover:bg-white/15'
                        )}
                    >
                        {isSelected
                            ? <><Check className="w-4 h-4 shrink-0" strokeWidth={3} /><span>Seleccionada</span></>
                            : <><Heart className="w-4 h-4 shrink-0" /><span>Me gusta</span></>
                        }
                    </motion.button>
                )}

                {canDownload ? (
                    <a
                        href={`/gallery/photo/${photo.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none py-3 px-4 md:px-7 rounded-full flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest bg-white text-black hover:bg-white/90 transition-colors"
                    >
                        <Download className="w-4 h-4 shrink-0" /><span>Descargar</span>
                    </a>
                ) : null}

                {/* If nothing actionable, just show a subtle hint */}
                {!canFavorite && !canDownload && (
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 text-white/20 text-[11px] font-black uppercase tracking-widest">
                        <Heart className="w-4 h-4" /> Solo clientes
                    </div>
                )}
            </div>
        </motion.div>
    );
}

const PhotoCard = ({ photo, isSelected, onClick, onToggleHeart, cardClass, showDarkChrome, allowSelection }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx('group relative overflow-hidden rounded-2xl md:rounded-[32px] cursor-pointer w-full transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]', cardClass)}
    >
        <div className="overflow-hidden aspect-auto">
            {photo.thumbnail_url || photo.url ? (
                <img
                    src={photo.thumbnail_url || photo.url}
                    alt=""
                    className="w-full h-auto object-cover md:transition-transform md:duration-1000 md:group-hover:scale-110 block"
                    onClick={onClick}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                />
            ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-black/10 text-[10px] font-black uppercase tracking-[0.3em] opacity-50">
                    Procesando
                </div>
            )}
        </div>

        {/* Desktop hover overlay */}
        <div className={clsx(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none hidden md:block',
            showDarkChrome ? 'bg-black/20' : 'bg-black/5'
        )} />

        {/* Desktop hover bottom bar */}
        <div className={clsx(
            'absolute inset-x-0 bottom-0 py-6 px-5 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 items-center justify-between z-10 hidden md:flex',
            showDarkChrome ? 'bg-gradient-to-t from-black via-black/40 to-[rgba(0,0,0,0)] text-white' : 'bg-gradient-to-t from-black/80 via-black/40 to-[rgba(0,0,0,0)] text-white'
        )}>
            <div className="flex items-center space-x-2 pointer-events-auto">
                {allowSelection && (
                    <motion.button
                        onClick={(e) => { e.stopPropagation(); onToggleHeart(photo); }}
                        whileTap={{ scale: 0.82 }}
                        className={clsx(
                            'p-3 rounded-full backdrop-blur-xl transition-colors duration-300',
                            isSelected
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                        )}
                    >
                        {isSelected
                            ? <Check className="w-4 h-4" strokeWidth={3} />
                            : <Heart className="w-4 h-4" />
                        }
                    </motion.button>
                )}
                <button
                    onClick={onClick}
                    className="p-3 rounded-full backdrop-blur-xl bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all active:scale-95"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
            <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/40 leading-none pointer-events-none">
                {photo.id.toString().padStart(4, '0')}
            </p>
        </div>

        {/* Mobile: always-visible heart button — small, bottom-left corner */}
        {allowSelection && (
            <motion.button
                onClick={(e) => { e.stopPropagation(); onToggleHeart(photo); }}
                whileTap={{ scale: 0.78 }}
                className={clsx(
                    'absolute bottom-2 left-2 z-20 flex items-center justify-center rounded-full backdrop-blur-md transition-colors duration-200 md:hidden',
                    'w-7 h-7',
                    isSelected
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/50'
                        : 'bg-black/50 text-white/80 border border-white/10'
                )}
            >
                {isSelected
                    ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    : <Heart className="w-3.5 h-3.5" />
                }
            </motion.button>
        )}

        {/* Selected badge (desktop, always visible when selected) */}
        <AnimatePresence>
            {allowSelection && isSelected && (
                <motion.div
                    key="selected-badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute top-3 left-3 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 text-white z-20"
                >
                    <Check className="w-4 h-4" strokeWidth={3} />
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
);

function GalleryHero({ templateCode, styles, heroPhoto, project, shareGallery, galleryTemplate, isDarkChrome }) {
    if (!heroPhoto) return null;

    if (templateCode === 'split-story' || templateCode === 'sunset-split') {
        return (
            <section className="px-5 pt-5 md:px-8 md:pt-8">
                <div className="grid min-h-[100svh] grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 items-stretch">
                    <div className="bg-white border border-[#ebe2d6] rounded-[40px] p-10 md:p-16 flex flex-col justify-center shadow-[0_20px_80px_rgba(181,156,107,0.12)]">
                        <div className="mb-12 flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white border-black/5">
                                    <Camera className="h-5 w-5 text-[#171717]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="mb-1 font-heading text-[10px] font-black uppercase tracking-[0.3em] leading-none text-black/35">
                                        {galleryTemplate?.name || 'Portafolio'}
                                    </span>
                                    <span className="text-xs text-[#666]">
                                        {project.event_date ? new Date(project.event_date).toLocaleDateString('es-PA') : project.name}
                                    </span>
                                </div>
                            </div>

                            <button onClick={shareGallery} className="flex items-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#444] transition-all hover:border-black/30 hover:text-[#111]">
                                <Share2 className="mr-2 h-3.5 w-3.5" /> Compartir
                            </button>
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-[#f0e6d6] border border-[#e1d3bc] flex items-center justify-center mb-8">
                            <Camera className="w-6 h-6 text-[#8c7340]" />
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.35em] font-black text-[#8f8068] mb-4">{project.event_date ? new Date(project.event_date).toLocaleDateString('es-PA') : 'Galería privada'}</p>
                        <h1 className={clsx('font-heading font-black mb-4', styles.title)}>{project.name}</h1>
                        <p className={clsx('text-sm md:text-base leading-relaxed max-w-xl', styles.subtitle)}>Explora la galería completa. Las descargas de alta calidad se gestionan de forma privada con tu fotógrafo.</p>
                        <button onClick={shareGallery} className={clsx('mt-8 inline-flex w-fit items-center px-6 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl', templateCode === 'sunset-split' ? 'bg-[#d89a57]' : 'bg-[#b59c6b]')}>
                            <Share2 className="w-4 h-4 mr-2" /> Compartir galería
                        </button>
                    </div>
                    <div className="bg-[#f3ede2] rounded-[40px] p-4 md:p-6 shadow-[0_20px_80px_rgba(181,156,107,0.12)]">
                        <div className="overflow-hidden rounded-[28px] h-full min-h-[320px]">
                            <img
                                src={heroPhoto.url}
                                alt="Portada de la galería"
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
            <section className="px-5 pt-5 md:px-8 md:pt-8">
                <div className="overflow-hidden rounded-[34px] border border-[#e9e9e3] bg-white">
                    <div className="flex items-center justify-between gap-4 border-b border-[#ecebe7] px-6 py-5 md:px-8">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white border-black/5">
                                <Camera className="h-5 w-5 text-[#171717]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="mb-1 font-heading text-[10px] font-black uppercase tracking-[0.3em] leading-none text-black/35">
                                    {galleryTemplate?.name || 'Portafolio'}
                                </span>
                                <span className="text-xs text-[#666]">
                                    {project.event_date ? new Date(project.event_date).toLocaleDateString('es-PA') : project.name}
                                </span>
                            </div>
                        </div>

                        <button onClick={shareGallery} className="flex items-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#444] transition-all hover:border-black/30 hover:text-[#111]">
                            <Share2 className="mr-2 h-3.5 w-3.5" /> Compartir
                        </button>
                    </div>
                    <div className={clsx('relative overflow-hidden min-h-[72svh] md:min-h-[100svh]', styles.heroHeight)}>
                        <img
                            src={heroPhoto.url}
                            alt="Portada de la galería"
                            className="w-full h-full object-cover"
                            style={{ objectPosition: `${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}` }}
                        />
                        <div className={clsx('absolute inset-0', styles.heroOverlay)} />
                    </div>
                    <div className="px-8 md:px-12 py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.35em] font-black text-[#7a7a73] mb-3">{project.event_date ? new Date(project.event_date).toLocaleDateString('es-PA') : 'Galería privada'}</p>
                            <h1 className={clsx('font-heading font-black mb-3', styles.title)}>{project.name}</h1>
                            <p className={clsx('text-sm md:text-base leading-relaxed max-w-2xl', styles.subtitle)}>Explora la galería completa. Las descargas de alta calidad se gestionan de forma privada con tu fotógrafo.</p>
                        </div>
                        <button onClick={shareGallery} className="inline-flex items-center px-6 py-3 rounded-2xl border border-[#111111] text-[#111111] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#111111] hover:text-white transition-all">
                            <Share2 className="w-4 h-4 mr-2" /> Compartir galería
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={clsx('relative w-full overflow-hidden border-b min-h-[100svh]', templateCode === 'editorial-frame' ? 'border-[#d9cdbf]' : 'border-white/5')}>
            {/* Focal Point / Bokeh Effect Container */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black">
                {/* 1. Base blurred layer */}
                <img
                    src={heroPhoto.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover blur-[10px] scale-105 opacity-60"
                    style={{ 
                        objectPosition: `${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}`
                    }}
                />
                
                {/* 2. Sharp Focal layer with Mask */}
                <img
                    src={heroPhoto.url}
                    alt="Portada de la galería"
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
                    style={{
                        objectPosition: `${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}`,
                        WebkitMaskImage: `radial-gradient(circle at ${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}, black 15%, rgba(0,0,0,0) 65%)`,
                        maskImage: `radial-gradient(circle at ${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}, black 15%, rgba(0,0,0,0) 65%)`
                    }}
                />
            </div>

            {/* High Contrast Overlay for Text Readability */}
            <div className={clsx(
                'absolute inset-0 z-1',
                templateCode === 'editorial-frame' 
                    ? 'bg-gradient-to-b from-[#1a1612]/60 via-transparent to-[#1a1612]/80' 
                    : 'bg-gradient-to-b from-black/40 via-transparent to-black/90'
            )} />

            <div className="absolute inset-x-0 top-0 z-20 px-5 pt-5 md:px-8 md:pt-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl border backdrop-blur-md', isDarkChrome ? 'bg-white/10 border-white/10' : 'bg-white border-black/5')}>
                            <Camera className={clsx('h-5 w-5', isDarkChrome ? 'text-white' : 'text-[#171717]')} />
                        </div>
                        <div className="flex flex-col">
                            <span className={clsx('mb-1 font-heading text-[10px] font-black uppercase tracking-[0.3em] leading-none', isDarkChrome ? 'text-white/55' : 'text-black/35')}>
                                {galleryTemplate?.name || 'Portafolio'}
                            </span>
                            <span className={clsx('text-xs', isDarkChrome ? 'text-white/80' : 'text-[#666]')}>
                                {project.event_date ? new Date(project.event_date).toLocaleDateString('es-PA') : project.name}
                            </span>
                        </div>
                    </div>

                    <button onClick={shareGallery} className={clsx('flex items-center rounded-full border px-5 py-2.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all', isDarkChrome ? 'bg-black/30 border-white/10 text-[#ddd] hover:text-white hover:bg-black/50' : 'bg-white border-black/10 text-[#444] hover:border-black/30 hover:text-[#111]')}>
                        <Share2 className="mr-2 h-3.5 w-3.5" /> Compartir
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 pt-24 text-center md:px-12 md:pt-28">
                <p className={clsx('font-black text-[10px] uppercase tracking-[0.4em] mb-4 text-white/70 shadow-sm', styles.subtitle)}>{project.event_date ? new Date(project.event_date).toLocaleDateString('es-PA') : 'Galería exclusiva'}</p>
                <h1 className={clsx('font-heading font-black drop-shadow-2xl text-4xl sm:text-5xl md:text-7xl lg:text-8xl max-w-6xl text-white', styles.title)}>{project.name}</h1>
                <p className={clsx('mt-8 max-w-2xl mx-auto text-sm md:text-base font-medium tracking-wide text-white/80', styles.subtitle)}>Explora la galería completa. Las descargas de alta calidad se gestionan de forma privada con tu fotógrafo.</p>
                <button onClick={shareGallery} className={clsx('mt-10 inline-flex items-center px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all', templateCode === 'editorial-frame' ? 'border-[#f5efe7] text-[#f5efe7] hover:bg-[#f5efe7] hover:text-[#1f1914]' : 'border-white/20 bg-white/10 text-white hover:bg-white hover:text-black')}>
                    <Share2 className="w-4 h-4 mr-2" /> Compartir galería
                </button>
            </div>
        </section>
    );
}

export default function Gallery({ project, photos, heroPhoto: heroPhotoProp, galleryTemplate, access, galleryTitle }) {
    const { flash, errors, branding } = usePage().props;
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);
    const selectedPhoto = selectedPhotoId != null ? (photos.find((p) => p.id === selectedPhotoId) ?? null) : null;
    // Local favorites set — updated optimistically like a Facebook like, no page reload
    const [localFavorites, setLocalFavorites] = useState(
        () => new Set(photos.filter(p => p.is_selected).map(p => p.id))
    );
    const isPhotoSelected = (photo) => localFavorites.has(photo.id);
    const selectedCount = localFavorites.size;
    const [filter, setFilter] = useState('All');
    const [peopleFilter, setPeopleFilter] = useState('All');
    const [brandFilter, setBrandFilter] = useState('All');
    const [peopleCountFilter, setPeopleCountFilter] = useState('All');
    const [jerseyFilter, setJerseyFilter] = useState('All');
    const [sponsorFilter, setSponsorFilter] = useState('All');
    const [contextFilter, setContextFilter] = useState('All');
    const [actionFilter, setActionFilter] = useState('All');
    const [showClientAccess, setShowClientAccess] = useState(false);
    const [zipDownloading, setZipDownloading] = useState(false);
    const templateCode = galleryTemplate?.code || 'cinematic-dark';
    const styles = TEMPLATE_STYLES[templateCode] || TEMPLATE_STYLES['cinematic-dark'];
    const categories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.tags?.length ? photo.tags : [photo.category]).filter(Boolean))], [photos]);
    const peopleCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.people_tags || []).filter(Boolean))], [photos]);
    const brandCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.brand_tags || []).filter(Boolean))], [photos]);
    const peopleCountCategories = useMemo(() => ['All', ...new Set(photos.map(photo => photo.people_count_label).filter(label => label && label !== '0 personas'))], [photos]);
    const jerseyCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.jersey_numbers || []).filter(Boolean))], [photos]);
    const sponsorCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.sponsor_tags || []).filter(Boolean))], [photos]);
    const contextCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.context_tags || []).filter(Boolean))], [photos]);
    const actionCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.action_tags || []).filter(Boolean))], [photos]);
    // heroPhotoProp viene del backend y siempre incluye la portada aunque no esté en "mostrar en web"
    const heroPhoto = heroPhotoProp || photos.find(photo => photo.id === project.hero_photo_id) || photos[0];
    const isDarkChrome = ['cinematic-dark', 'editorial-frame', 'mono-story'].includes(templateCode);
    // isPageDark se usa para el panel de info y modal — editorial-frame tiene fondo CLARO aunque el hero sea oscuro
    const isPageDark = ['cinematic-dark', 'mono-story'].includes(templateCode);
    const isClientView = access?.mode === 'client';

    const handleZipDownload = async () => {
        if (zipDownloading) return;
        setZipDownloading(true);
        try {
            const response = await fetch(`/gallery/${project.gallery_token}/download/zip`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'No fue posible preparar la descarga. Intenta de nuevo.');
                return;
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const disposition = response.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="?([^"]+)"?/);
            a.href = url;
            a.download = match ? match[1] : 'galeria-fotos.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            alert('Error de conexión al descargar. Intenta de nuevo.');
        } finally {
            setZipDownloading(false);
        }
    };
    const sportsModeEnabled = !!project?.sports_mode_enabled;
    const sponsorDiscoveryEnabled = !!project?.supports_sponsor_detection && sportsModeEnabled;
    const unlockForm = useForm({
        visitor_name: access?.registered_name || '',
        visitor_email: access?.registered_email || '',
        gallery_access_code: '',
    });

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

    useEffect(() => {
        if (errors?.gallery_access_code || errors?.visitor_email) {
            setShowClientAccess(true);
        }
    }, [errors?.gallery_access_code, errors?.visitor_email]);

    const toggleHeart = async (photo) => {
        if (!access?.can_select_favorites) return;
        const wasSelected = localFavorites.has(photo.id);
        // Instant optimistic update — no waiting, no reload
        setLocalFavorites(prev => {
            const next = new Set(prev);
            wasSelected ? next.delete(photo.id) : next.add(photo.id);
            return next;
        });
        try {
            const xsrfToken = decodeURIComponent(
                document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
            );
            const res = await fetch(`/gallery/photo/${photo.id}/toggle`, {
                method: 'POST',
                headers: {
                    'X-XSRF-TOKEN': xsrfToken,
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) throw new Error('toggle failed');
        } catch {
            // Revert on server error
            setLocalFavorites(prev => {
                const next = new Set(prev);
                wasSelected ? next.add(photo.id) : next.delete(photo.id);
                return next;
            });
        }
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
        window.alert('Enlace de la galería copiado.');
    };

    const filteredPhotos = photos.filter((photo) => {
        const generalMatch = filter === 'All'
            ? true
            : (photo.tags?.length ? photo.tags : [photo.category]).includes(filter);

        const peopleMatch = peopleFilter === 'All'
            ? true
            : (photo.people_tags || []).includes(peopleFilter);

        const brandMatch = brandFilter === 'All'
            ? true
            : (photo.brand_tags || []).includes(brandFilter);

        const peopleCountMatch = peopleCountFilter === 'All'
            ? true
            : photo.people_count_label === peopleCountFilter;

        const jerseyMatch = jerseyFilter === 'All'
            ? true
            : (photo.jersey_numbers || []).includes(jerseyFilter);

        const sponsorMatch = sponsorFilter === 'All'
            ? true
            : (photo.sponsor_tags || []).includes(sponsorFilter);

        const contextMatch = contextFilter === 'All'
            ? true
            : (photo.context_tags || []).includes(contextFilter);

        const actionMatch = actionFilter === 'All'
            ? true
            : (photo.action_tags || []).includes(actionFilter);

        return generalMatch
            && peopleMatch
            && (!sponsorDiscoveryEnabled || brandMatch)
            && peopleCountMatch
            && (!sponsorDiscoveryEnabled || jerseyMatch)
            && (!sponsorDiscoveryEnabled || sponsorMatch)
            && (!sponsorDiscoveryEnabled || contextMatch)
            && (!sponsorDiscoveryEnabled || actionMatch);
    });
    const nextPhoto = () => {
        if (!selectedPhoto) return;
        const index = photos.findIndex((p) => p.id === selectedPhoto.id);
        if (index < photos.length - 1) setSelectedPhotoId(photos[index + 1].id);
    };

    const prevPhoto = () => {
        if (!selectedPhoto) return;
        const index = photos.findIndex((p) => p.id === selectedPhoto.id);
        if (index > 0) setSelectedPhotoId(photos[index - 1].id);
    };

    return (
        <div className={clsx('min-h-screen selection:bg-accent/30 selection:text-white pb-24', styles.page)}>
            <Head title={galleryTitle || `${branding?.app_name || 'Galería'} | ${project.name}`} />

                <>

            {heroPhoto && (
                <GalleryHero
                    templateCode={templateCode}
                    styles={styles}
                    heroPhoto={heroPhoto}
                    project={project}
                    shareGallery={shareGallery}
                    galleryTemplate={galleryTemplate}
                    isDarkChrome={isDarkChrome}
                />
            )}

            <section className="px-5 pt-8 md:px-8 lg:px-10 xl:px-12">
                <div className={clsx(
                    'mx-auto max-w-[1320px] rounded-[2rem] border px-5 py-5 md:px-6',
                    isPageDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white'
                )}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className={clsx('text-[10px] font-black uppercase tracking-[0.28em]', isPageDark ? 'text-white/70' : 'text-black/60')}>
                                {isClientView ? 'Galería completa desbloqueada' : 'Vista pública del portafolio'}
                            </p>
                            <p className={clsx('mt-2 text-xs uppercase tracking-[0.24em] font-bold', isPageDark ? 'text-white/65' : 'text-[#6b4f3a]')}>
                                {branding?.app_name || 'Estudio'}
                            </p>
                            <h2 className={clsx('mt-2 text-xl font-black leading-tight md:text-2xl', isPageDark ? 'text-white' : 'text-[#241b16]')}>
                                {galleryTitle || 'Una galería construida con emoción, luz y movimiento'}
                            </h2>
                            <p className={clsx('mt-2 max-w-2xl text-sm leading-7', isPageDark ? 'text-white/90' : 'text-[#3d2b1e]')}>
                                {isClientView
                                    ? 'Estás viendo la galería completa del cliente. Aquí se habilitan favoritos y descargas originales si la ventana de entrega sigue activa.'
                                    : sportsModeEnabled
                                        ? 'Esta vista pública solo muestra las fotos marcadas por el fotógrafo para web. Si eres el cliente, usa Acceso cliente para ver la galería completa y aprovechar filtros deportivos cuando estén disponibles.'
                                        : 'Esta vista pública solo muestra las fotos marcadas por el fotógrafo para web. Si eres el cliente, usa Acceso cliente para ver la galería completa, marcar favoritos y descargar.'}
                            </p>
                            {typeof access?.public_photo_count === 'number' && typeof access?.client_photo_count === 'number' && (
                                <p className={clsx('mt-2 text-xs uppercase tracking-[0.2em] font-bold', isPageDark ? 'text-white/70' : 'text-[#6b4f3a]')}>
                                    {isClientView ? `${access.client_photo_count} fotos visibles` : `${access.public_photo_count} fotos públicas visibles`}
                                </p>
                            )}
                            {access?.registered_email && (
                                <p className={clsx('mt-2 text-xs font-medium', isPageDark ? 'text-white/70' : 'text-[#6b4f3a]')}>
                                    Acceso registrado con {access.registered_email}
                                </p>
                            )}
                        </div>

                        {!isClientView && (
                            <button
                                type="button"
                                onClick={() => setShowClientAccess(true)}
                                className={clsx(
                                    'rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition',
                                    isPageDark
                                        ? 'bg-white text-black'
                                        : 'bg-[#241b16] text-white'
                                )}
                            >
                                Acceso cliente
                            </button>
                        )}

                        {isClientView && access?.can_download_originals && (
                            <button
                                type="button"
                                onClick={handleZipDownload}
                                disabled={zipDownloading}
                                className={clsx(
                                    'flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition disabled:opacity-60 disabled:cursor-not-allowed',
                                    isPageDark
                                        ? 'bg-white text-black hover:bg-white/90'
                                        : 'bg-[#241b16] text-white hover:bg-black'
                                )}
                            >
                                <Download className={clsx('w-3.5 h-3.5 shrink-0', zipDownloading && 'animate-pulse')} />
                                {zipDownloading ? 'Preparando…' : 'Descargar todo (ZIP)'}
                            </button>
                        )}
                    </div>

                    {(flash?.success || errors?.gallery_access_code || errors?.visitor_email) && (
                        <div className={clsx(
                            'mt-4 rounded-[1.4rem] border px-4 py-3 text-sm',
                            (errors?.gallery_access_code || errors?.visitor_email)
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : isPageDark
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        )}>
                            {errors?.gallery_access_code || errors?.visitor_email || flash?.success}
                        </div>
                    )}
                </div>
            </section>

            <div className="w-full max-w-[1920px] mx-auto flex flex-col items-center">
                <section className="w-full px-3 md:px-5 pb-8 pt-10 flex items-center justify-center">
                    <div className="flex w-full max-w-[1320px] flex-col items-center gap-4">
                        <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                            {categories.map(cat => (
                                <motion.button
                                    key={cat}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilter(cat)}
                                    className={clsx(
                                        'px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all border whitespace-nowrap',
                                        filter === cat ? styles.filterActive : styles.filterIdle
                                    )}
                                >
                                    {galleryFilterLabel(cat)}
                                </motion.button>
                            ))}
                        </div>

                        {!!project?.face_recognition_enabled && peopleCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <UserRound className="h-3.5 w-3.5" />
                                    Personas en la galería
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                                    {peopleCategories.map(person => (
                                        <motion.button
                                            key={person}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setPeopleFilter(person)}
                                            className={clsx(
                                                'px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all border whitespace-nowrap',
                                                peopleFilter === person ? styles.filterActive : styles.filterIdle
                                            )}
                                        >
                                            {galleryFilterLabel(person)}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sponsorDiscoveryEnabled && brandCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <Camera className="h-3.5 w-3.5" />
                                    Marcas detectadas
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                                    {brandCategories.map((brand) => (
                                        <motion.button
                                            key={brand}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setBrandFilter(brand)}
                                            className={clsx(
                                                'px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all border whitespace-nowrap',
                                                brandFilter === brand ? styles.filterActive : styles.filterIdle
                                            )}
                                        >
                                            {galleryFilterLabel(brand)}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sponsorDiscoveryEnabled && peopleCountCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <UserRound className="h-3.5 w-3.5" />
                                    Conteo de personas
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                                    {peopleCountCategories.map((countLabel) => (
                                        <motion.button
                                            key={countLabel}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setPeopleCountFilter(countLabel)}
                                            className={clsx(
                                                'px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all border whitespace-nowrap',
                                                peopleCountFilter === countLabel ? styles.filterActive : styles.filterIdle
                                            )}
                                        >
                                            {galleryFilterLabel(countLabel)}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sponsorDiscoveryEnabled && jerseyCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <UserRound className="h-3.5 w-3.5" />
                                    Dorsales
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                                    {jerseyCategories.map((jersey) => (
                                        <motion.button
                                            key={jersey}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setJerseyFilter(jersey)}
                                            className={clsx(
                                                'px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all border whitespace-nowrap',
                                                jerseyFilter === jersey ? styles.filterActive : styles.filterIdle
                                            )}
                                        >
                                            {jersey === 'All' ? 'Todos' : `#${jersey}`}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sponsorDiscoveryEnabled && sponsorCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <Camera className="h-3.5 w-3.5" />
                                    Patrocinadores
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                                    {sponsorCategories.map((sponsor) => (
                                        <motion.button
                                            key={sponsor}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSponsorFilter(sponsor)}
                                            className={clsx(
                                                'px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all border whitespace-nowrap',
                                                sponsorFilter === sponsor ? styles.filterActive : styles.filterIdle
                                            )}
                                        >
                                            {galleryFilterLabel(sponsor)}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sponsorDiscoveryEnabled && contextCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <Camera className="h-3.5 w-3.5" />
                                    Contexto
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                                    {contextCategories.map((contextTag) => (
                                        <motion.button
                                            key={contextTag}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setContextFilter(contextTag)}
                                            className={clsx(
                                                'px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all border whitespace-nowrap',
                                                contextFilter === contextTag ? styles.filterActive : styles.filterIdle
                                            )}
                                        >
                                            {galleryFilterLabel(contextTag)}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sponsorDiscoveryEnabled && actionCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <Camera className="h-3.5 w-3.5" />
                                    Acciones
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto no-scrollbar py-2">
                                    {actionCategories.map((actionTag) => (
                                        <motion.button
                                            key={actionTag}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setActionFilter(actionTag)}
                                            className={clsx(
                                                'px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all border whitespace-nowrap',
                                                actionFilter === actionTag ? styles.filterActive : styles.filterIdle
                                            )}
                                        >
                                            {galleryFilterLabel(actionTag)}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <main className="w-full px-3 md:px-10 lg:px-12 xl:px-16 pb-32">
                    <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 2xl:columns-5 gap-2 sm:gap-3 md:gap-5 lg:gap-6">
                        <AnimatePresence initial={false}>
                            {filteredPhotos.map((photo) => (
                                <motion.div
                                    key={photo.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="break-inside-avoid mb-2 sm:mb-3 md:mb-5 lg:mb-6 w-full"
                                >
                                    <PhotoCard
                                        photo={photo}
                                        isSelected={isPhotoSelected(photo)}
                                        onClick={() => setSelectedPhotoId(photo.id)}
                                        onToggleHeart={toggleHeart}
                                        cardClass={styles.card}
                                        showDarkChrome={isDarkChrome}
                                        allowSelection={!!access?.can_select_favorites}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {filteredPhotos.length === 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="py-60 text-center w-full"
                        >
                            <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-10">
                                <LayoutGrid className="w-10 h-10 text-white/10" />
                            </div>
                            <p className="font-black uppercase tracking-[0.5em] text-xs opacity-30">No hay fotografías disponibles</p>
                        </motion.div>
                    )}

                </main>
            </div>

            <footer className={clsx('mt-24 px-16 text-center', styles.footer)}>
                <p className="text-[10px] uppercase font-black tracking-[0.6em] mb-4 italic">{branding?.app_name || 'Plataforma de selección y entrega fotográfica'}</p>
                <div className={clsx('w-12 h-[1px] mx-auto', isDarkChrome ? 'bg-white/5' : 'bg-black/10')} />
            </footer>

            <AnimatePresence>
                {selectedPhoto && (
                    <Lightbox
                        photo={selectedPhoto}
                        isSelected={isPhotoSelected(selectedPhoto)}
                        onClose={() => setSelectedPhotoId(null)}
                        onPrev={prevPhoto}
                        onNext={nextPhoto}
                        onToggleHeart={toggleHeart}
                        access={access}
                    />
                )}
            </AnimatePresence>
                </>

            {/* Floating selection counter */}
            <AnimatePresence>
                {access?.can_select_favorites && selectedCount > 0 && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2"
                    >
                        <div className="flex items-center gap-4 rounded-full bg-emerald-500 px-6 py-3 shadow-2xl shadow-emerald-500/40">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-black text-white">
                                {selectedCount}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-white">
                                {selectedCount === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
                            </span>
                            <Check className="h-4 w-4 text-white/80" strokeWidth={3} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showClientAccess && !isClientView && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            className={clsx(
                                'w-full max-w-lg rounded-[2rem] border p-8 shadow-[0_35px_120px_rgba(0,0,0,0.25)]',
                                isPageDark ? 'border-white/10 bg-[#0b0b0b] text-white' : 'border-[#e5ddd1] bg-white text-[#241b16]'
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className={clsx('text-[11px] font-black uppercase tracking-[0.28em]', isPageDark ? 'text-white/65' : 'text-[#6b4f3a]')}>
                                        Acceso cliente
                                    </p>
                                    <h2 className="mt-3 text-2xl font-black tracking-tight">Ver galería completa</h2>
                                    <p className={clsx('mt-3 text-sm leading-7', isPageDark ? 'text-white/80' : 'text-[#4a3728]')}>
                                        Ingresa tu correo y la clave privada para desbloquear toda la galería, activar favoritos y habilitar descargas.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowClientAccess(false)}
                                    className={clsx('rounded-full p-3 transition', isPageDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-[#241b16] hover:bg-black/10')}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    unlockForm.post(`/gallery/${project.gallery_token}/unlock`, {
                                        preserveScroll: true,
                                        onSuccess: () => setShowClientAccess(false),
                                    });
                                }}
                                className="mt-8 space-y-4"
                            >
                                <input
                                    type="text"
                                    value={unlockForm.data.visitor_name}
                                    onChange={(event) => unlockForm.setData('visitor_name', event.target.value)}
                                    placeholder="Nombre"
                                    className={clsx(
                                        'w-full rounded-[1.2rem] border px-4 py-3 text-sm outline-none',
                                        isPageDark
                                            ? 'border-white/15 bg-black/20 text-white placeholder:text-white/35'
                                            : 'border-black/10 bg-white text-[#241b16] placeholder:text-[#9b8877]'
                                    )}
                                />
                                <input
                                    type="email"
                                    value={unlockForm.data.visitor_email}
                                    onChange={(event) => unlockForm.setData('visitor_email', event.target.value.toLowerCase())}
                                    placeholder="correo@cliente.com"
                                    className={clsx(
                                        'w-full rounded-[1.2rem] border px-4 py-3 text-sm outline-none',
                                        isPageDark
                                            ? 'border-white/15 bg-black/20 text-white placeholder:text-white/35'
                                            : 'border-black/10 bg-white text-[#241b16] placeholder:text-[#9b8877]'
                                    )}
                                />
                                <input
                                    type="text"
                                    value={unlockForm.data.gallery_access_code}
                                    onChange={(event) => unlockForm.setData('gallery_access_code', event.target.value.toUpperCase())}
                                    placeholder={access?.has_password ? 'Clave o código de acceso' : 'Sin clave configurada'}
                                    disabled={!access?.has_password || unlockForm.processing}
                                    className={clsx(
                                        'w-full rounded-[1.2rem] border px-4 py-3 text-sm outline-none',
                                        isPageDark
                                            ? 'border-white/15 bg-black/20 text-white placeholder:text-white/35'
                                            : 'border-black/10 bg-white text-[#241b16] placeholder:text-[#9b8877]'
                                    )}
                                />
                                {(errors?.gallery_access_code || errors?.visitor_email) && (
                                    <div className="rounded-[1.1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        {errors?.gallery_access_code || errors?.visitor_email}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={!access?.has_password || unlockForm.processing}
                                    className={clsx(
                                        'w-full rounded-[1.2rem] px-5 py-3 text-xs font-black uppercase tracking-[0.2em] transition',
                                        isPageDark
                                            ? 'bg-white text-black disabled:bg-white/20 disabled:text-white/45'
                                            : 'bg-[#241b16] text-white disabled:bg-[#d5c6b8] disabled:text-white/70'
                                    )}
                                >
                                    {unlockForm.processing ? 'Validando acceso' : 'Entrar como cliente'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
