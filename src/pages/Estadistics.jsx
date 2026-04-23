import { useTheme } from "../context/ThemeContext";
import SectionCard from "../components/SectionCard";
import {
  LineChart,
  History,
  ShoppingCart,
  ArrowRightLeft,
  PackageSearch,
  Inbox,
  Percent
} from "lucide-react";

export const Estadistics = () => {
  const { theme } = useTheme();

  const reportSections = [
    { label: "Historial de Caja y Ventas", icon: History, route: "/sales-history" },
    { label: "Turnos y Arqueos de Caja", icon: Inbox, route: "/registers-history" },
    // { label: "Historial Slo Ventas", icon: ShoppingCart, route: "#" },
    // { label: "Movimientos No Ventas", icon: ArrowRightLeft, route: "#" },
    { label: "Historial de Stock", icon: PackageSearch, route: "/stock-history" },
    { label: "Rendimiento Vendedores", icon: LineChart, route: "/seller-performance" },
    { label: "Descuentos", icon: Percent, route: "/discounts" },
  ];

  return (
    <main className="flex h-full" style={{ backgroundColor: theme.bg }}>
      <div
        className="w-full h-full p-8 flex justify-center items-center flex-col gap-6 overflow-y-auto custom-scrollbar"
        style={{ backgroundColor: theme.bg, color: theme.text }}
      >
        <div className="w-full flex justify-between items-center max-w-5xl">
          <h1 className="text-3xl font-bold">Módulo de Reportes e Historial</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl h-1/2">
          {reportSections.map((section, idx) => (
            <SectionCard
              key={idx}
              label={section.label}
              icon={section.icon}
              route={section.route}
            />
          ))}
        </div>
      </div>
    </main>
  );
};
