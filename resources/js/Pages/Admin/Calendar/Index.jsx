import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    X, 
    Clock, 
    MapPin, 
    Lock, 
    Camera, 
    MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export default function Index({ events }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const { data, setData, post, reset, processing } = useForm({
        title: '',
        start: '',
        end: '',
        type: 'blocked',
    });

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1));

    const calendarDays = [];
    const totalDays = daysInMonth(year, month);
    const startingDay = firstDayOfMonth(year, month);

    // Filter events for current month
    const getEventsForDay = (day) => {
        return events.filter(event => {
            const date = new Date(event.start);
            return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
        });
    };

    const handleDayClick = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00`;
        setData({ ...data, start: dateStr, end: dateStr });
        setSelectedDate(day);
        setShowModal(true);
    };

    const submitEvent = (e) => {
        e.preventDefault();
        post('/admin/events', {
            onSuccess: () => {
                setShowModal(false);
                reset();
            }
        });
    };

    return (
        <AdminLayout>
            <div className="flex flex-col h-full space-y-10">
                <Head title="Master Agenda & Availability" />
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-heading font-black tracking-tighter mb-2">Agenda <span className="text-primary-400">Master</span></h1>
                        <p className="text-[#666] font-medium tracking-wide">Managing sessions and studio availability</p>
                    </div>

                    <div className="flex items-center space-x-6 bg-[#141414] p-2 rounded-[24px] border border-white/5 shadow-2xl">
                         <div className="flex items-center space-x-4 px-4">
                             <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-all"><ChevronLeft className="w-5 h-5" /></button>
                             <h2 className="text-lg font-heading font-black min-w-[140px] text-center tracking-tighter uppercase">{months[month]} {year}</h2>
                             <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-all"><ChevronRight className="w-5 h-5" /></button>
                         </div>
                         <button 
                            onClick={() => setShowModal(true)}
                            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center shadow-lg shadow-primary-500/20 transition-all"
                         >
                             <Plus className="w-4 h-4 mr-2" /> Block Date
                         </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 bg-[#111]/50 border border-white/5 rounded-[40px] overflow-hidden shadow-3xl flex flex-col min-h-[600px]">
                    <div className="grid grid-cols-7 border-bottom border-white/5 bg-[#0a0a0a]/50">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.3em] text-[#333]">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                        {Array.from({ length: startingDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="border border-white/[0.02] bg-[#0d0d0d]/30" />
                        ))}
                        
                        {Array.from({ length: totalDays }).map((_, i) => {
                            const day = i + 1;
                            const dayEvents = getEventsForDay(day);
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                            return (
                                <motion.div 
                                    key={day} 
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                    onClick={() => handleDayClick(day)}
                                    className={clsx(
                                        "min-h-[120px] p-4 border border-white/[0.03] transition-colors cursor-pointer group flex flex-col items-start relative",
                                        isToday && "bg-primary-500/5"
                                    )}
                                >
                                    <span className={clsx(
                                        "text-sm font-black mb-4",
                                        isToday ? "text-primary-400" : "text-[#444] group-hover:text-white"
                                    )}>
                                        {day}
                                    </span>

                                    <div className="w-full space-y-1.5 overflow-hidden">
                                        {dayEvents.map(event => (
                                            <div 
                                                key={event.id}
                                                className={clsx(
                                                    "px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest truncate flex items-center border",
                                                    event.type === 'session' 
                                                        ? "bg-primary-500/10 text-primary-400 border-primary-500/20" 
                                                        : "bg-accent/10 text-accent border-accent/20"
                                                )}
                                            >
                                                {event.type === 'session' ? <Camera className="w-2 h-2 mr-1.5 shrink-0" /> : <Lock className="w-2 h-2 mr-1.5 shrink-0" />}
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>

                                    {isToday && (
                                         <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-primary-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Event Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#000]/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#141414] border border-white/5 rounded-[40px] w-full max-w-md p-10 shadow-3xl"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-heading font-black tracking-tighter">Manage Schedule</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={submitEvent} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-[#444] tracking-[0.2em] ml-1">Event Title</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={data.title}
                                        onChange={e => setData('title', e.target.value)}
                                        placeholder="Studio Maintenance / Outdoor Session"
                                        className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 text-white placeholder-[#222] focus:ring-1 focus:ring-primary-500/50 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[#444] tracking-[0.2em] ml-1">Start Time</label>
                                        <input 
                                            type="datetime-local" 
                                            required
                                            value={data.start}
                                            onChange={e => setData('start', e.target.value)}
                                            className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 text-white [color-scheme:dark] text-xs outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black text-[#444] tracking-[0.2em] ml-1">End Time</label>
                                        <input 
                                            type="datetime-local" 
                                            required
                                            value={data.end}
                                            onChange={e => setData('end', e.target.value)}
                                            className="w-full bg-[#0d0d0d] border border-white/10 rounded-2xl p-4 text-white [color-scheme:dark] text-xs outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black text-[#444] tracking-[0.2em] ml-1">Event Type</label>
                                    <div className="flex space-x-3">
                                        {['session', 'blocked', 'tentative'].map(t => (
                                            <button 
                                                key={t}
                                                type="button"
                                                onClick={() => setData('type', t)}
                                                className={clsx(
                                                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                                    data.type === t ? 'bg-primary-500 text-white border-primary-500 shadow-lg' : 'bg-white/5 text-[#444] border-white/5 hover:text-white'
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-400 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 mt-4 active:scale-95 transition-all"
                                    disabled={processing}
                                >
                                    {processing ? 'Saving...' : 'Update Master Schedule'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
