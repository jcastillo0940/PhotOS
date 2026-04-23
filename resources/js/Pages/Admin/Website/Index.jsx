import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    CheckCircle,
    GripVertical,
    Image as ImageIcon,
    LayoutTemplate,
    MapPin,
    Save,
    Search,
    Share2,
    Sparkles,
    Type,
    Upload,
} from 'lucide-react';

const labels = {
    hero: 'Hero',
    about: 'About',
    gallery: 'Gallery',
    featured: 'Featured',
    contact: 'Contact',
};

export default function Index({
    homepage,
    homepagePreview,
    theme,
    seo,
    submitUrl = '/admin/website',
    tenantLabel = null,
    pageTitle = 'Sitio web',
    heading = 'Landing del fotografo',
    description = 'Edita el contenido del home, cambia imagenes y reordena secciones con drag and drop. El sitio se mantiene dentro de una estructura predefinida para que el cliente personalice sin romper el diseno.',
    backHref = null,
    backLabel = 'Volver',
}) {
    const { flash } = usePage().props;
    const [content, setContent] = React.useState(homepage);
    const [dragging, setDragging] = React.useState(null);
    const [activeEditor, setActiveEditor] = React.useState('design');
    const { data, setData, post, processing, transform } = useForm({
        content: JSON.stringify(homepage),
        theme: JSON.stringify(theme || {}),
        seo: JSON.stringify(seo || {}),
        hero_image: null,
        about_image: null,
        gallery_image_0: null,
        gallery_image_1: null,
        gallery_image_2: null,
        gallery_image_3: null,
        gallery_image_4: null,
        gallery_image_5: null,
        featured_image_0: null,
        featured_image_1: null,
        featured_image_2: null,
    });

    const updateAtPath = (path, value) => {
        setContent((current) => {
            const clone = structuredClone(current);
            let target = clone;

            for (let index = 0; index < path.length - 1; index += 1) {
                target = target[path[index]];
            }

            target[path[path.length - 1]] = value;
            return clone;
        });
    };

    const moveSection = (from, to) => {
        if (from === to) {
            return;
        }

        setContent((current) => {
            const order = [...current.sections_order];
            const [section] = order.splice(from, 1);
            order.splice(to, 0, section);
            return { ...current, sections_order: order };
        });
    };

    const submit = (event) => {
        event.preventDefault();
        transform((current) => ({
            ...current,
            _method: 'put',
            content: JSON.stringify(content),
            theme: JSON.stringify(themeState),
            seo: JSON.stringify(seoState),
        }));

        post(submitUrl, {
            forceFormData: true,
            preserveScroll: true,
        });
    };
    const [themeState, setThemeState] = React.useState(theme || {});
    const [seoState, setSeoState] = React.useState(seo || {});
    const activeLayout = (theme?.home_layouts || []).find((layout) => layout.key === (themeState.home_layout || 'classic-editorial'));
    const editorTabs = [
        ['design', 'Diseño'],
        ['seo', 'SEO'],
        ['sections', 'Secciones'],
        ['hero', 'Hero'],
        ['about', 'About'],
        ['gallery', 'Gallery'],
        ['featured', 'Featured'],
        ['contact', 'Contact'],
    ];

    return (
        <AdminLayout>
            <Head title={pageTitle} />

            <form onSubmit={submit} className="space-y-8 pb-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-3xl">
                        {backHref && (
                            <Link href={backHref} className="mb-4 inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-900">
                                {backLabel}
                            </Link>
                        )}
                        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
                            <LayoutTemplate className="h-3.5 w-3.5" />
                            Website builder
                        </p>
                        <h1 className="text-4xl font-heading font-black tracking-tight text-slate-900">{heading}</h1>
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                            {description}
                        </p>
                        {tenantLabel && (
                            <p className="mt-3 inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Tenant: {tenantLabel}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Save className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                        {processing ? 'Guardando...' : 'Guardar sitio'}
                    </button>
                </div>

                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)]">
                    <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                            <div className="bg-slate-950 p-5 text-white">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/42">Front activo</p>
                                <h2 className="mt-3 text-xl font-semibold">{activeLayout?.label || 'Classic Editorial'}</h2>
                                <p className="mt-2 text-xs leading-5 text-white/60">{activeLayout?.description || 'Home actual del tenant.'}</p>
                            </div>
                            <div className="space-y-2 p-3">
                                {editorTabs.map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setActiveEditor(key)}
                                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeEditor === key ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {label}
                                        {activeEditor === key && <CheckCircle className="h-4 w-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Resumen editable</p>
                            <div className="mt-4 space-y-3">
                                {content.sections_order.map((section) => (
                                    <button key={section} type="button" onClick={() => setActiveEditor(section)} className="block w-full rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{labels[section]}</p>
                                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-800">
                                            {section === 'hero' && content.hero.title}
                                            {section === 'about' && content.about.heading}
                                            {section === 'gallery' && content.gallery.heading}
                                            {section === 'featured' && content.featured.heading}
                                            {section === 'contact' && content.contact.heading}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="space-y-6">
                        {activeEditor === 'design' && (
                            <>
                                <Panel title="Asignar diseño del front" icon={Sparkles} description="Elige el home completo que vera este tenant en su dominio. Esta seleccion se guarda aislada por tenant.">
                                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                                        {(theme?.home_layouts || []).map((layout) => {
                                            const active = (themeState.home_layout || 'classic-editorial') === layout.key;

                                            return (
                                                <button
                                                    key={layout.key}
                                                    type="button"
                                                    onClick={() => setThemeState((current) => ({
                                                        ...current,
                                                        home_layout: layout.key,
                                                        preset: layout.recommended_preset || current.preset,
                                                    }))}
                                                    className={`group overflow-hidden rounded-[2rem] border text-left transition hover:-translate-y-0.5 ${active ? 'border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-900/15' : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:shadow-lg'}`}
                                                >
                                                    <div className={`h-28 ${layoutPreviewClass(layout.key)}`} />
                                                    <div className="p-5">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${active ? 'text-white/42' : 'text-slate-400'}`}>Front completo</p>
                                                                <h3 className="mt-2 text-lg font-semibold">{layout.label}</h3>
                                                            </div>
                                                            {active && <CheckCircle className="h-5 w-5 text-emerald-300" />}
                                                        </div>
                                                        <p className={`mt-3 text-sm leading-6 ${active ? 'text-white/68' : 'text-slate-500'}`}>{layout.description}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Panel>

                                <Panel title="Paleta y tipografia" icon={Type} description="Opcional: el diseño ya aplica una paleta recomendada, pero puedes ajustarla manualmente.">
                                    <div className="grid gap-5 md:grid-cols-3">
                                        <div className="space-y-2 md:col-span-1">
                                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Preset</label>
                                            <select
                                                value={themeState.preset || 'editorial-warm'}
                                                onChange={(event) => setThemeState((current) => ({ ...current, preset: event.target.value }))}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:bg-white"
                                            >
                                                {(theme?.presets || []).map((preset) => (
                                                    <option key={preset.key} value={preset.key}>{preset.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <TextField label="Heading font" value={themeState.font_heading} onChange={(value) => setThemeState((current) => ({ ...current, font_heading: value }))} />
                                        <TextField label="Body font" value={themeState.font_body} onChange={(value) => setThemeState((current) => ({ ...current, font_body: value }))} />
                                    </div>
                                </Panel>

                                <Panel title="Branding" icon={Type} description="El nombre del estudio y tagline se administran desde branding para mantener una sola fuente de verdad.">
                            <div className="grid gap-5 md:grid-cols-2">
                                <ReadOnlyField label="Brand name" value={content.brand.name} />
                                <ReadOnlyField label="Tagline" value={content.brand.tagline} />
                            </div>
                            <Link
                                href="/admin/settings/branding"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700"
                            >
                                Ir a branding
                            </Link>
                                </Panel>
                            </>
                        )}

                        {activeEditor === 'seo' && (
                            <>
                                <Panel title="SEO estrella del tenant" icon={Search} description="Controla como aparece el front en Google, enlaces compartidos, WhatsApp, X/Facebook y resultados enriquecidos.">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <ToggleField
                                            label="Permitir indexacion"
                                            description="Si esta apagado, Google recibe noindex/nofollow. Usalo solo en sitios en construccion."
                                            checked={seoState.indexable !== false}
                                            onChange={(value) => setSeoState((current) => ({ ...current, indexable: value }))}
                                        />
                                        <ToggleField
                                            label="SEO activo"
                                            description="Mantiene metatags, Open Graph, canonical y schema en el front publico."
                                            checked={seoState.enabled !== false}
                                            onChange={(value) => setSeoState((current) => ({ ...current, enabled: value }))}
                                        />
                                    </div>
                                    <TextField label="Titulo SEO" value={seoState.title} onChange={(value) => setSeoState((current) => ({ ...current, title: value }))} />
                                    <TextAreaField label="Descripcion SEO" value={seoState.description} onChange={(value) => setSeoState((current) => ({ ...current, description: value }))} rows={3} />
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <TextField label="Keywords / servicios clave" value={seoState.keywords} onChange={(value) => setSeoState((current) => ({ ...current, keywords: value }))} />
                                        <TextField label="Canonical URL opcional" value={seoState.canonical_url} onChange={(value) => setSeoState((current) => ({ ...current, canonical_url: value }))} />
                                    </div>
                                    <SeoPreview seo={seoState} fallbackTitle={homepage?.brand?.name} fallbackDescription={homepage?.brand?.tagline} />
                                </Panel>

                                <Panel title="Compartir en redes y WhatsApp" icon={Share2} description="Esto define la tarjeta visual cuando pegan el enlace en redes, chats o mensajes.">
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <TextField label="Open Graph title" value={seoState.og_title} onChange={(value) => setSeoState((current) => ({ ...current, og_title: value }))} />
                                        <TextField label="Imagen social URL" value={seoState.og_image_url} onChange={(value) => setSeoState((current) => ({ ...current, og_image_url: value }))} />
                                    </div>
                                    <TextAreaField label="Open Graph description" value={seoState.og_description} onChange={(value) => setSeoState((current) => ({ ...current, og_description: value }))} rows={3} />
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Twitter/X card</label>
                                            <select
                                                value={seoState.twitter_card || 'summary_large_image'}
                                                onChange={(event) => setSeoState((current) => ({ ...current, twitter_card: event.target.value }))}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:bg-white"
                                            >
                                                <option value="summary_large_image">Imagen grande</option>
                                                <option value="summary">Resumen compacto</option>
                                            </select>
                                        </div>
                                        <TextField label="Google Search Console verification" value={seoState.google_site_verification} onChange={(value) => setSeoState((current) => ({ ...current, google_site_verification: value }))} />
                                    </div>
                                </Panel>

                                <Panel title="Google Cards / Schema local" icon={MapPin} description="Datos estructurados para que Google entienda el negocio, ubicacion, servicios y presencia real del tenant.">
                                    <div className="grid gap-5 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Tipo schema</label>
                                            <select
                                                value={seoState.schema_type || 'LocalBusiness'}
                                                onChange={(event) => setSeoState((current) => ({ ...current, schema_type: event.target.value }))}
                                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:bg-white"
                                            >
                                                <option value="LocalBusiness">LocalBusiness</option>
                                                <option value="ProfessionalService">ProfessionalService</option>
                                                <option value="Organization">Organization</option>
                                            </select>
                                        </div>
                                        <TextField label="Nombre negocio" value={seoState.business_name} onChange={(value) => setSeoState((current) => ({ ...current, business_name: value }))} />
                                        <TextField label="Rango precio" value={seoState.price_range} onChange={(value) => setSeoState((current) => ({ ...current, price_range: value }))} />
                                    </div>
                                    <TextAreaField label="Descripcion negocio" value={seoState.business_description} onChange={(value) => setSeoState((current) => ({ ...current, business_description: value }))} rows={3} />
                                    <div className="grid gap-5 md:grid-cols-2">
                                        <TextField label="Telefono" value={seoState.phone} onChange={(value) => setSeoState((current) => ({ ...current, phone: value }))} />
                                        <TextField label="Email publico" value={seoState.email} onChange={(value) => setSeoState((current) => ({ ...current, email: value }))} />
                                        <TextField label="Direccion" value={seoState.street_address} onChange={(value) => setSeoState((current) => ({ ...current, street_address: value }))} />
                                        <TextField label="Ciudad" value={seoState.locality} onChange={(value) => setSeoState((current) => ({ ...current, locality: value }))} />
                                        <TextField label="Region / provincia" value={seoState.region} onChange={(value) => setSeoState((current) => ({ ...current, region: value }))} />
                                        <TextField label="Pais" value={seoState.country} onChange={(value) => setSeoState((current) => ({ ...current, country: value }))} />
                                        <TextField label="Latitud" value={seoState.latitude} onChange={(value) => setSeoState((current) => ({ ...current, latitude: value }))} />
                                        <TextField label="Longitud" value={seoState.longitude} onChange={(value) => setSeoState((current) => ({ ...current, longitude: value }))} />
                                    </div>
                                    <TextAreaField label="Servicios separados por coma" value={seoState.services} onChange={(value) => setSeoState((current) => ({ ...current, services: value }))} rows={3} />
                                    <TextAreaField label="Redes / perfiles separados por coma" value={seoState.same_as} onChange={(value) => setSeoState((current) => ({ ...current, same_as: value }))} rows={3} />
                                </Panel>
                            </>
                        )}

                        {activeEditor === 'sections' && (
                            <Panel title="Orden de secciones" icon={GripVertical} description="Arrastra para cambiar el flujo visual del home.">
                                <div className="grid gap-3 md:grid-cols-2">
                                    {content.sections_order.map((section, index) => (
                                        <button
                                            key={section}
                                            type="button"
                                            draggable
                                            onDragStart={() => setDragging(index)}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={() => {
                                                if (dragging !== null) {
                                                    moveSection(dragging, index);
                                                }
                                                setDragging(null);
                                            }}
                                            onDragEnd={() => setDragging(null)}
                                            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-primary-300 hover:bg-primary-50/40"
                                        >
                                            <span className="text-sm font-medium text-slate-700">{labels[section]}</span>
                                            <GripVertical className="h-4 w-4 text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            </Panel>
                        )}

                        {activeEditor === 'hero' && <Panel title="Hero" icon={LayoutTemplate} description="Seccion principal con imagen, titular y llamadas a la accion.">
                            <div className="grid gap-5 md:grid-cols-2">
                                <TextField label="Eyebrow" value={content.hero.eyebrow} onChange={(value) => updateAtPath(['hero', 'eyebrow'], value)} />
                                <TextField label="Floating caption" value={content.hero.floating_caption} onChange={(value) => updateAtPath(['hero', 'floating_caption'], value)} />
                            </div>
                            <TextAreaField label="Title" value={content.hero.title} onChange={(value) => updateAtPath(['hero', 'title'], value)} rows={3} />
                            <TextAreaField label="Description" value={content.hero.description} onChange={(value) => updateAtPath(['hero', 'description'], value)} rows={4} />
                            <div className="grid gap-5 md:grid-cols-2">
                                <TextField label="Primary CTA label" value={content.hero.primary_cta_label} onChange={(value) => updateAtPath(['hero', 'primary_cta_label'], value)} />
                                <TextField label="Primary CTA target" value={content.hero.primary_cta_target} onChange={(value) => updateAtPath(['hero', 'primary_cta_target'], value)} />
                                <TextField label="Secondary CTA label" value={content.hero.secondary_cta_label} onChange={(value) => updateAtPath(['hero', 'secondary_cta_label'], value)} />
                                <TextField label="Secondary CTA target" value={content.hero.secondary_cta_target} onChange={(value) => updateAtPath(['hero', 'secondary_cta_target'], value)} />
                            </div>
                            <FileField
                                label="Hero image"
                                preview={homepagePreview.hero.image_url || resolvePreview(content.hero.image_path)}
                                onChange={(file) => setData('hero_image', file)}
                            />
                        </Panel>}

                        {activeEditor === 'about' && <Panel title="About" icon={Type} description="Presentacion del fotografo y sus diferenciales.">
                            <TextField label="Eyebrow" value={content.about.eyebrow} onChange={(value) => updateAtPath(['about', 'eyebrow'], value)} />
                            <TextAreaField label="Heading" value={content.about.heading} onChange={(value) => updateAtPath(['about', 'heading'], value)} rows={3} />
                            <TextAreaField label="Body" value={content.about.body} onChange={(value) => updateAtPath(['about', 'body'], value)} rows={4} />
                            <TextAreaField label="Detail" value={content.about.detail} onChange={(value) => updateAtPath(['about', 'detail'], value)} rows={3} />
                            <div className="grid gap-4 md:grid-cols-3">
                                {content.about.stats.map((item, index) => (
                                    <div key={`stat-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <TextField label={`Stat ${index + 1} value`} value={item.value} onChange={(value) => updateAtPath(['about', 'stats', index, 'value'], value)} />
                                        <div className="mt-4">
                                            <TextField label={`Stat ${index + 1} label`} value={item.label} onChange={(value) => updateAtPath(['about', 'stats', index, 'label'], value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <FileField
                                label="About image"
                                preview={homepagePreview.about.image_url || resolvePreview(content.about.image_path)}
                                onChange={(file) => setData('about_image', file)}
                            />
                        </Panel>}

                        {activeEditor === 'gallery' && <Panel title="Gallery" icon={ImageIcon} description="Mosaico principal de trabajos o proyectos destacados.">
                            <TextField label="Eyebrow" value={content.gallery.eyebrow} onChange={(value) => updateAtPath(['gallery', 'eyebrow'], value)} />
                            <TextAreaField label="Heading" value={content.gallery.heading} onChange={(value) => updateAtPath(['gallery', 'heading'], value)} rows={3} />
                            <TextAreaField label="Description" value={content.gallery.description} onChange={(value) => updateAtPath(['gallery', 'description'], value)} rows={3} />
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {content.gallery.images.map((image, index) => (
                                    <FileField
                                        key={`gallery-${index}`}
                                        label={`Gallery image ${index + 1}`}
                                        preview={homepagePreview.gallery.image_urls?.[index] || resolvePreview(image)}
                                        onChange={(file) => setData(`gallery_image_${index}`, file)}
                                    />
                                ))}
                            </div>
                        </Panel>}

                        {activeEditor === 'featured' && <Panel title="Featured" icon={Sparkles} description="Tres tarjetas para nichos, servicios o proyectos especiales.">
                            <TextField label="Eyebrow" value={content.featured.eyebrow} onChange={(value) => updateAtPath(['featured', 'eyebrow'], value)} />
                            <TextAreaField label="Heading" value={content.featured.heading} onChange={(value) => updateAtPath(['featured', 'heading'], value)} rows={3} />
                            <TextAreaField label="Description" value={content.featured.description} onChange={(value) => updateAtPath(['featured', 'description'], value)} rows={3} />
                            <div className="grid gap-4 xl:grid-cols-3">
                                {content.featured.items.map((item, index) => (
                                    <div key={`featured-${index}`} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                                        <TextField label="Title" value={item.title} onChange={(value) => updateAtPath(['featured', 'items', index, 'title'], value)} />
                                        <div className="mt-4">
                                            <TextAreaField label="Category / description" value={item.category} onChange={(value) => updateAtPath(['featured', 'items', index, 'category'], value)} rows={3} />
                                        </div>
                                        <div className="mt-4">
                                            <FileField
                                                label={`Card image ${index + 1}`}
                                                preview={homepagePreview.featured.items?.[index]?.image_url || resolvePreview(item.image_path)}
                                                onChange={(file) => setData(`featured_image_${index}`, file)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Panel>}

                        {activeEditor === 'contact' && <Panel title="Contact" icon={Upload} description="Cierre comercial y formulario que alimenta los leads del sistema.">
                            <TextField label="Eyebrow" value={content.contact.eyebrow} onChange={(value) => updateAtPath(['contact', 'eyebrow'], value)} />
                            <TextAreaField label="Heading" value={content.contact.heading} onChange={(value) => updateAtPath(['contact', 'heading'], value)} rows={3} />
                            <TextAreaField label="Description" value={content.contact.description} onChange={(value) => updateAtPath(['contact', 'description'], value)} rows={3} />
                            <div className="grid gap-5 md:grid-cols-3">
                                <TextField label="Form heading" value={content.contact.form_heading} onChange={(value) => updateAtPath(['contact', 'form_heading'], value)} />
                                <TextField label="Submit label" value={content.contact.submit_label} onChange={(value) => updateAtPath(['contact', 'submit_label'], value)} />
                                <TextField label="Info label" value={content.contact.info_label} onChange={(value) => updateAtPath(['contact', 'info_label'], value)} />
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {content.contact.info_lines.map((line, index) => (
                                    <TextField
                                        key={`info-line-${index}`}
                                        label={`Info line ${index + 1}`}
                                        value={line}
                                        onChange={(value) => updateAtPath(['contact', 'info_lines', index], value)}
                                    />
                                ))}
                            </div>
                        </Panel>}
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

function resolvePreview(path) {
    if (!path) {
        return null;
    }

    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    if (path.startsWith('r2://')) {
        return null;
    }

    return `/storage/${path}`;
}

function layoutPreviewClass(key) {
    const previews = {
        'classic-editorial': 'bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,.8),transparent_22%),linear-gradient(135deg,#251b16,#c69b72)]',
        'tetta-explorer': 'bg-[linear-gradient(90deg,#050505_0%,#050505_38%,#6d5a4f_38%,#151515_100%)]',
        'hardy-portrait': 'bg-[radial-gradient(circle_at_70%_35%,rgba(196,125,114,.45),transparent_30%),linear-gradient(135deg,#fff8f5,#321c1f)]',
        'wedding-event': 'bg-[linear-gradient(135deg,#fff8f5_0%,#f4dcd5_45%,#321c1f_100%)]',
        'wild-nature': 'bg-[radial-gradient(circle_at_30%_25%,rgba(141,154,85,.55),transparent_28%),linear-gradient(135deg,#172419,#f4f1e8)]',
        'sports-dynamic': 'bg-[radial-gradient(circle_at_25%_30%,rgba(183,255,60,.7),transparent_24%),linear-gradient(135deg,#051015,#0d1b22)]',
    };

    return previews[key] || previews['classic-editorial'];
}

function Panel({ title, description, icon: Icon, children }) {
    return (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-start gap-4">
                <div className="rounded-2xl bg-primary-50 p-3 text-primary-700">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </div>
            </div>
            <div className="space-y-5">{children}</div>
        </section>
    );
}

function TextField({ label, value, onChange }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</label>
            <input
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:bg-white"
            />
        </div>
    );
}

function ToggleField({ label, description, checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`rounded-[1.5rem] border p-4 text-left transition ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
        >
            <span className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-900">{label}</span>
                <span className={`h-6 w-11 rounded-full p-1 transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`} />
                </span>
            </span>
            <span className="mt-2 block text-xs leading-5 text-slate-500">{description}</span>
        </button>
    );
}

function SeoPreview({ seo, fallbackTitle, fallbackDescription }) {
    const title = seo?.title || fallbackTitle || 'Titulo del tenant';
    const description = seo?.description || fallbackDescription || 'Descripcion que vera Google cuando muestre esta pagina.';
    const ogTitle = seo?.og_title || title;
    const ogDescription = seo?.og_description || description;

    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Vista Google</p>
                <p className="mt-4 text-sm text-emerald-700">https://dominio-del-tenant.com</p>
                <p className="mt-1 text-xl font-medium text-blue-700">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
                <div className="flex h-36 items-center justify-center bg-slate-100 text-sm text-slate-400">
                    {seo?.og_image_url ? <img src={seo.og_image_url} alt="Social preview" className="h-full w-full object-cover" /> : 'Imagen social'}
                </div>
                <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Card social</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{ogTitle}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{ogDescription}</p>
                </div>
            </div>
        </div>
    );
}

function ReadOnlyField({ label, value }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</label>
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {value || '-'}
            </div>
        </div>
    );
}

function TextAreaField({ label, value, onChange, rows = 4 }) {
    return (
        <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</label>
            <textarea
                rows={rows}
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:bg-white"
            />
        </div>
    );
}

function FileField({ label, preview, onChange }) {
    return (
        <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</label>
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
                {preview ? (
                    <img src={preview} alt={label} className="h-48 w-full object-cover" />
                ) : (
                    <div className="flex h-48 items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                    </div>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-slate-200 px-4 py-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
                    <Upload className="h-4 w-4" />
                    Replace image
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => onChange(event.target.files?.[0] || null)}
                        className="hidden"
                    />
                </label>
            </div>
        </div>
    );
}
