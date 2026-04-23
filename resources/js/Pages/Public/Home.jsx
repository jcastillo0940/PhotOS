import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AvailabilityCalendar from '@/Components/AvailabilityCalendar';
import { buildSlots } from '@/lib/availability';
import { ArrowRight, Camera, Grip, Mail, MapPin, Menu, MessageSquare, Phone, Star, Trophy, Zap } from 'lucide-react';

const sectionLabels = {
    hero: 'Home',
    about: 'About',
    gallery: 'Gallery',
    featured: 'Featured',
    contact: 'Contact',
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
}) {
    const { flash, branding } = usePage().props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [activeCategory, setActiveCategory] = React.useState('All');
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
        allCategories,
        filteredPortfolio,
        activeCategory,
        setActiveCategory,
        branding,
        leadForm,
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

    return (
        <div style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: fonts.body }}>
            <Head title={homepage.brand.name} />

            <section id="hero" className="relative isolate min-h-[92vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(180deg, ${palette.hero_overlay} 0%, ${palette.hero_overlay} 100%), url(${homepage.hero.image_url})` }}
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
                        <div className="max-w-4xl">
                            <p className="mb-6 text-[11px] uppercase tracking-[0.35em] text-white/70">{homepage.hero.eyebrow}</p>
                            <h1 className="max-w-4xl text-5xl leading-[0.95] text-white md:text-7xl" style={{ fontFamily: fonts.heading }}>
                                {homepage.hero.title}
                            </h1>
                            <p className="mt-8 max-w-2xl text-base leading-7 text-white/78 md:text-lg">{homepage.hero.description}</p>
                            <div className="mt-10 flex flex-wrap gap-4">
                                <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background={palette.accent_soft} color={palette.text} />
                                <OutlineHeroButton label={homepage.hero.secondary_cta_label} onClick={() => scrollToTarget(homepage.hero.secondary_cta_target)} />
                                <LinkButton href="/portfolio" label="Portafolio" background={palette.accent} />
                                <OutlineLinkButton href="/booking" label="Reservar sesion" />
                            </div>
                        </div>

                        <div className="self-end rounded-[2rem] border border-white/14 bg-white/8 p-6 text-white/82 backdrop-blur">
                            <div className="flex items-center justify-between border-b border-white/14 pb-5">
                                <p className="text-xs uppercase tracking-[0.32em]">Studio note</p>
                                <Camera className="h-4 w-4" />
                            </div>
                            <p className="mt-6 text-3xl leading-tight text-white" style={{ fontFamily: fonts.heading }}>
                                {homepage.hero.floating_caption}
                            </p>
                            <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
                                <StatCard label="Style" value="Editorial and honest" />
                                <StatCard label="Availability" value="Local and destination" />
                            </div>
                        </div>
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
                            <img src={homepage.about.image_url} alt="Photographer portrait" className="h-full min-h-[420px] w-full object-cover" />
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
                                <article key={item.id} className="mb-6 break-inside-avoid overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(60,40,24,.08)]" style={{ backgroundColor: '#fff' }}>
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
                            No portfolio images have been selected yet. Mark photos from the admin panel to publish them on the website.
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
                                    <p className="text-[11px] uppercase tracking-[0.32em]" style={{ color: palette.accent }}>Featured</p>
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
                                <SelectField label="Project type" value={data.event_type} error={errors.event_type} onChange={(value) => setData('event_type', value)} options={eventTypes} palette={palette} />
                            </div>
                            <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
                                <AvailabilityCalendar
                                    label="Tentative date"
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
                                    label="Available time"
                                    value={data.tentative_time}
                                    error={errors.tentative_time}
                                    onChange={(value) => setData('tentative_time', value)}
                                    options={availableSlots}
                                    placeholder={data.tentative_date ? 'Select an available time' : 'Select a date first'}
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
                                        placeholder="Tell me about the story, mood, or date you have in mind."
                                        className="w-full resize-none bg-transparent text-sm outline-none"
                                        style={{ color: palette.text }}
                                    />
                                </div>
                                {errors.message && <p className="text-sm text-rose-600">{errors.message}</p>}
                            </div>
                            <button type="submit" disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70" style={{ backgroundColor: palette.text }}>
                                {processing ? 'Sending...' : homepage.contact.submit_label}
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
                        Login
                    </Link>
                </div>
            </footer>
        </div>
    );
}

function TettaExplorerHome({ homepage, palette, fonts, navItems, filteredPortfolio, leadForm, branding }) {
    const heroWords = (homepage.hero.title || homepage.brand.name || '').split(' ');
    const firstWord = heroWords.shift() || homepage.brand.name;
    const restTitle = heroWords.join(' ') || homepage.brand.tagline || 'The Explorer';
    const featuredPhoto = filteredPortfolio[0]?.image_url || homepage.hero.image_url;

    return (
        <div className="min-h-screen bg-[#0b0b0b] text-white" style={{ fontFamily: fonts.body }}>
            <Head title={homepage.brand.name} />

            <section id="hero" className="relative isolate min-h-screen overflow-hidden">
                <div className="grid min-h-screen lg:grid-cols-[38vw_1fr]">
                    <aside className="relative z-10 flex min-h-[52vh] flex-col justify-between bg-[#090909] px-7 py-8 md:px-12 lg:min-h-screen">
                        <div className="flex items-center justify-between">
                            <BrandMark homepage={homepage} branding={branding} fonts={fonts} className="text-white" textClassName="text-3xl font-black tracking-tight" />
                            <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-white/55">Login</Link>
                        </div>
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                            <div className="mb-8 h-px w-16 bg-white" />
                            <p className="max-w-sm text-sm leading-7 text-white/72">{homepage.hero.description}</p>
                        </div>
                        <div className="flex gap-5 text-xs uppercase tracking-[0.24em] text-white/40">
                            <span>Instagram</span>
                            <span>Behance</span>
                            <span>Studio</span>
                        </div>
                    </aside>

                    <main className="relative min-h-[62vh] overflow-hidden lg:min-h-screen">
                        <img src={homepage.hero.image_url} alt={homepage.hero.title} className="absolute inset-0 h-full w-full object-cover opacity-82" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/42 via-black/5 to-black/35" />
                        <header className="relative z-20 flex items-center justify-end gap-8 px-7 py-8 text-sm font-semibold text-white/72 md:px-12">
                            {navItems.map((item) => (
                                <button key={item} type="button" onClick={() => scrollToTarget(`#${item}`)} className="hidden transition hover:text-white md:inline-flex">
                                    {sectionLabels[item]}
                                </button>
                            ))}
                            <Link href="/portfolio" className="rounded-full bg-white px-5 py-2 text-black">Portfolio</Link>
                        </header>
                        <div className="relative z-10 flex min-h-[calc(100vh-96px)] items-center px-7 pb-16 md:px-12">
                            <div className="-ml-[2px] max-w-6xl">
                                <p className="mb-7 text-[11px] uppercase tracking-[0.38em] text-white/62">{homepage.hero.eyebrow}</p>
                                <h1 className="text-[clamp(4rem,9vw,10.5rem)] font-black leading-[0.86] tracking-[-0.08em]" style={{ fontFamily: fonts.heading }}>
                                    {firstWord} <span className="text-transparent [-webkit-text-stroke:1.4px_rgba(255,255,255,.86)]">{restTitle}</span>
                                </h1>
                                <div className="mt-10 flex flex-wrap gap-4">
                                    <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background="#fff" color="#050505" />
                                    <OutlineHeroButton label={homepage.hero.secondary_cta_label} onClick={() => scrollToTarget(homepage.hero.secondary_cta_target)} />
                                </div>
                            </div>
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
                <img src={homepage.about.image_url || featuredPhoto} alt="About" className="h-full min-h-[520px] w-full object-cover" />
            </section>

            <TettaGallery homepage={homepage} filteredPortfolio={filteredPortfolio} fonts={fonts} />
            <CompactLeadSection homepage={homepage} palette={palette} fonts={fonts} leadForm={leadForm} dark />
            <MinimalFooter palette={palette} />
        </div>
    );
}

function HardyPortraitHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding }) {
    const portrait = homepage.about.image_url || homepage.hero.image_url;

    return (
        <div style={{ backgroundColor: '#f6efe4', color: '#221a14', fontFamily: fonts.body }}>
            <Head title={homepage.brand.name} />

            <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 md:px-10">
                <BrandMark homepage={homepage} branding={branding} fonts={fonts} textClassName="text-2xl font-semibold" />
                <nav className="hidden items-center gap-8 text-sm font-semibold text-[#7a6655] md:flex">
                    {['about', 'featured', 'gallery', 'contact'].map((item) => (
                        <button key={item} type="button" onClick={() => scrollToTarget(`#${item}`)}>{sectionLabels[item]}</button>
                    ))}
                </nav>
                <Link href="/booking" className="rounded-full bg-[#221a14] px-5 py-2.5 text-sm font-semibold text-white">Book now</Link>
            </header>

            <section id="hero" className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-8 md:px-10 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-[#b68156]">{homepage.hero.eyebrow || "Hello I'm Hardy"}</p>
                    <h1 className="text-5xl leading-[1.02] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.hero.title}</h1>
                    <p className="mt-7 max-w-xl text-base leading-8 text-[#716052]">{homepage.hero.description}</p>
                    <div className="mt-9 flex flex-wrap gap-4">
                        <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background="#221a14" color="#fff" />
                        <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-full border border-[#d9c7b3] px-7 py-3 text-sm font-semibold text-[#221a14]">View portfolio</Link>
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute -left-5 top-10 hidden h-72 w-32 rounded-full bg-[#d7a676]/35 blur-3xl lg:block" />
                    <img src={homepage.hero.image_url} alt={homepage.hero.title} className="relative h-[680px] w-full rounded-t-full object-cover shadow-[0_40px_90px_rgba(78,52,32,.18)]" />
                    <div className="absolute bottom-8 left-8 rounded-[1.6rem] bg-white/88 p-5 shadow-xl backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#b68156]">Professional photographer</p>
                        <p className="mt-2 text-3xl" style={{ fontFamily: fonts.heading }}>{homepage.brand.name}</p>
                    </div>
                </div>
            </section>

            <section id="about" className="bg-white px-6 py-24 md:px-10">
                <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
                    <img src={portrait} alt="Portrait" className="h-[560px] w-full rounded-[2.5rem] object-cover" />
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

function WeddingEventHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding }) {
    const storyImages = filteredPortfolio.length
        ? filteredPortfolio.slice(0, 5)
        : homepage.gallery.images.slice(0, 5).map((image_url, id) => ({ id, image_url, project_name: `Story ${id + 1}`, category: 'Wedding' }));

    return (
        <div style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: fonts.body }}>
            <Head title={homepage.brand.name} />

            <section id="hero" className="relative min-h-screen overflow-hidden">
                <img src={homepage.hero.image_url} alt={homepage.hero.title} className="absolute inset-0 h-full w-full object-cover" />
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
                    <div className="max-w-3xl rounded-[3rem] border border-white/14 bg-white/10 p-8 text-white shadow-[0_40px_100px_rgba(50,28,31,.25)] backdrop-blur md:p-12">
                        <p className="mb-5 text-[11px] uppercase tracking-[0.36em] text-white/62">{homepage.hero.eyebrow || 'Wedding stories'}</p>
                        <h1 className="text-5xl leading-[1.02] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.hero.title}</h1>
                        <p className="mt-7 max-w-2xl text-base leading-8 text-white/76">{homepage.hero.description}</p>
                        <div className="mt-9 flex flex-wrap gap-4">
                            <ActionButton label={homepage.hero.primary_cta_label} onClick={() => scrollToTarget(homepage.hero.primary_cta_target)} background={palette.accent_soft} color={palette.text} />
                            <OutlineHeroButton label={homepage.hero.secondary_cta_label} onClick={() => scrollToTarget(homepage.hero.secondary_cta_target)} />
                        </div>
                    </div>
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
                    <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.featured.eyebrow || 'Event collections'}</p>
                    <h2 className="max-w-4xl text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                    <div className="mt-12 grid gap-6 lg:grid-cols-3">
                        {homepage.featured.items.map((item, index) => (
                            <article key={`${item.title}-${index}`} className="overflow-hidden rounded-[2.2rem] bg-white shadow-[0_26px_70px_rgba(50,28,31,.1)]">
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
                            <article key={item.id} className={`group overflow-hidden rounded-[2rem] ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
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

function WildNatureHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding }) {
    const natureItems = filteredPortfolio.length
        ? filteredPortfolio.slice(0, 6)
        : homepage.gallery.images.map((image_url, id) => ({ id, image_url, project_name: `Expedition ${id + 1}`, category: 'Nature' }));

    return (
        <div style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: fonts.body }}>
            <Head title={homepage.brand.name} />

            <section id="hero" className="relative min-h-screen overflow-hidden">
                <img src={homepage.hero.image_url} alt={homepage.hero.title} className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${palette.hero_overlay}, rgba(23,36,25,.8))` }} />
                <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 text-white md:px-10">
                    <BrandMark homepage={homepage} branding={branding} fonts={fonts} className="text-white" textClassName="text-2xl font-black uppercase tracking-[0.08em]" />
                    <Link href="/portfolio" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/78">Explore</Link>
                </header>
                <div className="relative z-10 mx-auto flex min-h-[calc(100vh-92px)] max-w-7xl items-end px-6 pb-16 md:px-10">
                    <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
                        <div>
                            <p className="mb-5 text-[11px] uppercase tracking-[0.38em] text-white/62">{homepage.hero.eyebrow || 'Wild visual stories'}</p>
                            <h1 className="max-w-5xl text-6xl font-black leading-[.9] tracking-[-0.06em] text-white md:text-8xl" style={{ fontFamily: fonts.heading }}>{homepage.hero.title}</h1>
                            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/72">{homepage.hero.description}</p>
                        </div>
                        <div className="rounded-[2rem] border border-white/12 bg-white/10 p-6 text-white backdrop-blur">
                            <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">{homepage.hero.floating_caption}</p>
                            <div className="mt-6 grid gap-3">
                                {homepage.about.stats.map((item) => <DarkMetric key={`${item.value}-${item.label}`} value={item.value} label={item.label} />)}
                            </div>
                        </div>
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
                    <img src={homepage.about.image_url} alt="Nature story" className="h-[560px] w-full rounded-[2.5rem] object-cover" />
                </div>
            </section>

            <section id="featured" className="px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <p className="mb-4 text-[11px] uppercase tracking-[0.34em]" style={{ color: palette.accent }}>{homepage.featured.eyebrow || 'Field notes'}</p>
                    <h2 className="max-w-4xl text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        {homepage.featured.items.map((item) => (
                            <article key={item.title} className="rounded-[2rem] border p-6" style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt }}>
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
                            <article key={item.id} className="min-w-[300px] overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(30,42,29,.1)] md:min-w-[420px]">
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

function SportsDynamicHome({ homepage, palette, fonts, filteredPortfolio, leadForm, branding }) {
    return (
        <div className="overflow-hidden bg-[#051015] text-white" style={{ fontFamily: fonts.body }}>
            <Head title={homepage.brand.name} />

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
                            <OutlineHeroButton label="Ver highlights" onClick={() => scrollToTarget('#gallery')} />
                        </div>
                    </div>
                    <div className="relative">
                        <img src={homepage.hero.image_url} alt={homepage.hero.title} className="h-[640px] w-full skew-y-[-3deg] rounded-[2rem] object-cover shadow-[0_40px_100px_rgba(0,0,0,.42)]" />
                        <div className="absolute -bottom-6 left-5 grid w-[calc(100%-40px)] grid-cols-3 gap-3">
                            {homepage.about.stats.map((item) => <ScoreMetric key={`${item.value}-${item.label}`} value={item.value} label={item.label} />)}
                        </div>
                    </div>
                </div>
            </section>

            <section id="featured" className="px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <SectionKicker icon={Trophy} label={homepage.featured.eyebrow || 'Services'} />
                    <h2 className="max-w-4xl text-5xl font-black uppercase leading-[.9] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        {homepage.featured.items.map((item, index) => <SportCard key={`${item.title}-${index}`} item={item} index={index} />)}
                    </div>
                </div>
            </section>

            <section id="gallery" className="bg-[#0a1a20] px-6 py-24 md:px-10">
                <div className="mx-auto max-w-7xl">
                    <SectionKicker icon={Zap} label={homepage.gallery.eyebrow || 'Highlights'} />
                    <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <h2 className="max-w-3xl text-5xl font-black uppercase leading-[.9] md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                        <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-full bg-[#b7ff3c] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-[#051015]">Portfolio <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {(filteredPortfolio.length ? filteredPortfolio : homepage.gallery.images.map((image_url, id) => ({ id, image_url, project_name: `Highlight ${id + 1}`, category: 'Sports' }))).slice(0, 6).map((item) => (
                            <article key={item.id} className="group overflow-hidden rounded-[1.8rem] bg-white/5">
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
                <SelectField label="Project type" value={data.event_type} error={errors.event_type} onChange={(value) => setData('event_type', value)} options={eventTypes} palette={palette} />
            </div>
            <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]">
                <AvailabilityCalendar
                    label="Tentative date"
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
                    label="Available time"
                    value={data.tentative_time}
                    error={errors.tentative_time}
                    onChange={(value) => setData('tentative_time', value)}
                    options={availableSlots}
                    placeholder={data.tentative_date ? 'Select an available time' : 'Select a date first'}
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
                    placeholder="Tell me about the project."
                    className="w-full resize-none rounded-[1.5rem] border bg-transparent px-4 py-4 text-sm outline-none"
                    style={{ borderColor: palette.accent_soft, color: palette.text }}
                />
                {errors.message && <p className="text-sm text-rose-600">{errors.message}</p>}
            </div>
            <button type="submit" disabled={processing} className="inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-semibold transition disabled:opacity-70" style={{ backgroundColor: palette.accent, color: palette.surface_dark }}>
                {processing ? 'Sending...' : homepage.contact.submit_label}
                <ArrowRight className="h-4 w-4" />
            </button>
        </form>
    );
}

function TettaGallery({ homepage, filteredPortfolio, fonts }) {
    const items = filteredPortfolio.length
        ? filteredPortfolio.slice(0, 6)
        : homepage.gallery.images.map((image_url, id) => ({ id, image_url, project_name: `Frame ${id + 1}`, category: 'Editorial' }));

    return (
        <section id="gallery" className="bg-[#090909] px-7 py-24 md:px-12">
            <div className="mx-auto max-w-7xl">
                <p className="mb-5 text-[11px] uppercase tracking-[0.34em] text-white/40">{homepage.gallery.eyebrow}</p>
                <h2 className="max-w-4xl text-5xl leading-[.92] text-white md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                <div className="mt-12 grid gap-5 md:grid-cols-3">
                    {items.map((item, index) => (
                        <article key={item.id} className={`group overflow-hidden rounded-[2rem] bg-white/5 ${index === 1 ? 'md:mt-16' : ''}`}>
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
                <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#b68156]">{homepage.featured.eyebrow || 'Our Services'}</p>
                <h2 className="text-4xl leading-tight md:text-6xl" style={{ fontFamily: fonts.heading }}>{homepage.featured.heading}</h2>
                <div className="mt-12 grid gap-6 lg:grid-cols-3">
                    {homepage.featured.items.map((item, index) => (
                        <article key={`${item.title}-${index}`} className="overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(78,52,32,.1)]">
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
        : homepage.gallery.images.slice(0, 4).map((image_url, id) => ({ id, image_url, project_name: `Project ${id + 1}`, category: 'Portrait' }));

    return (
        <section id="gallery" className="bg-[#211915] px-6 py-24 text-white md:px-10">
            <div className="mx-auto max-w-7xl">
                <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#d7a676]">{homepage.gallery.eyebrow || 'Our Project'}</p>
                <h2 className="text-5xl leading-tight md:text-7xl" style={{ fontFamily: fonts.heading }}>{homepage.gallery.heading}</h2>
                <div className="mt-12 grid gap-5 md:grid-cols-2">
                    {photos.map((item) => (
                        <article key={item.id} className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 md:grid-cols-[.9fr_1fr]">
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
        <article className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
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
                    Login
                </Link>
            </div>
        </footer>
    );
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
