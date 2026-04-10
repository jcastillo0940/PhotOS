import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Camera, Lock, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { resolveTenantTheme } from '@/lib/tenantTheme';

export default function Login() {
    const page = usePage().props;
    const { branding, tenant, flash } = page;
    const { palette, headingFont, bodyFont, studioName, studioTagline } = resolveTenantTheme(page);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/login');
    };

    const feedback = errors.auth || flash?.error;

    return (
        <div className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: palette.surface, color: palette.text, fontFamily: bodyFont }}>
            <Head title={`Acceso | ${studioName}`} />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                <div className="mb-10 text-center">
                    {branding?.app_logo_url ? (
                        <img src={branding.app_logo_url} alt={studioName || 'Studio'} className="mx-auto mb-5 h-14 w-14 rounded-full object-cover" />
                    ) : (
                        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: palette.surface_dark }}>
                            <Camera className="h-6 w-6" />
                        </div>
                    )}
                    <h1 className="mb-1 text-2xl font-bold tracking-tight" style={{ color: palette.text, fontFamily: headingFont }}>{studioName}</h1>
                    <p className="text-sm" style={{ color: palette.muted }}>{studioTagline || 'Acceso al panel del estudio'}</p>
                    {tenant?.name && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.accent }}>
                            Acceso privado de {tenant.name}
                        </p>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-5 rounded-3xl border bg-white p-8 shadow-sm" style={{ borderColor: palette.accent_soft }}>
                    {feedback && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {feedback}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: palette.accent }}>
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: palette.muted }} />
                            <input
                                type="email"
                                name="email"
                                autoComplete="username"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                placeholder="tu@email.com"
                                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                                style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt, color: palette.text }}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: palette.accent }}>
                            Contrasena
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: palette.muted }} />
                            <input
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                placeholder="********"
                                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                                style={{ borderColor: palette.accent_soft, backgroundColor: palette.surface_alt, color: palette.text }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="h-4 w-4 rounded"
                            style={{ accentColor: palette.accent }}
                        />
                        <label htmlFor="remember" className="cursor-pointer text-sm" style={{ color: palette.muted }}>
                            Recordar dispositivo
                        </label>
                    </div>

                    <button
                        disabled={processing}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: palette.surface_dark }}
                    >
                        {processing ? 'Verificando...' : 'Ingresar'}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </form>

                <div className="mt-8 flex items-center justify-center gap-5">
                    <div className="flex items-center gap-1.5" style={{ color: palette.muted }}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-xs">Sesion protegida</span>
                    </div>
                    <div className="h-3 w-px" style={{ backgroundColor: palette.accent_soft }} />
                    <div className="flex items-center gap-1.5" style={{ color: palette.muted }}>
                        <Camera className="h-3.5 w-3.5" />
                        <span className="text-xs">{tenant?.slug || 'white-label'}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
