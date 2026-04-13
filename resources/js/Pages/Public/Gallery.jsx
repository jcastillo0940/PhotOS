import React, { useEffect, useMemo, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
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
        heroOverlay: 'bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent',
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
        heroOverlay: 'bg-gradient-to-t from-[#1a1612]/20 via-transparent to-transparent',
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
        heroOverlay: 'bg-gradient-to-t from-white via-transparent to-transparent',
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
        heroOverlay: 'bg-gradient-to-t from-black via-transparent to-transparent',
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

const PhotoCard = ({ photo, onClick, onToggleHeart, cardClass, showDarkChrome, allowSelection }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, transition: { duration: 0.3, ease: 'easeOut' } }}
        className={clsx('group relative overflow-hidden rounded-[32px] cursor-zoom-in w-full transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]', cardClass)}
    >
        <div className="overflow-hidden aspect-auto">
            <img
                src={photo.url}
                alt="Gallery Shot"
                className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110 block"
                onClick={onClick}
                loading="lazy"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
            />
        </div>
        
        <div className={clsx(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none',
            showDarkChrome ? 'bg-black/20' : 'bg-black/5'
        )} />

        <div className={clsx(
            'absolute inset-x-0 bottom-0 py-8 px-6 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center justify-between z-10',
            showDarkChrome ? 'bg-gradient-to-t from-black via-black/40 to-transparent text-white' : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white'
        )}>
            <div className="flex items-center space-x-3 pointer-events-auto">
                {allowSelection && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleHeart(photo); }}
                        className={clsx(
                            'p-4 rounded-full backdrop-blur-xl transition-all duration-300 transform active:scale-95',
                            photo.is_selected
                                ? 'bg-accent text-white shadow-lg shadow-accent/40'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                        )}
                    >
                        <Heart className={clsx('w-4.5 h-4.5', photo.is_selected && 'fill-current')} />
                    </button>
                )}
                <button 
                    onClick={onClick}
                    className="p-4 rounded-full backdrop-blur-xl bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all transform active:scale-95"
                >
                    <Maximize2 className="w-4.5 h-4.5" />
                </button>
            </div>
            <div className="text-right pointer-events-none">
                <p className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/50 leading-none">Reference</p>
                <p className="text-sm font-heading font-black leading-none mt-1.5">{photo.id.toString().padStart(4, '0')}</p>
            </div>
        </div>

        {allowSelection && photo.is_selected && (
            <div className="absolute top-6 left-6 p-2.5 bg-accent shadow-2xl shadow-accent/40 rounded-full text-white z-20">
                <Heart className="w-5 h-5 fill-current" />
            </div>
        )}
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
                                        {galleryTemplate?.name || 'Portfolio'}
                                    </span>
                                    <span className="text-xs text-[#666]">
                                        {project.event_date ? new Date(project.event_date).toLocaleDateString() : project.name}
                                    </span>
                                </div>
                            </div>

                            <button onClick={shareGallery} className="flex items-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#444] transition-all hover:border-black/30 hover:text-[#111]">
                                <Share2 className="mr-2 h-3.5 w-3.5" /> Share
                            </button>
                        </div>
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
                    <div className="bg-[#f3ede2] rounded-[40px] p-4 md:p-6 shadow-[0_20px_80px_rgba(181,156,107,0.12)]">
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
            <section className="px-5 pt-5 md:px-8 md:pt-8">
                <div className="overflow-hidden rounded-[34px] border border-[#e9e9e3] bg-white">
                    <div className="flex items-center justify-between gap-4 border-b border-[#ecebe7] px-6 py-5 md:px-8">
                        <div className="flex items-center space-x-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-white border-black/5">
                                <Camera className="h-5 w-5 text-[#171717]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="mb-1 font-heading text-[10px] font-black uppercase tracking-[0.3em] leading-none text-black/35">
                                    {galleryTemplate?.name || 'Portfolio'}
                                </span>
                                <span className="text-xs text-[#666]">
                                    {project.event_date ? new Date(project.event_date).toLocaleDateString() : project.name}
                                </span>
                            </div>
                        </div>

                        <button onClick={shareGallery} className="flex items-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#444] transition-all hover:border-black/30 hover:text-[#111]">
                            <Share2 className="mr-2 h-3.5 w-3.5" /> Share
                        </button>
                    </div>
                    <div className={clsx('relative overflow-hidden min-h-[72svh] md:min-h-[100svh]', styles.heroHeight)}>
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
                    alt="Gallery Cover"
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
                    style={{ 
                        objectPosition: `${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}`,
                        WebkitMaskImage: `radial-gradient(circle at ${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}, black 15%, transparent 65%)`,
                        maskImage: `radial-gradient(circle at ${project.hero_focus_x || '50%'} ${project.hero_focus_y || '50%'}, black 15%, transparent 65%)`
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
                                {galleryTemplate?.name || 'Portfolio'}
                            </span>
                            <span className={clsx('text-xs', isDarkChrome ? 'text-white/80' : 'text-[#666]')}>
                                {project.event_date ? new Date(project.event_date).toLocaleDateString() : project.name}
                            </span>
                        </div>
                    </div>

                    <button onClick={shareGallery} className={clsx('flex items-center rounded-full border px-5 py-2.5 text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all', isDarkChrome ? 'bg-black/30 border-white/10 text-[#ddd] hover:text-white hover:bg-black/50' : 'bg-white border-black/10 text-[#444] hover:border-black/30 hover:text-[#111]')}>
                        <Share2 className="mr-2 h-3.5 w-3.5" /> Share
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 pt-24 text-center md:px-12 md:pt-28">
                <p className={clsx('font-black text-[10px] uppercase tracking-[0.4em] mb-4 text-white/70 shadow-sm', styles.subtitle)}>{project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Exclusive Gallery'}</p>
                <h1 className={clsx('font-heading font-black drop-shadow-2xl text-4xl sm:text-5xl md:text-7xl lg:text-8xl max-w-6xl text-white', styles.title)}>{project.name}</h1>
                <p className={clsx('mt-8 max-w-2xl mx-auto text-sm md:text-base font-medium tracking-wide text-white/80', styles.subtitle)}>Explora la galeria completa. Las descargas de alta calidad se gestionan de forma privada con tu fotografo.</p>
                <button onClick={shareGallery} className={clsx('mt-10 inline-flex items-center px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all', templateCode === 'editorial-frame' ? 'border-[#f5efe7] text-[#f5efe7] hover:bg-[#f5efe7] hover:text-[#1f1914]' : 'border-white/20 bg-white/10 text-white hover:bg-white hover:text-black')}>
                    <Share2 className="w-4 h-4 mr-2" /> Compartir galeria
                </button>
            </div>
        </section>
    );
}

export default function Gallery({ project, photos, galleryTemplate, access, pagination, galleryTitle }) {
    const { flash, errors, branding } = usePage().props;
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [filter, setFilter] = useState('All');
    const [peopleFilter, setPeopleFilter] = useState('All');
    const [brandFilter, setBrandFilter] = useState('All');
    const [peopleCountFilter, setPeopleCountFilter] = useState('All');
    const [jerseyFilter, setJerseyFilter] = useState('All');
    const [sponsorFilter, setSponsorFilter] = useState('All');
    const [contextFilter, setContextFilter] = useState('All');
    const [showClientAccess, setShowClientAccess] = useState(false);
    const templateCode = galleryTemplate?.code || 'cinematic-dark';
    const styles = TEMPLATE_STYLES[templateCode] || TEMPLATE_STYLES['cinematic-dark'];
    const categories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.tags?.length ? photo.tags : [photo.category]).filter(Boolean))], [photos]);
    const peopleCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.people_tags || []).filter(Boolean))], [photos]);
    const brandCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.brand_tags || []).filter(Boolean))], [photos]);
    const peopleCountCategories = useMemo(() => ['All', ...new Set(photos.map(photo => photo.people_count_label).filter(label => label && label !== '0 personas'))], [photos]);
    const jerseyCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.jersey_numbers || []).filter(Boolean))], [photos]);
    const sponsorCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.sponsor_tags || []).filter(Boolean))], [photos]);
    const contextCategories = useMemo(() => ['All', ...new Set(photos.flatMap(photo => photo.context_tags || []).filter(Boolean))], [photos]);
    const heroPhoto = photos.find(photo => photo.id === project.hero_photo_id) || photos[0];
    const isDarkChrome = ['cinematic-dark', 'editorial-frame', 'mono-story'].includes(templateCode);
    const isClientView = access?.mode === 'client';
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

    const toggleHeart = (photo) => {
        if (!access?.can_select_favorites) return;

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

        return generalMatch && peopleMatch && brandMatch && peopleCountMatch && jerseyMatch && sponsorMatch && contextMatch;
    });
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
            <Head title={galleryTitle || `${branding?.app_name || 'Gallery'} | ${project.name}`} />

                <>

            {photos.length > 0 && heroPhoto && (
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
                    isDarkChrome ? 'border-white/10 bg-white/5' : 'border-black/10 bg-white/70'
                )}>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className={clsx('text-[10px] font-black uppercase tracking-[0.28em]', isDarkChrome ? 'text-white/45' : 'text-black/35')}>
                                {isClientView ? 'Client gallery unlocked' : 'Public portfolio view'}
                            </p>
                            <p className={clsx('mt-2 text-xs uppercase tracking-[0.24em]', isDarkChrome ? 'text-white/35' : 'text-[#8b6d54]')}>
                                {branding?.app_name || 'Studio'}
                            </p>
                            <h2 className={clsx('mt-2 text-xl font-black leading-tight md:text-2xl', isDarkChrome ? 'text-white' : 'text-[#241b16]')}>
                                {galleryTitle || 'Selected work: A gallery shaped by emotion, landscape, and movement'}
                            </h2>
                            <p className={clsx('mt-2 max-w-2xl text-sm leading-7', isDarkChrome ? 'text-white/75' : 'text-[#5c4939]')}>
                                {isClientView
                                    ? 'Estas viendo la galeria completa del cliente. Aqui se habilitan favoritos y descargas originales si la ventana de entrega sigue activa.'
                                    : 'Esta vista publica solo muestra las fotos marcadas por el fotografo para web. Si eres el cliente, usa Acceso cliente para ver la galeria completa, marcar favoritos y descargar.'}
                            </p>
                            {typeof access?.public_photo_count === 'number' && typeof access?.client_photo_count === 'number' && (
                                <p className={clsx('mt-2 text-xs uppercase tracking-[0.2em]', isDarkChrome ? 'text-white/45' : 'text-[#8b6d54]')}>
                                    {isClientView ? `${access.client_photo_count} fotos visibles` : `${access.public_photo_count} fotos publicas visibles`}
                                </p>
                            )}
                            {access?.registered_email && (
                                <p className={clsx('mt-2 text-xs', isDarkChrome ? 'text-white/45' : 'text-[#8b6d54]')}>
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
                                    isDarkChrome
                                        ? 'bg-white text-black'
                                        : 'bg-[#241b16] text-white'
                                )}
                            >
                                Acceso cliente
                            </button>
                        )}
                    </div>

                    {(flash?.success || errors?.gallery_access_code || errors?.visitor_email) && (
                        <div className={clsx(
                            'mt-4 rounded-[1.4rem] border px-4 py-3 text-sm',
                            (errors?.gallery_access_code || errors?.visitor_email)
                                ? 'border-rose-200 bg-rose-50 text-rose-700'
                                : isDarkChrome
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        )}>
                            {errors?.gallery_access_code || errors?.visitor_email || flash?.success}
                        </div>
                    )}
                </div>
            </section>

            <div className="w-full max-w-[1920px] mx-auto flex flex-col items-center">
                <section className="w-full px-5 pb-12 pt-16 flex items-center justify-center">
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
                                    {cat}
                                </motion.button>
                            ))}
                        </div>

                        {!!project?.face_recognition_enabled && peopleCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <UserRound className="h-3.5 w-3.5" />
                                    Personas en la galeria
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
                                            {person}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {brandCategories.length > 1 && (
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
                                            {brand}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {peopleCountCategories.length > 1 && (
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
                                            {countLabel}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {jerseyCategories.length > 1 && (
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
                                            #{jersey}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {sponsorCategories.length > 1 && (
                            <div className="flex w-full flex-col items-center gap-3">
                                <div className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', isDarkChrome ? 'bg-white/5 text-white/60' : 'bg-black/5 text-[#6b5442]')}>
                                    <Camera className="h-3.5 w-3.5" />
                                    Sponsors
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
                                            {sponsor}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {contextCategories.length > 1 && (
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
                                            {contextTag}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <main className="w-full px-5 md:px-10 lg:px-12 xl:px-16 pb-32">
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-8 lg:gap-12 justify-center place-items-center"
                    >
                        <AnimatePresence mode="popLayout" initial={false}>
                            {filteredPhotos.map((photo) => (
                                <motion.div 
                                    key={photo.id} 
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="w-full max-w-[500px]"
                                >
                                    <PhotoCard
                                        photo={photo}
                                        onClick={() => setSelectedPhoto(photo)}
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

                    {!!pagination?.last_page && pagination.last_page > 1 && (
                        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                disabled={pagination.current_page <= 1}
                                onClick={() => router.get(window.location.pathname, { page: pagination.current_page - 1 }, { preserveState: true, preserveScroll: true })}
                                className={clsx(
                                    'rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition',
                                    pagination.current_page <= 1
                                        ? 'cursor-not-allowed opacity-40 border border-white/10'
                                        : isDarkChrome
                                            ? 'border border-white/15 text-white hover:bg-white/10'
                                            : 'border border-black/10 text-[#241b16] hover:bg-black hover:text-white'
                                )}
                            >
                                Anterior
                            </button>
                            <div className={clsx('rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em]', isDarkChrome ? 'bg-white/5 text-white/70' : 'bg-black/5 text-[#5c4939]')}>
                                Pagina {pagination.current_page} de {pagination.last_page}
                            </div>
                            <button
                                type="button"
                                disabled={!pagination.has_more_pages}
                                onClick={() => router.get(window.location.pathname, { page: pagination.current_page + 1 }, { preserveState: true, preserveScroll: true })}
                                className={clsx(
                                    'rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition',
                                    !pagination.has_more_pages
                                        ? 'cursor-not-allowed opacity-40 border border-white/10'
                                        : isDarkChrome
                                            ? 'border border-white/15 text-white hover:bg-white/10'
                                            : 'border border-black/10 text-[#241b16] hover:bg-black hover:text-white'
                                )}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <footer className={clsx('mt-24 px-16 text-center', styles.footer)}>
                <p className="text-[10px] uppercase font-black tracking-[0.6em] mb-4 italic">{branding?.app_name || 'Artisan Processing and Delivery Platform'}</p>
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
                                    disabled={!access?.can_select_favorites}
                                    className={clsx(
                                        'px-8 py-3 rounded-full flex items-center transition-all font-black text-xs uppercase tracking-widest',
                                        !access?.can_select_favorites
                                            ? 'bg-white/5 text-[#666] border border-white/10 cursor-not-allowed'
                                            : selectedPhoto.is_selected
                                                ? 'bg-accent text-white shadow-xl shadow-accent/20'
                                                : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                                    )}
                                >
                                    <Heart className={clsx('w-4 h-4 mr-2', selectedPhoto.is_selected && 'fill-current')} />
                                    {access?.can_select_favorites
                                        ? (selectedPhoto.is_selected ? 'In Selection' : 'Add to Selection')
                                        : 'Seleccion solo cliente'}
                                </button>
                                {selectedPhoto.high_res_available && access?.can_download_originals && (
                                    <a
                                        href={`/gallery/photo/${selectedPhoto.id}/download`}
                                        className="px-8 py-3 rounded-full flex items-center transition-all font-black text-xs uppercase tracking-widest bg-white text-black hover:bg-[#f3f3f3]"
                                    >
                                        Descargar original
                                    </a>
                                )}
                                {!access?.can_download_originals && (
                                    <div className="px-8 py-3 rounded-full flex items-center transition-all font-black text-xs uppercase tracking-widest bg-white/5 text-[#666] border border-white/10">
                                        Descargas solo para cliente
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
                </>

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
                                isDarkChrome ? 'border-white/10 bg-[#0b0b0b] text-white' : 'border-[#e5ddd1] bg-white text-[#241b16]'
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className={clsx('text-[11px] font-black uppercase tracking-[0.28em]', isDarkChrome ? 'text-white/45' : 'text-[#8b6d54]')}>
                                        Acceso cliente
                                    </p>
                                    <h2 className="mt-3 text-2xl font-black tracking-tight">Ver galeria completa</h2>
                                    <p className={clsx('mt-3 text-sm leading-7', isDarkChrome ? 'text-white/70' : 'text-[#5c4939]')}>
                                        Ingresa tu correo y la clave privada para desbloquear toda la galeria, activar favoritos y habilitar descargas.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowClientAccess(false)}
                                    className={clsx('rounded-full p-3 transition', isDarkChrome ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-[#241b16] hover:bg-black/10')}
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
                                        isDarkChrome
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
                                        isDarkChrome
                                            ? 'border-white/15 bg-black/20 text-white placeholder:text-white/35'
                                            : 'border-black/10 bg-white text-[#241b16] placeholder:text-[#9b8877]'
                                    )}
                                />
                                <input
                                    type="text"
                                    value={unlockForm.data.gallery_access_code}
                                    onChange={(event) => unlockForm.setData('gallery_access_code', event.target.value.toUpperCase())}
                                    placeholder={access?.has_password ? 'Clave o codigo de acceso' : 'Sin clave configurada'}
                                    disabled={!access?.has_password || unlockForm.processing}
                                    className={clsx(
                                        'w-full rounded-[1.2rem] border px-4 py-3 text-sm outline-none',
                                        isDarkChrome
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
                                        isDarkChrome
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
