import React from 'react';
import { FaFilter, FaTimes } from 'react-icons/fa';

const MAX_DAYS = 30;

const DateRangeFilter = ({ 
    startDate, 
    endDate, 
    onStartChange, 
    onEndChange, 
    onApply, 
    onClear, 
    loading, 
    theme 
}) => {

    const toLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const maxDate = toLocalDateString(new Date());

    return (
        <div className="mb-6 p-4 rounded-xl border flex flex-wrap items-end gap-4 shrink-0 transition-all" 
             style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}>
            
            <div className="flex items-center gap-2 font-semibold opacity-70 text-sm">
                <FaFilter />
                Filtrar por período
                <span className="text-xs font-normal opacity-60">(máx. {MAX_DAYS} días)</span>
            </div>

            <div className="flex flex-wrap items-end gap-3 flex-1">
                <div className="flex flex-col gap-1">
                    <label className="text-xs opacity-60 font-medium">Desde</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => onStartChange(e.target.value)}
                        max={endDate}
                        className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 transition-all"
                        style={{ 
                            backgroundColor: theme.bg, 
                            borderColor: theme.bg3, 
                            color: theme.text,
                            '--tw-ring-color': theme.primary
                        }}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs opacity-60 font-medium">Hasta</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => onEndChange(e.target.value)}
                        min={startDate}
                        max={maxDate}
                        className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 transition-all"
                        style={{ 
                            backgroundColor: theme.bg, 
                            borderColor: theme.bg3, 
                            color: theme.text,
                            '--tw-ring-color': theme.primary 
                        }}
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onApply}
                        disabled={loading}
                        className="px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
                        style={{ backgroundColor: theme.primary || '#6366f1' }}
                    >
                        {loading ? 'Cargando...' : 'Aplicar'}
                    </button>
                    <button
                        onClick={onClear}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg text-sm font-bold border flex items-center gap-1.5 transition-all hover:opacity-70 active:scale-95"
                        style={{ borderColor: theme.bg3, color: theme.text }}
                    >
                        <FaTimes size={11} /> Últimos 7 días
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateRangeFilter;
