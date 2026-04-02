import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Mail, Lock, ArrowRight, ShieldCheck, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
            <Head title="Acceso — Client Gallery" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="w-12 h-12 bg-primary-500 rounded-full mx-auto flex items-center justify-center mb-5">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-1">Client Gallery</h1>
                    <p className="text-sm text-slate-500">Panel de administración</p>
                </div>

                <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all"
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 outline-none transition-all"
                            />
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500/20"
                        />
                        <label htmlFor="remember" className="text-sm text-slate-500 cursor-pointer">
                            Recordar dispositivo
                        </label>
                    </div>

                    <button
                        disabled={processing}
                        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold mt-2 transition-colors flex items-center justify-center gap-2"
                    >
                        {processing ? 'Verificando...' : 'Ingresar'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-8 text-center flex items-center justify-center gap-5 text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-xs">Cifrado global</span>
                    </div>
                    <div className="w-px h-3 bg-slate-300" />
                    <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" />
                        <span className="text-xs">Single-tenant</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
