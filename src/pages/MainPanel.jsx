import { useTheme } from "../context/ThemeContext";
import SectionCard from "../components/SectionCard";
import {
  User,
  Box,
  ShoppingCart,
  Users,
  Building2,
  LayoutGrid,
  Building,
} from "lucide-react";
import useUserStore from "../store/userStore";
import { ROLES } from "../constants/roles";

const MainPanel = () => {
  const { theme } = useTheme();
  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const effectiveRole = (simulatedRole || user?.role)?.toUpperCase();

  const sections = [
    { label: "Personal", icon: User, route: "/employees", roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR] },
    { label: "Clientes", icon: Users, route: "/clients", roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Proveedores", icon: Building2, route: "/suppliers", roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Inventario", icon: Box, route: "/stock", roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR] },
    { label: "Reportes", icon: Building, route: "/Estadistics", roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR] },
    { label: "Ventas", icon: ShoppingCart, route: "/sells", roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
  ];

  const filteredSections = sections.filter(s => s.roles.includes(effectiveRole));

  return (
    <div
      className="w-full min-h-full p-4 md:p-8 flex flex-col items-center justify-start md:justify-center gap-6"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div className="w-full flex justify-between items-center max-w-5xl">
        <h1 className="text-2xl md:text-3xl font-bold">Panel principal</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl">
        {filteredSections.map((section) => (
          <SectionCard
            key={section.route}
            label={section.label}
            icon={section.icon}
            route={section.route}
          />
        ))}
      </div>
    </div>
  );
};

export default MainPanel;







