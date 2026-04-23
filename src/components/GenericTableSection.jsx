import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import DynamicForm from "./DynamicForm";
import ThemedButton from "./ThemedButton";
import DataTable from "./DataTable";
import { useNavigate } from "react-router-dom";
import { FaEye, FaFileExcel } from "react-icons/fa";
import Modal from "./Modals/Modal";
import useUserStore from "../store/userStore";
import MessageModal from "./Modals/MessageModal";
import BarcodeSuccessModal from "./Modals/BarcodeSuccessModal";
import { ROLES } from "../constants/roles";
import { downloadExcel } from "../utils/exportHelper";

export const GenericTableSection = ({ title, endpoint, fields, columns, createRoles = null, exportEndpoint = null }) => {
  const [data, setData] = useState([]);
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pinMessage, setPinMessage] = useState({ isOpen: false, title: "", text: "" });
  const [barcodeSuccess, setBarcodeSuccess] = useState({ isOpen: false, product: null });
  const { theme } = useTheme();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const activeStore = useUserStore((state) => state.activeStore);
  const currentRole = simulatedRole || user?.role; // Sincronizado con el modo simulación
  const canCreate = !createRoles || createRoles.includes(currentRole);

  console.log("role actual:", currentRole);

  const enhancedColumns = [
    ...columns,
    {
      header: "Ver",
      id: "actions",
      cell: ({ row }) => (
        <button
          className="text-blue-500 hover:text-blue-700 transition cursor-pointer"
          onClick={() => navigate(`/${endpoint}/details/${row.original.id}`)}
          title="Ver detalles"
        >
          <FaEye />
        </button>
      ),
    },
  ];


  useEffect(() => {
    axios.get(`/api/${endpoint}`)
      .then(

        res => {

          setData(res.data)
          console.log("Entidades:", res.data);
        }
      )

      .catch(err => console.error(`Error cargando ${title}`, err));
  }, [endpoint, title]);

  // NOTE: Se ha eliminado la inyección dinámica manual del `storeId` al formulario porque
  // ahora la arquitectura está gobernada globalmente por un Header x-store-id mediante
  // el Sidebar / Interceptor de Axios. El Superadmin elige su entorno de trabajo allí.

  const [statusFilter, setStatusFilter] = useState("active");

  // Filtramos la data visible
  const filteredDataItems = useMemo(() => {
    let filtered = data;
    
    // Filtramos por tienda si no es SISTEMA Puro (sin simulación)
    // Usamos el activeStore del store global como fuente de verdad
    if (currentRole !== ROLES.SISTEMA && endpoint !== "stores") {
      filtered = filtered.filter(item => item.storeId === activeStore);
    }

    // Then filter by status
    if (statusFilter === "active") {
      filtered = filtered.filter(item => item.isActive !== false);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter(item => item.isActive === false);
    }

    return filtered;
  }, [data, currentRole, activeStore, endpoint, statusFilter]);


  const handleExport = async () => {
    if (!exportEndpoint) return;
    setIsExporting(true);
    try {
      await downloadExcel(`/api/${exportEndpoint}/export`, {}, `${exportEndpoint}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch {
      alert('Error al exportar. Intentá de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenModal = () => {
    if (!canCreate) {
      return;
    }

    // Si es SISTEMA y está en la vista Global (ALL), exigir elegir una tienda
    if (currentRole === ROLES.SISTEMA && !activeStore && endpoint !== "stores") {
      alert("Para agregar un elemento, por favor selecciona una tienda específica en el menú lateral.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleAddItem = (newItem) => {
    console.log(`Agregando nuevo ${title} (actualizando lista):`, newItem);

    if (newItem.generatedPin) {
      setPinMessage({
        isOpen: true,
        title: "¡Empleado Creado con Éxito!",
        text: `Email: ${newItem.email}\nPIN temporal: ${newItem.generatedPin}\n\nEl usuario deberá ingresar este PIN en su primer login para configurar su contraseña definitiva.`
      });
    }

    if (endpoint === "products") {
        setBarcodeSuccess({ isOpen: true, product: newItem });
    }

    setData(prev => [...prev, newItem]);
  };

  return (
    <div className="p-6 h-screen" style={{ backgroundColor: theme.bg }}>
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold">Administrar {title}</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold whitespace-nowrap">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 rounded outline-none font-semibold text-sm border"
              style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.bg3 }}
            >
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="all">Ver Todos</option>
            </select>
          </div>
          {exportEndpoint && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#16a34a', color: '#fff' }}
              title="Exportar a Excel"
            >
              <FaFileExcel size={14} />
              {isExporting ? 'Exportando...' : 'Excel'}
            </button>
          )}
          {canCreate && <ThemedButton onClick={handleOpenModal}>Agregar</ThemedButton>}
        </div>
      </div>

      <DataTable columns={enhancedColumns} data={filteredDataItems} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(url) => {
          console.log("Imagen subida a:", url);
        }}>
        <DynamicForm
          title={title}
          fields={fields}
          entityType={endpoint}
          onSubmit={handleAddItem}
          onClose={() => setIsModalOpen(false)}
          entityIdField={`${endpoint}Id`}
        />
      </Modal>
      <MessageModal
        isOpen={pinMessage.isOpen}
        onClose={() => setPinMessage({ ...pinMessage, isOpen: false })}
        message={pinMessage.text}
        type="info"
      />

      <BarcodeSuccessModal 
        isOpen={barcodeSuccess.isOpen}
        onClose={() => setBarcodeSuccess({ ...barcodeSuccess, isOpen: false })}
        product={barcodeSuccess.product}
      />
    </div>
  );
};

export default GenericTableSection;
