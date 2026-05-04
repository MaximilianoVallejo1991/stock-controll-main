// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import { useTheme } from "../context/ThemeContext";
import { logoutUser } from "../utils/auth";
import useUserStore from "../store/userStore";
import { ROLES } from "../constants/roles";
import { FaBars, FaHome, FaShoppingCart, FaStore, FaUsers, FaBoxOpen, FaPercent, FaTruck, FaFileInvoiceDollar, FaChartLine } from "react-icons/fa";

const MainLayout = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // El rol efectivo para filtrar el menú: si hay simulación activa, úsala; si no, el rol real.
  const effectiveRole = (simulatedRole || user?.role)?.toUpperCase();

  const rawMenuItems = [
    { label: "Panel Principal", icon: <FaHome />, onClick: () => { navigate("/MainPanel"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Nueva Venta", icon: <FaShoppingCart />, onClick: () => { navigate("/sells"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Tiendas", icon: <FaStore />, onClick: () => { navigate("/stores"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA] },
    { label: "Clientes", icon: <FaUsers />, onClick: () => { navigate("/clients"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Productos", icon: <FaBoxOpen />, onClick: () => { navigate("/products"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Descuentos", icon: <FaPercent />, onClick: () => { navigate("/discounts"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Proveedores", icon: <FaTruck />, onClick: () => { navigate("/suppliers"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Cuentas Corrientes", icon: <FaFileInvoiceDollar />, onClick: () => { navigate("/accounts"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR] },
    { label: "Reportes", icon: <FaChartLine />, onClick: () => { navigate("/estadistics"); setIsMobileMenuOpen(false); }, roles: [ROLES.SISTEMA, ROLES.ADMINISTRADOR] },
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
    <main className="flex flex-col md:flex-row h-screen w-screen overflow-hidden" style={{ backgroundColor: theme.bg2, color: theme.text }}>
      
      {/* HEADER MOBILE (Solo visible en pantallas chicas) */}
      <div className="md:hidden flex items-center justify-between p-4 shadow-md shrink-0 z-10 no-print" style={{ backgroundColor: theme.bg3 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors">
            <FaBars size={22} />
          </button>
          <span className="font-black text-xl tracking-tighter">StockControl</span>
        </div>
        
        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700">
           {user?.profilePicture ? (
             <img src={user.profilePicture} alt="User" className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
               {user?.firstName?.[0]}{user?.lastName?.[0]}
             </div>
           )}
        </div>
      </div>

      {/* SIDEBAR */}
      <Sidebar 
        user={user} 
        menuItems={menuItems} 
        onLogout={handleLogout} 
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 h-full overflow-y-auto custom-scrollbar relative">
        <Outlet />
      </div>
    </main>
  );
};

export default MainLayout;
