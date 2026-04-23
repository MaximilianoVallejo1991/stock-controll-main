import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

import { useTheme } from "../../context/ThemeContext";
import ThemedButton from "../../components/ThemedButton";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function ImagePreviewModal({
  onClose,
  images = [],               // ← nuevo
  initialImage = null,       // ← nuevo
  entityId = null,          // ← nuevo
  entity = null,             // ← nuevo
  onImageSetMain,
}) {
  if (!initialImage && images.length === 0) return null;

  const [selected, setSelected] = useState(initialImage || images[0] || null);
  const { theme } = useTheme();

  // Estados para el scroll horizontal de las miniaturas
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Cierre con Escape
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown]);


  useEffect(() => {
    setSelected(initialImage || images[0] || null);
    // Verificar scroll después de que las imágenes se carguen
    setTimeout(checkScroll, 100);
  }, [initialImage, images]);

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
  }, [images]);

  const handleWheel = (e) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
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

  const handleSetMain = async () => {
    if (!entityId || !selected) return;

    try {
      await axios.put(`/api/images/${entityId}/set-main`, {
        newProfilePicture: selected.url,
        entity,
        imageId: selected.id
      });

      alert("Imagen principal actualizada con éxito");

      if (onImageSetMain) {

        onImageSetMain(selected.url)
      }

      onClose();

    } catch (err) {
      console.error(err);
      alert("Error al actualizar la imagen principal");
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center  bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 z-50"
      onClick={onClose}
    >
      <div
        className="p-4 rounded-xl shadow-xl max-w-lg w-full" style={{ backgroundColor: theme.bg3 }}
        onClick={(e) => e.stopPropagation()}
      >

        <div>


          {/* IMAGEN GRANDE */}
          <div
            className="relative mb-4 w-full h-[55vh] flex items-end justify-center"
          >
            <img
              src={selected?.url}
              alt="preview"
              className="h-full w-auto object-cover rounded-lg"
            />

            {selected?.isMain && (
              <span className="absolute top-2 right-2  px-2 py-1 text-xs rounded shadow"
                style={{ backgroundColor: theme.bg5, color: theme.text }}
              >
                ⭐ Principal
              </span>
            )}

            {/* BOTÓN HACER PRINCIPAL */}
            {!selected?.isMain && (
              <ThemedButton
                className="w-39 absolute bottom-1 left-1/2 -translate-x-1/2 py-2 mb-3 transition"
                onClick={handleSetMain}
              >
                ✓ Hacer principal
              </ThemedButton>
            )}
          </div>

        </div>

        {/* MINIATURAS */}
        <div className="relative group mt-4">
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
            {images.map((img, index) => (
              <div
                key={img?.id || index}
                onClick={() => setSelected(img)}
                className="relative cursor-pointer border-2 rounded-lg overflow-hidden flex-shrink-0 transition-all"
                style={{
                  width: "80px",
                  height: "80px",
                  borderColor: selected?.id === img?.id ? theme.bg5 : "transparent",
                  boxShadow: selected?.id === img?.id ? `0 0 0 2px ${theme.bg5}` : "none",
                }}
              >
                <img
                  src={img?.url}
                  alt={img?.altText}
                  className="w-full h-full object-cover"
                />

                {/* Orden */}
                <div className="absolute top-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1 rounded">
                  {(img?.order ?? 0) + 1}
                </div>

                {/* Badge principal */}
                {img?.isMain && (
                  <span className="absolute bottom-0.5 right-0.5 text-yellow-400 text-xs">
                    ⭐
                  </span>
                )}
              </div>
            ))}
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
      </div>
    </div>
  );
}
