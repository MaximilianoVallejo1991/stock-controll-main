import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  FaTrophy,
  FaUserTie,
  FaChartBar,
  FaShoppingCart,
  FaDollarSign,
  FaPercentage,
  FaFileExcel,
} from "react-icons/fa";
import { formatCurrency } from "../../utils/currency";
import { downloadExcel } from "../../utils/exportHelper";

// ─── Colores de la paleta de barras ───────────────────────────────────────────
const BAR_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f97316", // orange
];

// ─── Períodos predefinidos ─────────────────────────────────────────────────────
const PERIODS = [
  { label: "Hoy",       value: "today" },
  { label: "Esta semana", value: "week" },
  { label: "Este mes",  value: "month" },
  { label: "Todo",      value: "all" },
];

function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case "today": return { from: startOfDay(now).toISOString() };
    case "week":  return { from: startOfWeek(now, { weekStartsOn: 1 }).toISOString() };
    case "month": return { from: startOfMonth(now).toISOString() };
    default:      return {};
  }
}

// ─── Tooltip personalizado para el gráfico ────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">
        {d.firstName} {d.lastName}
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        Ventas: <span className="font-semibold text-indigo-600">{d.salesCount}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        Monto: <span className="font-semibold text-emerald-600">{formatCurrency(d.totalAmount)}</span>
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        Participación: <span className="font-semibold text-purple-600">{d.percentage}%</span>
      </p>
    </div>
  );
};

// ─── Medallas de podio ─────────────────────────────────────────────────────────
const MEDALS = ["🥇", "🥈", "🥉"];

export const SellerPerformance = () => {
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("month");
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = getDateRange(period);
      const res = await axios.get("/api/seller-performance", {
        params,
        withCredentials: true,
      });
      setData(res.data);
    } catch (err) {
      console.error("Error fetching seller performance:", err);
      setError("Error al cargar los datos de rendimiento.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = getDateRange(period);
      await downloadExcel('/api/seller-performance/export', params, `desempeno_vendedores_${period}.xlsx`);
    } catch {
      alert('Error al exportar. Intentá de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Estados de carga / error ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: theme.bgtotal }}>
        <div className="flex flex-col items-center gap-3 opacity-60">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span style={{ color: theme.text }}>Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: theme.bgtotal }}>
        <p className="text-red-500 font-bold text-center">{error}</p>
      </div>
    );
  }

  const { sellers = [], summary = {} } = data || {};
  const topSeller = sellers[0] || null;

  return (
    <div
      className="h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: theme.bgtotal, color: theme.text }}
    >
      {/* ─── HEADER ────────────────────────────────────────────────────────── */}
      <div
        className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4 shrink-0"
        style={{ borderColor: theme.bg3 }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-1">Rendimiento de Vendedores</h1>
          <p className="opacity-60 text-sm">
            Estadísticas de ventas por operador en el período seleccionado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón exportar */}
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

          {/* Selector de período */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ backgroundColor: theme.bgcards }}
          >
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: period === p.value ? "#6366f1" : "transparent",
                  color: period === p.value ? "#fff" : theme.text,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sellers.length === 0 ? (
        <div
          className="flex-1 flex items-center justify-center text-center opacity-50 italic border rounded-xl p-12"
          style={{ borderColor: theme.bg3 }}
        >
          No hay ventas registradas en este período.
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ─── TOP 3 PODIO ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sellers.slice(0, 3).map((seller, idx) => (
              <div
                key={seller.userId}
                className="relative rounded-2xl border p-5 flex flex-col gap-2 shadow-sm overflow-hidden transition-transform hover:scale-[1.01]"
                style={{
                  backgroundColor: theme.bgcards,
                  borderColor: idx === 0 ? "#f59e0b" : theme.bg3,
                  boxShadow: idx === 0 ? "0 0 0 2px #f59e0b44" : undefined,
                }}
              >
                {/* Medalla de posición */}
                <span className="text-3xl leading-none">{MEDALS[idx] || `#${idx + 1}`}</span>

                <div className="flex items-center gap-3 mt-1">
                  {seller.profilePicture ? (
                    <img
                      src={seller.profilePicture}
                      alt={seller.firstName}
                      className="w-10 h-10 rounded-full object-cover border"
                      style={{ borderColor: theme.bg3 }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                    >
                      {seller.firstName[0]}{seller.lastName[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-base leading-tight">
                      {seller.firstName} {seller.lastName}
                    </p>
                    <p className="text-xs opacity-50 uppercase">{seller.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="flex flex-col items-center p-2 rounded-lg" style={{ backgroundColor: theme.bg3 }}>
                    <FaShoppingCart className="text-indigo-400 mb-1" />
                    <span className="font-bold text-lg">{seller.salesCount}</span>
                    <span className="text-[10px] opacity-50 uppercase">Ventas</span>
                  </div>
                  <div className="flex flex-col items-center p-2 rounded-lg col-span-2" style={{ backgroundColor: theme.bg3 }}>
                    <FaDollarSign className="text-emerald-400 mb-1" />
                    <span className="font-bold text-base">{formatCurrency(seller.totalAmount)}</span>
                    <span className="text-[10px] opacity-50 uppercase">Total</span>
                  </div>
                </div>

                {/* Barra de participación */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs opacity-60 mb-1">
                    <span>Participación</span>
                    <span className="font-bold">{seller.percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.bg3 }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${seller.percentage}%`,
                        backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── SUMMARY CARDS ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: FaShoppingCart,
                label: "Ventas totales",
                value: summary.grandCount,
                color: "#6366f1",
              },
              {
                icon: FaDollarSign,
                label: "Monto total",
                value: formatCurrency(summary.grandTotal),
                color: "#10b981",
              },
              {
                icon: FaUserTie,
                label: "Vendedores activos",
                value: summary.sellerCount,
                color: "#8b5cf6",
              },
              {
                icon: FaTrophy,
                label: "Top vendedor",
                value: topSeller ? `${topSeller.firstName} ${topSeller.lastName}` : "—",
                color: "#f59e0b",
              },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <div
                key={i}
                className="rounded-xl border p-4 flex flex-col gap-2 shadow-sm"
                style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color + "22" }}
                >
                  <Icon style={{ color }} />
                </div>
                <p className="text-xs opacity-50 uppercase">{label}</p>
                <p className="font-bold text-lg leading-tight truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* ─── GRÁFICO DE BARRAS ───────────────────────────────────────── */}
          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FaChartBar className="text-indigo-400" />
              <h2 className="font-bold text-lg">Ventas por vendedor</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={sellers}
                margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme.bg3}
                  vertical={false}
                />
                <XAxis
                  dataKey="firstName"
                  tick={{ fill: theme.text, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: theme.text, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.07)" }} />
                <Bar dataKey="salesCount" radius={[8, 8, 0, 0]} maxBarSize={60}>
                  {sellers.map((_, idx) => (
                    <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="salesCount"
                    position="top"
                    style={{ fill: theme.text, fontSize: 12, fontWeight: 700 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ─── TABLA RANKING COMPLETO ───────────────────────────────────── */}
          <div
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}
          >
            <div className="p-5 border-b" style={{ borderColor: theme.bg3 }}>
              <h2 className="font-bold text-lg">Ranking completo</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: theme.bg3 + "66" }}>
                    <th className="text-left p-3 pl-5 font-semibold opacity-60 uppercase text-xs">#</th>
                    <th className="text-left p-3 font-semibold opacity-60 uppercase text-xs">Vendedor</th>
                    <th className="text-right p-3 font-semibold opacity-60 uppercase text-xs">Ventas</th>
                    <th className="text-right p-3 font-semibold opacity-60 uppercase text-xs">Monto Total</th>
                    <th className="text-right p-3 pr-5 font-semibold opacity-60 uppercase text-xs">Participación</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller, idx) => (
                    <tr
                      key={seller.userId}
                      className="border-t transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ borderColor: theme.bg3 }}
                    >
                      <td className="p-3 pl-5 font-bold opacity-50">
                        {MEDALS[idx] || `#${idx + 1}`}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {seller.profilePicture ? (
                            <img
                              src={seller.profilePicture}
                              alt={seller.firstName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                            >
                              {seller.firstName[0]}{seller.lastName[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{seller.firstName} {seller.lastName}</p>
                            <p className="text-xs opacity-40 uppercase">{seller.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-bold text-indigo-500">{seller.salesCount}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                        {formatCurrency(seller.totalAmount)}
                      </td>
                      <td className="p-3 pr-5">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="font-bold text-purple-500 min-w-[40px] text-right">
                            {seller.percentage}%
                          </span>
                          <div className="w-20 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.bg3 }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${seller.percentage}%`,
                                backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
