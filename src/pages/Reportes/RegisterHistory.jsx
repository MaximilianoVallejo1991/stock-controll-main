import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  FaCalendarAlt,
  FaUserTie,
  FaChevronDown,
  FaChevronUp,
  FaMoneyBillWave,
  FaCreditCard,
  FaExchangeAlt,
  FaFileExcel,
} from "react-icons/fa";
import { SaleDetail } from "../sales/SaleDetail";
import DateRangeFilter from "../../components/Filters/DateRangeFilter";
import { downloadExcel } from "../../utils/exportHelper";

const MAX_DAYS = 30;

function toLocalDateString(date) {
    return format(date, "yyyy-MM-dd");
}

export const RegisterHistory = () => {
    const { theme } = useTheme();
    const [registers, setRegisters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    // Default: last 7 days
    const [startDate, setStartDate] = useState(() => toLocalDateString(subDays(new Date(), 7)));
    const [endDate, setEndDate] = useState(() => toLocalDateString(new Date()));
    const [filterError, setFilterError] = useState(null);

    const fetchRegisters = useCallback(async (start, end) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/caja/registers", {
                params: { startDate: start, endDate: end },
                withCredentials: true,
            });
            setRegisters(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || "Error al cargar el historial de cajas.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegisters(startDate, endDate);
    }, []);  // Only on mount

    const validateRange = (start, end) => {
        if (!start || !end) return "Debes seleccionar ambas fechas.";
        const diffDays = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) return "La fecha de inicio no puede ser posterior a la fecha de fin.";
        if (diffDays > MAX_DAYS) return `El período máximo permitido es de ${MAX_DAYS} días.`;
        return null;
    };

    const handleApply = () => {
        const err = validateRange(startDate, endDate);
        if (err) { setFilterError(err); return; }
        setFilterError(null);
        fetchRegisters(startDate, endDate);
    };

    const handleClear = () => {
        const defaultStart = toLocalDateString(subDays(new Date(), 7));
        const defaultEnd = toLocalDateString(new Date());
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
        setFilterError(null);
        fetchRegisters(defaultStart, defaultEnd);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await downloadExcel(
                '/api/caja/registers/export',
                { startDate, endDate },
                `turnos_${startDate}_${endDate}.xlsx`
            );
        } catch {
            alert('Error al exportar. Intentá de nuevo.');
        } finally {
            setIsExporting(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    const handleSaleClick = async (orderId) => {
        try {
            const res = await axios.get(`http://localhost:3000/api/sales/${orderId}`);
            setSelectedSale(res.data);
        } catch (err) {
            console.error("Error fetching sale details:", err);
            alert("No se pudo cargar el detalle de la venta.");
        }
    };

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>

            {/* HEADER */}
            <div className="mb-4 flex justify-between items-end border-b pb-4 shrink-0" style={{ borderColor: theme.bg3 }}>
                <div>
                    <h1 className="text-3xl font-bold mb-1">Historial de Turnos y Arqueos</h1>
                    <p className="opacity-70 text-sm">Registro completo de cajas, aperturas, cierres y balances separados por método de pago.</p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={isExporting || loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#16a34a', color: '#fff' }}
                    title="Exportar movimientos de caja a Excel"
                >
                    <FaFileExcel size={14} />
                    {isExporting ? 'Exportando...' : 'Excel'}
                </button>
            </div>

            <DateRangeFilter 
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                onApply={handleApply}
                onClear={handleClear}
                loading={loading}
                theme={theme}
            />

            {filterError && (
                <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm font-medium border border-red-200">
                    {filterError}
                </div>
            )}

            {/* CONTENT */}
            {loading ? (
                <div className="p-8 text-center italic opacity-60">Cargando historial de turnos...</div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 font-bold">{error}</div>
            ) : (
                <div className="flex flex-col gap-6">
                    {registers.length === 0 ? (
                        <div className="p-12 text-center opacity-50 italic border rounded-xl" style={{ borderColor: theme.bg3 }}>
                            No hay registros de cajas en el período seleccionado.
                        </div>
                    ) : (
                        registers.map((reg) => {
                            const isExpanded = expandedId === reg.id;
                            const t = reg.totals;

                            const fisicoExpected = reg.openingAmount + t.ventasEfectivo + t.ingresosManuales - t.retirosManuales;
                            const isClosed = reg.status === 'CLOSED';
                            const difference = isClosed ? reg.difference : null;

                            return (
                                <div key={reg.id} className="rounded-xl shadow-lg border overflow-hidden flex flex-col transition-all" style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}>

                                    {/* HEADER - Info general del Turno */}
                                    <div
                                        className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                        onClick={() => toggleExpand(reg.id)}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${isClosed ? 'bg-gray-500 text-white' : 'animate-pulse'}`} style={!isClosed ? { backgroundColor: theme.success, color: '#fff' } : {}}>
                                                    {isClosed ? 'Cerrada' : 'Activa'}
                                                </span>
                                                <h3 className="font-bold text-lg flex items-center gap-2">
                                                    <FaCalendarAlt className="opacity-60" />
                                                    Turno: {format(new Date(reg.openedAt), "dd MMM yyyy - HH:mm", { locale: es })}
                                                </h3>

                                                {isClosed && difference !== null && difference !== 0 && (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${difference < 0 ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' : 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'}`}>
                                                        {difference < 0 ? `Faltante: -$${Math.abs(difference).toFixed(2)}` : `Excedente: +$${difference.toFixed(2)}`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm opacity-80">
                                                <FaUserTie />
                                                <span>Abierto por: <b>{reg.openedByUser?.firstName} {reg.openedByUser?.lastName}</b></span>
                                                {isClosed && (
                                                    <span className="ml-2 pl-2 border-l border-current">
                                                        Cerrado por: <b>{reg.closedByUser?.firstName} {reg.closedByUser?.lastName}</b> a las {format(new Date(reg.closedAt), "HH:mm")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-2xl opacity-50 hidden md:block">
                                            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                        </div>
                                    </div>

                                    {/* BLOCKS CAJAS */}
                                    {isExpanded && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-black/10 dark:bg-white/5 p-1">

                                            {/* CAJA FÍSICA (EFECTIVO) */}
                                            <div className="flex flex-col p-4 rounded-lg shadow-inner gap-2" style={{ backgroundColor: theme.bg }}>
                                                <div className="flex items-center gap-2 font-bold mb-2 pb-2 border-b" style={{ borderColor: theme.bg3, color: theme.success }}>
                                                    <FaMoneyBillWave size={18} /> EFECTIVO (FÍSICO)
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="opacity-70">Apertura (Base):</span>
                                                    <span className="font-mono">${reg.openingAmount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="opacity-70">Ventas Registradas:</span>
                                                    <span className="font-mono text-green-600">+${t.ventasEfectivo.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="opacity-70">Ingresos Manuales:</span>
                                                    <span className="font-mono text-green-600">+${t.ingresosManuales.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="opacity-70">Retiros/Gastos:</span>
                                                    <span className="font-mono text-red-500">-${t.retirosManuales.toFixed(2)}</span>
                                                </div>

                                                <div className="mt-2 pt-2 border-t flex flex-col gap-1" style={{ borderColor: theme.bg3 }}>
                                                    <div className="flex justify-between font-bold">
                                                        <span>Esperado Sistema:</span>
                                                        <span className="font-mono">${fisicoExpected.toFixed(2)}</span>
                                                    </div>
                                                    {isClosed && (
                                                        <>
                                                            <div className="flex justify-between font-bold">
                                                                <span>Arqueo Declarado:</span>
                                                                <span className="font-mono">${reg.closingAmount.toFixed(2)}</span>
                                                            </div>
                                                            <div className={`flex flex-col gap-1 px-2 py-1 rounded mt-1 ${difference === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                                <div className="flex justify-between font-bold text-sm">
                                                                    <span>Discrepancia:</span>
                                                                    <span className="font-mono">
                                                                        {difference === 0 ? 'Cuadrada' : difference < 0 ? `Faltante: -$${Math.abs(difference).toFixed(2)}` : `Excedente: +$${difference.toFixed(2)}`}
                                                                    </span>
                                                                </div>
                                                                {reg.observation && (
                                                                    <div className="text-xs pt-1 border-t border-current opacity-90 italic">
                                                                        <b>Obs:</b> {reg.observation}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* CAJA TRANSFERENCIAS */}
                                            <div className="flex flex-col p-4 rounded-lg shadow-inner gap-2 h-full" style={{ backgroundColor: theme.bg }}>
                                                <div className="flex items-center gap-2 font-bold mb-2 pb-2 border-b text-blue-500" style={{ borderColor: theme.bg3 }}>
                                                    <FaExchangeAlt size={18} /> TRANSFERENCIAS
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center items-center">
                                                    <span className="text-sm opacity-70 mb-1">Total Ingresos:</span>
                                                    <span className="text-2xl font-mono font-bold text-blue-500">${t.ventasTransferencia.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            {/* CAJA TARJETAS */}
                                            <div className="flex flex-col p-4 rounded-lg shadow-inner gap-2 h-full" style={{ backgroundColor: theme.bg }}>
                                                <div className="flex items-center gap-2 font-bold mb-2 pb-2 border-b text-orange-500" style={{ borderColor: theme.bg3 }}>
                                                    <FaCreditCard size={18} /> TARJETAS
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center items-center">
                                                    <span className="text-sm opacity-70 mb-1">Total Ingresos:</span>
                                                    <span className="text-2xl font-mono font-bold text-orange-500">${t.ventasTarjeta.toFixed(2)}</span>
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {/* LISTA DETALLADA (Expandible) */}
                                    {isExpanded && (
                                        <div className="p-4 md:p-6 border-t" style={{ borderColor: theme.bg3, backgroundColor: theme.bgcards }}>
                                            <h4 className="font-bold mb-4 opacity-80">Detalle Desglosado del Turno</h4>
                                            <div className="max-h-96 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">

                                                {[
                                                    ...reg.orders.map(o => ({ ...o, isOrder: true, date: new Date(o.orderDate || o.createdAt) })),
                                                    ...reg.cashMovements.map(m => ({ ...m, isOrder: false, date: new Date(m.createdAt) }))
                                                ].sort((a, b) => b.date - a.date).map((item, idx) => {

                                                    let label = '';
                                                    let isIncome = true;
                                                    let method = '';
                                                    let colorClass = '';
                                                    let badgeClass = '';

                                                    if (item.isOrder) {
                                                        label = 'VENTA POS';
                                                        method = item.paymentMethod || 'Efectivo';
                                                        if (method === 'Efectivo') badgeClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                                                        if (method === 'Transferencia') badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                                                        if (method === 'Tarjeta') badgeClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
                                                        colorClass = 'text-green-600';
                                                    } else {
                                                        label = 'MOV. MANUAL';
                                                        method = item.type === 'INCOME' ? 'Ingreso Físico' : 'Retiro Físico';
                                                        isIncome = item.type === 'INCOME';
                                                        badgeClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                                                        colorClass = isIncome ? 'text-green-600' : 'text-red-500';
                                                    }

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`flex justify-between items-center p-3 rounded-lg border text-sm transition-colors ${item.isOrder ? 'hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer hover:border-current' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                                                            style={{ borderColor: theme.bg3 }}
                                                            onClick={() => { if (item.isOrder) handleSaleClick(item.id); }}
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex gap-2 items-center">
                                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                        {label}
                                                                    </span>
                                                                    <span className="opacity-60 text-xs">{format(item.date, "HH:mm:ss")}</span>
                                                                </div>
                                                                <div className="opacity-80">
                                                                    {item.isOrder ? `Venta #${item.id.slice(-6)} - Pago: ${method}` : `Motivo: ${item.description || "N/A"} (${method})`}
                                                                </div>
                                                            </div>
                                                            <div className={`font-mono font-bold text-base ${colorClass}`}>
                                                                {isIncome ? '+' : '-'}${item.amount || item.amoutPayed}
                                                            </div>
                                                        </div>
                                                    )
                                                })}

                                                {reg.orders.length === 0 && reg.cashMovements.length === 0 && (
                                                    <div className="text-center opacity-50 py-4 italic">No hubo movimientos registrados en este turno.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            <SaleDetail
                isOpen={!!selectedSale}
                onClose={() => setSelectedSale(null)}
                saleData={selectedSale}
            />
        </div>
    );
};
