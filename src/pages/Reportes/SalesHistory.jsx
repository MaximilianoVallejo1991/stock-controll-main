import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { format, subDays } from "date-fns";
import { FaEye, FaFileExcel } from "react-icons/fa";
import SaleDetail from "../sales/SaleDetail";
import { formatCurrency } from "../../utils/currency";
import DateRangeFilter from "../../components/Filters/DateRangeFilter";
import { downloadExcel } from "../../utils/exportHelper";

export const SalesHistory = () => {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [filterType, setFilterType] = useState("Todos");
  const [paymentFilter, setPaymentFilter] = useState("Todos");

  // Filter States
  const [startDate, setStartDate] = useState(() => {
    const d = subDays(new Date(), 7);
    return format(d, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [filterError, setFilterError] = useState(null);

  const fetchHistory = useCallback(async (start, end) => {
    try {
      setIsLoading(true);
      setFilterError(null);
      const response = await axios.get("/api/caja/history/all", {
        params: { startDate: start, endDate: end },
        withCredentials: true
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching global history:", error);
      setFilterError(error.response?.data?.message || "Error al cargar el historial");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(startDate, endDate);
  }, []);

  const handleApplyFilters = () => {
    fetchHistory(startDate, endDate);
  };

  const handleClearFilters = () => {
    const defaultStart = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const defaultEnd = format(new Date(), "yyyy-MM-dd");
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    fetchHistory(defaultStart, defaultEnd);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadExcel('/api/sales/export', { from: startDate, to: endDate }, `ventas_${startDate}_${endDate}.xlsx`);
    } catch {
      alert('Error al exportar. Intentá de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRowClick = (item) => {
    if (item._typeModel === 'ORDER') {
      setSelectedSale(item);
    }
  };

  const IconView = FaEye;

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Historial de Ventas y Movimientos</h1>
          <p className="opacity-70 text-sm">Registro unificado de facturación POS y movimientos manuales de caja.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleExport}
            disabled={isExporting || isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#16a34a', color: '#fff' }}
            title="Exportar a Excel"
          >
            <FaFileExcel size={14} />
            {isExporting ? 'Exportando...' : 'Excel'}
          </button>
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Tipo de Evento:</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                if (e.target.value !== "ORDER" && e.target.value !== "Todos") {
                  setPaymentFilter("Todos");
                }
              }}
              className="p-2 rounded outline-none font-semibold border"
              style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.bg3 }}
            >
              <option value="Todos">Todos (Combinado)</option>
              <option value="ORDER">Facturación POS (Ventas)</option>
              <option value="INCOME">Ingresos de Caja Manuales</option>
              <option value="EXPENSE">Egresos / Retiros Manuales</option>
            </select>
          </div>

          {(filterType === "Todos" || filterType === "ORDER") && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Medio de Pago:</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="p-2 rounded outline-none font-semibold border"
                style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.bg3 }}
              >
                <option value="Todos">Todos los medios</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="CUENTA_CORRIENTE">Cuenta Corriente</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        loading={isLoading}
        theme={theme}
      />

      {filterError && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm font-medium border border-red-200">
          {filterError}
        </div>
      )}

      <div className="flex-1 bg-transparent rounded-xl shadow-sm overflow-hidden border" style={{ borderColor: theme.bg3, backgroundColor: theme.bgcards }}>
        <div className="overflow-x-auto h-full custom-scrollbar">
          <table className="w-full min-w-max table-auto text-left">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: theme.bg3 }}>
              <tr>
                <th className="p-4 font-semibold text-sm">Fecha y Hora</th>
                <th className="p-4 font-semibold text-sm">Operador</th>
                <th className="p-4 font-semibold text-sm">Clasificación</th>
                <th className="p-4 font-semibold text-sm">Concepto / Destino</th>
                <th className="p-4 font-semibold text-sm">Importe</th>
                <th className="p-4 font-semibold text-sm text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Construyendo bitácora temporal...
                  </td>
                </tr>
              ) : (() => {
                const filteredHistory = history.filter(item => {
                  // 1. Tipo de Movimiento
                  let matchesType = false;
                  if (filterType === "Todos") matchesType = true;
                  else if (filterType === "ORDER" && item._typeModel === "ORDER") matchesType = true;
                  else if (filterType === "INCOME" && item._typeModel === "MOVEMENT" && item.type === "INCOME") matchesType = true;
                  else if (filterType === "EXPENSE" && item._typeModel === "MOVEMENT" && item.type === "EXPENSE") matchesType = true;

                  if (!matchesType) return false;

                  // 2. Medio de Pago (Solo si se especifica y es un pedido)
                  if (paymentFilter !== "Todos") {
                    if (item._typeModel !== "ORDER") return false;

                    if (item.orderPayments && item.orderPayments.length > 0) {
                      return item.orderPayments.some(p => p.paymentMethod.toLowerCase() === paymentFilter.toLowerCase());
                    }

                    const method = (item.paymentMethod || "Efectivo").toLowerCase();
                    return method === paymentFilter.toLowerCase();
                  }

                  return true;
                });

                if (filteredHistory.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="p-8 text-center" style={{ color: theme.text }}>
                        No se encontraron operaciones asentadas para el filtro seleccionado en este periodo.
                      </td>
                    </tr>
                  );
                }

                return filteredHistory.map((item) => {
                  const isOrder = item._typeModel === 'ORDER';
                  const isIncome = isOrder || item.type === 'INCOME';

                  // Cantidad a mostrar: Si hay filtro de pago, mostramos solo la parte correspondiente
                  let displayAmount = item.amount;
                  if (paymentFilter !== "Todos" && isOrder && item.orderPayments?.length > 0) {
                    const partialMatch = item.orderPayments.find(p => p.paymentMethod.toLowerCase() === paymentFilter.toLowerCase());
                    if (partialMatch) displayAmount = partialMatch.amount;
                  }

                  let badge = '';
                  let color = '';
                  let bgColor = '';

                  if (isOrder) {
                    const method = item.paymentMethod || 'Efectivo';
                    if (method === 'CUENTA_CORRIENTE') {
                      badge = 'CUENTA CORRIENTE';
                      color = '#ea580c'; 
                      bgColor = '#fff7ed';
                    } else {
                      badge = 'VENTA POS';
                      color = theme.info;
                      bgColor = theme.infoBg;
                    }
                  } else if (item.type === 'INCOME') {
                    badge = 'INGRESO';
                    color = theme.success;
                    bgColor = theme.successBg;
                  } else {
                    badge = 'EGRESO';
                    color = theme.danger;
                    bgColor = theme.dangerBg;
                  }

                  const concepto = isOrder
                    ? `Facturación Cliente: ${item.client ? (item.client.firstName + " " + (item.client.lastName || "")) : 'Consumidor Final'}`
                    : (item.description || 'Sin referencia comercial asentada');

                  return (
                    <tr
                      key={`${item._typeModel}-${item.id}`}
                      onClick={() => handleRowClick(item)}
                      className={`border-b transition-colors ${isOrder ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''}`}
                      style={{ borderColor: theme.bg3, backgroundColor: theme.bg }}
                    >
                      <td className="p-4">
                        {format(new Date(item.date), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="p-4 font-semibold text-sm">
                        {item.user?.firstName} {item.user?.lastName || ''}
                      </td>
                      <td className="p-4">
                        <span className="font-bold px-2 py-1 text-xs rounded border border-current" style={{ color: color, backgroundColor: bgColor }}>
                          {badge}
                        </span>
                      </td>
                      <td className="p-4 truncate max-w-[250px]" title={concepto}>
                        {concepto}
                      </td>
                      <td className="p-4 font-bold text-lg" style={{ color: isIncome ? theme.success : theme.danger }}>
                        {isIncome ? '+' : '-'}{formatCurrency(displayAmount)}
                      </td>
                      <td className="p-4 text-center">
                        {isOrder ? (
                          <button
                            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            title="Fiscalizar detalle de la Venta"
                          >
                            <IconView size={20} color={theme.text} />
                          </button>
                        ) : (
                          <span className="opacity-40 text-xs italic">Directo</span>
                        )}
                      </td>
                    </tr>
                  )
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <SaleDetail
        isOpen={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        saleData={selectedSale}
      />
    </div>
  );
};
