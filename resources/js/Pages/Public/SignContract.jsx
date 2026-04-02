import React, { useRef, useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Camera, ShieldCheck, PenTool, Eraser, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignContract({ contract }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        signature_data: '',
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        setData('signature_data', canvas.toDataURL());
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setData('signature_data', '');
    };

    const submitSignature = (e) => {
        e.preventDefault();
        post(`/sign/${contract.token}`);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 relative overflow-hidden flex items-center justify-center">
             {/* Background blur */}
             <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-primary-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 -left-1/4 w-96 h-96 bg-accent/5 blur-[150px] rounded-full" />
            </div>

            <Head title="Sign Professional Services Agreement" />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl bg-[#111] border border-white/5 rounded-[40px] shadow-3xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto"
            >
                {/* Left: Document View */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar bg-[#0d0d0d]">
                    <div className="flex items-center space-x-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                             <h1 className="text-xl font-heading font-black tracking-tight leading-none">PhotOS Legal</h1>
                             <p className="text-[10px] text-[#444] uppercase font-bold tracking-[0.2em] mt-1">E-Signature Platform</p>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none text-white/70 leading-relaxed font-light" 
                         dangerouslySetInnerHTML={{ __html: contract.content }}>
                    </div>
                </div>

                {/* Right: Signature Panel */}
                <div className="w-full md:w-[400px] p-8 bg-[#141414] border-l border-white/5 flex flex-col justify-between">
                     <div>
                        <h2 className="text-2xl font-heading font-black tracking-tighter mb-4">Finalize Agreement</h2>
                        <p className="text-sm text-[#666] leading-loose mb-10">
                            By signing below, you agree to the terms provided by the photographer. This is a legally binding electronic signature.
                        </p>

                        <div className="space-y-4">
                            <label className="text-[10px] uppercase font-black text-[#444] tracking-[0.3em] block">Draw Your Signature</label>
                            <div className="relative bg-[#0d0d0d] rounded-2xl border border-dashed border-white/10 group overflow-hidden">
                                <canvas 
                                    ref={canvasRef}
                                    width={336}
                                    height={200}
                                    className="cursor-crosshair w-full h-[200px]"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                { !data.signature_data && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[#222] pointer-events-none transition-opacity group-hover:opacity-100">
                                        <PenTool className="w-10 h-10 mb-2 opacity-5" />
                                        <p className="text-[10px] uppercase tracking-widest font-black opacity-20">Sign Here</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    onClick={clearSignature}
                                    className="text-[10px] font-bold uppercase tracking-widest text-[#444] hover:text-accent transition-colors flex items-center"
                                >
                                    <Eraser className="w-3 h-3 mr-2" /> Clear Signature
                                </button>
                            </div>
                        </div>
                     </div>

                     <div className="mt-12 space-y-4">
                        <div className="p-4 bg-primary-500/5 rounded-2xl flex items-center space-x-4 border border-primary-500/10">
                            <CheckCircle2 className="w-5 h-5 text-primary-400" />
                            <p className="text-[10px] text-primary-400/70 font-medium leading-normal italic">
                                Your IP and Timestamp will be recorded upon submission for legal verification.
                            </p>
                        </div>
                        <form onSubmit={submitSignature}>
                            <button 
                                disabled={processing || !data.signature_data}
                                className={clsx(
                                    "w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center",
                                    (processing || !data.signature_data) 
                                        ? "bg-white/5 text-[#333] cursor-not-allowed" 
                                        : "bg-gradient-to-r from-primary-600 to-primary-400 text-white shadow-lg shadow-primary-500/20 active:scale-95"
                                )}
                            >
                                {processing ? 'Verifying...' : 'Finalize & Sign Now'}
                            </button>
                        </form>
                     </div>
                </div>
            </motion.div>
        </div>
    );
}
