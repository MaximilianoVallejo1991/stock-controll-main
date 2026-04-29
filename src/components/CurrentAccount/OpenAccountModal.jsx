import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import Modal from "../Modals/Modal";
import ThemedButton from "../ThemedButton";
import { FaSearch, FaUserPlus } from "react-icons/fa";
import MessageModal from "../Modals/MessageModal";

const OpenAccountModal = ({ isOpen, onClose, onSuccess }) => {
    const { theme } = useTheme();
    const [clients, setClients] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ isOpen: false, text: "", type: "info" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            axios.get("/api/clients")
                .then(res => setClients(res.data))
                .catch(err => console.error("Error fetching clients:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    const filteredClients = useMemo(() => {
        const text = searchText.toLowerCase().trim();
        // Filtrar solo los que NO tienen cuenta ya abierta o los que son Consumidor Final (opcional según regla)
        // Por ahora, mostrar todos y dejar que el backend valide, o filtrar los que ya tienen currentAccount != null
        return clients.filter(c => {
            const matchesSearch = 
                c.firstName.toLowerCase().includes(text) || 
                c.lastName.toLowerCase().includes(text) || 
                c.dni.includes(text);
            
            // Regla: No abrir cuenta a "Consumidor Final" (id genérico o nombre específico si existe)
            const isConsumidorFinal = c.lastName.toLowerCase().includes("consumidor") || c.firstName.toLowerCase().includes("consumidor");
            
            return matchesSearch && !isConsumidorFinal;
        });
    }, [clients, searchText]);

    const handleOpenAccount = async (clientId) => {
        setIsSubmitting(true);
        try {
            await axios.post("/api/accounts/open", { clientId });
            setMessage({
                isOpen: true,
                text: "Cuenta abierta exitosamente.",
                type: "success"
            });
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err) {
            console.error("Error opening account:", err);
            setMessage({
                isOpen: true,
                text: err.response?.data?.message || "Error al abrir la cuenta corriente.",
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Abrir Nueva Cuenta Corriente">
                <div className="p-4 space-y-4">
                    <p className="text-sm opacity-80">
                        Seleccioná un cliente para habilitar su línea de crédito en la tienda.
                    </p>

                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido o DNI..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 transition"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-lg divide-y custom-scrollbar" style={{ borderColor: theme.bg3 }}>
                        {isLoading ? (
                            <div className="p-4 text-center animate-pulse">Cargando clientes...</div>
                        ) : filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                                <div key={client.id} className="p-3 flex items-center justify-between hover:bg-black/5 transition">
                                    <div>
                                        <p className="font-bold">{client.lastName}, {client.firstName}</p>
                                        <p className="text-xs opacity-60">DNI: {client.dni}</p>
                                        {client.currentAccount && (
                                            <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded font-bold uppercase">
                                                Ya tiene cuenta
                                            </span>
                                        )}
                                    </div>
                                    <ThemedButton 
                                        disabled={isSubmitting || client.currentAccount}
                                        onClick={() => handleOpenAccount(client.id)}
                                        className="!px-3 !py-1 text-xs flex items-center gap-1"
                                    >
                                        <FaUserPlus /> {isSubmitting ? "Abriendo..." : "Abrir"}
                                    </ThemedButton>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center opacity-50 italic">No se encontraron clientes elegibles.</div>
                        )}
                    </div>
                </div>
            </Modal>

            <MessageModal 
                isOpen={message.isOpen} 
                onClose={() => setMessage({ ...message, isOpen: false })} 
                message={message.text} 
                type={message.type} 
            />
        </>
    );
};

export default OpenAccountModal;
