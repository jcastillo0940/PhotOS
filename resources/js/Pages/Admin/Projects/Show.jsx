import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ChevronLeft, ExternalLink, Copy, FolderKanban, Link2, LayoutTemplate, Images, ReceiptText, CalendarRange, MapPin, BadgeCheck, UploadCloud, Trash2, Globe2, CheckCircle2, Download, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

const nav = [
  { id: 'overview', label: 'Resumen', icon: FolderKanban },
  { id: 'sharing', label: 'Compartir', icon: Link2 },
  { id: 'design', label: 'Diseno', icon: LayoutTemplate },
  { id: 'photos', label: 'Fotos', icon: Images },
  { id: 'billing', label: 'Facturacion', icon: ReceiptText },
];

export default function Show({ project, installationPlan, availableTemplates, billingSettings }) {
  const { flash } = usePage().props;
  const fileInputRef = React.useRef(null);
  const [active, setActive] = React.useState('overview');
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [heroPhotoId, setHeroPhotoId] = React.useState(project.hero_photo_id || project.photos?.[0]?.id || null);
  const [templateCode, setTemplateCode] = React.useState(project.gallery_template_code || availableTemplates?.[0]?.code || '');
  const [websiteCategory, setWebsiteCategory] = React.useState(project.website_category || project.lead?.event_type || '');
  const [websiteDescription, setWebsiteDescription] = React.useState(project.website_description || '');
  const [photoState, setPhotoState] = React.useState(Object.fromEntries((project.photos || []).map((photo) => [photo.id, { tags: (photo.tags || []).join(', '), show_on_website: !!photo.show_on_website }])));
  const invoiceForm = useForm({ amount: '', concept: '', due_date: '', itbms_enabled: !!billingSettings?.itbms_enabled, alanube_enabled: !!billingSettings?.alanube_enabled });

  const galleryUrl = `${window.location.origin}/gallery/${project.gallery_token}`;
  const signatureUrl = `${window.location.origin}/sign/${project.contract?.token}`;
  const heroPhoto = project.photos?.find((photo) => photo.id === heroPhotoId) || project.photos?.[0] || null;
  const portfolioCount = project.photos?.filter((photo) => photo.show_on_website).length || 0;

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (first?.target?.id) setActive(first.target.id);
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0.1 });
    nav.forEach((item) => { const node = document.getElementById(item.id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);

  const copy = async (value) => {
    await navigator.clipboard.writeText(value);
    window.alert('Copiado al portapapeles.');
  };

  const savePhoto = (photoId, nextState) => {
    const next = { ...(photoState[photoId] || {}), ...nextState };
    setPhotoState((current) => ({ ...current, [photoId]: next }));
    const tags = (next.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    router.put(`/admin/projects/${project.id}/photos/${photoId}`, { category: tags[0] || 'General', tags, show_on_website: next.show_on_website }, { preserveScroll: true, preserveState: true });
  };

  const uploadPhotos = (files) => {
    if (!files?.length) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('photos[]', file));
    setIsUploading(true);
    router.post(`/admin/projects/${project.id}/photos`, formData, { forceFormData: true, preserveScroll: true, onProgress: (event) => setUploadProgress(event?.percentage || 0), onFinish: () => { setIsUploading(false); setUploadProgress(0); if (fileInputRef.current) fileInputRef.current.value = ''; } });
  };

  const createInvoice = (event) => {
    event.preventDefault();
    invoiceForm.post(`/admin/projects/${project.id}/invoices`, { preserveScroll: true, onSuccess: () => invoiceForm.reset('amount', 'concept', 'due_date') });
  };

  return (
    <AdminLayout>
      <Head title={`Coleccion: ${project.name}`} />
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ChevronLeft className="h-4 w-4" />Volver a colecciones</Link>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{project.name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2"><CalendarRange className="h-4 w-4" />{project.event_date ? new Date(project.event_date).toLocaleDateString() : 'Fecha por definir'}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{project.location || 'Sin ubicacion'}</span>
              <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4" />{installationPlan?.name}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => copy(galleryUrl)} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700">Copiar galeria</button>
            <Link href={`/gallery/${project.gallery_token}`} className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white"><ExternalLink className="h-4 w-4" />Abrir vista cliente</Link>
          </div>
        </div>

        {(flash?.success || flash?.error) && <div className={clsx('rounded-[1.4rem] border px-4 py-4 text-sm shadow-sm', flash?.error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>{flash?.error || flash?.success}</div>}

        <div className="grid gap-8 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside>
            <div className="sticky top-28 rounded-[2rem] border border-[#e6e0d5] bg-white p-5 shadow-sm">
              <div className="overflow-hidden rounded-[1.6rem] bg-[#f4efe7]">{heroPhoto ? <img src={heroPhoto.thumbnail_url || heroPhoto.url} alt={project.name} className="h-44 w-full object-cover" /> : <div className="flex h-44 items-center justify-center text-slate-300">Sin portada</div>}</div>
              <nav className="mt-5 space-y-1">{nav.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })} className={clsx('flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm transition', active === id ? 'bg-[#171411] text-white' : 'text-slate-500 hover:bg-[#fbf9f6] hover:text-slate-900')}><Icon className="h-4 w-4" />{label}</button>)}</nav>
              <div className="mt-5 grid gap-3">{[['Fotos', project.photos?.length || 0], ['Web', portfolioCount], ['Descargas', project.remaining_weekly_downloads === null ? 'Ilimitado' : project.remaining_weekly_downloads]].map(([label, value]) => <div key={label} className="rounded-[1.3rem] border border-[#e8e1d5] bg-[#fbf9f6] px-4 py-4"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 text-lg font-semibold text-slate-900">{value}</p></div>)}</div>
            </div>
          </aside>

          <div className="space-y-8">
            <Section id="overview" title="Resumen operativo" description="La informacion mas importante del proyecto en una sola lectura.">
              <div className="grid gap-4 md:grid-cols-3">{[[ 'Cliente', project.lead?.name || 'Cliente directo', project.lead?.event_type || 'Sin tipo' ], [ 'Contrato', project.contract ? project.contract.status : 'Sin generar', project.contract?.status === 'signed' ? 'Firma completa' : 'Pendiente' ], [ 'Portafolio', portfolioCount, 'Fotos visibles en la web' ]].map(([label, value, helper]) => <Card key={label} label={label} value={value} helper={helper} />)}</div>
            </Section>

            <Section id="sharing" title="Compartir y accesos" description="Enlaces y acciones que usas para entregar o firmar.">
              <div className="grid gap-4 lg:grid-cols-2">
                <LinkCard label="Galeria del cliente" value={galleryUrl} helper="Comparte este enlace con tu cliente." onCopy={() => copy(galleryUrl)} />
                <LinkCard label="Codigo de acceso" value={project.gallery_password || ''} helper="Desbloquea la galeria completa." onCopy={() => copy(project.gallery_password || '')} />
                <LinkCard label="Firma del contrato" value={project.contract ? signatureUrl : 'Genera primero el contrato'} helper="Acceso publico al contrato." onCopy={() => project.contract && copy(signatureUrl)} disabled={!project.contract} />
                <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Acciones</p><div className="mt-4 flex flex-wrap gap-3">{project.contract ? <><Link href="/admin/contracts" className="inline-flex items-center gap-2 rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-sm font-semibold text-slate-700"><FileText className="h-4 w-4" />Editar contrato</Link><Link href={`/sign/${project.contract.token}/print`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white"><Download className="h-4 w-4" />PDF contrato</Link></> : <button onClick={() => router.post(`/admin/projects/${project.id}/contract`)} className="rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white">Generar contrato</button>}</div></div>
              </div>
            </Section>

            <Section id="design" title="Diseno y presencia publica" description="Plantilla, portada y categoria visible en la web.">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5"><label className="block text-[11px] uppercase tracking-[0.18em] text-slate-400">Plantilla de galeria</label><select value={templateCode} onChange={(event) => { setTemplateCode(event.target.value); router.put(`/admin/projects/${project.id}`, { gallery_template_code: event.target.value }, { preserveScroll: true, preserveState: true }); }} className="mt-3 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none">{availableTemplates?.map((template) => <option key={template.code} value={template.code}>{template.name}</option>)}</select><label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Categoria visible</label><input value={websiteCategory} onChange={(event) => setWebsiteCategory(event.target.value)} onBlur={() => router.put(`/admin/projects/${project.id}`, { website_category: websiteCategory, website_description: websiteDescription }, { preserveScroll: true, preserveState: true })} className="mt-3 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" /><label className="mt-4 block text-[11px] uppercase tracking-[0.18em] text-slate-400">Descripcion</label><textarea rows={4} value={websiteDescription} onChange={(event) => setWebsiteDescription(event.target.value)} onBlur={() => router.put(`/admin/projects/${project.id}`, { website_category: websiteCategory, website_description: websiteDescription }, { preserveScroll: true, preserveState: true })} className="mt-3 w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" /></div>
                <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Portada</p><div className="mt-3 overflow-hidden rounded-[1.6rem] border border-[#e6e0d5] bg-white">{heroPhoto ? <img src={heroPhoto.url} alt={project.name} className="h-[260px] w-full object-cover" /> : <div className="flex h-[260px] items-center justify-center text-slate-300">Sin portada</div>}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{(project.photos || []).slice(0, 6).map((photo) => <button key={photo.id} type="button" onClick={() => { setHeroPhotoId(photo.id); router.put(`/admin/projects/${project.id}`, { hero_photo_id: photo.id }, { preserveScroll: true, preserveState: true }); }} className={clsx('overflow-hidden rounded-[1.2rem] border text-left', heroPhotoId === photo.id ? 'border-[#171411]' : 'border-[#e6e0d5] bg-white')}><img src={photo.thumbnail_url || photo.url} alt="" className="h-24 w-full object-cover" /><div className="flex items-center justify-between px-3 py-3 text-sm text-slate-700">Foto #{photo.id}{heroPhotoId === photo.id && <CheckCircle2 className="h-4 w-4" />}</div></button>)}</div></div>
              </div>
            </Section>

            <Section id="photos" title="Biblioteca de fotos" description="Sube material y decide que aparece en el portafolio.">
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(event) => uploadPhotos(event.target.files)} className="hidden" />
              <div className="rounded-[1.8rem] border border-dashed border-[#d9d1c4] bg-[#fbf9f6] px-6 py-10 text-center"><UploadCloud className="mx-auto h-9 w-9 text-slate-300" /><h3 className="mt-4 text-xl font-semibold text-slate-900">Arrastra fotos o subelas aqui</h3><p className="mt-2 text-sm text-slate-500">Los originales y las versiones web se sincronizan con Cloudflare R2.</p><button onClick={() => fileInputRef.current?.click()} className="mt-5 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white">Agregar multimedia</button></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(project.photos || []).length > 0 ? project.photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-[1.7rem] border border-[#ece5d8] bg-white shadow-sm"><div className="relative"><img src={photo.thumbnail_url || photo.url} alt="" className="h-56 w-full object-cover" /><button type="button" onClick={() => { if (window.confirm('Eliminar esta foto del proyecto y del bucket?')) router.post(`/admin/projects/${project.id}/photos/${photo.id}`, { _method: 'delete' }, { preserveScroll: true }); }} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm"><Trash2 className="h-4 w-4" /></button></div><div className="space-y-4 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">Foto #{photo.id}</p><button type="button" onClick={() => { setHeroPhotoId(photo.id); router.put(`/admin/projects/${project.id}`, { hero_photo_id: photo.id }, { preserveScroll: true, preserveState: true }); }} className={clsx('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', heroPhotoId === photo.id ? 'bg-[#171411] text-white' : 'border border-[#e6e0d5] text-slate-600')}>{heroPhotoId === photo.id ? 'Portada' : 'Usar en portada'}</button></div><input value={photoState[photo.id]?.tags || ''} onChange={(event) => savePhoto(photo.id, { tags: event.target.value })} placeholder="Ej. ceremonia, retratos" className="w-full rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700 outline-none" /><label className="flex items-center justify-between rounded-2xl border border-[#e6e0d5] bg-[#fbf9f6] px-4 py-3 text-sm text-slate-700"><span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-slate-400" />Mostrar en web</span><input type="checkbox" checked={!!photoState[photo.id]?.show_on_website} onChange={(event) => savePhoto(photo.id, { show_on_website: event.target.checked })} className="h-4 w-4 rounded border-slate-300 text-primary-600" /></label></div></article>) : <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-16 text-center text-sm text-slate-400 md:col-span-2 xl:col-span-3">Aun no hay fotos en esta coleccion.</div>}</div>
            </Section>

            <Section id="billing" title="Facturacion y cobro" description="Crea facturas y registra pagos desde la misma coleccion.">
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><form onSubmit={createInvoice} className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Nueva factura</p><div className="mt-4 space-y-3"><input type="number" min="0" step="0.01" value={invoiceForm.data.amount} onChange={(event) => invoiceForm.setData('amount', event.target.value)} placeholder="Monto base" className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" /><input type="text" value={invoiceForm.data.concept} onChange={(event) => invoiceForm.setData('concept', event.target.value)} placeholder="Concepto" className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" /><input type="date" value={invoiceForm.data.due_date} onChange={(event) => invoiceForm.setData('due_date', event.target.value)} className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" /></div><button type="submit" disabled={invoiceForm.processing} className="mt-5 rounded-2xl bg-[#171411] px-4 py-3 text-sm font-semibold text-white">{invoiceForm.processing ? 'Creando...' : 'Crear factura'}</button></form><div className="space-y-4">{(project.invoices || []).length > 0 ? project.invoices.map((invoice) => <div key={invoice.id} className="rounded-[1.6rem] border border-[#ece5d8] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-lg font-semibold text-slate-900">{invoice.concept}</p><p className="mt-1 text-sm text-slate-500">Vence {new Date(invoice.due_date).toLocaleDateString()}</p></div><div className="text-right"><p className="text-lg font-semibold text-slate-900">${invoice.total || invoice.amount}</p><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{invoice.status}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => router.put(`/admin/invoices/${invoice.id}/toggle-tax`)} className="rounded-2xl border border-[#ddd5c9] bg-[#fbf9f6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">{invoice.itbms_enabled ? 'Quitar 7%' : 'Aplicar 7%'}</button><button type="button" onClick={() => { const amount = window.prompt('Monto del pago parcial', invoice.balance_due || invoice.total || invoice.amount); if (!amount) return; router.post(`/admin/invoices/${invoice.id}/payments`, { amount, method: 'manual', reference: `MANUAL-${invoice.invoice_number || invoice.id}` }, { preserveScroll: true }); }} className="rounded-2xl border border-[#ddd5c9] bg-[#fbf9f6] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">Registrar pago</button><button type="button" onClick={() => router.post(`/admin/invoices/${invoice.id}/alanube`, {}, { preserveScroll: true })} disabled={!invoice.alanube_enabled} className={clsx('rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]', invoice.alanube_enabled ? 'bg-[#eef8f3] text-[#16794f] border border-[#dbeee4]' : 'border border-[#ddd5c9] bg-slate-100 text-slate-400 cursor-not-allowed')}>{invoice.alanube_status === 'submitted' ? 'Alanube enviado' : 'Enviar a Alanube'}</button><a href={`/admin/invoices/${invoice.id}/pdf`} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">Descargar PDF</a>{invoice.status !== 'paid' && <button type="button" onClick={() => router.put(`/admin/invoices/${invoice.id}/pay`)} className="rounded-2xl border border-[#ddd5c9] bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">Marcar pagada</button>}</div></div>) : <div className="rounded-[1.8rem] border border-dashed border-[#ddd5c9] px-6 py-16 text-center text-sm text-slate-400">Todavia no hay facturas en esta coleccion.</div>}</div></div>
            </Section>
          </div>
        </div>
      </div>

      <AnimatePresence>{isUploading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md"><div className="w-[380px] rounded-[2rem] bg-white p-10 text-center shadow-2xl"><UploadCloud className="mx-auto mb-4 h-14 w-14 animate-pulse text-primary-500" /><h2 className="text-xl font-semibold text-slate-900">Subiendo fotos</h2><p className="mt-2 text-sm text-slate-500">Sincronizando originales y versiones web en Cloudflare R2.</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100"><motion.div className="h-full rounded-full bg-primary-500" initial={{ width: 0 }} animate={{ width: `${uploadProgress || 0}%` }} /></div><p className="mt-3 text-sm font-semibold text-primary-600">{Math.round(uploadProgress || 0)}%</p></div></motion.div>}</AnimatePresence>
    </AdminLayout>
  );
}

function Section({ id, title, description, children }) {
  return <section id={id} className="scroll-mt-28 rounded-[2rem] border border-[#e6e0d5] bg-white p-7 shadow-sm"><div className="mb-6"><p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Workspace</p><h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-500">{description}</p></div>{children}</section>;
}

function Card({ label, value, helper }) {
  return <div className="rounded-[1.4rem] border border-[#e8e1d5] bg-[#fbf9f6] px-5 py-5"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 text-lg font-semibold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-500">{helper}</p></div>;
}

function LinkCard({ label, value, helper, onCopy, disabled = false }) {
  return <div className="rounded-[1.6rem] border border-[#ece5d8] bg-[#fbf9f6] p-5"><p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p><div className="mt-3 flex gap-2"><input readOnly value={value} className="w-full rounded-2xl border border-[#e6e0d5] bg-white px-4 py-3 text-sm text-slate-700 outline-none" /><button type="button" onClick={onCopy} disabled={disabled} className={clsx('flex h-[50px] w-[50px] items-center justify-center rounded-2xl border', disabled ? 'border-[#e6e0d5] bg-slate-100 text-slate-300 cursor-not-allowed' : 'border-[#ddd5c9] bg-white text-slate-600')}><Copy className="h-4 w-4" /></button></div><p className="mt-3 text-sm leading-6 text-slate-500">{helper}</p></div>;
}
