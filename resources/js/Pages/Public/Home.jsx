import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Camera,
    Grip,
    Mail,
    MapPin,
    Menu,
    MessageSquare,
    Phone,
} from 'lucide-react';

const sectionLabels = {
    hero: 'Home',
    about: 'About',
    gallery: 'Gallery',
    featured: 'Featured',
    contact: 'Contact',
};

const scrollToTarget = (target) => {
    if (!target?.startsWith('#')) {
        return;
    }

    const element = document.querySelector(target);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

export default function Home({ homepage, portfolioPhotos = [], portfolioCategories = [] }) {
    const { flash } = usePage().props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [activeCategory, setActiveCategory] = React.useState('All');
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: '',
        email: '',
        phone: '',
        event_type: 'Wedding',
        tentative_date: '',
        message: '',
    });

    const navItems = homepage.sections_order.filter((section) => section !== 'hero');
    const allCategories = ['All', ...portfolioCategories];
    const filteredPortfolio = activeCategory === 'All'
        ? portfolioPhotos
        : portfolioPhotos.filter((photo) => photo.category === activeCategory);

    const submit = (event) => {
        event.preventDefault();
        post('/leads', {
            preserveScroll: true,
            onSuccess: () => {
                setData({
                    name: '',
                    email: '',
                    phone: '',
                    event_type: 'Wedding',
                    tentative_date: '',
                    message: '',
                });
            },
        });
    };

    const renderSection = (section) => {
        switch (section) {
            case 'hero':
                return (
                    <section
                        key={section}
                        id="hero"
                        className="relative isolate min-h-[92vh] overflow-hidden"
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `linear-gradient(180deg, rgba(26,19,13,.28) 0%, rgba(26,19,13,.62) 100%), url(${homepage.hero.image_url})` }}
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
                                <p
                                    className="text-lg tracking-[0.35em] uppercase text-white/90 md:text-xl"
                                    style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                >
                                    {homepage.brand.name}
                                </p>
                            </div>

                            <nav className="hidden items-center gap-8 text-[11px] uppercase tracking-[0.28em] text-white/75 md:flex">
                                {navItems.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => scrollToTarget(`#${item}`)}
                                        className="transition hover:text-white"
                                    >
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
                                    <p className="mb-6 text-[11px] uppercase tracking-[0.35em] text-white/70">
                                        {homepage.hero.eyebrow}
                                    </p>
                                    <h1
                                        className="max-w-4xl text-5xl leading-[0.95] text-white md:text-7xl"
                                        style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                    >
                                        {homepage.hero.title}
                                    </h1>
                                    <p className="mt-8 max-w-2xl text-base leading-7 text-white/78 md:text-lg">
                                        {homepage.hero.description}
                                    </p>
                                    <div className="mt-10 flex flex-wrap gap-4">
                                        <button
                                            type="button"
                                            onClick={() => scrollToTarget(homepage.hero.primary_cta_target)}
                                            className="inline-flex items-center gap-2 rounded-full bg-[#f4eadf] px-7 py-3 text-sm font-semibold text-[#241b16] transition hover:bg-white"
                                        >
                                            {homepage.hero.primary_cta_label}
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => scrollToTarget(homepage.hero.secondary_cta_target)}
                                            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3 text-sm font-medium text-white/88 backdrop-blur transition hover:border-white/45 hover:bg-white/8"
                                        >
                                            {homepage.hero.secondary_cta_label}
                                        </button>
                                    </div>
                                </div>

                                <div className="self-end rounded-[2rem] border border-white/14 bg-white/8 p-6 text-white/82 backdrop-blur">
                                    <div className="flex items-center justify-between border-b border-white/14 pb-5">
                                        <p className="text-xs uppercase tracking-[0.32em]">Studio note</p>
                                        <Camera className="h-4 w-4" />
                                    </div>
                                    <p
                                        className="mt-6 text-3xl leading-tight text-white"
                                        style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                    >
                                        {homepage.hero.floating_caption}
                                    </p>
                                    <div className="mt-10 grid grid-cols-2 gap-4 text-sm">
                                        <div className="rounded-2xl bg-black/18 p-4">
                                            <p className="text-white/45">Style</p>
                                            <p className="mt-2 text-white">Editorial and honest</p>
                                        </div>
                                        <div className="rounded-2xl bg-black/18 p-4">
                                            <p className="text-white/45">Availability</p>
                                            <p className="mt-2 text-white">Local and destination</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                );

            case 'about':
                return (
                    <section key={section} id="about" className="bg-[#f5efe7] px-6 py-24 text-[#241b16] md:px-10">
                        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_.95fr]">
                            <div>
                                <p className="mb-5 text-[11px] uppercase tracking-[0.34em] text-[#8b6d54]">{homepage.about.eyebrow}</p>
                                <h2
                                    className="max-w-xl text-4xl leading-tight md:text-6xl"
                                    style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                >
                                    {homepage.about.heading}
                                </h2>
                            </div>
                            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
                                <div className="space-y-6 text-base leading-8 text-[#5c4939]">
                                    <p>{homepage.about.body}</p>
                                    <p>{homepage.about.detail}</p>
                                    <div className="grid gap-4 pt-4 md:grid-cols-3">
                                        {homepage.about.stats.map((item) => (
                                            <div key={`${item.value}-${item.label}`} className="rounded-[1.7rem] bg-white/70 p-5 shadow-[0_20px_40px_rgba(60,40,24,.06)]">
                                                <p
                                                    className="text-3xl text-[#241b16]"
                                                    style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                                >
                                                    {item.value}
                                                </p>
                                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8b6d54]">{item.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-[2.4rem] bg-[#d9cab9] shadow-[0_30px_60px_rgba(60,40,24,.12)]">
                                    <img src={homepage.about.image_url} alt="Photographer portrait" className="h-full min-h-[420px] w-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </section>
                );

            case 'gallery':
                return (
                    <section key={section} id="gallery" className="bg-[#f9f6f1] px-6 py-24 md:px-10">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-3xl">
                                    <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#8b6d54]">{homepage.gallery.eyebrow}</p>
                                    <h2
                                        className="text-4xl leading-tight text-[#241b16] md:text-6xl"
                                        style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                    >
                                        {homepage.gallery.heading}
                                    </h2>
                                </div>
                                <p className="max-w-xl text-base leading-7 text-[#6b594c]">{homepage.gallery.description}</p>
                            </div>

                            {!!allCategories.length && (
                                <div className="mb-8 flex flex-wrap gap-3">
                                    {allCategories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setActiveCategory(category)}
                                            className={`rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                                                activeCategory === category
                                                    ? 'bg-[#241b16] text-white'
                                                    : 'border border-[#ddcdbf] text-[#6b594c] hover:border-[#241b16] hover:text-[#241b16]'
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {filteredPortfolio.length > 0 ? (
                                <div style={{ columnWidth: '320px', columnGap: '1.5rem' }}>
                                    {filteredPortfolio.map((item) => (
                                        <article
                                            key={item.id}
                                            className="mb-6 break-inside-avoid overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_60px_rgba(60,40,24,.08)]"
                                        >
                                            <img src={item.image_url} alt={item.project_name} className="w-full object-cover" />
                                            <div className="space-y-3 p-6">
                                                <p className="text-[11px] uppercase tracking-[0.24em] text-[#8b6d54]">{item.category}</p>
                                                <h3 className="text-2xl text-[#241b16]" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
                                                    {item.project_name}
                                                </h3>
                                                <p className="text-sm leading-7 text-[#6b594c]">{item.description}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-[2rem] border border-dashed border-[#d8cabd] bg-white/70 px-8 py-16 text-center text-[#8b6d54]">
                                    No portfolio images have been selected yet. Mark photos from the admin panel to publish them on the website.
                                </div>
                            )}
                        </div>
                    </section>
                );

            case 'featured':
                return (
                    <section key={section} id="featured" className="bg-[#221914] px-6 py-24 text-white md:px-10">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-12 max-w-3xl">
                                <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#cbb39a]">{homepage.featured.eyebrow}</p>
                                <h2
                                    className="text-4xl leading-tight md:text-6xl"
                                    style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                >
                                    {homepage.featured.heading}
                                </h2>
                                <p className="mt-6 text-base leading-7 text-white/70">{homepage.featured.description}</p>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-3">
                                {homepage.featured.items.map((item, index) => (
                                    <button
                                        key={`${item.title}-${index}`}
                                        type="button"
                                        onClick={() => {
                                            setActiveCategory(item.title);
                                            scrollToTarget('#gallery');
                                        }}
                                        className="overflow-hidden rounded-[2.2rem] border border-white/8 bg-white/5 text-left transition hover:-translate-y-1"
                                    >
                                        <img src={item.image_url} alt={item.title} className="h-80 w-full object-cover" />
                                        <div className="space-y-4 p-7">
                                            <p className="text-[11px] uppercase tracking-[0.32em] text-[#cbb39a]">Featured</p>
                                            <h3
                                                className="text-3xl leading-tight"
                                                style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                            >
                                                {item.title}
                                            </h3>
                                            <p className="text-sm leading-7 text-white/68">{item.category}</p>
                                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                                                View collection
                                                <ArrowRight className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                );

            case 'contact':
                return (
                    <section key={section} id="contact" className="bg-[#f5efe7] px-6 py-24 text-[#241b16] md:px-10">
                        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.9fr_1.1fr]">
                            <div className="rounded-[2.6rem] bg-[#241b16] p-8 text-white md:p-10">
                                <p className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#cbb39a]">{homepage.contact.eyebrow}</p>
                                <h2
                                    className="max-w-md text-4xl leading-tight md:text-5xl"
                                    style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                >
                                    {homepage.contact.heading}
                                </h2>
                                <p className="mt-6 max-w-md text-base leading-7 text-white/72">{homepage.contact.description}</p>

                                <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                                    <p className="text-xs uppercase tracking-[0.3em] text-white/45">{homepage.contact.info_label}</p>
                                    <div className="mt-5 space-y-4">
                                        {homepage.contact.info_lines.map((line, index) => (
                                            <div key={`${line}-${index}`} className="flex items-start gap-3 text-sm text-white/82">
                                                <MapPin className="mt-0.5 h-4 w-4 text-[#d8b48b]" />
                                                <span>{line}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[2.6rem] bg-white p-8 shadow-[0_24px_60px_rgba(60,40,24,.1)] md:p-10">
                                <div className="mb-8 flex items-center justify-between gap-6">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.32em] text-[#8b6d54]">Lead form</p>
                                        <h3
                                            className="mt-3 text-3xl text-[#241b16]"
                                            style={{ fontFamily: 'Fraunces, Georgia, serif' }}
                                        >
                                            {homepage.contact.form_heading}
                                        </h3>
                                    </div>
                                    <Link href="/login" className="text-xs uppercase tracking-[0.26em] text-[#8b6d54] transition hover:text-[#241b16]">
                                        Admin access
                                    </Link>
                                </div>

                                {(flash?.success || recentlySuccessful) && (
                                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                        {flash?.success || 'Your inquiry was sent successfully.'}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-5">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field
                                            label="Name"
                                            icon={Camera}
                                            value={data.name}
                                            error={errors.name}
                                            onChange={(value) => setData('name', value)}
                                            placeholder="Your full name"
                                        />
                                        <Field
                                            label="Email"
                                            icon={Mail}
                                            type="email"
                                            value={data.email}
                                            error={errors.email}
                                            onChange={(value) => setData('email', value)}
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div className="grid gap-5 md:grid-cols-2">
                                        <Field
                                            label="Phone"
                                            icon={Phone}
                                            value={data.phone}
                                            error={errors.phone}
                                            onChange={(value) => setData('phone', value)}
                                            placeholder="+506 0000 0000"
                                        />
                                        <SelectField
                                            label="Project type"
                                            value={data.event_type}
                                            error={errors.event_type}
                                            onChange={(value) => setData('event_type', value)}
                                            options={['Wedding', 'Portrait', 'Commercial', 'Event', 'Other']}
                                        />
                                    </div>

                                    <Field
                                        label="Tentative date"
                                        icon={Calendar}
                                        type="date"
                                        value={data.tentative_date}
                                        error={errors.tentative_date}
                                        onChange={(value) => setData('tentative_date', value)}
                                    />

                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-[0.24em] text-[#8b6d54]">Message</label>
                                        <div className="rounded-[1.5rem] border border-[#e6dbcf] bg-[#faf6f1] px-4 py-4">
                                            <div className="mb-3 flex items-center gap-2 text-[#8b6d54]">
                                                <MessageSquare className="h-4 w-4" />
                                                <span className="text-xs uppercase tracking-[0.2em]">Project details</span>
                                            </div>
                                            <textarea
                                                value={data.message}
                                                onChange={(event) => setData('message', event.target.value)}
                                                rows={5}
                                                placeholder="Tell me about the story, mood, or date you have in mind."
                                                className="w-full resize-none bg-transparent text-sm text-[#241b16] outline-none placeholder:text-[#b09a88]"
                                            />
                                        </div>
                                        {errors.message && <p className="text-sm text-rose-600">{errors.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#241b16] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#3a2b22] disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {processing ? 'Sending...' : homepage.contact.submit_label}
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </section>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-[#f9f6f1] text-[#241b16]">
            <Head title={homepage.brand.name} />
            {homepage.sections_order.map(renderSection)}

            <footer className="border-t border-[#e8ddd2] bg-[#f9f6f1] px-6 py-8 md:px-10">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#7a6658] md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="uppercase tracking-[0.28em]">{homepage.brand.name}</p>
                        <p className="mt-2 text-[#9b8877]">{homepage.brand.tagline}</p>
                    </div>
                    <Link href="/login" className="inline-flex items-center gap-2 uppercase tracking-[0.22em] text-[#8b6d54] transition hover:text-[#241b16]">
                        <Grip className="h-4 w-4" />
                        Access admin
                    </Link>
                </div>
            </footer>
        </div>
    );
}

function Field({ label, icon: Icon, error, onChange, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.24em] text-[#8b6d54]">{label}</label>
            <div className="flex items-center gap-3 rounded-[1.5rem] border border-[#e6dbcf] bg-[#faf6f1] px-4 py-4">
                {Icon && <Icon className="h-4 w-4 text-[#8b6d54]" />}
                <input
                    {...props}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full bg-transparent text-sm text-[#241b16] outline-none placeholder:text-[#b09a88]"
                />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>
    );
}

function SelectField({ label, error, onChange, options, ...props }) {
    return (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.24em] text-[#8b6d54]">{label}</label>
            <div className="rounded-[1.5rem] border border-[#e6dbcf] bg-[#faf6f1] px-4 py-4">
                <select
                    {...props}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full bg-transparent text-sm text-[#241b16] outline-none"
                >
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
