import { useTheme } from "../../context/ThemeContext";
import { useEffect, useCallback } from "react";
import ThemedButton from "../ThemedButton";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  message = "¿Estás seguro?", 
  children,
  confirmText = "Confirmar",
  accentColor
}) => {
  const { theme } = useTheme();
  const effectiveAccent = accentColor || theme.primary;

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
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="p-6 rounded-xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: theme.bg3,
          color: theme.text,
          borderTop: `4px solid ${effectiveAccent}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">{message}</h2>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-70"
            style={{ backgroundColor: theme.bg, color: theme.text }}
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-md"
            style={{ backgroundColor: effectiveAccent, color: "white" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
