import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useUserStore = create(
  persist(
    (set) => ({
      user: null, 
      isDark: false,
      activeStore: null, 
      simulatedRole: null,   // Rol simulado por SISTEMA. null = sin simulación.
      isInitializing: true,
      setUser: (userData) => set({ user: userData, isInitializing: false }),
      clearUser: () => set({ user: null, activeStore: null, simulatedRole: null, isInitializing: false }),
      toggleTheme: () => set ((state) => ({isDark: !state.isDark})), 
      setActiveStore: (storeId) => set({ activeStore: storeId }),
      setSimulatedRole: (role) => set({ simulatedRole: role || null }),
      
      checkSession: async () => {
        try {
          const res = await axios.get("/api/auth/check");
          set({ user: res.data, isInitializing: false });
          return res.data;
        } catch (err) {
          // Solo cerramos sesión si es un 401 (Auth expirada) 
          // NO si es un 403 (Permiso denegado por simulación u otro motivo)
          if (err.response?.status === 401) {
            set({ user: null, activeStore: null, isInitializing: false });
          } else {
            set({ isInitializing: false });
          }
          throw err;
        }
      }
    }),
    {
      name: 'user-storage', 
      partialize: (state) => ({ 
        // Solo guardamos datos de UI y perfil básico (No rol, No storeId real)
        user: state.user ? { 
          firstName: state.user.firstName, 
          lastName: state.user.lastName, 
          profilePicture: state.user.profilePicture 
        } : null, 
        isDark: state.isDark,
        activeStore: state.activeStore,
        simulatedRole: state.simulatedRole  // Persiste la simulación entre F5 y navegaciones
      }), 
    }
  )
);

export default useUserStore;
