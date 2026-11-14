import axios from "axios";
import useUserStore from "../store/userStore";
import { clearTokens } from "./tokenStorage";

export const isAuthenticated = () => {
  const user = useUserStore.getState().user;
  return !!user; // Autenticado si el store tiene un usuario
};

export const logoutUser = async () => {
  try {
    const clearUser = useUserStore.getState().clearUser;

    // No-op confirmation call — there is no server-side cookie to clear anymore.
    try {
      await axios.post("/api/auth/logout");
    } catch (backendErr) {
      console.warn("Backend logout failed, proceeding with frontend logout", backendErr);
    }

    clearTokens();
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
