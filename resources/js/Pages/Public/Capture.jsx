import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Calendar, Mail, User, ChevronRight, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function Capture() {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: '',
        email: '',
        event_type: 'Wedding',
        tentative_date: '',
    });

    const [step, setStep] = useState(1);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/leads');
    };

    const eventTypes = ['Wedding', 'Portrait', 'Commercial', 'Event', 'Other'];

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.1 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden selection:bg-primary-500/30">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50" />
            </div>

            <Head title="Start Your Journey" />

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 w-full max-w-xl"
            >
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <motion.div 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 mb-6 shadow-xl shadow-primary-500/20"
                    >
                        <Camera className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight mb-3">
                        Phot<span className="text-primary-400">OS</span>
                    </h1>
                    <p className="text-[#a0a0a0] text-lg font-light tracking-wide max-w-md mx-auto">
                        Elevate your perspective. Let's capture the moments that define you.
                    </p>
                </div>

                <div className="bg-[#141414]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <AnimatePresence mode="wait">
                        {!recentlySuccessful ? (
                            <motion.form 
                                key="form"
                                variants={containerVariants}
                                onSubmit={handleSubmit}
                                className="space-y-6"
                            >
                                {/* Name Input */}
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-[0.2em] text-[#666] font-semibold ml-1">Your Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-[#444] group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Jeremy Castillo"
                                            className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                                            required
                                        />
                                    </div>
                                    {errors.name && <p className="text-accent text-sm mt-1">{errors.name}</p>}
                                </div>

                                {/* Email & Type Selection */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-[0.2em] text-[#666] font-semibold ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-[#444] group-focus-within:text-primary-400 transition-colors" />
                                            </div>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                placeholder="jeremy@example.com"
                                                className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300"
                                                required
                                            />
                                        </div>
                                        {errors.email && <p className="text-accent text-sm mt-1">{errors.email}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-[0.2em] text-[#666] font-semibold ml-1">Event Type</label>
                                        <select
                                            value={data.event_type}
                                            onChange={e => setData('event_type', e.target.value)}
                                            className="block w-full px-4 py-4 bg-[#1a1a1a] border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 appearance-none"
                                        >
                                            {eventTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Date Input */}
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-[0.2em] text-[#666] font-semibold ml-1">Tentative Date (Optional)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Calendar className="h-5 w-5 text-[#444] group-focus-within:text-primary-400 transition-colors" />
                                        </div>
                                        <input
                                            type="date"
                                            value={data.tentative_date}
                                            onChange={e => setData('tentative_date', e.target.value)}
                                            className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-[#444] focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-300 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full group relative flex items-center justify-center py-5 px-6 rounded-2xl text-white font-bold tracking-wider overflow-hidden transition-all duration-500"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400" />
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                                    
                                    <span className="relative flex items-center">
                                        {processing ? 'Processing...' : 'Secure Your Date'}
                                        {!processing && <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                                    </span>
                                </button>

                                <p className="text-center text-[#444] text-[10px] uppercase tracking-widest leading-relaxed">
                                    Zero Friction Capture • Privacy First • Instant Qualified Response
                                </p>
                            </motion.form>
                        ) : (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10"
                            >
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-500/20 text-primary-400 mb-6 border border-primary-500/30">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-heading font-bold text-white mb-4">Request Received</h2>
                                <p className="text-[#a0a0a0] text-lg max-w-xs mx-auto leading-relaxed">
                                    Thank you, <span className="text-white font-semibold">{data.name}</span>. We've sent a qualification link to your email.
                                </p>
                                <motion.div 
                                    animate={{ y: [0, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 4 }}
                                    className="mt-12 text-[#666] text-xs uppercase tracking-widest"
                                >
                                    Check your inbox to finalize your profile
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}

Capture.layout = (page) => page;
