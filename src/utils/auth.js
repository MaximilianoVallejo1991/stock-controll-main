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

    clearTokens();
    clearUser();
    sessionStorage.removeItem("pending-password-setup");

    // No-op confirmation call — no server-side cookie to clear anymore, so
    // there's nothing to wait for before letting the user go.
    axios.post("/api/auth/logout").catch((backendErr) => {
      console.warn("Backend logout failed (frontend already logged out)", backendErr);
    });

    // Forzamos recarga para limpiar cualquier estado residual
    window.location.href = '/';
  } catch (err) {
    console.error("Error during logout", err);
    // Fallback: limpiar localmente al menos
    localStorage.removeItem("user-storage");
    window.location.href = '/';
  }
};
