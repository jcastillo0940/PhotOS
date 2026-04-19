import React, { useRef, useState, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Bot, 
    Camera, 
    Check, 
    FolderKanban, 
    HelpCircle, 
    Info,
    ImagePlus, 
    ScanFace, 
    Shield, 
    Tags, 
    Ticket, 
    Trash2, 
    UserPlus, 
    UserRound, 
    WandSparkles, 
    X,
    Cpu,
    Target,
    Activity,
    Database,
    Zap,
    History,
    ChevronRight,
    Search,
    Plus,
    Layout
} from 'lucide-react';
import { Card, Badge, Button, Input, Drawer } from '@/Components/UI';
import { clsx } from 'clsx';

const CATALOG_META = {
    brand: {
        title: 'Marcas',
        eyebrow: 'Biblioteca visual',
        placeholder: 'Ej. Nike, Adidas, Puma',
        helper: 'Carga marcas clave para tu tenant. Puedes adjuntar un logo o referencia visual.',
        icon: Tags,
        empty: 'Todavía no hay marcas cargadas.',
        button: 'Guardar marca',
    },
    sponsor: {
        title: 'Sponsors',
        eyebrow: 'Biblioteca comercial',
        placeholder: 'Ej. Fly Emirates, Pepsi, Copa Airlines',
        helper: 'Usa esta biblioteca para patrocinadores principales en camisetas, vallas o activaciones.',
        icon: Shield,
        empty: 'Todavía no hay sponsors cargados.',
        button: 'Guardar sponsor',
    },
    jersey: {
        title: 'Dorsales',
        eyebrow: 'Biblioteca deportiva',
        placeholder: 'Ej. 10, 7, 21',
        helper: 'Opcional. Gemini puede detectar dorsales visibles por patrón en camiseta o pantaloneta sin cargar una biblioteca previa.',
        icon: Ticket,
        empty: 'Todavía no hay dorsales cargados.',
        button: 'Guardar dorsal opcional',
    },
    context: {
        title: 'Contexto',
        eyebrow: 'Biblioteca de escenas',
        placeholder: 'Ej. Balon, Porteria, Tarjeta roja',
        helper: 'Define escenas importantes del partido o del evento para que el equipo las siga de cerca.',
        icon: Bot,
        empty: 'Todavía no hay contextos cargados.',
        button: 'Guardar contexto',
    },
};

export default function Index({ mode, sportsModeEnabled = false, serviceConfigured, projects = [], identities = [], unknownDetections = [], catalogs = {}, stats = {} }) {
    const { flash } = usePage().props;
    const [isAddIdentityDrawerOpen, setIsAddIdentityDrawerOpen] = useState(false);
    const [isAddCatalogDrawerOpen, setIsAddCatalogDrawerOpen] = useState(false);
    
    const modeForm = useForm({ mode: mode || 'project_only', enable_existing_projects: mode === 'all_galleries' });
    const identityForm = useForm({ name: '', scope: 'global', project_id: '', reference_image: null });
    const catalogForm = useForm({ type: 'brand', name: '', reference_image: null });

    const submitMode = (e) => {
        e.preventDefault();
        modeForm.post('/admin/face-detection/mode', { preserveScroll: true });
    };

    const submitIdentity = (e) => {
        e.preventDefault();
        identityForm.post('/admin/face-detection/identities', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                identityForm.reset('name', 'project_id', 'reference_image');
                setIsAddIdentityDrawerOpen(false);
            },
        });
    };

    const submitCatalog = (e) => {
        e.preventDefault();
        catalogForm.post('/admin/face-detection/catalog', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                catalogForm.reset('name', 'reference_image');
                setIsAddCatalogDrawerOpen(false);
            },
        });
    };

    const selectedCatalog = CATALOG_META[catalogForm.data.type] || CATALOG_META.brand;

    return (
        <AdminLayout>
            <Head title={sportsModeEnabled ? 'IA Deportiva — PhotOS' : 'Detección Facial — PhotOS'} />

            <div className="flex flex-col h-full space-y-8">
                {/* Header Section */}
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Cpu className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                {sportsModeEnabled ? 'Centro de IA Deportiva' : 'Reconocimiento Facial'}
                            </h2>
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                            {sportsModeEnabled 
                                ? 'Entrena el modelo para reconocer dorsales, sponsors, marcas y rostros clave.' 
                                : 'Gestiona la biblioteca de rostros y referencias visuales automáticas.'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            icon={WandSparkles}
                            disabled={!serviceConfigured}
                            onClick={() => router.post('/admin/face-detection/run-all', {}, { preserveScroll: true })}
                        >
                            Escanear Todo
                        </Button>
                        <Button onClick={() => setIsAddIdentityDrawerOpen(true)} icon={Plus}>
                            Registrar {sportsModeEnabled ? 'Atleta' : 'Rostro'}
                        </Button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard 
                        icon={Activity} 
                        label="Fotos Procesadas" 
                        value={stats.photos_with_people || 0} 
                        detail={`De un total de ${stats.photos_count || 0}`}
                        color="cyan"
                    />
                    <StatCard 
                        icon={Target} 
                        label="Rostros Entrenados" 
                        value={(stats.global_identities_count || 0) + (stats.local_identities_count || 0)} 
                        detail="Identidades en biblioteca"
                        color="indigo"
                    />
                    <StatCard 
                        icon={Bot} 
                        label="Catálogo IA" 
                        value={(stats.catalog_brands_count || 0) + (stats.catalog_sponsors_count || 0) + (stats.catalog_jerseys_count || 0) + (stats.catalog_context_count || 0)} 
                        detail="Marcas & Sponsors"
                        color="amber"
                    />
                    <StatCard 
                        icon={History} 
                        label="Pendientes" 
                        value={stats.photos_pending || 0} 
                        detail="En cola de procesamiento"
                        color="slate"
                    />
                </div>

                <div className="grid gap-8 xl:grid-cols-[1fr_400px]">
                    <div className="space-y-8">
                        {/* Unknown Faces Lab: Immersive Learning Section */}
                        {unknownDetections.length > 0 && (
                            <Card 
                                className="bg-slate-900 border-none shadow-2xl shadow-primary/10 overflow-hidden"
                                decoration={<Zap className="h-24 w-24 text-primary/10 absolute -right-6 -bottom-6" />}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                                            <ScanFace className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight uppercase italic leading-none">Laboratorio de Aprendizaje</h3>
                                            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">Nuevos vectores detectados sin etiqueta</p>
                                        </div>
                                    </div>
                                    <Badge variant="primary" className="font-black py-1 px-3">
                                        {unknownDetections.length} PENDIENTES
                                    </Badge>
                                </div>
                                
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {unknownDetections.map((detection) => (
                                        <UnknownFaceCard key={detection.id} detection={detection} identities={identities} />
                                    ))}
                                </div>
                                
                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
                                        Confirma identidades para retroalimentar el sistema neuronal.
                                    </p>
                                    <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">
                                        Ver historial de aprendizaje
                                    </button>
                                </div>
                            </Card>
                        )}

                        {/* Library Grid */}
                        <div className="grid gap-6 sm:grid-cols-2">
                             <Card 
                                title={sportsModeEnabled ? "Plantel de Atletas" : "Directorio de Rostros"} 
                                subtitle="Identidades conocidas por el sistema"
                                className="h-full"
                            >
                                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {identities.length > 0 ? identities.map((identity) => (
                                        <PlayerIdentityCard
                                            key={identity.id}
                                            identity={identity}
                                            serviceConfigured={serviceConfigured}
                                            sportsModeEnabled={sportsModeEnabled}
                                        />
                                    )) : (
                                        <div className="py-12 text-center text-slate-400">
                                            <UserRound className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Sin registros activos</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            <Card title="Bibliotecas IA Activas" subtitle="Marcas, Sponsors y Escenas" className="h-full">
                                <div className="grid gap-4">
                                    <div className="flex bg-slate-100/50 p-1 rounded-xl mb-2">
                                        <button 
                                            onClick={() => setIsAddCatalogDrawerOpen(true)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-lg border border-slate-100 text-[10px] font-black uppercase tracking-widest text-primary shadow-sm hover:scale-[1.02] transition-all"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Agregar a Biblioteca
                                        </button>
                                    </div>
                                    <div className="space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                                        {Object.entries(CATALOG_META).map(([type, meta]) => (
                                            <CatalogSection
                                                key={type}
                                                type={type}
                                                meta={meta}
                                                items={catalogs?.[type]?.items || []}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>

                         {/* Project State */}
                         <Card title="Despliegue de IA" subtitle="Estado de activación por galería">
                            <div className="grid gap-4 lg:grid-cols-2 pr-2 overflow-y-auto max-h-[500px] custom-scrollbar">
                                {projects.map((project) => (
                                    <ProjectIAStatus key={project.id} project={project} />
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <Card title="Configuración de IA" subtitle="Modo de operación del tenant">
                            <form onSubmit={submitMode} className="space-y-6">
                                <div className="grid gap-3">
                                    <ModeCard
                                        title="Detección Dinámica"
                                        description="Cada galería gestiona su propio ecosistema de IA independientemente."
                                        checked={modeForm.data.mode === 'project_only'}
                                        onChange={() => modeForm.setData('mode', 'project_only')}
                                    />
                                    <ModeCard
                                        title="Red Global Tenant"
                                        description="Sincronización masiva de IA en todas las colecciones."
                                        checked={modeForm.data.mode === 'all_galleries'}
                                        onChange={() => modeForm.setData('mode', 'all_galleries')}
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer group">
                                        <span>Procesar Legado</span>
                                        <input
                                            type="checkbox"
                                            checked={!!modeForm.data.enable_existing_projects}
                                            onChange={(e) => modeForm.setData('enable_existing_projects', e.target.checked)}
                                            className="h-4 w-4 rounded-lg text-primary focus:ring-primary/20 border-slate-200 transition-all"
                                        />
                                    </label>
                                    <p className="mt-2 text-[10px] text-slate-400 font-medium leading-relaxed italic">
                                        Si se activa, las galerías antiguas se re-escanean con los nuevos parámetros.
                                    </p>
                                </div>

                                <Button fullWidth type="submit" loading={modeForm.processing}>Actualizar Configuración</Button>
                            </form>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                                    <Zap className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800 tracking-tight leading-none uppercase italic text-sm mb-2">Estado del Motor</h4>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        {serviceConfigured ? 'PhotOS IA se encuentra conectado y listo para procesar imágenes en tiempo real.' : 'El servicio de IA no está configurado correctamente. Contacta con soporte.'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Drawers */}
            <Drawer 
                isOpen={isAddIdentityDrawerOpen} 
                onClose={() => setIsAddIdentityDrawerOpen(false)}
                title={`Registrar ${sportsModeEnabled ? 'Atleta' : 'Persona'}`}
                subtitle="Agrega una nueva identidad a la red global o una galería"
            >
                <form onSubmit={submitIdentity} className="space-y-6">
                    <Input 
                        label="Nombre Completo" 
                        placeholder={sportsModeEnabled ? "Ej. Jeremy, Atleta #10" : "Ej. Carlos Mendoza"}
                        value={identityForm.data.name}
                        onChange={v => identityForm.setData('name', v.target.value)}
                    />
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alcance</label>
                            <select 
                                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                value={identityForm.data.scope}
                                onChange={v => {
                                    const val = v.target.value;
                                    identityForm.setData(d => ({ ...d, scope: val, project_id: val === 'project' ? d.project_id : '' }));
                                }}
                            >
                                <option value="global">Ecosistema Global</option>
                                <option value="project">Galería Específica</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Galería</label>
                            <select 
                                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none disabled:opacity-40"
                                disabled={identityForm.data.scope !== 'project'}
                                value={identityForm.data.project_id}
                                onChange={v => identityForm.setData('project_id', v.target.value)}
                            >
                                <option value="">Selecciona...</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-[1.8rem] text-center hover:border-primary/50 transition-colors group relative cursor-pointer">
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={e => identityForm.setData('reference_image', e.target.files?.[0])}
                        />
                        <ImagePlus className="h-10 w-10 text-slate-300 group-hover:text-primary mx-auto mb-4 transition-colors" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                            {identityForm.data.reference_image?.name || 'Subir Foto de Referencia'}
                        </p>
                    </div>

                    <Button fullWidth type="submit" loading={identityForm.processing}>Registrar Identidad</Button>
                </form>
            </Drawer>

             <Drawer 
                isOpen={isAddCatalogDrawerOpen} 
                onClose={() => setIsAddCatalogDrawerOpen(false)}
                title="Nueva Referencia IA"
                subtitle="Alimenta la biblioteca visual del tenant"
            >
                <form onSubmit={submitCatalog} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Referencia</label>
                        <select 
                            className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            value={catalogForm.data.type}
                            onChange={v => catalogForm.setData('type', v.target.value)}
                        >
                            {Object.entries(CATALOG_META).map(([val, meta]) => (
                                <option key={val} value={val}>{meta.title}</option>
                            ))}
                        </select>
                    </div>

                    <Input 
                        label="Nombre / Etiqueta" 
                        placeholder={selectedCatalog.placeholder}
                        value={catalogForm.data.name}
                        onChange={v => catalogForm.setData('name', v.target.value)}
                    />

                    <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 flex gap-4">
                        <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                            <Info className="h-4 w-4 text-amber-600" />
                        </div>
                        <p className="text-[10px] text-amber-800 font-bold leading-relaxed italic uppercase tracking-wider">
                            {selectedCatalog.helper}
                        </p>
                    </div>

                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-[1.8rem] text-center hover:border-primary/50 transition-colors group relative cursor-pointer">
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={e => catalogForm.setData('reference_image', e.target.files?.[0])}
                        />
                        <ImagePlus className="h-10 w-10 text-slate-300 group-hover:text-primary mx-auto mb-4 transition-colors" />
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                            {catalogForm.data.reference_image?.name || 'Subir Logo / Referencia Visual (Opcional)'}
                        </p>
                    </div>

                    <Button fullWidth type="submit" loading={catalogForm.processing}>{selectedCatalog.button}</Button>
                </form>
            </Drawer>
        </AdminLayout>
    );
}

function StatCard({ icon: Icon, label, value, detail, color = 'cyan' }) {
    const colors = {
        cyan: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        slate: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
    };
    
    return (
        <div className="p-6 rounded-[1.8rem] bg-white border border-slate-100 group hover:translate-y-[-4px] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${colors[color]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase mb-2">{label}</p>
            <h4 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{value}</h4>
            <p className="text-[11px] font-medium text-slate-500 truncate">{detail}</p>
        </div>
    );
}

function PlayerIdentityCard({ identity, serviceConfigured, sportsModeEnabled }) {
    const [addingPhoto, setAddingPhoto] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('reference_image', file);
        router.post(`/admin/face-detection/identities/${identity.id}/photos`, formData, {
            forceFormData: true, preserveScroll: true,
            onFinish: () => { setUploading(false); setAddingPhoto(false); },
        });
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-primary/20 transition-all group">
            <div className="h-14 w-14 rounded-xl bg-slate-200 overflow-hidden border border-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {identity.preview_url ? (
                    <img src={identity.preview_url} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <UserRound className="h-6 w-6 text-slate-400" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-black text-sm text-slate-800 truncate uppercase tracking-tight">{identity.name}</h5>
                    {identity.scope === 'global' && <Badge variant="slate" className="text-[7px] px-1.5 py-0 font-black">GLOBAL</Badge>}
                </div>
                <div className="flex items-center gap-3">
                    <span className={clsx(
                        'text-[10px] font-black uppercase tracking-widest',
                        identity.vectors_count > 0 ? 'text-primary' : 'text-slate-400'
                    )}>
                        {identity.vectors_count} muestras
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                        {identity.processing_status === 'ready' ? 'Entrenado' : 'Procesando'}
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setAddingPhoto(!addingPhoto)}
                    className="p-2 hover:bg-primary/10 rounded-xl text-slate-400 hover:text-primary transition-all"
                >
                    <ImagePlus className="h-4 w-4" />
                </button>
                <button 
                    onClick={() => {
                         if (window.confirm(`Eliminar a ${identity.name}?`)) router.delete(`/admin/face-detection/identities/${identity.id}`, { preserveScroll: true });
                    }}
                    className="p-2 hover:bg-rose-50 rounded-xl text-slate-300 hover:text-rose-500 transition-all"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {addingPhoto && (
                <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} disabled={uploading} />
                    <div className="text-center">
                         <Badge variant="primary" className="mb-2 animate-bounce">{uploading ? 'SUBIENDO...' : 'NUEVA MUESTRA'}</Badge>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clic para seleccionar imagen</p>
                    </div>
                    <button onClick={() => setAddingPhoto(false)} className="absolute top-2 right-2 p-1 text-slate-300"><X className="h-4 w-4" /></button>
                </div>
            )}
        </div>
    );
}

function CatalogSection({ meta, items = [] }) {
    const Icon = meta.icon;
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{meta.title}</h6>
            </div>
            <div className="space-y-2">
                {items.length > 0 ? items.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-50 bg-white/50 group">
                         <div className="flex items-center gap-3 min-w-0">
                             <div className="h-8 w-8 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                 {item.preview_url ? <img src={item.preview_url} className="h-full w-full object-cover" /> : <Icon className="h-3.5 w-3.5 text-slate-300 m-auto mt-2.5" />}
                             </div>
                             <p className="text-xs font-black text-slate-700 truncate uppercase tracking-tight">{item.name}</p>
                         </div>
                         <button 
                             onClick={() => {
                                 if (window.confirm('Eliminar?')) router.delete(`/admin/face-detection/catalog/${type}/${item.id}`, { preserveScroll: true });
                             }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                         >
                             <Trash2 className="h-3 w-3" />
                         </button>
                    </div>
                )) : <div className="p-4 rounded-xl border-dashed border border-slate-200 text-center text-[10px] text-slate-400 font-bold tracking-widest">SIN DATOS</div>}
            </div>
        </div>
    );
}

function ProjectIAStatus({ project }) {
    return (
        <div className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                    <h6 className="font-black text-sm text-slate-800 truncate uppercase tracking-tight mb-1">{project.name}</h6>
                    <p className="text-[11px] font-medium text-slate-500 truncate">{project.client_name || 'Sin cliente'}</p>
                </div>
                <Badge variant={project.face_recognition_enabled ? 'success' : 'slate'} className="text-[8px] px-1.5 py-0">
                    {project.face_recognition_enabled ? 'IA ACTIVA' : 'MANUAL'}
                </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
                 <div className="p-2 rounded-xl bg-slate-50 text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Fotos</p>
                     <p className="text-xs font-black text-slate-700">{project.photos_count || 0}</p>
                 </div>
                 <div className="p-2 rounded-xl bg-slate-50 text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Ident.</p>
                     <p className="text-xs font-black text-slate-700">{project.local_identities_count || 0}</p>
                 </div>
                 <div className="p-2 rounded-xl bg-slate-50 text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Base</p>
                     <p className="text-xs font-black text-slate-700">{project.database_ready ? 'OK' : '--'}</p>
                 </div>
            </div>
            <Link href={project.workspace_url} className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary group/link transition-colors pt-3 border-t border-slate-50">
                Ver Workspace IA
                <ChevronRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
}

function ModeCard({ title, description, checked, onChange }) {
    return (
        <label className={clsx(
            'block p-5 rounded-[1.8rem] border transition-all duration-300 cursor-pointer group',
            checked ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/10 translate-x-1' : 'bg-white border-slate-100 hover:border-primary/20 hover:bg-primary/5 hover:translate-x-1'
        )}>
            <div className="flex items-start justify-between gap-4">
                <div className="pr-4">
                    <h6 className={clsx('font-black text-sm uppercase tracking-tight mb-2 italic', checked ? 'text-white' : 'text-slate-800')}>
                        {title}
                    </h6>
                    <p className={clsx('text-[11px] font-medium leading-relaxed', checked ? 'text-white/60' : 'text-slate-500')}>
                        {description}
                    </p>
                </div>
                <input type="radio" checked={checked} onChange={onChange} className="mt-1 h-4 w-4 text-primary focus:ring-primary/20 border-slate-200 transition-all" />
            </div>
        </label>
    );
}

function UnknownFaceCard({ detection, identities = [] }) {
    const [mode, setMode] = useState('existing');
    const [selectedIdentityId, setSelectedIdentityId] = useState(detection.best_match_identity_id ? String(detection.best_match_identity_id) : '');
    const [newName, setNewName] = useState('');
    const simPct = detection.best_confidence ? Math.round(detection.best_confidence * 100) : 0;

    const confirm = () => {
        if (!selectedIdentityId) return;
        router.post(`/admin/face-detection/unknowns/${detection.id}/confirm`, { face_identity_id: selectedIdentityId }, { preserveScroll: true });
    };

    const labelNew = () => {
        if (!newName.trim()) return;
        router.post(`/admin/face-detection/unknowns/${detection.id}/name`, { name: newName.trim() }, { preserveScroll: true });
    };

    return (
        <div className="rounded-[2.2rem] bg-white/5 border border-white/5 p-4 flex flex-col gap-4 group hover:bg-white/10 transition-all relative">
            <div className="flex bg-white/5 p-1 rounded-xl text-[8px] font-black uppercase tracking-widest text-white/30">
                 <div className="flex-1 text-center py-1">DETECTION</div>
                 <div className="flex-1 text-center py-1 bg-white/5 rounded-lg border border-white/5 text-primary">VECTOR 512D</div>
                 <div className="flex-1 text-center py-1">COMPARISON</div>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden bg-white/5 aspect-video group/img shadow-2xl">
                 {detection.photo_url && <img src={detection.photo_url} className="h-full w-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity duration-700" />}
                 {detection.bbox && (
                    <div className="absolute border-2 border-primary rounded-xl animate-pulse shadow-[0_0_15px_rgba(23,184,255,0.5)]"
                        style={{ left: `${detection.bbox[0]*100}%`, top: `${detection.bbox[1]*100}%`, width: `${(detection.bbox[2]-detection.bbox[0])*100}%`, height: `${(detection.bbox[3]-detection.bbox[1])*100}%` }}
                    />
                 )}
                 <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                     <Badge variant={simPct >= 60 ? 'success' : 'primary'} className="text-[7px] py-0 px-1 border-none font-black backdrop-blur-md">
                        {simPct >= 60 ? `MATCH ${simPct}%` : 'IDENTITY UNKNOWN'}
                     </Badge>
                     {detection.best_match_name && <p className="text-[7px] text-white/50 font-black uppercase tracking-widest bg-black/50 px-1.5 py-0.5 rounded-lg">PROB: {detection.best_match_name}</p>}
                 </div>
            </div>

            <div className="space-y-3">
                 <div className="flex gap-1.5 p-1 rounded-xl bg-black/30 border border-white/5">
                     <button onClick={() => setMode('existing')} className={clsx('flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all', mode === 'existing' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white')}>Asociar</button>
                     <button onClick={() => setMode('new')} className={clsx('flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all', mode === 'new' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white')}>Nueva</button>
                 </div>

                 {mode === 'existing' ? (
                     <div className="flex gap-2">
                         <select 
                            value={selectedIdentityId} 
                            onChange={e => setSelectedIdentityId(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white/80 font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                         >
                             <option value="">Buscar...</option>
                             {identities.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                         </select>
                         <button onClick={confirm} disabled={!selectedIdentityId} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale">
                             <Check className="h-4 w-4" />
                         </button>
                     </div>
                 ) : (
                     <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                         <input 
                             placeholder="NOMBRE ATLETA"
                             value={newName} 
                             onChange={e => setNewName(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && labelNew()}
                             className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white font-black uppercase outline-none placeholder:text-white/20 focus:ring-2 focus:ring-primary/20 transition-all"
                         />
                         <button onClick={labelNew} disabled={!newName.trim()} className="h-9 w-9 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30">
                             <UserPlus className="h-4 w-4" />
                         </button>
                     </div>
                 )}
            </div>

            <button onClick={() => router.delete(`/admin/face-detection/unknowns/${detection.id}/reject`, { preserveScroll: true })} className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 transition-all shadow-xl">
                 <X className="h-3 w-3" />
            </button>
        </div>
    );
}
