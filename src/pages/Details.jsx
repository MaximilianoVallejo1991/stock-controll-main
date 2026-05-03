import { Navigate, useParams, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import ThemedButton from "../components/ThemedButton";
import MessageModal from "../components/Modals/MessageModal";
import ImagePreviewModal from "../components/Modals/ImagePreviewModal";
import ImageManagerModal from "../components/Modals/ImageManagerModal";
import ConfirmAdminPasswordModal from "../components/Modals/ConfirmAdminPasswordModal";
import StockAdjustModal from "../components/Modals/StockAdjustModal";
import { translate } from "../utils/translator";
import { isValidCUIT, isValidDNI, isValidEmail, isValidArPhone } from "../utils/validators";
import { EMPLOYEE_ROLES_DET, ROLES } from "../constants/roles";
import useUserStore from "../store/userStore";
import JsBarcode from "jsbarcode";

// Hooks y Componentes extraídos en el refactor
import { useEntityData } from "../hooks/useEntityData";
import { useEntitySave } from "../hooks/useEntitySave";
import { ENTITY_ALLOWED_ROLES, EDIT_ALLOWED_ROLES, ENTITY_FIELD_RULES } from "../config/entityRules";
import SkeletonDetails from "./Details/components/SkeletonDetails";
import EntityHeader from "./Details/components/EntityHeader";
import EntityActionButtons from "./Details/components/EntityActionButtons";
import EntityDetailsForm from "./Details/components/EntityDetailsForm";
import BarcodePreview from "./Details/components/BarcodePreview";

const Details = () => {
  const { id, entity: entityParam } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const entity = entityParam || location.pathname.split("/")[1];

  // Permisos
  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const currentUserRole = (simulatedRole || user?.role)?.toUpperCase();
  const canAccessCurrentEntity = ENTITY_ALLOWED_ROLES[entity]?.includes(currentUserRole);
  const canEditCurrentEntity = EDIT_ALLOWED_ROLES.includes(currentUserRole);

  if (!canAccessCurrentEntity) {
    return <Navigate to="/home" replace />;
  }

  // Datos
  const { data, setData, loading, fetchData, categories, activeProductsCount } = useEntityData(entity, id);

  // Estados locales del formulario y modales
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
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
  const [openPreview, setOpenPreview] = useState(false);
  const isSaving = useRef(false);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(data)
    || pendingStockAdjustment !== null
    || pendingImageActions.length > 0;

  // Sincronizar formData cuando llegan los datos del hook
  const entityFieldRules = ENTITY_FIELD_RULES[entity];
  const fullName = data
    ? data.name || data.fullName || `${data.firstName || ""} ${data.lastName || ""}`.trim()
    : "";

  // Actualizar formData cuando data cambia (ej: después de guardar)
  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  // Hook de guardado
  const { performSave, toggleActive, isSaving: isSavingHook } = useEntitySave(
    entity,
    id,
    (freshData) => {
      setData(freshData);
      setFormData(freshData);
      fetchData();
    }
  );

  // --- HANDLERS ---

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

  const handleCancel = () => {
    setFormData(data);
    setPendingStockAdjustment(null);
    setPendingImageActions([]);
    setTempProfilePicture(null);
    setIsEditing(false);
  };

  const handleToggleActive = () => {
    if (isSaving.current) return;

    if (modalAction === "category_change") {
      handleConfirmSave();
      setIsModalOpen(false);
      return;
    }

    if (entity === "user" && !isAdminPasswordOpen && adminPasswordAction !== "toggle_active") {
      setAdminPasswordAction("toggle_active");
      setIsAdminPasswordOpen(true);
      setIsModalOpen(false);
      return;
    }

    const endpointAction = modalAction === "disable" ? "disable" : "enable";
    isSaving.current = true;

    axios.put(`/api/${entity}/${id}/active`, {
      isActive: modalAction === "enable"
    }, { withCredentials: true })
      .then((res) => {
        setData(res.data);
        setFormData(res.data);
        setMessageModal({
          isOpen: true,
          text: `Registro ${endpointAction === "disable" ? "dado de baja" : "dado de alta"} correctamente`,
          type: "success",
        });
      })
      .catch((err) => {
        setMessageModal({
          isOpen: true,
          text: err.response?.data?.message || `Error al ${endpointAction === "disable" ? "dar de baja" : "dar de alta"} el registro`,
          type: "error",
        });
      })
      .finally(() => {
        isSaving.current = false;
        setIsModalOpen(false);
        setIsAdminPasswordOpen(false);
        setAdminPasswordAction(null);
      });
  };

  const handleResetPassword = () => {
    if (isSaving.current) return;
    isSaving.current = true;
    axios.put(`/api/${entity}/${id}/reset-pin`, {}, { withCredentials: true })
      .then((res) => {
        fetchData();
        setMessageModal({
          isOpen: true,
          text: `Clave blanqueada. Nuevo PIN temporal: ${res.data.newPin}`,
          type: "success",
        });
      })
      .catch((err) => {
        setMessageModal({
          isOpen: true,
          text: err.response?.data?.message || "Error al blanquear la clave",
          type: "error",
        });
      })
      .finally(() => {
        isSaving.current = false;
        setIsAdminPasswordOpen(false);
        setAdminPasswordAction(null);
      });
  };

  const handleOpenCurrentAccount = () => {
    if (isSaving.current) return;
    isSaving.current = true;
    axios.post("/api/accounts/open", { clientId: id })
      .then(() => {
        fetchData();
        setMessageModal({ isOpen: true, text: "Cuenta corriente abierta con éxito", type: "success" });
      })
      .catch((err) => {
        setMessageModal({
          isOpen: true,
          text: err.response?.data?.message || "Error al abrir la cuenta corriente",
          type: "error"
        });
      })
      .finally(() => { isSaving.current = false; });
  };

  const handlePrintLabel = () => {
    const printWindow = window.open("about:blank", "Print" + Date.now(), "left=50000,top=50000,width=0,height=0");
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, data.barcode, { format: "CODE128", displayValue: true, fontSize: 20, margin: 10, width: 2, height: 60 });
    } catch (error) {
      alert("Error al generar el código de barras.");
      printWindow.close();
      return;
    }
    const barcodeDataUrl = canvas.toDataURL("image/png");
    printWindow.document.head.innerHTML = `<title>Imprimir Etiqueta</title><style>body{font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;margin:0}.name{font-weight:bold;font-size:18px;margin-bottom:5px}</style>`;
    printWindow.document.body.innerHTML = `<h3 class="name"></h3><img src="" alt="Barcode"/>`;
    printWindow.document.body.querySelector('.name').textContent = data.name;
    printWindow.document.body.querySelector('img').src = barcodeDataUrl;
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
    setTimeout(() => { if (!printWindow.closed) { printWindow.print(); printWindow.close(); } }, 500);
    printWindow.focus();
  };

  const handleConfirmSave = () => {
    if (isSaving.current) return;

    const validateForm = () => {
      if ("role" in formData && formData.role && !EMPLOYEE_ROLES_DET.some(r => r.value === formData.role)) return "Rol inválido";
      if ("cuit" in formData && formData.cuit && !isValidCUIT(formData.cuit)) return "CUIT inválido";
      if ("dni" in formData && formData.dni && !isValidDNI(formData.dni)) return "DNI inválido";
      if ("email" in formData && formData.email && !isValidEmail(formData.email)) return "Email inválido";
      if ("phoneNumber" in formData && formData.phoneNumber && !isValidArPhone(formData.phoneNumber)) return "Teléfono inválido";
      return null;
    };

    const error = validateForm();
    if (error) {
      setMessageModal({ isOpen: true, text: error, type: "error" });
      setConfirmOpen(false);
      return;
    }

    const changes = getChangedFields(data, formData);
    delete changes.id; delete changes.createdAt; delete changes.updatedAt;
    delete changes.Image; delete changes.category; delete changes.stock;

    if (Object.keys(changes).length === 0 && !pendingStockAdjustment && pendingImageActions.length === 0) {
      setConfirmOpen(false);
      return;
    }

    if (entity === "products" && changes.categoryId && changes.categoryId !== data.categoryId) {
      setPendingChanges(changes);
      setModalAction("category_change");
      setIsModalOpen(true);
      setConfirmOpen(false);
      return;
    }

    if (!changes.password) delete changes.password;

    if (entity === "user" && changes.role) {
      setPendingChanges(changes);
      setAdminPasswordAction("save_role");
      setIsAdminPasswordOpen(true);
      setConfirmOpen(false);
      return;
    }

    performSave(changes, data, pendingStockAdjustment, pendingImageActions)
      .then((result) => {
        if (result.success) {
          setPendingStockAdjustment(null);
          setPendingImageActions([]);
          setTempProfilePicture(null);
          setIsEditing(false);
          setMessageModal({ isOpen: true, text: "Cambios guardados correctamente", type: "success" });
        } else {
          setMessageModal({ isOpen: true, text: result.message, type: "error" });
        }
      })
      .finally(() => { setConfirmOpen(false); });
  };

  // --- RENDER ---

  if (loading || !data) {
    return (
      <main className="min-h-screen p-8" style={{ backgroundColor: theme.bg }}>
        <SkeletonDetails />
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <div
        className="relative max-w-4xl mx-auto p-6 rounded-xl shadow-md border"
        style={{ backgroundColor: theme.bg2, borderColor: theme.bg4, color: theme.text }}
      >
        {/* Banner de cambio de clave pendiente */}
        {entity === "user" && data.mustChangePassword && (
          <div className="mb-6 p-4 rounded border-l-4 border-yellow-500 bg-yellow-100 text-yellow-800 shadow-sm">
            <h3 className="font-bold text-lg mb-1">⚠️ Pendiente de Cambio de Clave</h3>
            <p>Este usuario aún no ha realizado su primer ingreso. Si ha perdido su PIN temporal, usá el botón <strong>"Blanquear Clave"</strong> para generar uno nuevo.</p>
          </div>
        )}

        {/* Encabezado: Avatar + Nombre + Acciones */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <EntityHeader
            data={data}
            theme={theme}
            isEditing={isEditing}
            handleEditPicture={() => setIsImageManagerOpen(true)}
            tempProfilePicture={tempProfilePicture}
            setOpenPreview={setOpenPreview}
          />
          <EntityActionButtons
            entity={entity}
            data={data}
            isEditing={isEditing}
            canEditCurrentEntity={canEditCurrentEntity}
            handleOpenCurrentAccount={handleOpenCurrentAccount}
            navigate={navigate}
            toggleEdit={() => setIsEditing(true)}
            handleCancel={handleCancel}
          />
        </div>

        {/* Modal preview de imágenes */}
        {openPreview && data.Image && data.Image.length > 0 && (
          <ImagePreviewModal
            onClose={() => setOpenPreview(false)}
            images={data.Image}
            initialImage={data.Image.find((img) => img.isMain)}
            entityId={data.id}
            entity={entity}
            onImageSetMain={() => { setOpenPreview(false); fetchData(); }}
          />
        )}

        {/* Formulario dinámico */}
        <div className="mt-6">
          <EntityDetailsForm
            formData={formData}
            data={data}
            isEditing={isEditing}
            entity={entity}
            entityFieldRules={entityFieldRules}
            theme={theme}
            handleChange={handleChange}
            categories={categories}
            pendingStockAdjustment={pendingStockAdjustment}
            setPendingStockAdjustment={setPendingStockAdjustment}
            setIsStockModalOpen={setIsStockModalOpen}
            setAdminPasswordAction={setAdminPasswordAction}
            setIsAdminPasswordOpen={setIsAdminPasswordOpen}
          />
        </div>

        {/* Vista previa del código de barras */}
        {entity === "products" && data.barcode && (
          <div className="mt-8 pt-6 border-t flex flex-col items-center sm:items-start gap-4" style={{ borderColor: theme.bg3 }}>
            <p className="font-bold text-lg" style={{ color: theme.colorsubtitlecard }}>Código de Barras</p>
            <div className="flex flex-wrap items-center gap-8 bg-white p-4 rounded-xl border border-dashed shadow-inner" style={{ borderColor: theme.bg4 }}>
              <BarcodePreview barcode={data.barcode} />
              <ThemedButton onClick={handlePrintLabel} className="h-fit">🖨️ Imprimir Etiqueta</ThemedButton>
            </div>
            <p className="text-xs italic opacity-50">* Los códigos de barras son generados automáticamente y no son editables.</p>
          </div>
        )}

        {/* Acciones de edición: Dar de baja / Guardar */}
        {isEditing && (
          <div className="flex flex-row justify-between mt-6">
            <ThemedButton
              onClick={() => { setModalAction(data.isActive ? "disable" : "enable"); setIsModalOpen(true); }}
              style={{ backgroundColor: data.isActive ? theme.danger : theme.success, color: "#fff" }}
            >
              {data.isActive ? "Dar de baja" : "Dar de alta"}
            </ThemedButton>
            <ThemedButton
              disabled={!hasChanges || isSavingHook}
              onClick={() => setConfirmOpen(true)}
            >
              {isSavingHook ? "Guardando..." : "Guardar cambios"}
            </ThemedButton>
          </div>
        )}
      </div>

      {/* MODALES */}
      <MessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={
          modalAction === "category_change"
            ? "⚠️ Al cambiar la categoría, se generará un NUEVO código de barras. Las etiquetas impresas anteriormente ya no serán válidas. ¿Deseas continuar?"
            : modalAction === "disable"
              ? entity === "categories"
                ? `Esta categoría tiene ${activeProductsCount} productos activos. Al darla de baja, todos sus productos también se darán de baja. ¿Deseas continuar?`
                : "¿Deseás dar de baja este registro?"
              : "¿Deseás dar de alta este registro?"
        }
        type={modalAction === "category_change" ? "warning" : "confirm"}
        showActions={true}
        onConfirm={handleToggleActive}
      />

      <MessageModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        message="¿Estás seguro de guardar los cambios?"
        type="confirm"
        showActions={true}
        onConfirm={handleConfirmSave}
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
        title={
          adminPasswordAction === "reset" ? "Blanquear Clave"
            : adminPasswordAction === "save_role" ? "Confirmar Cambio de Rol"
              : "Confirmar Cambio de Estado"
        }
        description={
          adminPasswordAction === "reset"
            ? `Estás a punto de blanquear el PIN de ${fullName}. Ingresá tu contraseña de Administrador.`
            : adminPasswordAction === "save_role"
              ? `Estás a punto de cambiar los permisos al rol ${formData.role}. Ingresá tu contraseña de Administrador.`
              : `Estás a punto de ${modalAction === "enable" ? "dar de alta" : "dar de baja"} a ${fullName}. Ingresá tu contraseña de Administrador.`
        }
        onConfirm={() => {
          if (adminPasswordAction === "reset") handleResetPassword();
          else if (adminPasswordAction === "save_role") {
            performSave(pendingChanges, data, pendingStockAdjustment, pendingImageActions)
              .then(result => {
                if (result.success) {
                  setPendingStockAdjustment(null); setPendingImageActions([]);
                  setTempProfilePicture(null); setIsEditing(false);
                  setMessageModal({ isOpen: true, text: "Cambios guardados correctamente", type: "success" });
                } else {
                  setMessageModal({ isOpen: true, text: result.message, type: "error" });
                }
              })
              .finally(() => { setIsAdminPasswordOpen(false); setAdminPasswordAction(null); });
          }
          else if (adminPasswordAction === "toggle_active") handleToggleActive();
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
          setTempProfilePicture(mainImg ? mainImg.url : null);
        }}
      />
    </main>
  );
};

export default Details;
