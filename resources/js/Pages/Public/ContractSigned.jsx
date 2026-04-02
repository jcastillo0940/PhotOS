import React from 'react';
import { Head } from '@inertiajs/react';
import { CheckCircle2, ShieldCheck, Download, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContractSigned({ contract }) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 relative overflow-hidden">
             {/* Aesthetics */}
             <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/5 blur-[150px] rounded-full" />
             </div>

             <Head title="Contract Signed & Verified" />

             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-xl text-center bg-[#111] p-12 md:p-20 rounded-[60px] border border-white/5 shadow-3xl"
             >
                 <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 text-green-500 mb-10 border border-green-500/30">
                     <CheckCircle2 className="w-12 h-12" />
                 </div>

                 <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tighter text-white mb-6">Agreement Verified</h1>
                 <p className="text-[#888] text-lg mb-12 leading-relaxed">
                     Thank you. Your digital signature has been legally recorded and a confirmation has been sent to your email.
                 </p>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center">
                         <ShieldCheck className="w-6 h-6 text-primary-400 mb-3" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">E-Signature ID</span>
                         <span className="text-white text-xs font-mono font-bold truncate w-full px-4">{contract.token.substring(0, 15)}...</span>
                     </div>
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col items-center">
                         <Mail className="w-6 h-6 text-primary-400 mb-3" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[#444] mb-2">Notice Sent To</span>
                         <span className="text-white text-xs font-bold">{contract.project?.lead?.email || 'Your Email'}</span>
                     </div>
                 </div>

                 <button className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-400 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 mb-6">
                     Download Copy (PDF)
                 </button>
                 <p className="text-[#333] text-[10px] font-bold uppercase tracking-widest">PhotOS Legal Verification Service</p>
             </motion.div>
        </div>
    );
}
