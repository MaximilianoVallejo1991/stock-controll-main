import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import ThemedButton from "../ThemedButton";
import { X, Plus, Star, Trash2, ImageIcon } from "lucide-react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

/**
 * ImageManagerModal – Componente reutilizable para gestionar imágenes.
 *
 * Acumula acciones pendientes (add/delete/set_main) sin ejecutarlas.
 * El padre decide cuándo ejecutar las acciones.
 *
 * Props:
 *   isOpen          boolean
 *   onClose         () => void
 *   existingImages  Image[] del backend (con id, url, isMain, order)
 *   onApplyChanges  (pendingActions) => void
 */
export default function ImageManagerModal({
  isOpen,
  onClose,
  existingImages = [],
  onApplyChanges,
}) {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  // Cierre con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape" && isOpen) {
      handleCancel();
    }
  }, [isOpen]);

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

  // Estado local: imágenes visibles (existentes + nuevas añadidas)
  const [localImages, setLocalImages] = useState([]);
  // Acciones acumuladas
  const [pendingActions, setPendingActions] = useState([]);
  // Imagen seleccionada para la vista grande
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Estados para el scroll horizontal de las miniaturas
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalImages(
        existingImages.map((img) => ({
          ...img,
          _type: "existing", // marcar como imagen del backend
        }))
      );
      setPendingActions([]);
      setSelectedIdx(0);
      // Dar un pequeño tiempo para que el DOM se renderice antes de checkear scroll
      setTimeout(checkScroll, 100);
    }
  }, [isOpen, existingImages]);

  // --- Lógica de Scroll Horizontal ---
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [localImages]);

  const handleWheel = (e) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollToExtreme = (toEnd) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: toEnd ? scrollRef.current.scrollWidth : 0,
        behavior: "smooth"
      });
    }
  };

  if (!isOpen) return null;

  const selected = localImages[selectedIdx] || localImages[0] || null;

  // --- Handlers ---

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const rejected = [];
    const validFiles = files.filter((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`"${file.name}": tipo no permitido (solo JPG, PNG, WEBP).`);
        return false;
      }
      if (file.size > MAX_SIZE_BYTES) {
        rejected.push(`"${file.name}": supera el límite de ${MAX_SIZE_MB}MB.`);
        return false;
      }
      return true;
    });

    if (rejected.length > 0) {
      // Mostrar errores orientativos por cada archivo rechazado
      console.warn("[ImageManager] Archivos rechazados:", rejected);
      alert(`Los siguientes archivos no fueron aceptados:\n\n${rejected.join("\n")}`);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newImages = validFiles.map((file) => {
      const tempId = `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        id: tempId,
        url: URL.createObjectURL(file),
        isMain: false,
        order: localImages.length,
        _type: "new",
        _file: file,
      };
    });

    setLocalImages((prev) => [...prev, ...newImages]);

    // Agregar acciones pendientes
    newImages.forEach((img) => {
      setPendingActions((prev) => [
        ...prev,
        { type: "add", tempId: img.id, file: img._file },
      ]);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (img) => {
    const idx = localImages.findIndex((i) => i.id === img.id);

    setLocalImages((prev) => prev.filter((i) => i.id !== img.id));

    if (img._type === "existing") {
      // Eliminar del backend
      setPendingActions((prev) => [
        ...prev,
        { type: "delete", imageId: img.id },
      ]);
    } else {
      // Quitar la acción de "add" que se acumuló
      setPendingActions((prev) =>
        prev.filter((a) => !(a.type === "add" && a.tempId === img.id))
      );
      // Liberar object URL
      URL.revokeObjectURL(img.url);
    }

    // Ajustar selección
    if (selectedIdx >= localImages.length - 1) {
      setSelectedIdx(Math.max(0, localImages.length - 2));
    } else if (selectedIdx > idx) {
      setSelectedIdx((prev) => prev - 1);
    }
  };

  const handleSetMain = (img) => {
    setLocalImages((prev) =>
      prev.map((i) => ({
        ...i,
        isMain: i.id === img.id,
      }))
    );

    // Limpiar set_main previos y agregar el nuevo
    setPendingActions((prev) => [
      ...prev.filter((a) => a.type !== "set_main"),
      { type: "set_main", imageId: img.id, imageUrl: img.url, isNew: img._type === "new" },
    ]);
  };

  const handleApply = () => {
    onApplyChanges(pendingActions, localImages);
    onClose();
  };

  const handleCancel = () => {
    // Liberar URLs de imágenes nuevas
    localImages.forEach((img) => {
      if (img._type === "new") URL.revokeObjectURL(img.url);
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 z-50"
      onClick={handleCancel}
    >
      <div
        className="p-5 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
        style={{ backgroundColor: theme.bg3, color: theme.text }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: theme.colortitlecard }}>
            Gestionar Imágenes
          </h2>
          <button
            onClick={handleCancel}
            className="p-1 rounded-full hover:bg-black/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Imagen grande seleccionada */}
        <div className="relative mb-4 w-full h-[40vh] flex items-center justify-center rounded-lg overflow-hidden"
          style={{ backgroundColor: theme.bg }}
        >
          {selected ? (
            <>
              <img
                src={selected.url}
                alt="preview"
                className="h-full w-auto object-contain rounded-lg"
              />

              {selected.isMain && (
                <span
                  className="absolute top-2 right-2 px-2 py-1 text-xs rounded shadow flex items-center gap-1"
                  style={{ backgroundColor: theme.bg5, color: "#fff" }}
                >
                  <Star size={12} /> Principal
                </span>
              )}

              {/* Acciones sobre la imagen seleccionada */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {!selected.isMain && (
                  <ThemedButton
                    onClick={() => handleSetMain(selected)}
                    className="py-1.5 px-3 text-sm flex items-center gap-1"
                  >
                    <Star size={14} /> Hacer principal
                  </ThemedButton>
                )}
                <button
                  onClick={() => handleDelete(selected)}
                  className="py-1.5 px-3 text-sm rounded flex items-center gap-1 transition"
                  style={{
                    backgroundColor: "rgba(220, 38, 38, 0.85)",
                    color: "#fff",
                  }}
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-50">
              <ImageIcon size={48} />
              <p className="text-sm">No hay imágenes</p>
            </div>
          )}
        </div>

        {/* Miniaturas + botón agregar */}
        <div className="relative group mt-auto">
          {showLeftArrow && (
            <button
              onClick={() => scrollToExtreme(false)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full shadow-md bg-white/80 dark:bg-black/80 hover:scale-110 transition-all"
              style={{ color: theme.text }}
            >
              <FaChevronLeft size={16} />
            </button>
          )}

          <div 
            ref={scrollRef}
            onWheel={handleWheel}
            className="flex gap-3 overflow-x-auto no-scrollbar pb-2 items-center"
          >
            {localImages.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => setSelectedIdx(idx)}
                className="relative cursor-pointer border-2 rounded-lg overflow-hidden flex-shrink-0 transition-all"
                style={{
                  width: "80px",
                  height: "80px",
                  borderColor: selectedIdx === idx ? theme.bg5 : theme.bg4,
                  boxShadow: selectedIdx === idx ? `0 0 0 2px ${theme.bg5}` : "none",
                }}
              >
                <img
                  src={img.url}
                  alt={`thumb-${idx}`}
                  className="w-full h-full object-cover"
                />

                {/* Orden */}
                <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                  {idx + 1}
                </div>

                {/* Badge principal */}
                {img.isMain && (
                  <span className="absolute bottom-0.5 right-0.5 text-yellow-400 text-xs">
                    <Star size={12} fill="currentColor" />
                  </span>
                )}

                {/* Badge nuevo */}
                {img._type === "new" && (
                  <span className="absolute bottom-0.5 left-0.5 bg-green-600 text-white text-[9px] px-1 rounded">
                    Nueva
                  </span>
                )}
              </div>
            ))}

            {/* Botón agregar */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center flex-shrink-0 transition hover:opacity-80"
              style={{ borderColor: theme.bg4, color: theme.colorsubtitlecard }}
            >
              <Plus size={24} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAddFiles}
            />
          </div>

          {showRightArrow && (
            <button
              onClick={() => scrollToExtreme(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full shadow-md bg-white/80 dark:bg-black/80 hover:scale-110 transition-all"
              style={{ color: theme.text }}
            >
              <FaChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Resumen de cambios pendientes */}
        {pendingActions.length > 0 && (
          <p className="text-xs mt-2 opacity-60 italic">
            {pendingActions.length} cambio{pendingActions.length !== 1 ? "s" : ""} pendiente{pendingActions.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-between mt-4 pt-3 border-t" style={{ borderColor: theme.bg4 }}>
          <ThemedButton onClick={handleCancel}>
            Cancelar
          </ThemedButton>
          <ThemedButton
            onClick={handleApply}
            disabled={pendingActions.length === 0}
          >
            Aplicar cambios
          </ThemedButton>
        </div>
      </div>
    </div>
  );
}
