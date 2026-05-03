// src/layouts/MainLayout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { useTheme } from "../context/ThemeContext";
import { logoutUser } from "../utils/auth";
import useUserStore from "../store/userStore";
import { ROLES } from "../constants/roles";

const MainLayout = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);

  // El rol efectivo para filtrar el menú: si hay simulación activa, úsala; si no, el rol real.
  const effectiveRole = (simulatedRole || user?.role)?.toUpperCase();

  const rawMenuItems = [
    { label: "Panel Principal", onClick: () => navigate("/MainPanel"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Nueva Venta", onClick: () => navigate("/sells"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Tiendas", onClick: () => navigate("/stores"), roles: [ROLES.SISTEMA] },
    { label: "Clientes", onClick: () => navigate("/clients"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Productos", onClick: () => navigate("/products"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Descuentos", onClick: () => navigate("/discounts"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Proveedores", onClick: () => navigate("/suppliers"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Cuentas Corrientes", onClick: () => navigate("/accounts"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Reportes", onClick: () => navigate("/estadistics"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR] },
    // { label: "Mensajes", onClick: () => navigate("/Chat"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    // { label: "Perfil", onClick: () => navigate("/Profile"), roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
  ];

  const menuItems = rawMenuItems.filter(item => {
    const roleMatches = !item.roles || item.roles.includes(effectiveRole);
    if (!roleMatches) return false;

    if (item.subItems) {
      item.subItems = item.subItems.filter(sub => !sub.roles || sub.roles.includes(effectiveRole));
      return item.subItems.length > 0;
    }
    return true;
  });

  const handleLogout = () => {
    logoutUser();
    navigate("/", { replace: true });
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: theme.bg2, color: theme.text }}>
      <Sidebar user={user} menuItems={menuItems} onLogout={handleLogout} />
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
        <Outlet />
      </div>
    </main>
  );
};

export default MainLayout;
