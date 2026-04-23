import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import ThemedButton from "../components/ThemedButton";
import ThemedInput from "../components/ThemedInput";
import { useTheme } from "../context/ThemeContext";
import useUserStore from "../store/userStore";

const PasswordSetup = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const setUser = useUserStore((state) => state.setUser);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pendingSetup = useMemo(() => {
    const fromState = location.state?.email;

    if (fromState) {
      return { email: fromState };
    }

    try {
      return JSON.parse(sessionStorage.getItem("pending-password-setup") || "null");
    } catch {
      return null;
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim()) {
      setError("La nueva contraseña es obligatoria.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("/api/auth/setup-password", {
        newPassword
      });

      sessionStorage.removeItem("pending-password-setup");
      setUser(res.data.user);
      navigate("/mainpanel", { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        sessionStorage.removeItem("pending-password-setup");
      }

      setError(err.response?.data?.message || "No se pudo definir la nueva contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div
        className="p-6 rounded shadow-md w-full max-w-md"
        style={{ backgroundColor: theme.bg2, color: theme.text }}
      >
        <div className="pb-4 flex flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Definí tu nueva clave</h2>
            <p className="text-sm opacity-80 mt-2">
              {pendingSetup?.email
                ? `Ingresaste con el PIN temporal de ${pendingSetup.email}.`
                : "Ingresaste con un PIN temporal."}
            </p>
            <p className="text-sm opacity-80">
              Antes de continuar, debés crear una contraseña definitiva.
            </p>
          </div>

          <ThemeToggle />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ThemedInput
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            name="newPassword"
          />

          <ThemedInput
            type="password"
            placeholder="Repetir nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            name="confirmPassword"
          />

          {error && <p className="text-red-600 text-center mt-2">{error}</p>}

          <ThemedButton type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar nueva clave"}
          </ThemedButton>

          <ThemedButton
            type="button"
            onClick={() => {
              sessionStorage.removeItem("pending-password-setup");
              navigate("/", { replace: true });
            }}
          >
            Volver al login
          </ThemedButton>
        </form>
      </div>
    </div>
  );
};

export default PasswordSetup;
