import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AvailabilityCalendar from '@/Components/AvailabilityCalendar';
import SeoHead from '@/Components/SeoHead';
import { buildSlots } from '@/lib/availability';
import { ArrowRight, Camera, Grip, Mail, MapPin, Menu, MessageSquare, Phone, Star, Trophy, Zap } from 'lucide-react';

const sectionLabels = {
    hero: 'Inicio',
    about: 'Sobre mí',
    gallery: 'Portafolio',
    featured: 'Destacados',
    contact: 'Contacto',
};

const defaultTheme = {
    font_heading: 'Fraunces, Georgia, serif',
    font_body: 'Inter, system-ui, sans-serif',
    palette: {
        hero_overlay: 'rgba(26,19,13,.62)',
        surface: '#f9f6f1',
        surface_alt: '#f5efe7',
        surface_dark: '#221914',
        text: '#241b16',
        muted: '#6b594c',
        accent: '#c69b72',
        accent_soft: '#f4eadf',
    },
};

const scrollToTarget = (target) => {
    if (!target?.startsWith('#')) {
        return;
    }

    const element = document.querySelector(target);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function Home({
    homepage,
    theme = defaultTheme,
    portfolioPhotos = [],
    portfolioCategories = [],
    eventTypes = [],
    busyCalendarEvents = [],
    businessHours,
    availabilitySettings,
    seo = null,
}) {
    const { flash, branding } = usePage().props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [activeCategory, setActiveCategory] = React.useState('All');
    const { x: pointerX, y: pointerY } = usePointerPosition();
    const scrollProgress = useScrollProgress();
    const palette = { ...defaultTheme.palette, ...(theme?.palette || {}) };
    const fonts = {
        heading: theme?.font_heading || defaultTheme.font_heading,
        body: theme?.font_body || defaultTheme.font_body,
    };
    const navItems = homepage.sections_order.filter((section) => section !== 'hero');
    const allCategories = ['All', ...portfolioCategories];
    const filteredPortfolio = activeCategory === 'All'
        ? portfolioPhotos
        : portfolioPhotos.filter((photo) => photo.category === activeCategory);
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        event_type: eventTypes[0] || '',
        tentative_date: '',
        tentative_time: '',
        message: '',
    });

    const availableSlots = React.useMemo(
        () => buildSlots(data.tentative_date, busyCalendarEvents, businessHours, availabilitySettings),
        [data.tentative_date, busyCalendarEvents, businessHours, availabilitySettings],
    );

    React.useEffect(() => {
        if (!availableSlots.includes(data.tentative_time)) {
            setData('tentative_time', availableSlots[0] || '');
        }
    }, [availableSlots]);

    const submit = (event) => {
        event.preventDefault();
        post('/leads', {
            preserveScroll: true,
            onSuccess: () => {
                setData({
                    name: '',
                    email: '',
                    phone: '',
                    event_type: eventTypes[0] || '',
                    tentative_date: '',
                    tentative_time: '',
                    message: '',
                });
            },
        });
    };

    const leadForm = {
        data,
        setData,
        processing,
        errors,
        recentlySuccessful,
        submit,
        availableSlots,
        eventTypes,
        busyCalendarEvents,
        businessHours,
        availabilitySettings,
        flash,
    };

    const commonLayoutProps = {
        homepage,
        palette,
        fonts,
        navItems,
        portfolioCategories,
        portfolioPhotos,
        allCategories,
        filteredPortfolio,
        activeCategory,
        setActiveCategory,
        branding,
        leadForm,
        seo,
        pointerX,
        pointerY,
        scrollProgress,
    };

    if (theme?.home_layout === 'tetta-explorer') {
        return <TettaExplorerHome {...commonLayoutProps} />;
    }

    if (theme?.home_layout === 'hardy-portrait') {
        return <HardyPortraitHome {...commonLayoutProps} />;
    }

    if (theme?.home_layout === 'wedding-event') {
        return <WeddingEventHome {...commonLayoutProps} />;
    }

    if (theme?.home_layout === 'wild-nature') {
        return <WildNatureHome {...commonLayoutProps} />;
    }

    if (theme?.home_layout === 'sports-dynamic') {
        return <SportsDynamicHome {...commonLayoutProps} />;
    }

    if (theme?.home_layout === 'misael-signature') {
        return <MisaelSignatureHome {...commonLayoutProps} />;
    }

    return (
        <div style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: fonts.body }}>
            <SeoHead seo={seo} fallbackTitle={homepage.brand.name} fallbackDescription={homepage.brand.tagline} />
            <MotionAtmosphere palette={palette} pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollProgress} />

            <section id="hero" className="relative isolate min-h-[92vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center will-change-transform"
                    style={{
                        backgroundImage: `linear-gradient(180deg, ${palette.hero_overlay} 0%, ${palette.hero_overlay} 100%), url(${homepage.hero.image_url})`,
                        filter: `blur(${scrollProgress * 2.5}px) saturate(${1 + scrollProgress * 0.18})`,
                        transform: `scale(${1.04 + scrollProgress * 0.03}) translate3d(${(pointerX - 0.5) * -16}px, ${(pointerY - 0.5) * -12}px, 0)`,
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(166,124,82,.24),transparent_30%)]" />

                <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 text-white md:px-10">
                    <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/8 backdrop-blur md:hidden"
                        onClick={() => setMobileOpen((open) => !open)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="flex-1 md:flex-none">
                        <BrandMark homepage={homepage} branding={branding} fonts={fonts} className="text-white" textClassName="text-lg uppercase tracking-[0.35em] text-white/90 md:text-xl" />
                    </div>

                    <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.28em] text-white/75 md:flex">
                        {navItems.map((item) => (
                            <button key={item} type="button" onClick={() => scrollToTarget(`#${item}`)} className="transition hover:text-white">
                                {sectionLabels[item]}
                            </button>
                        ))}
                    </nav>
                </header>

                {mobileOpen && (
                    <div className="relative z-20 mx-6 mt-2 rounded-[2rem] border border-white/15 bg-[#1b140f]/85 p-5 text-white backdrop-blur md:hidden">
                        <div className="flex flex-col gap-4 text-xs uppercase tracking-[0.24em]">
                            {navItems.map((item) => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => {
                                        setMobileOpen(false);
                                        scrollToTarget(`#${item}`);
                                    }}
                                    className="text-left text-white/80"
                                >
                                    {sectionLabels[item]}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative z-10 mx-auto flex min-h-[calc(92vh-88px)] w-full max-w-7xl items-end px-6 pb-10 pt-16 md:px-10">
                    <div className="grid w-full gap-12 lg:grid-cols-[1.35fr_.75fr]">
                        <Reveal className="max-w-4xl">
                            <p className="mb-6 text-[11px] uppercase tracking-[0.35em] text-white/70">{homepage.hero.eyebrow}</p>
                            <h1 className="max-w-4xl text-5xl leading-[0.95] text-white md:text-7xl" style={{ fontFamily: fonts.heading }}>
                                {homepage.hero.title}
                            </h1>
                            <p className="mt-8 max-w-2xl text-base leading-7 text-white/78 md:text-lg">{homepage.hero.description}</p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background={palette.accent_soft} color={palette.text} />
                                <OutlineHeroButton label={homepage.hero.secondary_cta_label} onClick={() => scrollToTarget(homepage.hero.secondary_cta_target)} />
                                <LinkButton href="/portfolio" label="Portafolio" background={palette.accent} />
                                <OutlineLinkButton href="/booking" label="Reservar sesión" />
                            </div>
                        </Reveal>

                        <Reveal delay={120} className="self-end rounded-[2rem] border border-white/14 bg-white/8 p-6 text-white/82 backdrop-blur transition duration-500 hover:-translate-y-2 hover:bg-white/12">
                            <div className="flex items-center justify-between border-b border-white/14 pb-5">
                                <p className="text-xs uppercase tracking-[0.32em]">Nota del estudio</p>
                                <Camera className="h-4 w-4" />
                            </div>
                            <p className="mt-6 text-3xl leading-tight text-white" style={{ fontFamily: fonts.heading }}>
                                {homepage.hero.floating_caption}
                            </p>
                            <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
                                <StatCard label="Style" value="Editorial and honest" />
                                <StatCard label="Availability" value="Local and destination" />
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            <section id="about" className="px-6 py-24 md:px-10" style={{ backgroundColor: palette.surface_alt }}>
                <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_.95fr]">
                    <div>
                        <p className="mb-5 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.about.eyebrow}</p>
                        <h2 className="max-w-xl text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.about.heading}</h2>
                    </div>
                    <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
                        <div className="space-y-6 text-base leading-8" style={{ color: palette.muted }}>
                            <p>{homepage.about.body}</p>
                            <p>{homepage.about.detail}</p>
                            <div className="grid gap-4 pt-4 md:grid-cols-3">
                                {homepage.about.stats.map((item) => (
                                    <div key={`${item.value}-${item.label}`} className="rounded-[1.7rem] p-5 shadow-[0_20px_40px_rgba(60,40,24,.06)]" style={{ backgroundColor: 'rgba(255,255,255,.75)' }}>
                                        <p className="text-3xl" style={{ fontFamily: fonts.heading, color: palette.text }}>{item.value}</p>
                                        <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: palette.accent }}>{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-[2.4rem] shadow-[0_30px_60px_rgba(60,40,24,.12)]" style={{ backgroundColor: palette.accent_soft }}>
                            <img src={homepage.about.image_url} alt="Retrato del fotógrafo" className="h-full min-h-[420px] w-full object-cover" />
                        </div>
                    </div>
                </div>
            </section>

            <section id="gallery" className="px-6 py-24 md:px-10" style={{ backgroundColor: palette.surface }}>
                <div className="mx-auto max-w-7xl">
                    <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.gallery.eyebrow}</p>
                            <h2 className="text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                        </div>
                        <div className="flex max-w-xl flex-col items-start gap-4">
                            <p className="text-base leading-7" style={{ color: palette.muted }}>{homepage.gallery.description}</p>
                            <Link
                                href="/portfolio"
                                className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition"
                                style={{ borderColor: palette.accent, color: palette.muted }}
                            >
                                Ver galeria
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {!!allCategories.length && (
                        <div className="mb-8 flex flex-wrap gap-3">
                            {allCategories.map((category) => (
                                <button
                                    key={category}
                                    type="button"
                                    onClick={() => setActiveCategory(category)}
                                    className="rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition"
                                    style={activeCategory === category
                                        ? { backgroundColor: palette.text, color: palette.surface }
                                        : { border: `1px solid ${palette.accent_soft}`, color: palette.muted }}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    )}

                    {filteredPortfolio.length > 0 ? (
                        <div style={{ columnWidth: '320px', columnGap: '1.5rem' }}>
                            {filteredPortfolio.map((item) => (
                                <article key={item.id} className="motion-card mb-6 break-inside-avoid overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(60,40,24,.08)]" style={{ backgroundColor: '#fff' }}>
                                    <img src={item.image_url} alt={item.project_name} className="w-full object-cover" />
                                    <div className="space-y-3 p-6">
                                        <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: palette.accent }}>{item.category}</p>
                                        <h3 className="text-2xl" style={{ fontFamily: fonts.heading }}>{item.project_name}</h3>
                                        <p className="text-sm leading-7" style={{ color: palette.muted }}>{item.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[2rem] border border-dashed px-8 py-16 text-center" style={{ borderColor: palette.accent_soft, color: palette.muted }}>
                            Aún no hay imágenes seleccionadas para el portafolio. Marca fotografías desde el panel de administración para publicarlas en el sitio.
                        </div>
                    )}
                </div>
            </section>

            <section id="featured" className="px-6 py-24 text-white md:px-10" style={{ backgroundColor: palette.surface_dark }}>
                <div className="mx-auto max-w-7xl">
                    <div className="mb-12 max-w-3xl">
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.featured.eyebrow}</p>
                        <h2 className="text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                        <p className="mt-6 text-base leading-7 text-white/70">{homepage.featured.description}</p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {homepage.featured.items.map((item, index) => (
                            <Link
                                key={`${item.title}-${index}`}
                                href={resolveFeaturedHref(item, portfolioCategories)}
                                className="overflow-hidden rounded-[2.2rem] border text-left transition hover:-translate-y-1"
                                style={{ borderColor: 'rgba(255,255,255,.08)', backgroundColor: 'rgba(255,255,255,.05)' }}
                            >
                                <img src={item.image_url} alt={item.title} className="h-80 w-full object-cover" />
                                <div className="space-y-4 p-7">
                                    <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: palette.accent }}>Destacado</p>
                                    <h3 className="text-3xl leading-tight" style={{ fontFamily: fonts.heading }}>{item.title}</h3>
                                    <p className="text-sm leading-7 text-white/68">{item.category}</p>
                                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                        View collection
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section id="contact" className="px-6 py-24 md:px-10" style={{ backgroundColor: palette.surface_alt }}>
                <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr]">
                    <div className="rounded-[2.6rem] p-8 text-white md:p-10" style={{ backgroundColor: palette.surface_dark }}>
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.contact.eyebrow}</p>
                        <h2 className="max-w-md text-4xl leading-tight md:text-5xl" style={{ fontFamily: fonts.heading }}>{homepage.contact.heading}</h2>
                        <p className="mt-6 max-w-md text-base leading-7 text-white/72">{homepage.contact.description}</p>

                        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                            <p className="text-xs uppercase tracking-[0.3em] text-white/45">{homepage.contact.info_label}</p>
                            <div className="mt-5 space-y-4">
                                {homepage.contact.info_lines.map((line, index) => (
                                    <div key={`${line}-${index}`} className="flex items-start gap-3 text-sm text-white/82">
                                        <MapPin className="mt-0.5 h-4 w-4" style={{ color: palette.accent }} />
                                        <span>{line}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2.6rem] bg-white p-8 shadow-[0_24px_60px_rgba(60,40,24,.1)] md:p-10">
                        <div className="mb-8">
                            <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: palette.accent }}>Lead form</p>
                            <h3 className="mt-3 text-3xl" style={{ fontFamily: fonts.heading }}>{homepage.contact.form_heading}</h3>
                        </div>

                        {(flash?.success || recentlySuccessful) && (
                            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                {flash?.success || 'Your inquiry was sent successfully.'}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Name" icon={Camera} value={data.name} error={errors.name} onChange={(value) => setData('name', value)} placeholder="Your full name" palette={palette} />
                                <Field label="Email" icon={Mail} type="email" value={data.email} error={errors.email} onChange={(value) => setData('email', value)} placeholder="you@example.com" palette={palette} />
                            </div>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field label="Phone" icon={Phone} value={data.phone} error={errors.phone} onChange={(value) => setData('phone', value)} placeholder="+506 0000 0000" palette={palette} />
                                <SelectField label="Tipo de proyecto" value={data.event_type} error={errors.event_type} onChange={(value) => setData('event_type', value)} options={eventTypes} palette={palette} />
                            </div>
                            <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
                                <AvailabilityCalendar
                                    label="Fecha tentativa"
                                    value={data.tentative_date}
                                    onChange={(value) => setData('tentative_date', value)}
                                    error={errors.tentative_date}
                                    busyEvents={busyCalendarEvents}
                                    businessHours={businessHours}
                                    availabilitySettings={availabilitySettings}
                                    helperText="Selecciona un dia con disponibilidad real y luego una hora libre."
                                    tone="public"
                                />
                                <SelectField
                                    label="Hora disponible"
                                    value={data.tentative_time}
                                    error={errors.tentative_time}
                                    onChange={(value) => setData('tentative_time', value)}
                                    options={availableSlots}
                                    placeholder={data.tentative_date ? 'Selecciona una hora disponible' : 'Selecciona primero una fecha'}
                                    disabled={!data.tentative_date || availableSlots.length === 0}
                                    palette={palette}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.24em]" style={{ color: palette.accent }}>Message</label>
                                <div className="rounded-[1.5rem] border px-4 py-4" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface }}>
                                    <div className="mb-3 flex items-center gap-2" style={{ color: palette.accent }}>
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="text-xs uppercase tracking-[0.2em]">Project details</span>
                                    </div>
                                    <textarea
                                        value={data.message}
                                        onChange={(event) => setData('message', event.target.value)}
                                        rows={5}
                                        placeholder="Cuéntame la historia, el estilo o la fecha que tienes en mente."
                                        className="w-full resize-none bg-transparent text-sm outline-none"
                                        style={{ color: palette.text }}
                                    />
                                </div>
                                {errors.message && <p className="text-sm text-rose-600">{errors.message}</p>}
                            </div>
                            <button type="submit" disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70" style={{ backgroundColor: palette.text }}>
                                {processing ? 'Enviando...' : 'Enviar solicitud'}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <footer className="border-t px-6 py-8 md:px-10" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface }}>
                <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between" style={{ color: palette.muted }}>
                    <p>Desarrollado por PixelPRO</p>
                    <Link href="/login" className="inline-flex items-center gap-2 uppercase tracking-[0.22em] transition" style={{ color: palette.accent }}>
                        <Grip className="h-4 w-4" />
                        Iniciar sesión
                    </Link>
                </div>
            </footer>
        </div>
    );
}

function TettaExplorerHome({ homepage, palette, fonts, navItems, filteredPortfolio, leadForm, branding, seo, pointerX, pointerY, scrollProgress }) {
    const heroWords = (homepage.hero.title || homepage.brand.name || '').split(' ');
    const firstWord = heroWords.shift() || homepage.brand.name;
    const restTitle = heroWords.join(' ') || homepage.brand.tagline || 'The Explorer';
    const featuredPhoto = filteredPortfolio[0]?.image_url || homepage.hero.image_url;

    return (
        <div className="min-h-screen bg-[#0b0b0b] text-white" style={{ fontFamily: fonts.body }}>
            <SeoHead seo={seo} fallbackTitle={homepage.brand.name} fallbackDescription={homepage.brand.tagline} />
            <MotionAtmosphere palette={palette} pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollProgress} dark />

            <section id="hero" className="relative isolate min-h-screen overflow-hidden">
                <div className="grid min-h-screen lg:grid-cols-[38vw_1fr]">
                    <aside className="relative z-10 flex min-h-[52vh] flex-col justify-between bg-[#090909] px-7 py-8 md:px-12 lg:min-h-screen">
                        <div className="flex items-center justify-between">
                            <BrandMark homepage={homepage} branding={branding} fonts={fonts} className="text-white" textClassName="text-3xl font-black tracking-tight" />
                            <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white/55">Iniciar sesión</Link>
                        </div>
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="mb-8 h-px w-16 bg-white" />
                            <p className="max-w-sm text-sm leading-7 text-white/72">{homepage.hero.description}</p>
                        </div>
                        <div className="flex gap-5 text-xs uppercase tracking-[0.24em] text-white/40">
                            <span>Instagram</span>
                            <span>Behance</span>
                            <span>Estudio</span>
                        </div>
                    </aside>

                    <main className="relative min-h-[62vh] overflow-hidden lg:min-h-screen">
                        <img
                            src={homepage.hero.image_url}
                            alt={homepage.hero.title}
                            className="absolute inset-0 h-full w-full object-cover opacity-82 will-change-transform"
                            style={{
                                filter: `blur(${scrollProgress * 2}px)`,
                                transform: `scale(${1.03 + scrollProgress * 0.04}) translate3d(${(pointerX - 0.5) * 22}px, ${(pointerY - 0.5) * 16}px, 0)`,
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/42 via-black/5 to-black/35" />
                        <header className="relative z-20 flex items-center justify-end gap-8 px-7 py-8 text-sm font-semibold text-white/72 md:px-12">
                            {navItems.map((item) => (
                                <button key={item} type="button" onClick={() => scrollToTarget(`#${item}`)} className="hidden transition hover:text-white md:inline-flex">
                                    {sectionLabels[item]}
                                </button>
                            ))}
                            <Link href="/portfolio" className="rounded-full bg-white px-5 py-2 text-black">Portafolio</Link>
                        </header>
                        <div className="relative z-10 flex min-h-[calc(100vh-96px)] items-center px-7 pb-16 md:px-12">
                            <Reveal className="-ml-[2px] max-w-6xl">
                                <p className="mb-7 text-[11px] uppercase tracking-[0.38em] text-white/62">{homepage.hero.eyebrow}</p>
                                <h1 className="text-[clamp(4rem,9vw,10.5rem)] font-black leading-[0.86] tracking-[-0.08em]" style={{ fontFamily: fonts.heading }}>
                                    {firstWord} <span className="text-transparent [-webkit-text-stroke:1.4px_rgba(255,255,255,.86)]">{restTitle}</span>
                                </h1>
                                <div className="mt-10 flex flex-wrap gap-4">
                                    <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background="#fff" color="#050505" />
                                    <OutlineHeroButton label={homepage.hero.secondary_cta_label} onClick={() => scrollToTarget(homepage.hero.secondary_cta_target)} />
                                </div>
                            </Reveal>
                        </div>
                    </main>
                </div>
            </section>

            <section id="about" className="grid gap-0 bg-[#111] lg:grid-cols-[1fr_.8fr]">
                <div className="px-7 py-20 md:px-12 lg:py-28">
                    <p className="mb-5 text-[11px] uppercase tracking-[0.34em] text-white/40">{homepage.about.eyebrow}</p>
                    <h2 className="max-w-3xl text-5xl leading-[.95] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.about.heading}</h2>
                    <p className="mt-8 max-w-2xl text-base leading-8 text-white/68">{homepage.about.body}</p>
                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                        {homepage.about.stats.map((item) => <DarkMetric key={`${item.value}-${item.label}`} value={item.value} label={item.label} />)}
                    </div>
                </div>
                <img src={homepage.about.image_url || featuredPhoto} alt="Sobre el fotógrafo" className="h-full min-h-[520px] w-full object-cover" />
            </section>

            <TettaGallery homepage={homepage} filteredPortfolio={filteredPortfolio} fonts={fonts} />
            <CompactLeadSection homepage={homepage} palette={palette} fonts={fonts} leadForm={leadForm} dark />
            <MinimalFooter palette={palette} />
        </div>
    );
}

function HardyPortraitHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding, seo, pointerX, pointerY, scrollProgress }) {
    const portrait = homepage.about.image_url || homepage.hero.image_url;

    return (
        <div style={{ backgroundColor: '#f6efe4', color: '#221a14', fontFamily: fonts.body }}>
            <SeoHead seo={seo} fallbackTitle={homepage.brand.name} fallbackDescription={homepage.brand.tagline} />
            <MotionAtmosphere palette={palette} pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollProgress} />

            <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
                <BrandMark homepage={homepage} branding={branding} fonts={fonts} textClassName="text-2xl font-semibold" />
                <nav className="hidden items-center gap-8 text-sm font-semibold text-[#7a6655] md:flex">
                    {['about', 'featured', 'gallery', 'contact'].map((item) => (
                        <button key={item} type="button" onClick={() => scrollToTarget(`#${item}`)}>{sectionLabels[item]}</button>
                    ))}
                </nav>
                <Link href="/booking" className="rounded-full bg-[#221a14] px-5 py-2.5 text-sm font-semibold text-white">Reservar ahora</Link>
            </header>

            <section id="hero" className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-8 md:px-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
                <Reveal>
                    <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-[#b68156]">{homepage.hero.eyebrow || "Hello I'm Hardy"}</p>
                    <h1 className="text-5xl leading-[1.02] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.hero.title}</h1>
                    <p className="mt-7 max-w-xl text-base leading-8 text-[#716052]">{homepage.hero.description}</p>
                    <div className="mt-9 flex flex-wrap gap-4">
                        <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background="#221a14" color="#fff" />
                        <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-full border border-[#d9c7b3] px-7 py-3 text-sm font-semibold text-[#221a14]">Ver portafolio</Link>
                    </div>
                </Reveal>
                <Reveal delay={120} className="relative">
                    <div className="absolute -left-5 top-10 hidden h-72 w-32 rounded-full bg-[#d7a676]/35 blur-3xl lg:block" />
                    <img
                        src={homepage.hero.image_url}
                        alt={homepage.hero.title}
                        className="relative h-[680px] w-full rounded-t-full object-cover shadow-[0_40px_90px_rgba(78,52,32,.18)] will-change-transform"
                        style={{ transform: `translate3d(${(pointerX - 0.5) * -18}px, ${(pointerY - 0.5) * -12}px, 0) scale(${1 + scrollProgress * 0.015})` }}
                    />
                    <div className="absolute bottom-8 left-8 rounded-[1.6rem] bg-white/88 p-5 shadow-xl backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#b68156]">Professional photographer</p>
                        <p className="mt-2 text-3xl" style={{ fontFamily: fonts.heading }}>{homepage.brand.name}</p>
                    </div>
                </Reveal>
            </section>

            <section id="about" className="bg-white px-6 py-24 md:px-10">
                <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
                    <img src={portrait} alt="Retrato" className="h-[560px] w-full rounded-[2.5rem] object-cover" />
                    <div>
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#b68156]">{homepage.about.eyebrow}</p>
                        <h2 className="text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.about.heading}</h2>
                        <p className="mt-6 text-base leading-8 text-[#716052]">{homepage.about.body}</p>
                        <div className="mt-8 grid gap-4 sm:grid-cols-4">
                            {homepage.about.stats.map((item) => <LightMetric key={`${item.value}-${item.label}`} value={item.value} label={item.label} fonts={fonts} />)}
                        </div>
                    </div>
                </div>
            </section>

            <HardyServices homepage={homepage} fonts={fonts} />
            <HardyProjects homepage={homepage} filteredPortfolio={filteredPortfolio} fonts={fonts} />
            <CompactLeadSection homepage={homepage} palette={palette} fonts={fonts} leadForm={leadForm} />
            <MinimalFooter palette={palette} />
        </div>
    );
}

function WeddingEventHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding, seo, pointerX, pointerY, scrollProgress }) {
    const storyImages = filteredPortfolio.length
        ? filteredPortfolio.slice(0, 5)
        : homepage.gallery.images.slice(0, 5).map((image_url, id) => ({ id, image_url, project_name: `Historia ${id + 1}`, category: 'Bodas' }));

    return (
        <div style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: fonts.body }}>
            <SeoHead seo={seo} fallbackTitle={homepage.brand.name} fallbackDescription={homepage.brand.tagline} />
            <MotionAtmosphere palette={palette} pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollProgress} />

            <section id="hero" className="relative min-h-screen overflow-hidden">
                <img
                    src={homepage.hero.image_url}
                    alt={homepage.hero.title}
                    className="absolute inset-0 h-full w-full object-cover will-change-transform"
                    style={{
                        filter: `blur(${scrollProgress * 1.8}px)`,
                        transform: `scale(${1.04 + scrollProgress * 0.025}) translate3d(${(pointerX - 0.5) * -14}px, ${(pointerY - 0.5) * -10}px, 0)`,
                    }}
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${palette.hero_overlay}, rgba(255,248,245,.2) 58%, rgba(50,28,31,.45))` }} />
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
                    <BrandMark homepage={homepage} branding={branding} fonts={fonts} className="text-white" textClassName="text-2xl font-semibold" />
                    <nav className="hidden items-center gap-8 text-sm font-semibold text-white/72 md:flex">
                        {['about', 'featured', 'gallery', 'contact'].map((item) => (
                            <button key={item} type="button" onClick={() => scrollToTarget(`#${item}`)} className="hover:text-white">{sectionLabels[item]}</button>
                        ))}
                    </nav>
                </header>
                <div className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-7xl items-center px-6 pb-16 md:px-10">
                    <Reveal className="max-w-3xl rounded-[3rem] border border-white/14 bg-white/10 p-8 text-white shadow-[0_40px_100px_rgba(50,28,31,.25)] backdrop-blur md:p-12">
                        <p className="mb-5 text-[11px] uppercase tracking-[0.36em] text-white/62">{homepage.hero.eyebrow || 'Historias de boda'}</p>
                        <h1 className="text-5xl leading-[1.02] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.hero.title}</h1>
                        <p className="mt-7 max-w-2xl text-base leading-8 text-white/76">{homepage.hero.description}</p>
                        <div className="mt-9 flex flex-wrap gap-4">
                            <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background={palette.accent_soft} color={palette.text} />
                            <OutlineHeroButton label={homepage.hero.secondary_cta_label} onClick={() => scrollToTarget(homepage.hero.secondary_cta_target)} />
                        </div>
                    </Reveal>
                </div>
            </section>

            <section id="about" className="px-6 py-24 md:px-10">
                <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
                    <div>
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.about.eyebrow}</p>
                        <h2 className="text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.about.heading}</h2>
                        <p className="mt-6 text-base leading-8" style={{ color: palette.muted }}>{homepage.about.body}</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {homepage.about.stats.map((item) => (
                            <div key={`${item.value}-${item.label}`} className="rounded-[2rem] p-6 text-center" style={{ backgroundColor: palette.surface_alt }}>
                                <p className="text-4xl" style={{ fontFamily: fonts.heading }}>{item.value}</p>
                                <p className="mt-2 text-[10px] uppercase tracking-[0.22em]" style={{ color: palette.accent }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="featured" className="px-6 py-24 md:px-10" style={{ backgroundColor: palette.surface_alt }}>
                <div className="mx-auto max-w-7xl">
                    <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.featured.eyebrow || 'Colecciones de eventos'}</p>
                    <h2 className="max-w-4xl text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {homepage.featured.items.map((item, index) => (
                            <article key={`${item.title}-${index}`} className="motion-card overflow-hidden rounded-[2.2rem] bg-white shadow-[0_26px_70px_rgba(50,28,31,.1)]">
                                <img src={item.image_url} alt={item.title} className="h-80 w-full object-cover" />
                                <div className="p-7">
                                    <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: palette.accent }}>Chapter {index + 1}</p>
                                    <h3 className="mt-3 text-3xl" style={{ fontFamily: fonts.heading }}>{item.title}</h3>
                                    <p className="mt-3 text-sm leading-7" style={{ color: palette.muted }}>{item.category}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="gallery" className="px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <h2 className="max-w-3xl text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                        <Link href="/portfolio" className="rounded-full px-6 py-3 text-sm font-semibold text-white" style={{ backgroundColor: palette.surface_dark }}>Ver historia completa</Link>
                    </div>
                    <div className="grid auto-rows-[220px] gap-4 md:grid-cols-4">
                        {storyImages.map((item, index) => (
                            <article key={item.id} className={`motion-card group overflow-hidden rounded-[2rem] ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                                <img src={item.image_url} alt={item.project_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <CompactLeadSection homepage={homepage} palette={palette} fonts={fonts} leadForm={leadForm} />
            <MinimalFooter palette={palette} />
        </div>
    );
}

function WildNatureHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding, seo, pointerX, pointerY, scrollProgress }) {
    const natureItems = filteredPortfolio.length
        ? filteredPortfolio.slice(0, 6)
        : homepage.gallery.images.map((image_url, id) => ({ id, image_url, project_name: `Expedición ${id + 1}`, category: 'Naturaleza' }));

    return (
        <div style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: fonts.body }}>
            <SeoHead seo={seo} fallbackTitle={homepage.brand.name} fallbackDescription={homepage.brand.tagline} />
            <MotionAtmosphere palette={palette} pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollProgress} />

            <section id="hero" className="relative min-h-screen overflow-hidden">
                <img
                    src={homepage.hero.image_url}
                    alt={homepage.hero.title}
                    className="absolute inset-0 h-full w-full object-cover will-change-transform"
                    style={{
                        filter: `blur(${scrollProgress * 2.2}px) contrast(${1 + scrollProgress * 0.08})`,
                        transform: `scale(${1.04 + scrollProgress * 0.035}) translate3d(${(pointerX - 0.5) * 18}px, ${(pointerY - 0.5) * 12}px, 0)`,
                    }}
                />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${palette.hero_overlay}, rgba(23,36,25,.8))` }} />
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 text-white md:px-10">
                    <BrandMark homepage={homepage} branding={branding} fonts={fonts} className="text-white" textClassName="text-2xl font-black uppercase tracking-[0.08em]" />
                    <Link href="/portfolio" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/78">Explorar</Link>
                </header>
                <div className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-7xl items-end px-6 pb-16 md:px-10">
                    <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
                        <Reveal>
                            <p className="mb-5 text-[11px] uppercase tracking-[0.38em] text-white/62">{homepage.hero.eyebrow || 'Wild visual stories'}</p>
                            <h1 className="max-w-5xl text-6xl font-black leading-[.9] tracking-[-0.06em] text-white md:text-8xl" style={{ fontFamily: fonts.heading }}>{homepage.hero.title}</h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72">{homepage.hero.description}</p>
                        </Reveal>
                        <Reveal delay={140} className="rounded-[2rem] border border-white/12 bg-white/10 p-6 text-white backdrop-blur">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">{homepage.hero.floating_caption}</p>
                            <div className="mt-6 grid gap-3">
                                {homepage.about.stats.map((item) => <DarkMetric key={`${item.value}-${item.label}`} value={item.value} label={item.label} />)}
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            <section id="about" className="px-6 py-24 md:px-10" style={{ backgroundColor: palette.surface_dark, color: '#fff' }}>
                <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_.9fr] lg:items-center">
                    <div>
                        <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.about.eyebrow}</p>
                        <h2 className="text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.about.heading}</h2>
                        <p className="mt-6 text-base leading-8 text-white/68">{homepage.about.body}</p>
                    </div>
                    <img src={homepage.about.image_url} alt="Historia en la naturaleza" className="h-[560px] w-full rounded-[2.5rem] object-cover" />
                </div>
            </section>

            <section id="featured" className="px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.featured.eyebrow || 'Notas de campo'}</p>
                    <h2 className="max-w-4xl text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        {homepage.featured.items.map((item) => (
                            <article key={item.title} className="motion-card rounded-[2rem] border p-6" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
                                <img src={item.image_url} alt={item.title} className="mb-6 h-64 w-full rounded-[1.4rem] object-cover" />
                                <h3 className="text-3xl" style={{ fontFamily: fonts.heading }}>{item.title}</h3>
                                <p className="mt-3 text-sm leading-7" style={{ color: palette.muted }}>{item.category}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="gallery" className="overflow-hidden px-6 py-24 md:px-10" style={{ backgroundColor: palette.surface_alt }}>
                <div className="mx-auto max-w-7xl">
                    <h2 className="text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                    <div className="mt-10 flex gap-5 overflow-x-auto pb-6">
                        {natureItems.map((item) => (
                            <article key={item.id} className="motion-card min-w-[300px] overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(30,42,29,.1)] md:min-w-[420px]">
                                <img src={item.image_url} alt={item.project_name} className="h-[460px] w-full object-cover" />
                                <div className="p-6">
                                    <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: palette.accent }}>{item.category}</p>
                                    <h3 className="mt-2 text-2xl" style={{ fontFamily: fonts.heading }}>{item.project_name}</h3>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <CompactLeadSection homepage={homepage} palette={palette} fonts={fonts} leadForm={leadForm} />
            <MinimalFooter palette={palette} />
        </div>
    );
}

function SportsDynamicHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding, seo, pointerX, pointerY, scrollProgress }) {
    return (
        <div className="overflow-hidden bg-[#051015] text-white" style={{ fontFamily: fonts.body }}>
            <SeoHead seo={seo} fallbackTitle={homepage.brand.name} fallbackDescription={homepage.brand.tagline} />
            <MotionAtmosphere palette={palette} pointerX={pointerX} pointerY={pointerY} scrollProgress={scrollProgress} dark />

            <section id="hero" className="relative min-h-screen px-6 py-7 md:px-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(183,255,60,.26),transparent_26%),linear-gradient(135deg,#051015_0%,#0d2028_52%,#020609_100%)]" />
                <div className="absolute -right-24 top-24 h-[520px] w-[520px] rotate-12 border-[70px] border-[#b7ff3c]/10" />
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
                    <BrandMark homepage={homepage} branding={branding} fonts={fonts} className="text-white" textClassName="text-2xl font-black uppercase tracking-[-0.04em]" />
                    <nav className="hidden items-center gap-7 text-xs font-black uppercase tracking-[0.22em] text-white/60 md:flex">
                        {['about', 'featured', 'gallery', 'contact'].map((item) => (
                            <button key={item} type="button" onClick={() => scrollToTarget(`#${item}`)} className="hover:text-[#b7ff3c]">{sectionLabels[item]}</button>
                        ))}
                    </nav>
                </header>
                <div className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-12 py-16 lg:grid-cols-[1fr_.9fr]">
                    <div>
                        <p className="mb-5 inline-flex rounded-full border border-[#b7ff3c]/30 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#b7ff3c]">{homepage.hero.eyebrow || 'Game day visuals'}</p>
                        <h1 className="text-6xl font-black uppercase leading-[.86] tracking-[-0.08em] md:text-8xl" style={{ fontFamily: fonts.heading }}>{homepage.hero.title}</h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-white/66">{homepage.hero.description}</p>
                        <div className="mt-9 flex flex-wrap gap-4">
                            <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background="#b7ff3c" color="#051015" />
                            <OutlineHeroButton label="Ver destacados" onClick={() => scrollToTarget('#gallery')} />
                        </div>
                    </div>
                    <div className="relative">
                        <img
                            src={homepage.hero.image_url}
                            alt={homepage.hero.title}
                            className="h-[640px] w-full skew-y-[-3deg] rounded-[2rem] object-cover shadow-[0_40px_100px_rgba(0,0,0,.42)] will-change-transform"
                            style={{ transform: `skewY(-3deg) translate3d(${(pointerX - 0.5) * -20}px, ${(pointerY - 0.5) * -14}px, 0) scale(${1 + scrollProgress * 0.02})` }}
                        />
                        <div className="absolute -bottom-6 left-5 grid w-[calc(100%-40px)] grid-cols-3 gap-3">
                            {homepage.about.stats.map((item) => <ScoreMetric key={`${item.value}-${item.label}`} value={item.value} label={item.label} />)}
                        </div>
                    </div>
                </div>
            </section>

            <section id="featured" className="px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <SectionKicker icon={Trophy} label={homepage.featured.eyebrow || 'Servicios'} />
                    <h2 className="max-w-4xl text-5xl font-black uppercase leading-[.9] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        {homepage.featured.items.map((item, index) => <SportCard key={`${item.title}-${index}`} item={item} index={index} />)}
                    </div>
                </div>
            </section>

            <section id="gallery" className="bg-[#0a1a20] px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <SectionKicker icon={Zap} label={homepage.gallery.eyebrow || 'Destacados'} />
                    <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <h2 className="max-w-3xl text-5xl font-black uppercase leading-[.9] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                        <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-full bg-[#b7ff3c] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#051015]">Portafolio <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {(filteredPortfolio.length ? filteredPortfolio : homepage.gallery.images.map((image_url, id) => ({ id, image_url, project_name: `Destacado ${id + 1}`, category: 'Deportes' }))).slice(0, 6).map((item) => (
                            <article key={item.id} className="motion-card group overflow-hidden rounded-[1.8rem] bg-white/5">
                                <img src={item.image_url} alt={item.project_name} className="h-80 w-full object-cover transition duration-500 group-hover:scale-105" />
                                <div className="p-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#b7ff3c]">{item.category}</p>
                                    <h3 className="mt-2 text-2xl font-black uppercase" style={{ fontFamily: fonts.heading }}>{item.project_name}</h3>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <CompactLeadSection homepage={homepage} palette={palette} fonts={fonts} leadForm={leadForm} dark />
            <MinimalFooter palette={palette} />
        </div>
    );
}

function CompactLeadSection({ homepage, palette, fonts, leadForm, dark = false }) {
    const bg = dark ? '#080808' : '#fff';
    const text = dark ? '#fff' : palette.text;
    const muted = dark ? 'rgba(255,255,255,.66)' : palette.muted;

    return (
        <section id="contact" className="px-6 py-24 md:px-10" style={{ backgroundColor: bg, color: text }}>
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.85fr_1.15fr]">
                <div>
                    <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.contact.eyebrow}</p>
                    <h2 className="text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.contact.heading}</h2>
                    <p className="mt-6 max-w-lg text-base leading-8" style={{ color: muted }}>{homepage.contact.description}</p>
                    <div className="mt-10 space-y-3">
                        {homepage.contact.info_lines.map((line, index) => (
                            <p key={`${line}-${index}`} className="flex items-center gap-3 text-sm" style={{ color: muted }}>
                                <MapPin className="h-4 w-4" style={{ color: palette.accent }} />
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
                <div className="rounded-[2.2rem] p-6 shadow-[0_30px_80px_rgba(0,0,0,.16)] md:p-8" style={{ backgroundColor: dark ? 'rgba(255,255,255,.06)' : palette.surface_alt }}>
                    <LeadForm homepage={homepage} palette={palette} leadForm={leadForm} />
                </div>
            </div>
        </section>
    );
}

function LeadForm({ homepage, palette, leadForm }) {
    const { data, setData, processing, errors, recentlySuccessful, submit, availableSlots, eventTypes, busyCalendarEvents, businessHours, availabilitySettings, flash } = leadForm;

    return (
        <form onSubmit={submit} className="space-y-5">
            {(flash?.success || recentlySuccessful) && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash?.success || 'Your inquiry was sent successfully.'}
                </div>
            )}
            <div className="grid gap-5 md:grid-cols-2">
                <Field label="Name" icon={Camera} value={data.name} error={errors.name} onChange={(value) => setData('name', value)} placeholder="Your full name" palette={palette} />
                <Field label="Email" icon={Mail} type="email" value={data.email} error={errors.email} onChange={(value) => setData('email', value)} placeholder="you@example.com" palette={palette} />
                <Field label="Phone" icon={Phone} value={data.phone} error={errors.phone} onChange={(value) => setData('phone', value)} placeholder="+506 0000 0000" palette={palette} />
                <SelectField label="Tipo de proyecto" value={data.event_type} error={errors.event_type} onChange={(value) => setData('event_type', value)} options={eventTypes} palette={palette} />
            </div>
            <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
                <AvailabilityCalendar
                    label="Fecha tentativa"
                    value={data.tentative_date}
                    onChange={(value) => setData('tentative_date', value)}
                    error={errors.tentative_date}
                    busyEvents={busyCalendarEvents}
                    businessHours={businessHours}
                    availabilitySettings={availabilitySettings}
                    helperText="Selecciona un dia con disponibilidad real y luego una hora libre."
                    tone="public"
                />
                <SelectField
                    label="Hora disponible"
                    value={data.tentative_time}
                    error={errors.tentative_time}
                    onChange={(value) => setData('tentative_time', value)}
                    options={availableSlots}
                    placeholder={data.tentative_date ? 'Selecciona una hora disponible' : 'Selecciona primero una fecha'}
                    disabled={!data.tentative_date || availableSlots.length === 0}
                    palette={palette}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em]" style={{ color: palette.accent }}>Message</label>
                <textarea
                    value={data.message}
                    onChange={(event) => setData('message', event.target.value)}
                    rows={4}
                    placeholder="Cuéntame sobre el proyecto."
                    className="w-full resize-none rounded-[1.5rem] border bg-transparent px-4 py-4 text-sm outline-none"
                    style={{ borderColor: palette.accent_soft, color: palette.text }}
                />
                {errors.message && <p className="text-sm text-rose-600">{errors.message}</p>}
            </div>
            <button type="submit" disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-semibold transition disabled:opacity-70" style={{ backgroundColor: palette.accent, color: palette.surface_dark }}>
                {processing ? 'Enviando...' : 'Enviar solicitud'}
                <ArrowRight className="h-4 w-4" />
            </button>
        </form>
    );
}

function TettaGallery({ homepage, filteredPortfolio, fonts }) {
    const items = filteredPortfolio.length
        ? filteredPortfolio.slice(0, 6)
        : homepage.gallery.images.map((image_url, id) => ({ id, image_url, project_name: `Encuadre ${id + 1}`, category: 'Editorial' }));

    return (
        <section id="gallery" className="bg-[#090909] px-7 py-24 md:px-12">
            <div className="mx-auto max-w-7xl">
                <p className="mb-5 text-[11px] uppercase tracking-[0.34em] text-white/40">{homepage.gallery.eyebrow}</p>
                <h2 className="max-w-4xl text-5xl leading-[.92] text-white md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                <div className="mt-12 grid gap-5 md:grid-cols-3">
                    {items.map((item, index) => (
                        <article key={item.id} className={`motion-card group overflow-hidden rounded-[2rem] bg-white/5 ${index === 1 ? 'md:mt-16' : ''}`}>
                            <img src={item.image_url} alt={item.project_name} className="h-[420px] w-full object-cover grayscale transition duration-500 group-hover:grayscale-0" />
                            <div className="p-5">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">{item.category}</p>
                                <h3 className="mt-2 text-2xl text-white" style={{ fontFamily: fonts.heading }}>{item.project_name}</h3>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HardyServices({ homepage, fonts }) {
    return (
        <section id="featured" className="px-6 py-24 md:px-10">
            <div className="mx-auto max-w-7xl">
                <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#b68156]">{homepage.featured.eyebrow || 'Nuestros servicios'}</p>
                <h2 className="text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                <div className="mt-12 grid gap-6 lg:grid-cols-3">
                    {homepage.featured.items.map((item, index) => (
                        <article key={`${item.title}-${index}`} className="motion-card overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(78,52,32,.1)]">
                            <img src={item.image_url} alt={item.title} className="h-80 w-full object-cover" />
                            <div className="p-7">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#b68156]">Service</p>
                                <h3 className="mt-3 text-3xl" style={{ fontFamily: fonts.heading }}>{item.title}</h3>
                                <p className="mt-3 text-sm leading-7 text-[#716052]">{item.category}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HardyProjects({ homepage, filteredPortfolio, fonts }) {
    const photos = filteredPortfolio.length
        ? filteredPortfolio.slice(0, 4)
        : homepage.gallery.images.slice(0, 4).map((image_url, id) => ({ id, image_url, project_name: `Proyecto ${id + 1}`, category: 'Retratos' }));

    return (
        <section id="gallery" className="bg-[#211915] px-6 py-24 text-white md:px-10">
            <div className="mx-auto max-w-7xl">
                <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#d7a676]">{homepage.gallery.eyebrow || 'Nuestros proyectos'}</p>
                <h2 className="text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                <div className="mt-12 grid gap-5 md:grid-cols-2">
                    {photos.map((item) => (
                        <article key={item.id} className="motion-card grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 md:grid-cols-[.9fr_1fr]">
                            <img src={item.image_url} alt={item.project_name} className="h-80 w-full object-cover md:h-full" />
                            <div className="flex flex-col justify-end p-7">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-[#d7a676]">{item.category}</p>
                                <h3 className="mt-3 text-3xl" style={{ fontFamily: fonts.heading }}>{item.project_name}</h3>
                                <p className="mt-4 text-sm leading-7 text-white/60">{item.description || homepage.gallery.description}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function DarkMetric({ value, label }) {
    return (
        <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
            <p className="text-4xl font-black text-white">{value}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/40">{label}</p>
        </div>
    );
}

function LightMetric({ value, label, fonts }) {
    return (
        <div className="rounded-[1.4rem] bg-[#f6efe4] p-5 text-center">
            <p className="text-3xl" style={{ fontFamily: fonts.heading }}>{value}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-[#b68156]">{label}</p>
        </div>
    );
}

function ScoreMetric({ value, label }) {
    return (
        <div className="rounded-2xl border border-[#b7ff3c]/20 bg-[#061015]/88 p-4 backdrop-blur">
            <p className="text-2xl font-black text-[#b7ff3c]">{value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/52">{label}</p>
        </div>
    );
}

function SectionKicker({ icon: Icon, label }) {
    return (
        <p className="mb-5 inline-flex items-center gap-3 rounded-full border border-[#b7ff3c]/25 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-[#b7ff3c]">
            <Icon className="h-4 w-4" />
            {label}
        </p>
    );
}

function SportCard({ item, index }) {
    return (
        <article className="motion-card relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
            <Star className="mb-8 h-8 w-8 text-[#b7ff3c]" />
            <p className="absolute right-5 top-5 text-7xl font-black text-white/5">0{index + 1}</p>
            <h3 className="text-3xl font-black uppercase">{item.title}</h3>
            <p className="mt-4 text-sm leading-7 text-white/62">{item.category}</p>
        </article>
    );
}

function MinimalFooter({ palette }) {
    return (
        <footer className="border-t px-6 py-8 md:px-10" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_dark, color: palette.muted }}>
            <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm md:flex-row md:items-center md:justify-between">
                <p>Desarrollado por PixelPRO</p>
                <Link href="/login" className="inline-flex items-center gap-2 uppercase tracking-[0.22em]" style={{ color: palette.accent }}>
                    <Grip className="h-4 w-4" />
                    Iniciar sesión
                </Link>
            </div>
        </footer>
    );
}

function MotionAtmosphere({ palette, pointerX = 0.5, pointerY = 0.5, scrollProgress = 0, dark = false }) {
    return (
        <>
            <MotionStyles />
            <div className="pointer-events-none fixed left-0 top-0 z-[80] h-1 w-full bg-transparent">
                <div
                    className="h-full origin-left"
                    style={{
                        width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%`,
                        background: `linear-gradient(90deg, ${palette.accent}, ${palette.accent_soft})`,
                        boxShadow: `0 0 18px ${palette.accent}`,
                    }}
                />
            </div>
            <div
                className="pointer-events-none fixed z-[3] hidden h-72 w-72 rounded-full blur-3xl transition-transform duration-300 md:block"
                style={{
                    left: `${pointerX * 100}%`,
                    top: `${pointerY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: palette.accent,
                    opacity: dark ? 0.14 : 0.1,
                    mixBlendMode: dark ? 'screen' : 'multiply',
                }}
            />
            <div
                className="pointer-events-none fixed -right-24 top-24 z-[2] h-80 w-80 rounded-full blur-3xl motion-blob"
                style={{ backgroundColor: palette.accent_soft, opacity: dark ? 0.1 : 0.22 }}
            />
        </>
    );
}

function MotionStyles() {
    return (
        <style>{`
            @keyframes motionFloat {
                0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
                50% { transform: translate3d(16px, -22px, 0) rotate(4deg); }
            }

            @keyframes motionShimmer {
                0% { background-position: 0% 50%; }
                100% { background-position: 200% 50%; }
            }

            .motion-blob {
                animation: motionFloat 9s ease-in-out infinite;
            }

            .motion-shimmer {
                background-size: 200% 100%;
                animation: motionShimmer 4s linear infinite;
            }

            .motion-card {
                transform: translateZ(0);
                transition: transform .45s cubic-bezier(.2,.8,.2,1), filter .45s ease, box-shadow .45s ease;
            }

            .motion-card:hover {
                transform: translateY(-10px) scale(1.015);
                filter: saturate(1.08);
            }
        `}</style>
    );
}

function Reveal({ children, className = '', delay = 0 }) {
    const ref = React.useRef(null);
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        const node = ref.current;

        if (!node) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.16 },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                filter: visible ? 'blur(0px)' : 'blur(14px)',
                transform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,28px,0)',
                transition: 'opacity .8s ease, transform .8s cubic-bezier(.2,.8,.2,1), filter .8s ease',
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

function usePointerPosition() {
    const [position, setPosition] = React.useState({ x: 0.5, y: 0.5 });

    React.useEffect(() => {
        const update = (event) => {
            setPosition({
                x: event.clientX / Math.max(window.innerWidth, 1),
                y: event.clientY / Math.max(window.innerHeight, 1),
            });
        };

        window.addEventListener('pointermove', update, { passive: true });

        return () => window.removeEventListener('pointermove', update);
    }, []);

    return position;
}

function useScrollProgress() {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        const update = () => {
            const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            setProgress(window.scrollY / max);
        };

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, []);

    return progress;
}

function BrandMark({ homepage, branding, fonts, className = '', textClassName = '', logoClassName = '' }) {
    return (
        <div className={`inline-flex min-w-0 items-center gap-3 ${className}`}>
            {branding?.app_logo_url && (
                <img
                    src={branding.app_logo_url}
                    alt={homepage.brand.name}
                    className={`h-10 w-10 rounded-full object-cover ring-1 ring-current/15 ${logoClassName}`}
                />
            )}
            <span className={`min-w-0 break-words ${textClassName}`} style={{ fontFamily: fonts.heading }}>
                {homepage.brand.name}
            </span>
        </div>
    );
}

function resolveFeaturedHref(item, portfolioCategories) {
    const normalizedTitle = (item.title || '').toLowerCase();
    const normalizedCategory = (item.category || '').toLowerCase();
    const matchedCategory = portfolioCategories.find((category) => {
        const normalized = category.toLowerCase();
        return normalized === normalizedTitle
            || normalized === normalizedCategory
            || normalizedTitle.includes(normalized)
            || normalized.includes(normalizedTitle);
    });

    return matchedCategory
        ? `/portfolio?category=${encodeURIComponent(matchedCategory)}`
        : '/portfolio';
}

function ActionButton({ label, onClick, background, color }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition"
            style={{ backgroundColor: background, color }}
        >
            {label}
            <ArrowRight className="h-4 w-4" />
        </button>
    );
}

function LinkButton({ href, label, background }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition" style={{ backgroundColor: background }}>
            {label}
            <ArrowRight className="h-4 w-4" />
        </Link>
    );
}

function OutlineHeroButton({ label, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3 text-sm font-medium text-white/88 backdrop-blur transition hover:bg-white/8"
        >
            {label}
        </button>
    );
}

function OutlineLinkButton({ href, label }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3 text-sm font-medium text-white/88 backdrop-blur transition hover:bg-white/8">
            {label}
        </Link>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-2xl bg-black/18 p-4">
            <p className="text-white/45">{label}</p>
            <p className="mt-2 text-white">{value}</p>
        </div>
    );
}

function Field({ label, icon: Icon, error, onChange, palette, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.24em]" style={{ color: palette.accent }}>{label}</label>
            <div className="flex items-center gap-3 rounded-[1.5rem] border px-4 py-4" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface }}>
                {Icon && <Icon className="h-4 w-4" style={{ color: palette.accent }} />}
                <input {...props} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent text-sm outline-none" style={{ color: palette.text }} />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
    );
}

function SelectField({ label, error, onChange, options, placeholder = 'Select', disabled = false, palette, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.24em]" style={{ color: palette.accent }}>{label}</label>
            <div className="rounded-[1.5rem] border px-4 py-4" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface }}>
                <select
                    {...props}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full bg-transparent text-sm outline-none disabled:opacity-60"
                    style={{ color: palette.text }}
                >
                    <option value="">{placeholder}</option>
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
    );
}

Home.layout = (page) => page;

/* ─────────────────────────────────────────────
   MISAEL SIGNATURE LAYOUT
   Dark · Bold · Nike editorial style
   ───────────────────────────────────────────── */

const MA_ASSET_BASE = '/images/misael';
const MA_LOGO = `${MA_ASSET_BASE}/misael-david-photography.png`;
const MA_PROFILE_IMAGE = `${MA_ASSET_BASE}/misael-atencio.webp`;

const MA_SPECIALTIES = [
    { label: 'Deportiva', filter: 'Eventos', desc: 'Acción real, velocidad y precisión en cada disparo.', cover: `${MA_ASSET_BASE}/deportiva-retrato.webp` },
    { label: 'Artistas', filter: 'Eventos', desc: 'Conciertos, presentaciones y contenido visual para artistas.', cover: `${MA_ASSET_BASE}/artista-escenario.webp` },
    { label: 'Perfiles', filter: 'Retratos', desc: 'Retratos profesionales y marca personal de alto impacto.', cover: `${MA_ASSET_BASE}/perfil-estudio.webp` },
    { label: 'Individual', filter: 'Sesiones', desc: 'Retratos editoriales que expresan una identidad propia.', cover: `${MA_ASSET_BASE}/individual-editorial.webp` },
    { label: 'Eventos', filter: 'Bodas', desc: 'Bodas, quinceaños, eventos corporativos y experiencias.', cover: `${MA_ASSET_BASE}/evento-boda.webp` },
];

const MA_SIGNATURE_PHOTOS = [
    { id: 'ma-sport-01', image_url: `${MA_ASSET_BASE}/hero-futbol-panama.webp`, category: 'Eventos', project_name: 'Fútbol internacional en Panamá' },
    { id: 'ma-artist-01', image_url: `${MA_ASSET_BASE}/hero-concierto.webp`, category: 'Eventos', project_name: 'Concierto en vivo' },
    { id: 'ma-event-01', image_url: `${MA_ASSET_BASE}/hero-boda.webp`, category: 'Bodas', project_name: 'Celebración de boda' },
    { id: 'ma-sport-02', image_url: `${MA_ASSET_BASE}/hero-celebracion.webp`, category: 'Eventos', project_name: 'Selección de Panamá' },
    { id: 'ma-individual-01', image_url: `${MA_ASSET_BASE}/individual-editorial.webp`, category: 'Sesiones', project_name: 'Retrato editorial' },
    { id: 'ma-artist-02', image_url: `${MA_ASSET_BASE}/artista-escenario.webp`, category: 'Eventos', project_name: 'Artista en escena' },
    { id: 'ma-event-02', image_url: `${MA_ASSET_BASE}/evento-playa.webp`, category: 'Bodas', project_name: 'Boda frente al mar' },
    { id: 'ma-profile-01', image_url: `${MA_ASSET_BASE}/perfil-estudio.webp`, category: 'Retratos', project_name: 'Retrato de estudio' },
    { id: 'ma-sport-03', image_url: `${MA_ASSET_BASE}/deportiva-neymar.webp`, category: 'Eventos', project_name: 'Cobertura deportiva' },
    { id: 'ma-artist-03', image_url: `${MA_ASSET_BASE}/artista-retrato.webp`, category: 'Eventos', project_name: 'Retrato de artista' },
    { id: 'ma-event-03', image_url: `${MA_ASSET_BASE}/evento-detalles.webp`, category: 'Bodas', project_name: 'Detalles de evento' },
    { id: 'ma-sport-04', image_url: `${MA_ASSET_BASE}/deportiva-pesas.webp`, category: 'Eventos', project_name: 'Alto rendimiento' },
    { id: 'ma-individual-02', image_url: `${MA_ASSET_BASE}/individual-quince.webp`, category: 'Quinceaños', project_name: 'Retrato de quinceaños' },
    { id: 'ma-artist-04', image_url: `${MA_ASSET_BASE}/artista-guitarra.webp`, category: 'Eventos', project_name: 'Música en vivo' },
    { id: 'ma-sport-05', image_url: `${MA_ASSET_BASE}/deportiva-estadio.webp`, category: 'Eventos', project_name: 'El momento decisivo' },
    { id: 'ma-artist-05', image_url: `${MA_ASSET_BASE}/artista-bn.webp`, category: 'Eventos', project_name: 'Escena en blanco y negro' },
];

const MA_HERO_IMAGES = [
    `${MA_ASSET_BASE}/hero-futbol-panama.webp`,
    `${MA_ASSET_BASE}/hero-concierto.webp`,
    `${MA_ASSET_BASE}/hero-celebracion.webp`,
    `${MA_ASSET_BASE}/hero-boda.webp`,
];

const MA_MANIFESTO = ['CADA DISPARO,', 'UNA HISTORIA.'];

function MisaelSignatureHome({
    homepage, palette, fonts, navItems,
    filteredPortfolio, allCategories, activeCategory, setActiveCategory,
    portfolioPhotos = [],
    branding, leadForm, seo,
}) {
    const { flash } = usePage().props;
    const [scrolled, setScrolled] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const accent = palette.accent || '#e8ff00';

    React.useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const heroImage = homepage?.hero?.image_url;
    const aboutImage = MA_PROFILE_IMAGE;

    // The curated Misael portfolio is always present; CMS photos can extend it.
    const cmsPhotos = portfolioPhotos.length > 0 ? portfolioPhotos : filteredPortfolio;
    const allPhotos = [
        ...MA_SIGNATURE_PHOTOS,
        ...cmsPhotos.filter((photo) => !MA_SIGNATURE_PHOTOS.some((item) => item.image_url === photo.image_url)),
    ];
    const misaelCategories = ['All', ...new Set(leadForm.eventTypes.filter(Boolean))];
    const visiblePortfolio = activeCategory === 'All'
        ? allPhotos
        : allPhotos.filter((photo) => {
            const category = (photo.category || '').toLocaleLowerCase('es');
            const selected = activeCategory.toLocaleLowerCase('es');
            return category.includes(selected) || selected.includes(category);
        });
    const heroImages = [...new Set([...MA_HERO_IMAGES, heroImage, ...cmsPhotos.slice(0, 2).map((photo) => photo.image_url)].filter(Boolean))];
    const categoryShowcase = MA_SPECIALTIES.map((spec) => ({
        ...spec,
        photo: { image_url: spec.cover },
    }));

    return (
        <div style={{ backgroundColor: '#080808', color: '#f0f0f0', fontFamily: fonts.body }} className="min-h-screen">
            <SeoHead
                seo={seo}
                fallbackTitle="Misael David Photography"
                fallbackDescription="Fotografía profesional de deportes, artistas, eventos, marcas y proyectos comerciales en Panamá."
            />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600&display=swap');
                html { scroll-behavior: smooth; }

                @keyframes maFadeUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes maFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }

                /* Ken Burns variants */
                @keyframes kbZoomIn {
                    from { transform: scale(1.0) translate(0%, 0%); }
                    to   { transform: scale(1.18) translate(-2%, -2%); }
                }
                @keyframes kbZoomOut {
                    from { transform: scale(1.18) translate(2%, 1%); }
                    to   { transform: scale(1.0) translate(0%, 0%); }
                }
                @keyframes kbPanRight {
                    from { transform: scale(1.1) translate(-3%, 0%); }
                    to   { transform: scale(1.1) translate(3%, -1.5%); }
                }
                @keyframes kbPanLeft {
                    from { transform: scale(1.1) translate(3%, -1%); }
                    to   { transform: scale(1.1) translate(-3%, 1%); }
                }
                @keyframes kbZoomInUp {
                    from { transform: scale(1.0) translate(0%, 2%); }
                    to   { transform: scale(1.16) translate(1.5%, -2%); }
                }

                /* Slideshow */
                .ma-slide { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; will-change: transform, opacity; transition: opacity 1.4s cubic-bezier(.4,0,.2,1); }
                .ma-slide-hidden { opacity: 0; z-index: 0; animation: none !important; }
                .ma-slide-prev   { opacity: 0; z-index: 1; }
                .ma-slide-active { opacity: 1; z-index: 2; }

                @keyframes slideDown {
                    0%   { transform: translateY(-100%); opacity: 0; }
                    50%  { opacity: 1; }
                    100% { transform: translateY(100%); opacity: 0; }
                }
                @keyframes maManifestoIn {
                    from { opacity: 0; transform: translateY(70px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .ma-hero-img    { animation: maFadeIn 1.6s ease .05s both; }
                .ma-hero-1      { animation: maFadeUp .9s cubic-bezier(.22,1,.36,1) .2s  both; }
                .ma-hero-2      { animation: maFadeUp .9s cubic-bezier(.22,1,.36,1) .38s both; }
                .ma-hero-3      { animation: maFadeUp .9s cubic-bezier(.22,1,.36,1) .56s both; }
                .ma-hero-4      { animation: maFadeUp .9s cubic-bezier(.22,1,.36,1) .74s both; }
                .ma-hero-scroll { animation: maFadeIn 1s ease 1.3s both; }

                .ma-reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
                .ma-reveal.visible { opacity: 1; transform: translateY(0); }
                .ma-reveal-left { opacity: 0; transform: translateX(-44px); transition: opacity .9s cubic-bezier(.22,1,.36,1), transform .9s cubic-bezier(.22,1,.36,1); }
                .ma-reveal-left.visible { opacity: 1; transform: translateX(0); }

                /* Photo masonry */
                .photo-item { overflow: hidden; }
                .photo-item img { transition: transform .7s cubic-bezier(.22,1,.36,1); display: block; width: 100%; }
                .photo-item:hover img { transform: scale(1.05); }

                /* Nav link underline */
                .nav-link { position: relative; }
                .nav-link::after { content:''; position:absolute; bottom:-3px; left:0; width:0; height:1px; background:currentColor; transition: width .3s ease; }
                .nav-link:hover::after { width:100%; }

                /* Category tile */
                .cat-tile { position: relative; overflow: hidden; display: block; cursor: pointer; }
                .cat-tile-bg { width:100%; height:100%; object-fit:cover; transition: transform .85s cubic-bezier(.22,1,.36,1); display:block; }
                .cat-tile:hover .cat-tile-bg { transform: scale(1.07); }
                .cat-tile-overlay { position:absolute; inset:0; background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.25) 55%, transparent 100%); transition: background .4s ease; }
                .cat-tile:hover .cat-tile-overlay { background: linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.45) 60%, rgba(0,0,0,.08) 100%); }
                .cat-tile-label { transition: transform .35s cubic-bezier(.22,1,.36,1); }
                .cat-tile:hover .cat-tile-label { transform: translateY(-6px); }
                .cat-tile-cta { opacity:0; transform: translateY(12px); transition: opacity .3s ease .05s, transform .3s cubic-bezier(.22,1,.36,1) .05s; }
                .cat-tile:hover .cat-tile-cta { opacity:1; transform: translateY(0); }

                /* Specialty row */
                .spec-row { transition: padding-left .3s ease; }
                .spec-row:hover { padding-left: 1rem; }
                .spec-num { transition: color .3s ease; }
                .spec-row:hover .spec-num { color: var(--ma-accent, #e8ff00); }
                .spec-arrow { transition: transform .3s ease, opacity .3s ease; }
                .spec-row:hover .spec-arrow { transform: translateX(6px); opacity: .7; }

                /* Manifesto */
                .ma-manifesto-line { opacity:0; }
                .ma-manifesto-line.fired { animation: maManifestoIn .95s cubic-bezier(.22,1,.36,1) both; }
                .ma-manifesto-line.fired:nth-child(2) { animation-delay: .18s; }
            `}</style>

            {/* ── STICKY NAV ── */}
            <header
                className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
                style={{
                    backgroundColor: scrolled ? 'rgba(8,8,8,0.96)' : 'transparent',
                    backdropFilter: scrolled ? 'blur(20px)' : 'none',
                    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
                }}
            >
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
                    <a href="/" aria-label="Misael David Photography" className="flex items-center">
                        <img
                            src={MA_LOGO}
                            alt="Logotipo de Misael David Photography"
                            className="h-12 w-[210px] object-contain object-left md:h-14 md:w-[260px]"
                        />
                    </a>
                    <nav className="hidden items-center gap-8 md:flex">
                        {navItems.map((s) => (
                            <button
                                key={s}
                                onClick={() => scrollToTarget(`#${s}`)}
                                className="nav-link text-[10px] font-semibold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
                            >
                                {sectionLabels[s] || s}
                            </button>
                        ))}
                        <button
                            onClick={() => scrollToTarget('#contact')}
                            className="ml-3 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-90 active:scale-95"
                            style={{ backgroundColor: accent, color: '#080808' }}
                        >
                            Reservar sesión
                        </button>
                    </nav>
                    <button className="md:hidden text-white/60 hover:text-white transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
                        <Menu className="h-5 w-5" />
                    </button>
                </div>
                {mobileOpen && (
                    <div className="md:hidden border-t border-white/8 bg-black/97 px-6 py-6 flex flex-col gap-5">
                        {[...navItems, 'contact'].map((s) => (
                            <button
                                key={s}
                                onClick={() => { scrollToTarget(`#${s}`); setMobileOpen(false); }}
                                className="text-left text-sm font-semibold uppercase tracking-widest text-white/55 hover:text-white transition-colors"
                            >
                                {sectionLabels[s] || s}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* ── HERO ── */}
            <section id="hero" className="relative flex h-screen min-h-[680px] items-end overflow-hidden">
                <MaHeroSlideshow images={heroImages} />
                <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.12) 0%, transparent 30%, rgba(8,8,8,0.65) 65%, #080808 100%)' }} />
                <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to right, rgba(8,8,8,0.52) 0%, transparent 60%)' }} />

                <div className="relative z-20 mx-auto w-full max-w-7xl px-6 pb-28 md:px-10 md:pb-40">
                    <p className="ma-hero-1 mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.42em]" style={{ color: accent }}>
                        <span className="inline-block h-px w-7" style={{ backgroundColor: accent }} />
                        Misael Atencio · Panamá
                    </p>
                    <h1
                        className="ma-hero-2 mb-7 max-w-4xl uppercase text-white"
                        style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(3.8rem, 11vw, 9rem)', lineHeight: '.93', letterSpacing: '-0.025em' }}
                    >
                        El instante no espera.
                    </h1>
                    <p className="ma-hero-3 mb-12 max-w-sm text-base leading-relaxed text-white/45 md:text-lg">
                        Fotografía de alto impacto para deportes, artistas, marcas, eventos y proyectos comerciales.
                    </p>
                    <div className="ma-hero-4 flex flex-wrap gap-3">
                        <button
                            onClick={() => scrollToTarget('#gallery')}
                            className="inline-flex items-center gap-2 px-8 py-4 text-[11px] font-bold uppercase tracking-widest transition-all hover:brightness-90 active:scale-95"
                            style={{ backgroundColor: accent, color: '#080808' }}
                        >
                            Ver portafolio <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => scrollToTarget('#contact')}
                            className="inline-flex items-center gap-2 border border-white/22 px-8 py-4 text-[11px] font-medium text-white/65 backdrop-blur-sm transition hover:bg-white/6 hover:border-white/40"
                        >
                            Cuéntame tu proyecto
                        </button>
                    </div>
                </div>

                <div className="ma-hero-scroll absolute bottom-8 right-8 md:right-12 z-20 flex flex-col items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.22em] text-white/25" style={{ writingMode: 'vertical-rl' }}>Desliza</span>
                    <div className="h-14 w-px bg-white/12 relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-full animate-[slideDown_2.2s_ease-in-out_infinite]" style={{ background: `linear-gradient(to bottom, transparent, ${accent})` }} />
                    </div>
                </div>
            </section>

            {/* ── CATEGORY SHOWCASE ── Nike-style editorial image grid */}
            <section className="p-1.5" style={{ backgroundColor: '#020202' }}>
                <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-5">
                    {categoryShowcase.map((cat, i) => (
                        <MaReveal key={cat.label} delay={i * 55}>
                            <button
                                onClick={() => {
                                    const next = cat.filter === activeCategory ? 'All' : cat.filter;
                                    setActiveCategory(next);
                                    scrollToTarget('#gallery');
                                }}
                                className="cat-tile w-full text-left"
                                style={{ height: 'clamp(260px, 30vw, 440px)', backgroundColor: '#111' }}
                            >
                                {cat.photo?.image_url ? (
                                    <img src={cat.photo.image_url} alt={cat.label} className="cat-tile-bg" loading="lazy" />
                                ) : (
                                    <div
                                        className="cat-tile-bg"
                                        style={{ background: `linear-gradient(160deg, #181818 0%, #${['131313','151515','121212','141414','161616'][i]} 100%)` }}
                                    />
                                )}
                                <div className="cat-tile-overlay" />
                                <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-6">
                                    <p
                                        className="cat-tile-label leading-none text-white uppercase mb-2"
                                        style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(1.4rem, 2.8vw, 2rem)' }}
                                    >
                                        {cat.label}
                                    </p>
                                    <p className="text-[11px] text-white/40 leading-snug mb-4 max-w-[16ch]">{cat.desc}</p>
                                    <span
                                        className="cat-tile-cta inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                        style={{ color: accent }}
                                    >
                                        Ver fotos <ArrowRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </button>
                        </MaReveal>
                    ))}
                </div>
            </section>

            {/* ── SPECIALTIES — numbered editorial list ── */}
            <section
                className="py-24 md:py-36"
                style={{ backgroundColor: '#080808', '--ma-accent': accent }}
            >
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <MaReveal>
                        <div className="mb-14 flex items-end justify-between border-b pb-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: accent }}>Especialidades</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/18">{MA_SPECIALTIES.length} servicios</p>
                        </div>
                    </MaReveal>
                    {MA_SPECIALTIES.map((spec, i) => (
                        <MaReveal key={spec.label} delay={i * 55}>
                            <div
                                className="spec-row group flex items-center gap-6 md:gap-10 border-b py-8 md:py-10 cursor-default"
                                style={{ borderColor: 'rgba(255,255,255,0.05)', paddingLeft: 0 }}
                            >
                                <span
                                    className="spec-num flex-shrink-0 leading-none text-white/10"
                                    style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(2.2rem, 5vw, 3.8rem)' }}
                                >
                                    0{i + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className="font-bold uppercase tracking-wide text-white group-hover:text-white/85 transition-colors"
                                        style={{ fontSize: 'clamp(1rem, 2.2vw, 1.5rem)' }}
                                    >
                                        {spec.label}
                                    </p>
                                    <p className="mt-1.5 text-sm leading-snug text-white/32 md:text-base">{spec.desc}</p>
                                </div>
                                <ArrowRight className="spec-arrow flex-shrink-0 h-5 w-5 text-white/12" />
                            </div>
                        </MaReveal>
                    ))}
                </div>
            </section>

            {/* ── ABOUT ── */}
            <section id="about" className="overflow-hidden py-28 md:py-44" style={{ backgroundColor: '#050505' }}>
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="grid gap-16 md:grid-cols-2 md:gap-28 items-center">
                        <MaReveal className="ma-reveal-left order-2 md:order-1">
                            <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
                                {aboutImage
                                    ? <MaAboutImage src={aboutImage} />
                                    : <div className="absolute inset-0" style={{ backgroundColor: '#111' }} />
                                }
                                <div className="absolute bottom-0 left-0 h-[2px] w-14" style={{ backgroundColor: accent }} />
                                <div className="absolute bottom-0 left-0 h-14 w-[2px]" style={{ backgroundColor: accent }} />
                            </div>
                        </MaReveal>

                        <div className="order-1 md:order-2 space-y-8">
                            <MaReveal>
                                <p className="text-[10px] font-bold uppercase tracking-[0.42em]" style={{ color: accent }}>
                                    Detrás de la cámara
                                </p>
                            </MaReveal>
                            <MaReveal delay={100}>
                                <h2
                                    className="leading-none text-white uppercase"
                                    style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
                                >
                                    Misael Atencio
                                </h2>
                            </MaReveal>
                            <MaReveal delay={180}>
                                <p className="text-base leading-relaxed text-white/48 md:text-lg">
                                    Fotógrafo profesional enfocado en crear contenido visual de alto impacto para marcas, eventos, deportes y proyectos comerciales.
                                </p>
                            </MaReveal>
                            <MaReveal delay={240}>
                                <p className="text-sm leading-relaxed text-white/28">
                                    Cada proyecto es una oportunidad para contar una historia, fortalecer una marca y dejar un impacto duradero. Excelencia, creatividad y profesionalismo guían cada imagen.
                                </p>
                            </MaReveal>
                            <MaReveal delay={320}>
                                <div className="grid grid-cols-3 gap-5 border-t pt-6 md:gap-8" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                    {[
                                        { value: 10, suffix: '+', label: 'Años de experiencia' },
                                        { value: 500, suffix: '+', label: 'Proyectos entregados' },
                                        { value: 100, suffix: '%', label: 'Compromiso con cada cliente' },
                                    ].map((stat) => (
                                        <MaAnimatedStat key={stat.label} {...stat} accent={accent} />
                                    ))}
                                </div>
                            </MaReveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── MANIFESTO ── pure typography statement */}
            <MaManifesto accent={accent} />

            {/* ── PORTFOLIO ── */}
            <section id="gallery" className="py-24 md:py-36" style={{ backgroundColor: '#040404' }}>
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                            <MaReveal>
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.42em]" style={{ color: accent }}>
                                    Portafolio
                                </p>
                            </MaReveal>
                            <MaReveal delay={100}>
                                <h2
                                    className="text-white uppercase"
                                    style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: '.95' }}
                                >
                                    Historias en imágenes
                                </h2>
                            </MaReveal>
                        </div>
                        {misaelCategories.length > 1 && (
                            <MaReveal delay={180}>
                                <div className="flex flex-wrap gap-2">
                                    {misaelCategories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95"
                                            style={activeCategory === cat
                                                ? { backgroundColor: accent, color: '#080808' }
                                                : { color: 'rgba(255,255,255,0.32)', border: '1px solid rgba(255,255,255,0.1)' }
                                            }
                                        >
                                            {cat === 'All' ? 'Todos' : cat}
                                        </button>
                                    ))}
                                </div>
                            </MaReveal>
                        )}
                    </div>

                    {/* Featured hero image */}
                    {visiblePortfolio.length > 0 && (
                        <MaReveal>
                            <div className="photo-item mb-2 w-full overflow-hidden" style={{ height: 'clamp(240px, 42vw, 560px)' }}>
                                <img
                                    src={visiblePortfolio[0].image_url}
                                    alt={visiblePortfolio[0].project_name || 'Fotografía destacada de Misael Atencio'}
                                    className="w-full h-full object-cover"
                                    fetchPriority="high"
                                    decoding="async"
                                />
                            </div>
                        </MaReveal>
                    )}

                    {visiblePortfolio.length > 1 && (
                        <div className="columns-2 gap-2 md:columns-3 lg:columns-4">
                            {visiblePortfolio.slice(1).map((photo, i) => (
                                <MaReveal key={photo.id} delay={Math.min(i * 40, 280)} className="photo-item mb-2 break-inside-avoid">
                                    <img
                                        src={photo.image_url}
                                        alt={photo.project_name || 'Foto'}
                                        className="w-full object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </MaReveal>
                            ))}
                        </div>
                    )}

                    {visiblePortfolio.length === 0 && (
                        <div className="py-28 text-center">
                            <p className="text-white/20 text-xs uppercase tracking-widest">No hay fotos en esta categoría.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── CONTACT ── */}
            <section id="contact" className="py-24 md:py-36" style={{ backgroundColor: '#080808' }}>
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="grid gap-16 md:grid-cols-2 md:gap-24">
                        <div className="space-y-10">
                            <div>
                                <MaReveal>
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.42em]" style={{ color: accent }}>
                                        Contacto directo
                                    </p>
                                </MaReveal>
                                <MaReveal delay={100}>
                                    <h2
                                        className="leading-none text-white uppercase"
                                        style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
                                    >
                                        Hagamos realidad tu visión.
                                    </h2>
                                </MaReveal>
                                <MaReveal delay={180}>
                                    <p className="mt-5 text-base leading-relaxed text-white/38">
                                        Ya sea una cobertura deportiva, un evento, una campaña comercial o una producción audiovisual, conversemos sobre tu próximo proyecto.
                                    </p>
                                </MaReveal>
                            </div>

                            <MaReveal delay={280}>
                                <div className="space-y-4">
                                    {[
                                        { icon: Mail,   text: 'info@misaeldavid.com', href: 'mailto:info@misaeldavid.com' },
                                        { icon: Phone,  text: '+(507) 6662-1144',      href: 'tel:+5076662114' },
                                        { icon: Camera, text: '@misaeldavidph',        href: 'https://instagram.com/misaeldavidph' },
                                        { icon: MapPin, text: 'Panamá',                href: null },
                                    ].map(({ icon: Icon, text, href }) => (
                                        <div key={text} className="flex items-center gap-4">
                                            <div
                                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                            >
                                                <Icon className="h-4 w-4" style={{ color: accent }} />
                                            </div>
                                            {href ? (
                                                <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                                                   className="text-sm text-white/48 hover:text-white transition-colors">
                                                    {text}
                                                </a>
                                            ) : (
                                                <span className="text-sm text-white/48">{text}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </MaReveal>
                        </div>

                        <MaReveal delay={120}>
                            <MisaelLeadForm leadForm={leadForm} accent={accent} flash={flash} />
                        </MaReveal>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t py-10" style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: '#020202' }}>
                <div className="mx-auto max-w-7xl px-6 md:px-10">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <img src={MA_LOGO} alt="Misael David Photography" className="h-12 w-auto opacity-35" />
                        <div className="flex flex-wrap items-center gap-6">
                            <a href="https://instagram.com/misaeldavidph" target="_blank" rel="noreferrer"
                               className="text-[10px] uppercase tracking-widest text-white/22 hover:text-white/55 transition-colors">
                                Instagram
                            </a>
                            <button onClick={() => scrollToTarget('#gallery')}
                               className="text-[10px] uppercase tracking-widest text-white/22 hover:text-white/55 transition-colors">
                                Portafolio
                            </button>
                            <button onClick={() => scrollToTarget('#about')}
                               className="text-[10px] uppercase tracking-widest text-white/22 hover:text-white/55 transition-colors">
                                Sobre mí
                            </button>
                            <button onClick={() => scrollToTarget('#contact')}
                               className="text-[10px] uppercase tracking-widest text-white/22 hover:text-white/55 transition-colors">
                                Contacto
                            </button>
                        </div>
                        <div className="flex items-center gap-5">
                            <span className="text-[10px] text-white/14">© {new Date().getFullYear()} {homepage.brand.name}</span>
                            <Link href="/login?s=studio" className="text-[10px] text-white/10 hover:text-white/25 transition-colors">Administración</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* Full-bleed typographic manifesto strip */
function MaManifesto({ accent }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const lines = el.querySelectorAll('.ma-manifesto-line');
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    lines.forEach((l) => l.classList.add('fired'));
                    obs.disconnect();
                }
            },
            { threshold: 0.25 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className="overflow-hidden py-28 md:py-44"
            style={{ backgroundColor: '#020202' }}
        >
            <div className="mx-auto max-w-7xl px-6 md:px-10">
                {MA_MANIFESTO.map((line, i) => (
                    <p
                        key={i}
                        className="ma-manifesto-line select-none leading-none text-white"
                        style={{
                            fontFamily: 'Anton, sans-serif',
                            fontSize: 'clamp(3.5rem, 13vw, 10rem)',
                            letterSpacing: '-0.03em',
                            color: i === 1 ? accent : '#fff',
                        }}
                    >
                        {line}
                    </p>
                ))}
            </div>
        </div>
    );
}

/* Scroll-reveal for below-fold elements */
function MaReveal({ children, delay = 0, className = '' }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        // RAF ensures browser paints initial opacity:0 before observation starts
        let raf = requestAnimationFrame(() => {
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } },
                { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
            );
            obs.observe(el);
        });
        return () => { cancelAnimationFrame(raf); };
    }, []);
    return (
        <div ref={ref} className={`ma-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

function MaAnimatedStat({ value, suffix = '', label, accent }) {
    const ref = React.useRef(null);
    const [displayValue, setDisplayValue] = React.useState(0);

    React.useEffect(() => {
        const element = ref.current;
        if (!element) return undefined;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            setDisplayValue(value);
            return undefined;
        }

        let animationFrame;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;

            const startedAt = performance.now();
            const duration = 1600;
            const animate = (now) => {
                const progress = Math.min((now - startedAt) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setDisplayValue(Math.round(value * eased));

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(animate);
                }
            };

            animationFrame = requestAnimationFrame(animate);
            observer.disconnect();
        }, { threshold: 0.45 });

        observer.observe(element);

        return () => {
            observer.disconnect();
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [value]);

    return (
        <div ref={ref}>
            <p
                className="leading-none tabular-nums"
                style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(2rem, 4vw, 3rem)', color: accent }}
                aria-label={`${value}${suffix} ${label}`}
            >
                {displayValue.toLocaleString('es-PA')}{suffix}
            </p>
            <p className="mt-2 text-[10px] leading-snug uppercase tracking-widest text-white/28">{label}</p>
        </div>
    );
}

const KB_VARIANTS = [
    'kbZoomIn 7s ease-in-out forwards',
    'kbZoomOut 7s ease-in-out forwards',
    'kbPanRight 7s ease-in-out forwards',
    'kbPanLeft 7s ease-in-out forwards',
    'kbZoomInUp 7s ease-in-out forwards',
];

/* Multi-image hero slideshow with Ken Burns per slide */
function MaHeroSlideshow({ images }) {
    const [current, setCurrent] = React.useState(0);
    const [prev, setPrev] = React.useState(null);
    const [tick, setTick] = React.useState(0);

    React.useEffect(() => {
        if (images.length <= 1) return;
        const id = setInterval(() => {
            setCurrent(c => {
                setPrev(c);
                return (c + 1) % images.length;
            });
            setTick(t => t + 1);
        }, 6500);
        return () => clearInterval(id);
    }, [images.length]);

    if (!images.length) return <div className="absolute inset-0 bg-zinc-900" />;

    return (
        <div className="absolute inset-0 overflow-hidden">
            {images.map((src, i) => {
                const state = i === current ? 'active' : i === prev ? 'prev' : 'hidden';
                return (
                    <img
                        key={src}
                        src={src}
                        alt=""
                        className={`ma-slide ma-slide-${state}`}
                        style={{
                            animation: state === 'active'
                                ? `${KB_VARIANTS[i % KB_VARIANTS.length]}`
                                : 'none',
                        }}
                        fetchPriority={i === 0 ? 'high' : 'low'}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                    />
                );
            })}
        </div>
    );
}

/* Hero background image with parallax */
function MaHeroImage({ src, className = '' }) {
    const [offset, setOffset] = React.useState(0);
    React.useEffect(() => {
        const onScroll = () => setOffset(window.scrollY * 0.22);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
        <img
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${className}`}
            style={{ transform: `translateY(${offset}px) scale(1.1)`, objectPosition: 'center 30%', willChange: 'transform' }}
            fetchPriority="high"
        />
    );
}

/* About image with subtle parallax */
function MaAboutImage({ src }) {
    const ref = React.useRef(null);
    const [offset, setOffset] = React.useState(0);
    React.useEffect(() => {
        const onScroll = () => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const center = rect.top + rect.height / 2 - window.innerHeight / 2;
            setOffset(center * 0.07);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return (
        <img
            ref={ref}
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: `translateY(${offset}px) scale(1.06)`, objectPosition: 'center top', willChange: 'transform' }}
            loading="lazy"
        />
    );
}

/* Dark contact form */
function MisaelLeadForm({ leadForm, accent, flash }) {
    const {
        data,
        setData,
        processing,
        errors,
        recentlySuccessful,
        submit,
        eventTypes,
        availableSlots,
        busyCalendarEvents,
        businessHours,
        availabilitySettings,
    } = leadForm;
    const inputBase = {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '10px',
        color: '#f0f0f0',
        padding: '13px 16px',
        fontSize: '14px',
        width: '100%',
        outline: 'none',
        transition: 'border-color .2s ease',
    };
    const focus = (e) => (e.target.style.borderColor = accent);
    const blur  = (e) => (e.target.style.borderColor = 'rgba(255,255,255,0.09)');

    if (recentlySuccessful || flash?.success) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 py-20 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black" style={{ backgroundColor: accent, color: '#080808' }}>✓</div>
                <p className="text-lg font-bold text-white">¡Mensaje enviado!</p>
                <p className="mt-2 text-sm text-white/35">Me pondré en contacto contigo pronto.</p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-3.5">
            <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                    <input type="text" placeholder="Tu nombre" value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        style={inputBase} onFocus={focus} onBlur={blur} />
                    {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                </div>
                <div>
                    <input type="email" placeholder="Tu correo" value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        style={inputBase} onFocus={focus} onBlur={blur} />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                </div>
            </div>
            <input type="tel" placeholder="WhatsApp / Teléfono" value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
                style={inputBase} onFocus={focus} onBlur={blur} />
            {eventTypes.length > 0 && (
                <select value={data.event_type} onChange={(e) => setData('event_type', e.target.value)}
                    className="[&>option]:bg-[#111] [&>option]:text-white"
                    style={{ ...inputBase, appearance: 'none', cursor: 'pointer' }} onFocus={focus} onBlur={blur}>
                    <option value="">Tipo de sesión</option>
                    {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
            )}
            {errors.event_type && <p className="mt-1 text-xs text-red-400">{errors.event_type}</p>}
            <div className="grid gap-3.5 sm:grid-cols-2">
                <AvailabilityCalendar
                    label="Fecha tentativa"
                    value={data.tentative_date}
                    onChange={(value) => setData('tentative_date', value)}
                    error={errors.tentative_date}
                    busyEvents={busyCalendarEvents}
                    businessHours={businessHours}
                    availabilitySettings={availabilitySettings}
                    helperText="Elige un día con disponibilidad."
                    tone="dark"
                />
                <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Hora disponible</label>
                    <select
                        value={data.tentative_time}
                        onChange={(event) => setData('tentative_time', event.target.value)}
                        disabled={!data.tentative_date || availableSlots.length === 0}
                        className="[&>option]:bg-[#111] [&>option]:text-white"
                        style={{ ...inputBase, appearance: 'none', cursor: data.tentative_date ? 'pointer' : 'not-allowed', opacity: data.tentative_date ? 1 : 0.5 }}
                        onFocus={focus}
                        onBlur={blur}
                    >
                        <option value="">
                            {data.tentative_date ? 'Selecciona una hora' : 'Selecciona primero una fecha'}
                        </option>
                        {availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
                    {errors.tentative_time && <p className="text-xs text-red-400">{errors.tentative_time}</p>}
                </div>
            </div>
            <textarea placeholder="Cuéntame tu proyecto..." value={data.message}
                onChange={(e) => setData('message', e.target.value)}
                rows={4} style={{ ...inputBase, resize: 'none' }} onFocus={focus} onBlur={blur} />
            {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
            <button
                type="submit" disabled={processing}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold uppercase tracking-wider transition-all hover:brightness-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: accent, color: '#080808' }}
            >
                {processing ? 'Enviando...' : 'Enviar solicitud'}
                {!processing && <ArrowRight className="h-4 w-4" />}
            </button>
        </form>
    );
}
