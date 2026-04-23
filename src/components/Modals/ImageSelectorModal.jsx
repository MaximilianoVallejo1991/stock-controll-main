import { useState, useEffect, useCallback } from "react";

export default function ImageSelectorModal({
  images = [],            // [{ id, url, order }]
  initialIndex = 0,
  onClose,
  onSelectAsMain,         // función callback cuando elige la imagen principal
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

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

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-4 rounded-xl shadow-xl max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* IMAGEN GRANDE */}
        <div className="flex flex-col items-center">
          <img
            src={currentImage.url}
            alt="preview"
            className="max-h-[60vh] rounded-lg mb-3 object-contain"
          />

          {/* BOTÓN PARA MARCAR COMO PRINCIPAL */}
          <button
            onClick={() => onSelectAsMain(currentImage)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg shadow hover:bg-amber-700 transition"
          >
            Marcar como principal
          </button>
        </div>

        {/* MINIATURAS */}
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,_minmax(70px,_1fr))] gap-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              onClick={() => setCurrentIndex(idx)}
              className="relative cursor-pointer group"
            >
              {/* NÚMERO */}
              <span className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded-full">
                {img.order + 1}
              </span>

              {/* BADGE DE PRINCIPAL */}
              {img.order === 0 && (
                <span className="absolute bottom-1 left-1 bg-amber-600 text-white text-[10px] px-1 rounded">
                  Principal
                </span>
              )}

              <img
                src={img.url}
                alt={`thumb-${idx}`}
                className={`
                  h-16 w-full object-cover rounded border
                  ${idx === currentIndex ? "ring-2 ring-amber-600" : ""}
                `}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
