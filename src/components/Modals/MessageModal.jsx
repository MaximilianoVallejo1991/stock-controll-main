import { useTheme } from "../../context/ThemeContext";
import { useEffect, useCallback } from "react";
import ThemedButton from "../ThemedButton";


const MessageModal = ({
  isOpen,
  onClose,
  message = "",
  type = "info",
  showActions = false,
  onConfirm,
  loading = false,
}) => {
  const { theme } = useTheme();

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape" && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const borderColor =
    type === "success"
      ? theme.bg5
      : type === "error"
        ? "#f44336"
        : theme.primary;

  return (
    <div className="fixed inset-0 flex items-center justify-center  bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 z-50" onClick={onClose}>
      <div
        className="p-6 rounded-lg shadow-md max-w-sm w-full"
        style={{
          backgroundColor: theme.bg3,
          color: theme.text,
          borderLeft: `4px solid ${borderColor}`,
        }}
      >
        <h2 className="text-md font-semibold mb-4">{message}</h2>
        <div className="flex justify-end gap-2">
          {showActions ? (
            <>
              <ThemedButton onClick={onClose} disabled={loading}>
                Cancelar
              </ThemedButton>
              <ThemedButton onClick={onConfirm} disabled={loading}>
                {loading ? "Cargando..." : "Confirmar"}
              </ThemedButton>
            </>
          ) : (
            <ThemedButton onClick={onClose} disabled={loading}>
              {loading ? "Cargando..." : "Aceptar"}
            </ThemedButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
