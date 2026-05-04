// src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { FaBars } from "react-icons/fa";
import { RiCloseLine } from "react-icons/ri";
import { MdOutlineInstallDesktop } from "react-icons/md"; // Nuevo icono
import ThemedButton from "./ThemedButton";
import ThemeToggle from "./ThemeToggle";
import useUserStore from "../store/userStore";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ImagePreviewModal from "./Modals/ImagePreviewModal";
import { ROLES } from "../constants/roles";

const Sidebar = ({ menuItems = [], onLogout, isMobileOpen, onCloseMobile }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(true);
  const [showAdminSettings, setShowAdminSettings] = useState(false); // Nuevo estado para mobile
  const [canInstall, setCanInstall] = useState(!!window.deferredPrompt); // Estado para el botón de PWA
  const [stores, setStores] = useState([]);

  const user = useUserStore((state) => state.user);
  const activeStore = useUserStore((state) => state.activeStore);
  const setActiveStore = useUserStore((state) => state.setActiveStore);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const setSimulatedRole = useUserStore((state) => state.setSimulatedRole);
  const clearUser = useUserStore((state) => state.clearUser);
  const setUser = useUserStore((state) => state.setUser);
  const Navigate = useNavigate();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [userImages, setUserImages] = useState([]);

  useEffect(() => {
    // Escuchar el evento personalizado de PWA
    const handlePwaReady = () => setCanInstall(true);
    window.addEventListener('pwa-install-ready', handlePwaReady);

    if (user?.role === ROLES.SISTEMA) {
      axios.get("/api/stores")
        .then(res => setStores(res.data))
        .catch(err => console.error("Error cargando tiendas en sidebar", err));
    }

    return () => window.removeEventListener('pwa-install-ready', handlePwaReady);
  }, [user]);

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) return;

    // Mostrar el prompt nativo
    promptEvent.prompt();

    // Esperar la respuesta del usuario
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    // Limpiar el evento guardado
    window.deferredPrompt = null;
    setCanInstall(false);
  };

  const handleStoreChange = (e) => {
    const newStoreId = e.target.value === "ALL" ? null : e.target.value;

    // Si pasamos a modo Global (null) y estábamos simulando algo que requiere tienda,
    // quitamos la simulación para evitar que el backend nos rebote.
    if (!newStoreId && simulatedRole && simulatedRole !== ROLES.SISTEMA) {
      setSimulatedRole(null);
    }

    setActiveStore(newStoreId);
    window.location.reload();
  };

  const handleSimulationChange = (e) => {
    const newRole = e.target.value || null;

    // Validación: No se puede simular Vendedor/Encargado sin una tienda seleccionada
    if (newRole && newRole !== ROLES.SISTEMA && !activeStore) {
      alert("⚠️ Para simular un rol operativo (Vendedor o Encargado), primero debes elegir una tienda específica en el menú superior.");
      return;
    }

    setSimulatedRole(newRole);
    // Forzamos recarga para que el Router y los componentes re-evalúen el contexto
    window.location.reload();
  };

  const handleImageClick = async () => {
    if (!user) return;

    // Abrir modal inmediatamente (se mostrará el profilePicture actual mientras carga el resto)
    setIsPreviewOpen(true);

    // Fetch imágenes si no se han cargado aún
    if (userImages.length === 0) {
      try {
        const res = await axios.get(`/api/images/users/${user.id}`);
        setUserImages(res.data);
      } catch (err) {
        console.error("Error cargando imágenes del usuario", err);
      }
    }
  };

  const handleImageSetMain = (newUrl) => {
    if (user) {
      setUser({ ...user, profilePicture: newUrl });
    }
  };

  return (
    <>
      {/* Backdrop (fondo oscuro) solo visible en móviles cuando el menú está abierto */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          h-full transition-all duration-300 flex flex-col justify-between shrink-0 no-print 
          fixed md:relative z-50 md:z-auto top-0 left-0
          ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0 md:shadow-none"}
          ${isOpen ? "w-64" : "w-20"}
        `}
        style={{ backgroundColor: theme.bg2, color: theme.text }}
      >
      {/* Header Wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className={`flex items-center p-4 shrink-0 ${isOpen ? "justify-between" : "flex-col justify-center gap-6"}`}>
          {isOpen ? (
            <div className="flex items-center gap-2">
              <ThemedButton onClick={() => Navigate(-1)}>
                ⬅ <span className="hidden md:inline">Atrás</span>
              </ThemedButton>
            </div>
          ) : (
            <button
              onClick={() => Navigate(-1)}
              title="Atrás"
              className="text-xl hover:opacity-70 transition-opacity"
            >
              ⬅
            </button>
          )}

          {/* Botón de colapso para DESKTOP (Hamburguesa) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Icono de Instalación PWA (Versión pequeña) - AHORA AQUÍ ARRIBA */}
            {canInstall && (
              <button
                onClick={handleInstallClick}
                title="Instalar como aplicación de escritorio"
                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-90"
                style={{ color: theme.text }}
              >
                <MdOutlineInstallDesktop size={20} />
              </button>
            )}
            
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <FaBars size={20} />
            </button>
          </div>

          {/* Versión Mobile: Solo el icono de instalación si no está el sidebar abierto? No, mejor siempre disponible */}
          <div className="md:hidden flex items-center gap-2">
             {canInstall && (
              <button
                onClick={handleInstallClick}
                title="Instalar App"
                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: theme.text }}
              >
                <MdOutlineInstallDesktop size={24} />
              </button>
            )}
            <button 
              onClick={onCloseMobile} 
              className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              style={{ color: theme.text }}
            >
              <RiCloseLine size={28} />
            </button>
          </div>
        </div>


        {/* Perfil */}
        <div className="flex flex-col items-center p-4 gap-2 border-b shrink-0" style={{ borderColor: theme.bg3 }}>
          <img
            src={user?.profilePicture}
            alt="Perfil"
            className="w-16 h-16 rounded-full object-cover transition-transform duration-300 p-1 border-2 border-gray-300 hover:scale-110 cursor-pointer"
            onClick={handleImageClick}
            title="Ver / Cambiar foto de perfil"
          />
          {isOpen && (
            <>
              <p className="font-semibold">{user?.firstName}</p>
              <p className="text-sm">{user?.email}</p>
              <p className="text-sm italic">{user?.role}</p>

              {user?.role === ROLES.SISTEMA && (
                <div className="w-full flex flex-col gap-2">
                  {/* Botón de toggle SOLO para Mobile */}
                  <button
                    onClick={() => setShowAdminSettings(!showAdminSettings)}
                    className="md:hidden w-full flex items-center justify-between p-2 rounded-lg text-xs font-bold uppercase transition-colors"
                    style={{ backgroundColor: theme.bg3, color: showAdminSettings ? '#f97316' : theme.text }}
                  >
                    <span>⚙️ Ajustes de Sistema</span>
                    <span className={`transition-transform duration-300 ${showAdminSettings ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {/* Contenedor de Selectores: Siempre visible en Desktop (md:flex), colapsable en Mobile */}
                  <div className={`
                    w-full flex-col gap-2 
                    ${showAdminSettings ? "flex" : "hidden"} 
                    md:flex
                  `}>
                    {/* Entorno de Tienda */}
                    <div className="w-full flex flex-col gap-1 items-center bg-black/10 p-2 rounded-lg text-xs" style={{ backgroundColor: theme.bg3 }}>
                      <label className="font-bold uppercase text-amber-500">🏢 Entorno de Tienda</label>
                      <select
                        value={activeStore || "ALL"}
                        onChange={handleStoreChange}
                        className="w-full p-2 outline-none rounded mt-1 overflow-hidden text-ellipsis shadow-sm"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <option value="ALL">🌐 TODAS (Dashboard Global)</option>
                        {activeStore && !stores.find(s => s.id === activeStore) && (
                          <option value={activeStore}>🏬 Cargando tienda...</option>
                        )}
                        {stores.map(s => (
                          <option key={s.id} value={s.id}>🏬 {s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Simulador de Rol */}
                    <div className="w-full flex flex-col gap-1 items-center p-2 rounded-lg text-xs" style={{ backgroundColor: theme.bg3 }}>
                      <label className="font-bold uppercase" style={{ color: simulatedRole ? '#f97316' : '#a3a3a3' }}>
                        {simulatedRole ? `🎭 Simulando: ${simulatedRole}` : '🎭 Modo de Vista'}
                      </label>
                      <select
                        value={simulatedRole || ""}
                        onChange={handleSimulationChange}
                        className="w-full p-2 outline-none rounded mt-1 shadow-sm"
                        style={{ backgroundColor: theme.bg, border: simulatedRole ? '1px solid #f97316' : 'none' }}
                      >
                        <option value="">👑 SISTEMA (Sin simulación)</option>
                        <option value="ADMINISTRADOR">🏪 Administrador</option>
                        <option value="ENCARGADO">📋 Encargado</option>
                        <option value="VENDEDOR">🛒 Vendedor</option>
                      </select>
                      {simulatedRole && (
                        <p className="text-orange-400 text-center mt-1" style={{ fontSize: '0.65rem' }}>
                          ⚠️ Vista restringida activa.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Menú */}
        <nav className="px-4 py-4 flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`
                text-left shrink-0 rounded-xl transition-all duration-200
                flex items-center gap-3
                ${isOpen ? "px-4 py-3.5 text-base md:text-sm font-medium" : "p-3 justify-center"}
                hover:bg-black/5 dark:hover:bg-white/5 active:scale-95
              `}
            >
              {!isOpen ? item.icon : (
                <>
                  <span className="text-xl md:text-lg opacity-80">{item.icon}</span>
                  <span>{item.label}</span>
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer: Toggle + Install + Logout */}
      <div
        className={`transition-all duration-50 shrink-0 ${isOpen ? "opacity-100 w-full" : "opacity-0 w-0 overflow-hidden"
          } flex flex-col gap-4 p-6`}
      >
        <ThemeToggle />

        <ThemedButton
          onClick={() => {
            onLogout();
            clearUser();
          }}
        >
          Cerrar sesión
        </ThemedButton>
      </div>
      </aside>
      
      {/* Modal de Previsualización - MOVIDO AFUERA DEL ASIDE PARA QUE SEA FULL SCREEN */}
      {isPreviewOpen && (
        <ImagePreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          images={userImages.length > 0 ? userImages : [{ id: 'current', url: user?.profilePicture, isMain: true }]}
          initialImage={{ url: user?.profilePicture, isMain: true }}
          entityId={user?.id}
          entity="users"
          onImageSetMain={handleImageSetMain}
        />
      )}
    </>
  );
};

export default Sidebar;
