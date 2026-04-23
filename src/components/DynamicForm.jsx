import { useEffect, useState, useRef } from "react";
import axios from "axios";
import ThemedButton from "./ThemedButton";
import { useTheme } from "../context/ThemeContext";
import { translate } from "../utils/translator";
import { EMPLOYEE_ROLES_DET, ROLES } from "../constants/roles";
import useUserStore from "../store/userStore";
import { X } from "lucide-react";
import { v } from "../styles/variables";

import Sortable from "sortablejs";

import {
  isValidCUIT,
  isValidDNI,
  isValidEmail,
  isValidArPhone
} from "../utils/validators";
import ConfirmAdminPasswordModal from "./Modals/ConfirmAdminPasswordModal";

const DynamicForm = ({
  fields,
  onSubmit,
  onClose,
  title,
  entityType, // "product", "user", "category"
  entityIdField // nombre del campo de ID en el modelo Image
}) => {
  const user = useUserStore((state) => state.user);
  const currentRole = user?.role || ROLES.VENDEDOR; // Ya viene en mayúsculas del backend

  const visibleFields = fields.filter((field) => {
    if (field.roles && !field.roles.includes(currentRole)) return false;
    return true;
  });

  const isEditable = (field) => {
    if (field.editableRoles && !field.editableRoles.includes(currentRole)) return false;
    return true;
  };
  const [formData, setFormData] = useState(() =>
    visibleFields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {})
  );
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    if (!value) return null;

    switch (name) {
      case "cuit":
        return isValidCUIT(value) ? null : "CUIT inválido";

      case "role":
        return EMPLOYEE_ROLES_DET.map(r => r.value).includes(value) ? null : "Rol inválido";
      case "dni":
        return isValidDNI(value) ? null : "DNI inválido";
      case "email":
        return isValidEmail(value) ? null : "Email inválido";
      case "phoneNumber":
        return isValidArPhone(value) ? null : "Teléfono inválido";
      default:
        return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    for (const key in formData) {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    }

    return newErrors;
  };


  const previewContainerRef = useRef(null);

  // <-- Cambiado: un único estado "images" con objetos { id, file, preview }
  const [images, setImages] = useState([]); // [{ id, file, preview }]
  const [loading, setLoading] = useState(false);
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [hoveredImageId, setHoveredImageId] = useState(null);
  const { theme } = useTheme();
  const themedInputStyle = {
    backgroundColor: theme.bg,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: v.borderRadius,
  };

  // Inicializar Sortable solo una vez
  useEffect(() => {
    if (!previewContainerRef.current) return;

    const sortable = Sortable.create(previewContainerRef.current, {
      animation: 150,
      ghostClass: "opacity-50",
      onEnd: (evt) => {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;

        if (oldIndex === undefined || newIndex === undefined) return;

        setImages((prev) => {
          const updated = [...prev];
          const [moved] = updated.splice(oldIndex, 1);
          updated.splice(newIndex, 0, moved);
          return updated;
        });
      },
    });

    return () => sortable.destroy();
  }, []); // solo una vez

  // Limpiar object URLs cuando las images cambian o componente se desmonta
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        try {
          URL.revokeObjectURL(img.preview);
        } catch (e) { }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // cleanup on unmount

  // Cada vez que images cambian (remoción o reorden), opcional: podrías limpiar previas, pero
  // dejamos la limpieza completa al unmount para evitar revocar previews aún en uso.

  useEffect(() => {
    // reconciliación segura: si quisiéramos revocar previews de imágenes eliminadas
    // podríamos comparar prev/next y revocar los que no estén. Para simplicidad lo omitimos.
  }, [images]);

  // helper para generar UUID (fallback si no existe crypto.randomUUID)
  const generateId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    // fallback simple
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  useEffect(() => {
    setFormData(visibleFields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {}));
    // conservar imágenes si el form se mantiene abierto; si querés limpiar al cambiar fields:
    setImages([]);
  }, [fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    const error = validateField(name, value);

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };


  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  // Acumula varias selecciones y crea objetos con id+preview
  const handleFileChange = (e) => {
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
      console.warn("[DynamicForm] Archivos rechazados:", rejected);
      alert(`Los siguientes archivos no fueron aceptados:\n\n${rejected.join("\n")}`);
    }

    if (validFiles.length === 0) return;

    const newImages = validFiles.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) {
        try {
          URL.revokeObjectURL(removed.preview);
        } catch (e) {
          console.error("Error revoking image preview URL", e);
        }
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const performSubmit = async (payload) => {
    setLoading(true);
    try {
      // 1. Crear entidad (ej: producto, categoría, etc.)
      const res = await axios.post(`/api/${entityType}`, payload);
      
      const entity = res.data;
      const entityId = entity.id;

      if (!entityId) throw new Error("No se recibió el ID de la entidad");

      // 2. Subir imágenes (si hay) respetando el orden actual en `images`
      for (let i = 0; i < images.length; i++) {
        const translatedEntityIdField = translate(entityIdField);
        const formImage = new FormData();
        formImage.append("file", images[i].file);
        formImage.append(translatedEntityIdField, entityId); // Ej: productId, userId
        formImage.append("altText", `Imagen ${i + 1}`);
        formImage.append("isMain", i === 0); // La primera es la principal
        formImage.append("order", i);

        await axios.post("/api/images/upload", formImage, {
           headers: { "Content-Type": "multipart/form-data" }
        });
      }

      onSubmit?.(entity);
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      const errorMsg = error.response?.data?.message || error.message || "Error al guardar datos";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    if (entityType === "user" && (formData.role === ROLES.ADMINISTRADOR || formData.role === ROLES.SISTEMA)) {
      setIsAdminPasswordModalOpen(true);
      return;
    }

    await performSubmit(formData);
  };

  const handleAdminPasswordConfirm = async () => {
    setIsAdminPasswordModalOpen(false);
    await performSubmit(formData);
  };

  const hasErrors = Object.values(errors).some(e => e);


  return (
    <div className="relative">
      {loading && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm rounded-xl"
          style={{ backgroundColor: theme.bgAlpha }}
        >
          <div
            className="text-xl font-bold animate-pulse"
            style={{ color: theme.text }}
          >
            Cargando...
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[80vh] overflow-y-auto p-4 custom-scrollbar"
        style={{ color: theme.text }}
      >
        <h2
          className="text-xl text-center font-bold rounded-3xl mb-4 sticky top-0 z-10 p-2 -m-2 shadow-sm"
          style={{
            backgroundColor: theme.bg,
            color: theme.colortitlecard
          }}
        >
          Agregar {title}
        </h2>

        {visibleFields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium">{field.label}</label>

            {field.type === "select" ? (
              <select
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                style={themedInputStyle}
                className="w-full p-2 border rounded disabled:opacity-50"
                required={field.required ?? true}
                disabled={!isEditable(field)}
              >
                <option value="">Seleccione una opción</option>
                {field.options?.map((opt) => (
                  <option className="back" key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={field.name}
                type={field.type || "text"}
                value={formData[field.name]}
                style={themedInputStyle}
                onChange={handleChange}
                className="w-full p-2 border rounded disabled:opacity-50"
                required={field.required ?? true}
                disabled={!isEditable(field)}
                min={field.name === "price" || field.name === "stock" ? 0 : undefined}
              />


            )}
            {errors[field.name] && (
              <p
                className="text-sm mt-1"
                style={{ color: theme.danger }}
              >
                {errors[field.name]}
              </p>
            )}

          </div>
        ))}

        <div>
          <label className="block text-sm font-medium">Imágenes</label>
          <input type="file" accept="image/*" multiple onChange={handleFileChange} />
          <div
            ref={previewContainerRef}
            className="grid grid-cols-[repeat(auto-fill,_minmax(90px,_1fr))] gap-2 mt-2"
          >
            {images.map((img, idx) => (
              <div key={img.id} className="relative h-24 w-24 group">
                {/* Badge Orden (Top-Left) */}
                <span
                  className="absolute top-1 left-1 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10 shadow-sm"
                  style={{ backgroundColor: theme.bg5 }}
                >
                  {idx + 1}
                </span>

                {/* Botón Eliminar (Top-Right) */}
                <button
                  type="button"
                  onMouseEnter={() => setHoveredImageId(img.id)}
                  onMouseLeave={() => setHoveredImageId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  className="absolute top-1 right-1 text-white p-0.5 rounded-full shadow-md transition-all duration-200 z-20 opacity-0 group-hover:opacity-100 sm:opacity-100 hover:scale-125"
                  style={{ 
                    backgroundColor: hoveredImageId === img.id ? theme.dangerHover : theme.danger 
                  }}
                  title="Eliminar imagen"
                >
                  <X size={12} />
                </button>

                <img
                  src={img.preview}
                  alt={`preview-${idx}`}
                  className="h-full w-full object-cover rounded border shadow-sm"
                  style={{ borderColor: theme.bg4 }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <ThemedButton type="button" onClick={onClose}>
            Cancelar
          </ThemedButton>
          <ThemedButton type="submit" disabled={hasErrors || loading}>
            Guardar
          </ThemedButton>

        </div>
      </form>

      <ConfirmAdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        title="Crear Administrador"
        description={`Estás a punto de crear un nuevo usuario con rol ${formData.role}. Por seguridad, ingresa tu contraseña de Administrador para autorizar.`}
        onConfirm={handleAdminPasswordConfirm}
      />
    </div>
  );
};

export default DynamicForm;
