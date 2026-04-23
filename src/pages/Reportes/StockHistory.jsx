import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { FaBoxOpen, FaUserTie, FaExchangeAlt, FaArrowRight, FaHashtag, FaInfoCircle, FaFileExcel } from "react-icons/fa";
import { SaleDetail } from "../sales/SaleDetail";
import MessageModal from "../../components/Modals/MessageModal";
import DateRangeFilter from "../../components/Filters/DateRangeFilter";
import { downloadExcel } from "../../utils/exportHelper";

const MAX_DAYS = 30;

function toLocalDateString(date) {
    return format(date, "yyyy-MM-dd");
}

export const StockHistory = () => {
    const { theme } = useTheme();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
    const [selectedAdjustDetail, setSelectedAdjustDetail] = useState(null);

    // Default: last 7 days
    const [startDate, setStartDate] = useState(() => toLocalDateString(subDays(new Date(), 7)));
    const [endDate, setEndDate] = useState(() => toLocalDateString(new Date()));
    const [filterError, setFilterError] = useState(null);

    const fetchHistory = useCallback(async (start, end) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get("/api/stock-history", {
                params: { startDate: start, endDate: end },
                withCredentials: true,
            });
            setHistory(res.data);
        } catch (err) {
            const msg = err.response?.data?.error || "Error al cargar el historial de stock.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(startDate, endDate);
    }, []);  // Only on mount — user applies manually after that

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
        fetchHistory(startDate, endDate);
    };

    const handleClear = () => {
        const defaultStart = toLocalDateString(subDays(new Date(), 7));
        const defaultEnd = toLocalDateString(new Date());
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
        setFilterError(null);
        fetchHistory(defaultStart, defaultEnd);
    };

    const handleExport = async () => {
        const err = validateRange(startDate, endDate);
        if (err) { setFilterError(err); return; }
        setIsExporting(true);
        try {
            await downloadExcel('/api/stock-history/export', { startDate, endDate }, `historial_stock_${startDate}_${endDate}.xlsx`);
        } catch {
            alert('Error al exportar. Intentá de nuevo.');
        } finally {
            setIsExporting(false);
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'SALE': return { label: 'Venta', colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
            case 'MANUAL_ADJUSTMENT': return { label: 'Ajuste Manual', colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
            case 'INITIAL': return { label: 'Inicial', colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
            case 'PURCHASE': return { label: 'Compra', colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
            case 'RETURN': return { label: 'Devolución', colorClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
            default: return { label: type, colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
        }
    };

    const handleRowClick = async (record) => {
        if (record.type === 'SALE') {
            const saleIdStr = record.description.split("#")[1];
            if (saleIdStr) {
                try {
                    const res = await axios.get(`/api/sales/${saleIdStr}`, { withCredentials: true });
                    setSelectedSaleDetail(res.data);
                } catch (err) {
                    setSelectedAdjustDetail({
                        title: "Venta no encontrada",
                        description: `No se pudo encontrar el detalle completo de la Venta #${saleIdStr}. Puede que haya sido eliminada o que no tengas permisos.`,
                        record: record
                    });
                }
            } else {
                setSelectedAdjustDetail({
                    title: "Detalle de Venta",
                    description: "Esta venta no tiene un ID rastreable registrado en su descripción.",
                    record: record
                });
            }
        } else {
            setSelectedAdjustDetail({
                title: getTypeLabel(record.type).label,
                description: record.description || "Sin descripción proporcionada.",
                record: record
            });
        }
    };

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>

            <div className="mb-4 flex justify-between items-end border-b pb-4 shrink-0" style={{ borderColor: theme.bg3 }}>
                <div>
                    <h1 className="text-3xl font-bold mb-1">Historial de Movimientos de Stock</h1>
                    <p className="opacity-70 text-sm">Registro completo de modificaciones, ventas y ajustes de inventario.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                      onClick={handleExport}
                      disabled={isExporting || loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#16a34a', color: '#fff' }}
                      title="Exportar a Excel"
                    >
                      <FaFileExcel size={14} />
                      {isExporting ? 'Exportando...' : 'Excel'}
                    </button>
                    <button 
                      onClick={() => fetchHistory(startDate, endDate)}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ backgroundColor: theme.bgcards, border: `1px solid ${theme.bg3}`, color: theme.text }}
                    >
                      {loading ? "Actualizando..." : "🔄 Refrescar"}
                    </button>
                </div>
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
                <div className="p-8 text-center italic opacity-60">Cargando historial de stock...</div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 font-bold">{error}</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {history.length === 0 ? (
                        <div className="p-12 text-center opacity-50 italic border rounded-xl" style={{ borderColor: theme.bg3 }}>
                            No hay movimientos registrados en el período seleccionado.
                        </div>
                    ) : (
                        history.map((record) => {
                            const typeInfo = getTypeLabel(record.type);
                            const isPositive = record.movementAmount > 0;
                            const isNegative = record.movementAmount < 0;
                            const amountColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-500';

                            return (
                                <div
                                    key={record.id}
                                    onClick={() => handleRowClick(record)}
                                    className="rounded-xl shadow-sm border overflow-hidden flex flex-col transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer relative"
                                    style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}
                                >
                                    <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-100">
                                        <FaInfoCircle />
                                    </div>
                                    <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                                        {/* INFO PRINCIPAL (Izquierda) */}
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${typeInfo.colorClass}`}>
                                                    {typeInfo.label}
                                                </span>
                                                <span className="opacity-60 text-sm">
                                                    {format(new Date(record.createdAt), "dd MMM yyyy - HH:mm", { locale: es })}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-lg flex items-center gap-2">
                                                <FaBoxOpen className="opacity-50" />
                                                {record.product?.name || "Producto Eliminado"}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-3 text-sm opacity-80 mt-1">
                                                <div className="flex items-center gap-1.5" title="Usuario responsable">
                                                    <FaUserTie />
                                                    <span>
                                                        {record.user ? `${record.user.firstName} ${record.user.lastName}` : "Sistema"}
                                                    </span>
                                                </div>
                                                {record.description && (
                                                    <div className="flex items-center gap-1.5 italic border-l pl-3" style={{ borderColor: 'inherit' }}>
                                                        <FaHashtag /> {record.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* INFO NUMÉRICA (Derecha) */}
                                        <div className="flex items-center gap-4 md:gap-6 bg-black/5 dark:bg-white/5 p-3 rounded-lg border" style={{ borderColor: theme.bg3 }}>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] uppercase font-bold opacity-50">Anterior</span>
                                                <span className="font-mono text-lg">{record.previousStock}</span>
                                            </div>

                                            <div className="flex flex-col items-center px-2">
                                                <span className={`font-mono font-bold text-xl ${amountColor}`}>
                                                    {isPositive ? '+' : ''}{record.movementAmount}
                                                </span>
                                                <FaExchangeAlt className="text-gray-400 my-0.5 text-xs" />
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] uppercase font-bold text-blue-500">Actual</span>
                                                <span className="font-mono text-xl font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 rounded">
                                                    {record.currentStock}
                                                </span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}

            {/* Modals */}
            <SaleDetail
                isOpen={!!selectedSaleDetail}
                onClose={() => setSelectedSaleDetail(null)}
                saleData={selectedSaleDetail}
            />

            {selectedAdjustDetail && (
                <MessageModal
                    isOpen={true}
                    onClose={() => setSelectedAdjustDetail(null)}
                    message={
                        <div className="flex flex-col gap-3 text-left w-full mt-2">
                            <p className="opacity-80">
                                <strong>Operativo:</strong> {selectedAdjustDetail.record.user ? `${selectedAdjustDetail.record.user.firstName} ${selectedAdjustDetail.record.user.lastName}` : "Sistema"} <br />
                                <strong>Fecha:</strong> {format(new Date(selectedAdjustDetail.record.createdAt), "dd MMM yyyy - HH:mm", { locale: es })} <br />
                                <strong>Producto:</strong> {selectedAdjustDetail.record.product?.name || "Desconocido"}
                            </p>
                            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg border" style={{ borderColor: theme.bg3 }}>
                                <h4 className="font-bold mb-1 opacity-70 uppercase text-xs">Motivo / Descripción Registrada</h4>
                                <p className="italic">{selectedAdjustDetail.description}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm font-mono mt-2 opacity-70">
                                <span>Antes: {selectedAdjustDetail.record.previousStock}</span>
                                <FaArrowRight />
                                <span>Mov: {selectedAdjustDetail.record.movementAmount > 0 ? '+' : ''}{selectedAdjustDetail.record.movementAmount}</span>
                                <FaArrowRight />
                                <span className="font-bold text-blue-500">Actual: {selectedAdjustDetail.record.currentStock}</span>
                            </div>
                        </div>
                    }
                    type="info"
                    customTitle={selectedAdjustDetail.title}
                />
            )}

        </div>
    );
};
