import axios from "axios";
import useUserStore from "../store/userStore";

export const isAuthenticated = () => {
  const user = useUserStore.getState().user;
  return !!user; // Autenticado si el store tiene un usuario
};

export const logoutUser = async () => {
  try {
    const clearUser = useUserStore.getState().clearUser;
    
    // Avisar al backend para limpiar la cookie
    try {
      await axios.post("/api/auth/logout"); 
    } catch (backendErr) {
      console.warn("Backend logout failed, proceeding with frontend logout", backendErr);
    }

    clearUser();
    sessionStorage.removeItem("pending-password-setup");
    
    // Forzamos recarga para limpiar cualquier estado residual
    window.location.href = '/';
  } catch (err) {
    console.error("Error during logout", err);
    // Fallback: limpiar localmente al menos
    localStorage.removeItem("user-storage");
    window.location.href = '/';
  }
};
