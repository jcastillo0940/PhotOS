import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Camera, Lock, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-6">
            <Head title="Acceso | PhotOS Admin" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                <div className="mb-10 text-center">
                    <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500">
                        <Camera className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="mb-1 text-2xl font-bold tracking-tight text-slate-800">PhotOS Admin</h1>
                    <p className="text-sm text-slate-500">Acceso al panel del estudio</p>
                </div>

                <form onSubmit={submit} className="space-y-5 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
                    {errors.auth && (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {errors.auth}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                placeholder="tu@email.com"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Contrasena
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                placeholder="********"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={data.remember}
                            onChange={(event) => setData('remember', event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500/20"
                        />
                        <label htmlFor="remember" className="cursor-pointer text-sm text-slate-500">
                            Recordar dispositivo
                        </label>
                    </div>

                    <button
                        disabled={processing}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
                    >
                        {processing ? 'Verificando...' : 'Ingresar'}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </form>

                <div className="mt-8 flex items-center justify-center gap-5 text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-xs">Sesion protegida</span>
                    </div>
                    <div className="h-3 w-px bg-slate-300" />
                    <div className="flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5" />
                        <span className="text-xs">Single tenant</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
