import axios from 'axios';

// Habilitar envío de cookies HttpOnly globalmente
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

axios.interceptors.request.use(
  (config) => {

    // Attempt to pull 'activeStore' and 'simulatedRole' from the persisted Zustand state "user-storage"
    const storageData = localStorage.getItem('user-storage');
    if (storageData) {
      try {
        const parsed = JSON.parse(storageData);
        const activeStore = parsed?.state?.activeStore;
        const simulatedRole = parsed?.state?.simulatedRole;
        
        // Solo enviar header si hay una tienda activa (no null para "ALL")
        if (activeStore) {
          config.headers['x-store-id'] = activeStore;
        }

        // Enviar rol simulado si existe (el backend lo validará contra el JWT real)
        if (simulatedRole) {
          config.headers['x-simulated-role'] = simulatedRole.toUpperCase();
        }
      } catch (e) {
        console.warn('[Axios] No se pudo leer state del storage. Posible dato corrupto.', e.message);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Ignorar 401 de /auth/check (es esperable cuando no hay sesión)
      const isAuthCheck = error.config?.url?.includes('/auth/check');
      const isOnLoginPage = window.location.pathname === '/';
      
      if (!isAuthCheck && !isOnLoginPage) {
        // Sesión expirada durante uso normal → limpiar y redirigir al login
        localStorage.removeItem('user-storage');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
