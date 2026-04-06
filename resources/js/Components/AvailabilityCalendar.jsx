import React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { buildSlots, getMonthGrid, isDateUnavailable, toIsoDate } from '@/lib/availability';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

export default function AvailabilityCalendar({
    label,
    value,
    onChange,
    error,
    busyEvents = [],
    businessHours,
    availabilitySettings,
    helperText,
    tone = 'admin',
}) {
    const initialMonth = React.useMemo(() => {
        if (value) {
            const selected = new Date(`${value}T00:00:00`);
            if (!Number.isNaN(selected.getTime())) {
                return selected;
            }
        }

        return new Date();
    }, [value]);

    const [currentMonth, setCurrentMonth] = React.useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        if (!value) return;

        const selected = new Date(`${value}T00:00:00`);
        if (!Number.isNaN(selected.getTime())) {
            setCurrentMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
        }
    }, [value]);

    React.useEffect(() => {
        if (!isOpen) return undefined;

        const handleOutsideClick = (event) => {
            if (!containerRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    const monthCells = React.useMemo(() => getMonthGrid(currentMonth), [currentMonth]);
    const selectedSlots = React.useMemo(
        () => buildSlots(value, busyEvents, businessHours, availabilitySettings),
        [value, busyEvents, businessHours, availabilitySettings],
    );

    const palette = tone === 'public'
        ? {
            field: 'border-[#e6dbcf] bg-[#faf6f1] text-[#241b16]',
            fieldIcon: 'text-[#8b6d54]',
            active: 'bg-[#241b16] text-white',
            disabled: 'text-[#c7b9ab] bg-transparent',
            available: 'text-[#241b16] hover:border-[#241b16] hover:bg-white',
            label: 'text-[#8b6d54]',
            current: 'border-[#c9af95]',
            icon: 'text-[#8b6d54] hover:border-[#e6dbcf] hover:bg-white',
            title: 'text-[#241b16]',
            helper: 'text-[#8b6d54]',
            panel: 'border-[#e6dbcf] bg-white shadow-[0_22px_60px_rgba(60,40,24,.14)]',
        }
        : {
            field: 'border-slate-200 bg-slate-50 text-slate-800',
            fieldIcon: 'text-slate-500',
            active: 'bg-slate-900 text-white',
            disabled: 'text-slate-300 bg-transparent',
            available: 'text-slate-800 hover:border-slate-400 hover:bg-white',
            label: 'text-slate-500',
            current: 'border-primary-300',
            icon: 'text-slate-500 hover:border-slate-200 hover:bg-white',
            title: 'text-slate-800',
            helper: 'text-slate-500',
            panel: 'border-slate-200 bg-white shadow-xl',
        };

    const formattedValue = value
        ? new Date(`${value}T00:00:00`).toLocaleDateString('es-PA', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        })
        : 'Selecciona una fecha';

    return (
        <div ref={containerRef} className="relative space-y-2">
            <label className={clsx('block text-xs font-semibold uppercase tracking-[0.18em]', palette.label)}>{label}</label>

            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                className={clsx(
                    'flex w-full items-center justify-between rounded-[1.2rem] border px-4 py-3 text-left text-sm transition',
                    palette.field
                )}
            >
                <span className="flex items-center gap-3">
                    <CalendarDays className={clsx('h-4 w-4', palette.fieldIcon)} />
                    <span>{formattedValue}</span>
                </span>
                <span className={clsx('text-xs font-semibold uppercase tracking-[0.18em]', palette.fieldIcon)}>
                    {isOpen ? 'Cerrar' : 'Abrir'}
                </span>
            </button>

            {isOpen && (
                <div className={clsx('absolute left-0 top-full z-40 mt-3 w-full rounded-[1.5rem] border p-4', palette.panel)}>
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                            className={clsx('rounded-full border border-transparent p-2 transition', palette.icon)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <p className={clsx('text-sm font-semibold', palette.title)}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>
                        <button
                            type="button"
                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                            className={clsx('rounded-full border border-transparent p-2 transition', palette.icon)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 text-center">
                        {DAYS.map((day) => (
                            <div key={day} className={clsx('text-[11px] font-semibold uppercase tracking-[0.18em]', palette.label)}>{day}</div>
                        ))}

                        {monthCells.map((cell, index) => {
                            if (!cell) {
                                return <div key={`empty-${index}`} className="h-11" />;
                            }

                            const isSelected = value === cell.iso;
                            const isToday = cell.iso === toIsoDate(new Date());
                            const disabled = isDateUnavailable(cell.iso, busyEvents, businessHours, availabilitySettings);

                            return (
                                <button
                                    key={cell.iso}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                        onChange(cell.iso);
                                        setIsOpen(false);
                                    }}
                                    className={clsx(
                                        'h-11 rounded-2xl border text-sm font-medium transition',
                                        isSelected && palette.active,
                                        !isSelected && disabled && palette.disabled,
                                        !isSelected && !disabled && palette.available,
                                        isToday && !isSelected && palette.current,
                                        disabled ? 'cursor-not-allowed border-transparent' : 'border-transparent'
                                    )}
                                    title={disabled ? 'Sin disponibilidad' : `${cell.day} con horarios disponibles`}
                                >
                                    {cell.day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {helperText && <p className={clsx('text-xs', palette.helper)}>{helperText}</p>}
            {value && selectedSlots.length === 0 && <p className="text-sm text-amber-600">Ese dia ya no tiene horas disponibles. Elige otra fecha.</p>}
            {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
    );
}
