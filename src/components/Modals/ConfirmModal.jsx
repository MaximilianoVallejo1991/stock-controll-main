import { useTheme } from "../../context/ThemeContext";
import { useEffect, useCallback } from "react";
import ThemedButton from "../ThemedButton";

const ConfirmModal = ({ isOpen, onClose, onConfirm, message = "¿Estás seguro?", children }) => {
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

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 z-50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="p-6 rounded-lg shadow-md max-w-sm w-full"
        style={{
          backgroundColor: theme.bg3,
          color: theme.text,
          borderLeft: `4px solid ${theme.primary}`,
        }}
      >
        <h2 className="text-lg font-semibold mb-4">{message}</h2>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex justify-end gap-2">
          <ThemedButton onClick={onClose}>Cancelar</ThemedButton>
          <ThemedButton onClick={onConfirm}>Confirmar</ThemedButton>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
