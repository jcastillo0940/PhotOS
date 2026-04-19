import React from 'react';
import { clsx } from 'clsx';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

// --- LAYOUT COMPONENTS ---

export function Card({ children, className, title, subtitle, headerAction, noPadding = false }) {
    return (
        <div className={clsx('overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md', className)}>
            {(title || subtitle || headerAction) && (
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        {title && <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>}
                        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                    </div>
                    {headerAction && <div>{headerAction}</div>}
                </div>
            )}
            <div className={clsx(!noPadding && 'px-6 py-5')}>{children}</div>
        </div>
    );
}

export function StatsCard({ title, value, trend, trendValue, icon: Icon, color = 'primary' }) {
    const colors = {
        primary: 'text-primary bg-primary/10',
        success: 'text-green-500 bg-green-50',
        warning: 'text-amber-500 bg-amber-50',
        danger: 'text-red-500 bg-red-50',
        info: 'text-sky-500 bg-sky-50',
    };

    return (
        <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-800">{value}</h3>
                    {trend && (
                        <div className="mt-2 flex items-center gap-1.5">
                            {trend === 'up' ? (
                                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                            )}
                            <span className={clsx('text-xs font-bold', trend === 'up' ? 'text-green-500' : 'text-red-500')}>
                                {trendValue}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={clsx('flex h-12 w-12 items-center justify-center rounded-2xl', colors[color])}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </Card>
    );
}

// --- NAVIGATION & INTERACTION ---

export function Tabs({ tabs, activeTab, onChange }) {
    return (
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (activeTab === tab.id || !tab.hidden) && (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={clsx(
                        'relative px-6 py-4 text-sm font-bold transition-all whitespace-nowrap',
                        activeTab === tab.id 
                            ? 'text-primary' 
                            : 'text-slate-500 hover:text-slate-800'
                    )}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );
}

export function Drawer({ isOpen, onClose, title, children, width = 'max-w-md' }) {
    return (
        <>
            <div 
                className={clsx(
                    'fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />
            <div 
                className={clsx(
                    'fixed top-0 right-0 z-[101] h-full w-full bg-white shadow-2xl transition-transform duration-300 ease-in-out',
                    width,
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}

// --- FORM & ACTION COMPONENTS ---

export function Button({ 
    children, 
    className, 
    variant = 'primary', 
    size = 'md', 
    icon: Icon, 
    loading = false,
    ...props 
}) {
    const variants = {
        primary: 'bg-primary text-white shadow-lg shadow-primary/20 hover:opacity-90',
        secondary: 'bg-slate-800 text-white shadow-lg shadow-slate-800/20 hover:bg-slate-900',
        outline: 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
        ghost: 'text-slate-600 hover:bg-slate-100',
        success: 'bg-green-500 text-white hover:bg-green-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-5 py-2.5 text-sm gap-2',
        lg: 'px-7 py-3.5 text-base gap-3',
    };

    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center font-bold transition-all rounded-lg active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : Icon && (
                <Icon className={clsx(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            )}
            {children}
        </button>
    );
}

export function Badge({ children, variant = 'slate', className }) {
    const variants = {
        slate: 'bg-slate-100 text-slate-700',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-green-100 text-green-700',
        danger: 'bg-red-100 text-red-700',
        warning: 'bg-amber-100 text-amber-700',
        info: 'bg-sky-100 text-sky-700',
    };

    return (
        <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', variants[variant], className)}>
            {children}
        </span>
    );
}

const ReactApexChart = lazy(() => import('react-apexcharts'));

export function Chart({ options, series, type = 'area', height = 350 }) {
    return (
        <div className="w-full">
            <Suspense fallback={<div className="h-[350px] w-full animate-pulse rounded-xl bg-slate-50" />}>
                <ReactApexChart 
                    options={{
                        ...options,
                        chart: { ...options?.chart, toolbar: { show: false }, zoom: { enabled: false } },
                        colors: options?.colors || ['#02c0ce', '#fb6d9d', '#ffaa00'],
                        stroke: { curve: 'smooth', width: 2, ...options?.stroke },
                        fill: {
                            type: 'gradient',
                            gradient: {
                                shadeIntensity: 1,
                                opacityFrom: 0.45,
                                opacityTo: 0.05,
                                stops: [20, 100, 100, 100]
                            },
                        },
                    }} 
                    series={series} 
                    type={type} 
                    height={height} 
                />
            </Suspense>
        </div>
    );
}

export function Input({ label, error, className, icon: Icon, ...props }) {
    return (
        <div className="space-y-1.5 w-full">
            {label && <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">{label}</label>}
            <div className="relative">
                {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
                <input
                    className={clsx(
                        'w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10',
                        Icon ? 'pl-11 pr-4' : 'px-4',
                        error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="text-[11px] text-red-500 font-bold ml-1">{error}</p>}
        </div>
    );
}
