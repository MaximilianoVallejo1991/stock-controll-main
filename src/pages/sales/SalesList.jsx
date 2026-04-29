import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { format, subDays } from "date-fns";
import { FaEye } from "react-icons/fa";
import SaleDetail from "./SaleDetail";
import { formatCurrency } from "../../utils/currency";



const MAX_DAYS = 30;
function toLocalDateString(date) {
  return format(date, "yyyy-MM-dd");
}

export const SalesList = () => {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null); // Solo se usa si es Venta
  const [filterType, setFilterType] = useState("Todos");

  // Default: last 7 days
  const [startDate, setStartDate] = useState(() => toLocalDateString(subDays(new Date(), 7)));
  const [endDate, setEndDate] = useState(() => toLocalDateString(new Date()));
  const [filterError, setFilterError] = useState(null);
  const [error, setError] = useState(null);




  const fetchHistory = useCallback(async (start, end) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/caja/history/all", {
        params: { startDate: start, endDate: end },
        withCredentials: true,
      });
      setHistory(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Error al cargar el historial.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);



  useEffect(() => {
    fetchHistory(startDate, endDate);
  }, [fetchHistory]);



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


  const handleRowClick = (item) => {
    if (item._typeModel === 'ORDER') {
      setSelectedSale(item);
    }
  };

  const IconView = FaEye;

  return (
    <div className="h-full flex flex-col p-6" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Historial</h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Tipo de Evento:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 rounded outline-none font-semibold"
              style={{ backgroundColor: theme.bg, color: theme.text }}
            >
              <option value="Todos">Todos (Combinado)</option>
              <option value="ORDER">Facturación POS (Ventas)</option>
              <option value="INCOME">Ingresos de Caja Manuales</option>
              <option value="EXPENSE">Egresos / Retiros Manuales</option>
            </select>
          </div>
        </div>
      </div>

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
              ) : history
                .filter(item => {
                  if (filterType === "Todos") return true;
                  if (filterType === "ORDER" && item._typeModel === "ORDER") return true;
                  if (filterType === "INCOME" && item._typeModel === "MOVEMENT" && item.type === "INCOME") return true;
                  if (filterType === "EXPENSE" && item._typeModel === "MOVEMENT" && item.type === "EXPENSE") return true;
                  return false;
                })
                .length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center" style={{ color: theme.text }}>
                    La bandeja histórica se encuentra sin asentar operaciones para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                history
                  .filter(item => {
                    if (filterType === "Todos") return true;
                    if (filterType === "ORDER" && item._typeModel === "ORDER") return true;
                    if (filterType === "INCOME" && item._typeModel === "MOVEMENT" && item.type === "INCOME") return true;
                    if (filterType === "EXPENSE" && item._typeModel === "MOVEMENT" && item.type === "EXPENSE") return true;
                    return false;
                  })
                  .map((item) => {

                    const isOrder = item._typeModel === 'ORDER';
                    const isIncome = isOrder || item.type === 'INCOME';

                    let badge = '';
                    let color = '';
                    let bgColor = '';

                    if (isOrder) {
                      badge = 'VENTA POS';
                      color = theme.info;
                      bgColor = theme.infoBg;
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
                          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
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
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SaleDetail
        isOpen={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        saleData={selectedSale}
        onCancelSuccess={() => fetchHistory(startDate, endDate)}
      />

    </div>
  );
};
