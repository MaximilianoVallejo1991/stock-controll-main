import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "./Modal";
import ThemedButton from "../ThemedButton";
import ThemedInput from "../ThemedInput";

const ConfirmAdminPasswordModal = ({ isOpen, onClose, onConfirm, title = "Confirmar Acción", description = "Por seguridad, ingresa tu contraseña de Administrador para confirmar esta acción.", loading = false }) => {
  const [adminPassword, setAdminPassword] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAdminPassword("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    
    setInternalLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/sudo", { password: adminPassword }, { withCredentials: true });
      onConfirm(); // Éxito: disparamos la acción original (que ahora chequeará la cookie sudo en el server)
    } catch (err) {
      setError(err.response?.data?.message || "Contraseña incorrecta o error de validación.");
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 flex flex-col gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-red-500">⚠️</span> {title}
        </h2>
        
        <p className="text-sm">
          {description}
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <ThemedInput
            type="password"
            placeholder="Tu contraseña de administrador..."
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
            autoFocus
            disabled={loading || internalLoading}
          />

          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || internalLoading}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
            >
               Cancelar
            </button>
            <ThemedButton type="submit" disabled={loading || internalLoading || !adminPassword.trim()}>
              {loading || internalLoading ? "Validando..." : "Confirmar"}
            </ThemedButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ConfirmAdminPasswordModal;
