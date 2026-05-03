import { Navigate, useParams, useLocation, useNavigate } from "react-router-dom";
import { use, useEffect, useState, useRef } from "react";
import axios from "axios";
import { format } from "date-fns";
import JsBarcode from "jsbarcode";
import { useTheme } from "../context/ThemeContext";
import ThemedButton from "../components/ThemedButton";
import MessageModal from "../components/Modals/MessageModal";
import { Pencil, CreditCard } from "lucide-react";
import ImagePreviewModal from "../components/Modals/ImagePreviewModal";
import ImageManagerModal from "../components/Modals/ImageManagerModal";
import ConfirmAdminPasswordModal from "../components/Modals/ConfirmAdminPasswordModal";
import StockAdjustModal from "../components/Modals/StockAdjustModal";
import { translate } from "../utils/translator";
import {
  isValidCUIT,
  isValidDNI,
  isValidEmail,
  isValidArPhone
} from "../utils/validators";
import { EMPLOYEE_ROLES_DET, ROLES } from "../constants/roles";
import { formatCurrency, parseCurrency } from "../utils/currency";
import { v } from "../styles/variables";
import useUserStore from "../store/userStore";

const Details = () => {
  const { id, entity: entityParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [messageModal, setMessageModal] = useState({ isOpen: false, text: "", type: "info" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [isAdminPasswordOpen, setIsAdminPasswordOpen] = useState(false);
  const [adminPasswordAction, setAdminPasswordAction] = useState("");
  const [pendingChanges, setPendingChanges] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [pendingStockAdjustment, setPendingStockAdjustment] = useState(null);
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [pendingImageActions, setPendingImageActions] = useState([]);
  const [tempProfilePicture, setTempProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const isSaving = useRef(false); // guard sync contra múltiples clics
  const entity = entityParam || location.pathname.split("/")[1];
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(data) || pendingStockAdjustment !== null || pendingImageActions.length > 0;
  const [openPreview, setOpenPreview] = useState(false);
  const [categories, setCategories] = useState([]);
  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const currentUserRole = simulatedRole || user?.role;
  const ENTITY_ALLOWED_ROLES = {
    clients: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR],
    suppliers: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR],
    products: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR],
    categories: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO],
    user: [ROLES.SISTEMA, ROLES.ADMINISTRADOR],
    stores: [ROLES.SISTEMA],
  };
  const canAccessCurrentEntity = ENTITY_ALLOWED_ROLES[entity]?.includes(currentUserRole);
  const canEditCurrentEntity = [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO].includes(currentUserRole);
  const ENTITY_FIELD_RULES = {
    suppliers: {
      // showOnly: ["name", "fullName", "email", "phoneNumber", "address", "city", "cuit", "description", "isActive"],
      showExtra: ["fullName"],
      hide: ["name", "firstName", "lastName", "dni", "price", "stock"],
    },
    categories: {
      readOnly: ["barcodePrefix",]
    },
    products: {
      readOnly: ["barcode"],
    }
  };

  useEffect(() => {
    if (entity === "products") {
      axios.get("/api/categories")
        .then(res => {
          setCategories(res.data);
        })
        .catch(err => console.error("Error fetching categories:", err));
    }
  }, [entity]);

  if (!canAccessCurrentEntity) {
    return <Navigate to="/home" replace />;
  }

  // FUNCION PARA CARGAR DATOS
  const fetchData = () => {
    axios
      .get(`/api/${entity}/${id}`)
      .then((res) => {
        setData(res.data);
        // console.log("Datos actualizados:", res.data);
        setFormData(res.data);
      })
      .catch((err) => console.error(`Error cargando ${entity}`, err));
  };

  const [activeProductsCount, setActiveProductsCount] = useState(0);

  useEffect(() => {
    fetchData(); // Llamamos la función al montar el componente
  }, [entity, id]);

  useEffect(() => {
    if (entity === "categories" && data) {
      axios.get(`/api/products?categoryId=${id}`)
        .then(res => {
          const activeOnes = res.data.filter(p => p.isActive !== false);
          setActiveProductsCount(activeOnes.length);
        })
        .catch(err => console.error("Error fetching category products:", err));
    }
  }, [entity, id, data]);

  // Efecto para renderizar el código de barras en pantalla (Vista Detalle)
  useEffect(() => {
    if (entity === "products" && data?.barcode) {
      // Pequeño timeout para asegurar que el DOM del canvas esté listo
      const timer = setTimeout(() => {
        const element = document.getElementById("barcode-detail-preview");
        if (element) {
          JsBarcode(element, data.barcode, {
            format: "CODE128",
            displayValue: true,
            fontSize: 16,
            width: 2,
            height: 50,
            background: "#ffffff",
            lineColor: "#000000"
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [entity, data?.barcode]);

  // HANDLER PARA CUANDO SE CAMBIA LA IMAGEN PRINCIPAL
  const handleProfilePictureUpdate = () => {
    setOpenPreview(false); // asegurar que el modal se cierre
    fetchData(); // Recargar datos después de cambiar la imagen principal
  };

  if (!data) return <p className="p-6 text-center">Cargando datos...</p>;

  const fullName = data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim();
  const createdAt = data.createdAt ? format(new Date(data.createdAt), "dd/MM/yyyy HH:mm") : "";
  const updatedAt = data.updatedAt ? format(new Date(data.updatedAt), "dd/MM/yyyy HH:mm") : "";

  const handleEditPicture = () => {
    setIsImageManagerOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const getChangedFields = (original, edited) => {
    const changes = {};
    for (const key in edited) {
      if (JSON.stringify(edited[key]) !== JSON.stringify(original[key])) {
        changes[key] = edited[key];
      }
    }
    return changes;
  };


  const handleToggleActive = () => {
    if (isSaving.current) return;


    if (modalAction === "category_change") {
      performSave(pendingChanges);
      setIsModalOpen(false);
      return;
    }

    // Si es un usuario y no tenemos Sudo Mode activo (esto lo maneja el modal ahora), abrimos el modal
    if (entity === "user" && !isAdminPasswordOpen && adminPasswordAction !== "toggle_active") {
      setAdminPasswordAction("toggle_active");
      setIsAdminPasswordOpen(true);
      setIsModalOpen(false);
      return;
    }

    const endpointAction = modalAction === "disable" ? "disable" : "enable";

    isSaving.current = true;
    setLoading(true);
    axios
      .put(`/api/${entity}/${id}/active`, {
        isActive: modalAction === "enable"
      }, { withCredentials: true }) // Enviamos cookies (para el Sudo Token)

      .then((res) => {
        setData(res.data);
        setMessageModal({
          isOpen: true,
          text: `${entity === 'user' ? 'Empleado' : 'Registro'} ${endpointAction === "disable" ? "dado de baja" : "dado de alta"} correctamente`,
          type: "success",
        });
      })
      .catch((err) => {
        console.error(`Error al ${endpointAction} el registro`, err);
        setMessageModal({
          isOpen: true,
          text: err.response?.data?.message || `Hubo un error al ${endpointAction === "disable" ? "dar de baja" : "dar de alta"} el registro`,
          type: "error",
        });
      })
      .finally(() => {
        isSaving.current = false;
        setLoading(false);
        setIsModalOpen(false);
        setIsAdminPasswordOpen(false);
        setAdminPasswordAction(null);
      });
  };

  const handleResetPassword = () => {
    if (isSaving.current) return;
    isSaving.current = true;
    setLoading(true);
    axios
      .put(`/api/${entity}/${id}/reset-pin`, {}, { withCredentials: true })
      .then((res) => {
        fetchData(); // Recarga los datos (ahora data.tempPassword tendrá el nuevo PIN)
        setMessageModal({
          isOpen: true,
          text: `La clave fue blanqueada exitosamente. El nuevo PIN temporal es: ${res.data.newPin}`,
          type: "success",
        });
      })
      .catch((err) => {
        console.error("Error al blanquear la clave", err);
        setMessageModal({
          isOpen: true,
          text: err.response?.data?.message || "Error al blanquear la clave",
          type: "error",
        });
      })
      .finally(() => {
        isSaving.current = false;
        setLoading(false);
        setIsAdminPasswordOpen(false);
        setAdminPasswordAction(null);
      });
  };

  const handleOpenCurrentAccount = () => {
    if (isSaving.current) return;
    isSaving.current = true;
    setLoading(true);

    axios.post("/api/accounts/open", { clientId: id })
      .then((res) => {
        fetchData(); // Recargar para obtener la cuenta recién creada
        setMessageModal({
          isOpen: true,
          text: "Cuenta corriente abierta con éxito",
          type: "success"
        });
      })
      .catch((err) => {
        console.error("Error al abrir cuenta corriente", err);
        setMessageModal({
          isOpen: true,
          text: err.response?.data?.message || "Error al abrir la cuenta corriente",
          type: "error"
        });
      })
      .finally(() => {
        isSaving.current = false;
        setLoading(false);
      });
  };

  const performSave = async (changesToSave) => {
    if (isSaving.current) return;
    isSaving.current = true;
    setLoading(true);
    try {
      let finalData = data;

      // Guardar cambios normales si hay alguno
      if (Object.keys(changesToSave).length > 0) {
        const res = await axios.put(`/api/${entity}/${id}`, changesToSave);
        finalData = res.data;
      }

      // Guardar ajuste de stock si está pendiente
      if (pendingStockAdjustment) {
        const stockRes = await axios.put(`/api/products/${id}/stock`, {
          amount: pendingStockAdjustment.amount,
          description: pendingStockAdjustment.description
        });
        finalData = stockRes.data;
      }

      // Ejecutar acciones pendientes de imágenes
      if (pendingImageActions.length > 0) {
        const translatedEntityIdField = translate(`${entity}Id`);

        for (const action of pendingImageActions) {
          if (action.type === "delete") {
            await axios.delete(`/api/images/${action.imageId}`);
          } else if (action.type === "add") {
            const formImage = new FormData();
            formImage.append("file", action.file);
            formImage.append(translatedEntityIdField, id);
            formImage.append("altText", "Imagen");
            formImage.append("isMain", "false");
            formImage.append("order", "99");
            await axios.post("/api/images/upload", formImage);
          } else if (action.type === "set_main" && !action.isNew) {
            await axios.put(`/api/images/${id}/set-main`, {
              newProfilePicture: action.imageUrl,
              entity,
              imageId: action.imageId,
            });
          }
        }

        // Si set_main apunta a una imagen nueva, necesitamos obtener su id real
        // después de subirla y luego setearla como principal.
        // Refetch para obtener estado actualizado
        const refreshed = await axios.get(`/api/${entity}/${id}`);
        finalData = refreshed.data;

        // Si hay una acción set_main para una imagen nueva, buscar por orden y setear
        const setMainNew = pendingImageActions.find(a => a.type === "set_main" && a.isNew);
        if (setMainNew && finalData.Image?.length > 0) {
          // La última imagen subida debería ser la nueva que queremos como principal
          const lastImg = finalData.Image[finalData.Image.length - 1];
          await axios.put(`/api/images/${id}/set-main`, {
            newProfilePicture: lastImg.url,
            entity,
            imageId: lastImg.id,
          });
          const refreshed2 = await axios.get(`/api/${entity}/${id}`);
          finalData = refreshed2.data;
        }
      }

      setData(finalData);
      setFormData(finalData);
      setPendingStockAdjustment(null);
      setPendingImageActions([]);
      setTempProfilePicture(null);
      setIsEditing(false);
      setMessageModal({ isOpen: true, text: "Cambios guardados correctamente ", type: "success" });

    } catch (err) {
      console.error("Error al guardar", err);
      setMessageModal({ isOpen: true, text: err.response?.data?.message || "Hubo un error al guardar los cambios", type: "error" });
    } finally {
      isSaving.current = false;
      setLoading(false);
      setConfirmOpen(false);
      setIsAdminPasswordOpen(false);
      setAdminPasswordAction(null);
    }
  };

  const handleConfirmSave = () => {
    if (isSaving.current) return;


    const validateForm = () => {
      if ("role" in formData && formData.role && !EMPLOYEE_ROLES_DET.some(r => r.value === formData.role)) {
        return "Rol inválido";
      }

      if ("cuit" in formData && formData.cuit && !isValidCUIT(formData.cuit)) {
        return "CUIT inválido";
      }

      if ("dni" in formData && formData.dni && !isValidDNI(formData.dni)) {
        return "DNI inválido";
      }

      if ("email" in formData && formData.email && !isValidEmail(formData.email)) {
        return "Email inválido";
      }

      if ("phoneNumber" in formData && formData.phoneNumber && !isValidArPhone(formData.phoneNumber)) {
        return "Teléfono inválido";
      }

      return null;
    };


    const error = validateForm();

    if (error) {
      setMessageModal({
        isOpen: true,
        text: error,
        type: "error"
      });
      setConfirmOpen(false);
      return;
    }

    const changes = getChangedFields(data, formData);

    // Quitar campos que jamás deben ir al backend
    delete changes.id;
    delete changes.createdAt;
    delete changes.updatedAt;
    delete changes.Image;
    delete changes.category;
    delete changes.stock; // Stock se maneja por separado ahora

    if (Object.keys(changes).length === 0 && !pendingStockAdjustment && pendingImageActions.length === 0) {
      setConfirmOpen(false);
      return;
    }

    // Si cambió la categoría y es un producto, advertir sobre el cambio de código de barras
    if (
      entity === "products" &&
      changes.categoryId &&
      changes.categoryId !== data.categoryId
    ) {
      setPendingChanges(changes);
      setModalAction("category_change");
      setIsModalOpen(true);
      setConfirmOpen(false);
      return;
    }

    // console.log("Campos a actualizar:", changes);

    if (!changes.password) {
      delete changes.password;
    }

    if (entity === "user" && changes.role) {
      setPendingChanges(changes);
      setAdminPasswordAction("save_role");
      setIsAdminPasswordOpen(true);
      setConfirmOpen(false);
      return;
    }

    performSave(changes);
  };

  const handlePrintLabel = () => {
    const windowUrl = "about:blank";
    const uniqueName = new Date();
    const windowName = "Print" + uniqueName.getTime();
    const printWindow = window.open(
      windowUrl,
      windowName,
      "left=50000,top=50000,width=0,height=0"
    );

    // Generar la URL de la imagen del código de barras usando un canvas oculto
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, data.barcode, {
        format: "CODE128",
        displayValue: true, // JsBarcode ya maneja mostrar el número debajo
        fontSize: 20,
        margin: 10,
        width: 2,
        height: 60
      });
    } catch (error) {
      console.error("Error generando barcode:", error);
      alert("Error al generar el código de barras.");
      printWindow.close();
      return;
    }
    const barcodeDataUrl = canvas.toDataURL("image/png");

    printWindow.document.head.innerHTML = `
      <title>Imprimir Etiqueta</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center;
          padding: 20px;
          text-align: center;
          margin: 0;
        }
        .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
        .barcode-container { margin: 10px 0; }
      </style>
    `;

    const body = printWindow.document.body;
    body.innerHTML = `
      <h3 class="name"></h3>
      <div class="barcode-container">
        <img class="barcode" src="" alt="Barcode" />
      </div>
    `;

    body.querySelector('.name').textContent = data.name;
    body.querySelector('.barcode').src = barcodeDataUrl;

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
    // Fallback por si onload no dispara
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
        printWindow.close();
      }
    }, 500);
    printWindow.focus();
  };

  const renderValue = (value, key) => {
    if (value === null || value === undefined) return "—";

    // Ocultar password
    if (key === "password") return "********";

    // Fechas
    if (key.toLowerCase().includes("date")) {
      try {
        return format(new Date(value), "dd/MM/yyyy HH:mm");
      } catch {
        return String(value);
      }
    }

    // Si es array
    if (Array.isArray(value)) {
      return value.length === 0 ? "—" : `${value.length} elementos`;
    }

    // Si es objeto
    if (typeof value === "object") {
      // Caso común: { name: "Algo" }
      if ("name" in value) return value.name;

      // Caso: { label, value }
      if ("label" in value) return value.label;

      // Fallback seguro
      return JSON.stringify(value);
    }

    if (key === "price" || key === "cost" || key === "total" || key === "amount")
      return formatCurrency(value);

    // Primitivos
    return String(value);
  };

  return (
    <main
      className="min-h-screen p-8"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div
        className="relative max-w-4xl mx-auto p-6 rounded-xl shadow-md border"
        style={{
          backgroundColor: theme.bg2,
          borderColor: theme.bg4,
          color: theme.text,
        }}
      >
        {entity === "user" && data.mustChangePassword && (
          <div className="mb-6 p-4 rounded border-l-4 border-yellow-500 bg-yellow-100 text-yellow-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-bold text-lg mb-1">
                ⚠️ Pendiente de Cambio de Clave
              </h3>
              <p>
                Este usuario aún no ha realizado su primer ingreso. Si ha perdido su PIN temporal, puede utilizar el botón <strong>"Blanquear Clave"</strong> para generar uno nuevo.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-6 mb-6 ">
          <div className="relative w-24 h-24 overflow-visible">
            {/* Imagen clickeable */}
            {(() => {
              // Solo mostrar imagen si realmente existen imÃ¡genes en la lista
              const hasImages = data.Image && data.Image.length > 0;
              const avatarSrc = tempProfilePicture || (hasImages ? data.profilePicture : null);
              return (
                <div
                  className={`w-24 h-24 rounded-full overflow-hidden ${hasImages ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => hasImages && setOpenPreview(true)}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={fullName}
                      className="w-24 h-24 rounded-full object-cover border"
                      style={{ borderColor: theme.bg4 }}
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full border flex items-center justify-center text-sm"
                      style={{ borderColor: theme.bg4, backgroundColor: theme.bg }}
                    >
                      Sin imagen
                    </div>
                  )}
                </div>
              );
            })()}
            <button
              onClick={handleEditPicture}
              className={`
              absolute bottom-0 right-0 
              p-1.5 rounded-full border shadow-lg
              z-20 transition-all duration-300
              ${isEditing
                  ? "opacity-100 scale-100 hover:scale-110 cursor-pointer"
                  : "opacity-0 scale-0 cursor-not-allowed pointer-events-none"
                }
              `}
              style={{
                backgroundColor: v.colorPrincipal,
                borderColor: v.colorPrincipal,
                color: theme.bg1
              }}
            >
              <Pencil size={16} strokeWidth={2.5} />
            </button>

          </div>

          {openPreview && data.Image && data.Image.length > 0 && (
            <ImagePreviewModal
              onClose={() => setOpenPreview(false)}
              images={data.Image}
              initialImage={data.Image.find((img) => img.isMain)}
              entityId={data.id}
              entity={entity}
              onImageSetMain={handleProfilePictureUpdate}
            />
          )}


          <div className="flex flex-col w-full">

            <div className="flex justify-between">

              <h1
                className="text-2xl font-bold"
                style={{ color: theme.colortitlecard }}
              >
                {fullName || "Detalle"}

              </h1>

              <div className="flex gap-2">



                {entity === "clients" && !data.currentAccount && canEditCurrentEntity && (
                  <ThemedButton
                    onClick={handleOpenCurrentAccount}
                    className="flex items-center gap-2"
                  >
                    <CreditCard size={18} />
                    Abrir Cuenta Corriente
                  </ThemedButton>
                )}

                {entity === "clients" && data.currentAccount && data.currentAccount.status === "OPEN" && (
                  <ThemedButton
                    variant="secondary"
                    onClick={() => navigate(`/accounts/details/${data.currentAccount.id}`)}
                    className="flex items-center gap-2"
                  >
                    <CreditCard size={18} />
                    Cuenta Corriente
                  </ThemedButton>
                )}

                {canEditCurrentEntity && (
                  <ThemedButton
                    onClick={() => {
                      if (isEditing) {
                        setFormData(data);
                        setPendingStockAdjustment(null);
                        setPendingImageActions([]);
                        setTempProfilePicture(null);
                        setIsEditing(false);
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  >
                    {isEditing ? "Cancelar" : "Editar"}
                  </ThemedButton>
                )}

              </div>
            </div>

            <div className="flex flex-row items-center justify-between">

              <div className="flex flex-col items-start mt-2">


                <p className="text-xs" style={{ color: theme.colorsubtitlecard }}>
                  ID: {data.id}
                </p>
                {data.isActive !== undefined && (
                  <span
                    className="inline-block mt-2 px-3 py-1 text-xs rounded-full font-medium"
                    style={{
                      backgroundColor: data.isActive ? theme.bg5 : theme.bg4,
                      color: data.isActive ? "#fff" : theme.text,
                    }}
                  >
                    {data.isActive ? "Activo" : "Inactivo"}
                  </span>
                )}

              </div>

              <div style={{ color: theme.colorsubtitlecard }} className="flex   flex-col justify-end text-xs text-right mt-6">
                <p>Creado: {createdAt}</p>
                <p>Actualizado: {updatedAt}</p>


              </div>

            </div>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {Object.entries(formData)
            .filter(([key]) => {
              const baseExcluded = [
                "id",
                "storeId",
                "image",
                "isActive",
                "orders",
                "payments",
                "Image",
                "createdAt",
                "updatedAt",
                "profilePicture",
                "category",
                "cuit",
                "tempPassword",
                "mustChangePassword",
                "roleId",
                "rbacRole"
              ];

              if (baseExcluded.includes(key)) return false;

              const rules = ENTITY_FIELD_RULES[entity];

              if (rules) {
                if (rules.hide?.includes(key) && entity === "suppliers") return false;
              }
              if (key === "fullName" && entity !== "suppliers") return false;



              return true;
            })

            .map(([key, value]) => (
              <div key={key}>
                <p className="font-semibold capitalize" style={{ color: theme.colorsubtitlecard }}>
                  {key}
                </p>
                {isEditing && !ENTITY_FIELD_RULES[entity]?.readOnly?.includes(key) ?
                  key === "categoryId" && entity === "products" ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.categoryId || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            categoryId: val
                          }));
                        }}
                        className="w-full p-2 border rounded text-sm"
                        style={{
                          backgroundColor: theme.bgtgderecha,
                          color: theme.text,
                          borderColor: theme.bg4,
                        }}
                      >
                        <option value="">Seleccionar categoría...</option>

                        {categories.map(c => (
                          <option
                            key={c.id}
                            value={c.id}
                            style={{
                              backgroundColor: theme.bgtgderecha,
                              color: theme.text,
                            }}
                          >
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {/* ID actual */}
                      <input
                        type="text"
                        value={formData.categoryId || ""}
                        disabled
                        className="w-1/2 p-2 border rounded text-xs opacity-70"
                        style={{
                          backgroundColor: theme.bgtgderecha,
                          borderColor: theme.bg4,
                          color: theme.text,
                        }}
                      />
                    </div>
                  )
                    :
                    key === "password" && entity === "user" ? (
                      <div className="mt-1">
                        <ThemedButton
                          type="button"
                          onClick={() => {
                            setAdminPasswordAction("reset");
                            setIsAdminPasswordOpen(true);
                          }}
                        >
                          Blanquear Clave
                        </ThemedButton>
                      </div>
                    ) : key === "role" ? (
                      <select
                        name="role"
                        value={formData.role || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData((prev) => ({ ...prev, role: val }));
                        }}
                        className="w-full p-2 border rounded text-sm"
                        style={{
                          backgroundColor: theme.bgtgderecha,
                          color: theme.text,
                          borderColor: theme.bg4,
                        }}
                        disabled={data.role === ROLES.SISTEMA || formData.role === ROLES.SISTEMA}
                      >
                        <option value="">Seleccionar rol...</option>

                        {(data.role === ROLES.SISTEMA || formData.role === ROLES.SISTEMA) && (
                          <option
                            value={ROLES.SISTEMA}
                            style={{
                              backgroundColor: theme.bgtgderecha,
                              color: theme.text,
                              borderColor: theme.bg4,
                            }}
                          >
                            Sistema
                          </option>
                        )}

                        {EMPLOYEE_ROLES_DET.map((r) => (
                          <option
                            key={r.value}
                            value={r.value}
                            style={{
                              backgroundColor: theme.bgtgderecha,
                              color: theme.text,
                              borderColor: theme.bg4,
                            }}
                          >
                            {r.label}
                          </option>
                        ))}
                      </select>
                    ) : entity === "products" && key === "stock" ? (
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg">
                          {pendingStockAdjustment ? data.stock + pendingStockAdjustment.amount : value}
                        </span>
                        {pendingStockAdjustment && (
                          <span className="text-xs italic text-blue-500">
                            ({pendingStockAdjustment.amount > 0 ? '+' : ''}{pendingStockAdjustment.amount} Pendiente)
                          </span>
                        )}
                        <ThemedButton
                          type="button"
                          onClick={() => setIsStockModalOpen(true)}
                          className="py-1 px-3 text-xs"
                        >
                          Ajustar Stock
                        </ThemedButton>
                        {pendingStockAdjustment && (
                          <button
                            onClick={() => setPendingStockAdjustment(null)}
                            className="text-red-500 text-xs underline cursor-pointer"
                          >
                            Cancelar ajuste
                          </button>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        name={key}
                        value={key === "price" || key === "cost" ? value || "" : value || ""}
                        onChange={(e) => {
                          if (key === "price" || key === "cost") {
                            // Si se estÃ¡ editando manual un input number
                            handleChange(e);
                          } else {
                            handleChange(e);
                          }
                        }}
                        className="w-full p-1 border rounded text-sm"
                        style={{
                          backgroundColor: theme.bgtgderecha,
                          borderColor: theme.bg4,
                          color: theme.text,
                        }}
                      />
                    ) : (
                    <p style={{ color: theme.colorsubtitlecard }}>
                      {entity === "products" && key === "categoryId"
                        ? data.category?.name || "—"
                        : renderValue(value, key)
                      }
                    </p>
                  )
                }
              </div>
            ))}

        </div>

        {entity === "products" && data.barcode && (
          <div className="mt-8 pt-6 border-t flex flex-col items-center sm:items-start gap-4" style={{ borderColor: theme.bg3 }}>
            <p className="font-bold text-lg" style={{ color: theme.colorsubtitlecard }}>Código de Barras Relevado</p>
            <div className="flex flex-wrap items-center gap-8 bg-white p-4 rounded-xl border border-dashed max-w-full overflow-hidden shadow-inner" style={{ borderColor: theme.bg4 }}>
              <div className="flex flex-col items-center max-w-full">
                <div className="barcode-preview-container bg-white p-2 rounded border">
                  <canvas id="barcode-detail-preview"></canvas>
                </div>
                <p className="text-xs tracking-[0.5em] font-mono mt-2 opacity-50 text-black">
                  {data.barcode}
                </p>
              </div>
              <ThemedButton onClick={handlePrintLabel} className="h-fit">
                🖨️ Imprimir Etiqueta
              </ThemedButton>
            </div>
            <p className="text-xs italic opacity-50">* Los códigos de barras son generados automáticamente y no son editables para mantener la integridad de la base de datos.</p>
          </div>
        )}
      </div>

      {isEditing && (

        <div className="flex flex-row justify-between" >

          <div className="mt-6 flex justify-start">

            <ThemedButton
              onClick={() => {
                setModalAction(data.isActive ? "disable" : "enable");
                setIsModalOpen(true);
              }}
              style={{ backgroundColor: data.isActive ? theme.danger : theme.success, color: '#fff' }}
            >
              {data.isActive ? "Dar de baja" : "Dar de alta"}
            </ThemedButton>
          </div>

          <div className="mt-6 flex justify-end">
            <ThemedButton
              disabled={!hasChanges || loading}
              onClick={() => setConfirmOpen(true)}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </ThemedButton>
          </div>
        </div>
      )}


      <MessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={
          modalAction === "category_change"
            ? "⚠️ : Al cambiar la categoría, se generará un NUEVO código de barras. Las etiquetas impresas anteriormente ya no serán válidas. ¿Deseas continuar?"
            : modalAction === "disable"
              ? entity === "categories"
                ? `Esta categoría tiene ${activeProductsCount} productos activos. Al darla de baja, todos sus productos también se darán de baja automáticamente. Presione cancelar y mueva a otra categoría los productos que no desea desactivar. Si ya lo hizo presione continuar.`
                : "¿Deseás dar de baja este registro?"
              : "¿Deseás dar de alta este registro?"
        }
        type={modalAction === "category_change" ? "warning" : "confirm"}
        showActions={true}
        onConfirm={() => handleToggleActive()}
        loading={loading}
      />

      <MessageModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        message="¿Estás seguro de guardar los cambios?"
        type="confirm"
        showActions={true}
        onConfirm={handleConfirmSave}
        loading={loading}
      />


      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
        message={messageModal.text}
        type={messageModal.type}
      />

      <ConfirmAdminPasswordModal
        isOpen={isAdminPasswordOpen}
        onClose={() => setIsAdminPasswordOpen(false)}
        loading={loading}
        title={
          adminPasswordAction === 'reset'
            ? "Blanquear Clave"
            : adminPasswordAction === 'save_role'
              ? "Confirmar Cambio de Rol"
              : "Confirmar Cambio de Estado"
        }
        description={
          adminPasswordAction === 'reset'
            ? `Estás a punto de blanquear y generar un nuevo PIN temporal para el empleado ${fullName}. Por seguridad, ingresa tu contraseña de Administrador para confirmar.`
            : adminPasswordAction === 'save_role'
              ? `Estás a punto de cambiar los permisos de este empleado al rol ${formData.role}. Por seguridad, ingresa tu contraseña de Administrador para confirmar.`
              : `Estás a punto de ${modalAction === 'enable' ? 'dar de alta' : 'dar de baja'} al empleado ${fullName}. Por seguridad, ingresa tu contraseña de Administrador para confirmar.`
        }
        onConfirm={() => {
          if (adminPasswordAction === 'reset') {
            handleResetPassword();
          } else if (adminPasswordAction === 'save_role') {
            performSave(pendingChanges);
          } else if (adminPasswordAction === 'toggle_active') {
            handleToggleActive();
          }
        }}
      />

      {entity === "products" && (
        <StockAdjustModal
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
          currentStock={data.stock}
          onConfirm={(amount, description) => {
            setPendingStockAdjustment({ amount, description });
            setIsStockModalOpen(false);
          }}
        />
      )}

      <ImageManagerModal
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        existingImages={data.Image || []}
        onApplyChanges={(actions, localImages) => {
          setPendingImageActions(actions);
          const mainImg = localImages.find(img => img.isMain);
          if (mainImg) {
            setTempProfilePicture(mainImg.url);
          } else {
            setTempProfilePicture(null);
          }
        }}
      />

    </main>
  );
};

export default Details;
