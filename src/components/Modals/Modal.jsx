import { useTheme } from "../../context/ThemeContext";
import { useEffect, useState, useCallback } from "react";

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = "max-w-md",
  closeOnEsc = true,
  closeOnOverlayClick = true
}) => {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape" && closeOnEsc && isOpen) {
      onClose();
    }
  }, [closeOnEsc, onClose, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      setShow(false);
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      } backdrop-blur-sm bg-black/10`}
      onClick={handleOverlayClick}
    >
      <div
        className={`p-6 rounded-md shadow-lg w-full ${maxWidth} transform transition-all duration-300 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{ backgroundColor: theme.bg }}
      >
        <button
          onClick={onClose}
          className="text-right w-full mb-2 font-bold text-xl"
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
