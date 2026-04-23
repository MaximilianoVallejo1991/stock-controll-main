import { useEffect, useRef } from "react";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { routes } from "./routes";
import useUserStore from "./store/userStore";

function App() {
  const isInitializing = useUserStore(state => state.isInitializing);

  useEffect(() => {
    // Re-validamos sesión en cada carga (F5) para traer los datos sensibles (rol, etc)
    // que NO están en localStorage.
    useUserStore.getState().checkSession().catch((err) => {
      // Si falla, el store ya se limpia y el usuario verá el Login
      console.warn('[App] Sesión no válida:', err?.response?.status || err.message);
    });
  }, []);

  if (isInitializing) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <div style={{ color: '#38bdf8', fontSize: '1.2rem', fontFamily: 'sans-serif' }}>
          Cargando Stock Control...
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
       <RouterProvider router={routes} />
    </ThemeProvider>
  );
}

export default App;
