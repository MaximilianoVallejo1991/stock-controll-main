import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import ThemedButton from "../ThemedButton";
import { FaSearch, FaDollarSign, FaFileInvoiceDollar, FaCheckCircle } from "react-icons/fa";
import { formatCurrency } from "../../utils/currency";
import MessageModal from "../Modals/MessageModal";
import ConfirmModal from "../Modals/ConfirmModal";

const PaymentForm = () => {
    const { theme } = useTheme();
    const [clients, setClients] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Efectivo");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ isOpen: false, text: "", type: "info" });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [lastPayment, setLastPayment] = useState(null);

    useEffect(() => {
        setIsLoading(true);
        axios.get("/api/clients")
            .then(res => setClients(res.data))
            .catch(err => console.error("Error fetching clients:", err))
            .finally(() => setIsLoading(false));
    }, []);

    const clientsWithAccounts = useMemo(() => {
        return clients.filter(c => c.currentAccount && c.currentAccount.status === "OPEN");
    }, [clients]);

    const filteredClients = useMemo(() => {
        if (!searchText.trim()) return [];
        const text = searchText.toLowerCase();
        return clientsWithAccounts.filter(c => 
            c.firstName.toLowerCase().includes(text) || 
            c.lastName.toLowerCase().includes(text) || 
            c.dni.includes(text)
        );
    }, [clientsWithAccounts, searchText]);

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSearchText("");
        setAmount("");
    };

    const handleSubmit = async () => {
        if (!selectedClient || !amount || parseFloat(amount) <= 0) {
            setMessage({ isOpen: true, text: "Por favor, ingresá un monto válido.", type: "error" });
            return;
        }

        setIsConfirmOpen(true);
    };

    const confirmPayment = async () => {
        setIsConfirmOpen(false);
        setIsSubmitting(true);
        try {
            const res = await axios.post("/api/accounts/payment", {
                clientId: selectedClient.id,
                amount: parseFloat(amount),
                paymentMethod,
                description: description || `Pago a cuenta corriente - ${selectedClient.lastName}`
            });

            setLastPayment(res.data);
            setMessage({
                isOpen: true,
                text: "¡Pago registrado con éxito!",
                type: "success"
            });
            
            // Limpiar formulario tras éxito
            setSelectedClient(null);
            setAmount("");
            setDescription("");
            setPaymentMethod("Efectivo");
            
            // Opcional: imprimir ticket automáticamente o mostrar botón
        } catch (err) {
            console.error("Error registering payment:", err);
            setMessage({
                isOpen: true,
                text: err.response?.data?.message || "Error al registrar el pago.",
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintTicket = (payment) => {
        if (!payment) return;
        
        const printWindow = window.open("", "_blank", "width=600,height=600");
        const dateStr = new Date(payment.createdAt).toLocaleString();
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Comprobante de Pago</title>
                    <style>
                        body { font-family: monospace; padding: 20px; text-align: center; }
                        .header { border-bottom: 1px dashed #000; margin-bottom: 10px; padding-bottom: 10px; }
                        .row { display: flex; justify-content: space-between; margin: 5px 0; }
                        .total { font-weight: bold; border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
                        .footer { margin-top: 20px; font-size: 0.8em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>COMPROBANTE DE PAGO</h2>
                        <p>Cuenta Corriente</p>
                    </div>
                    <div class="row"><span>Fecha:</span> <span>${dateStr}</span></div>
                    <div class="row"><span>ID Transacción:</span> <span>${payment.id.substring(0, 8)}</span></div>
                    <div class="row"><span>Cliente:</span> <span>${payment.currentAccount.client.lastName}, ${payment.currentAccount.client.firstName}</span></div>
                    <div class="row"><span>Concepto:</span> <span>${payment.description}</span></div>
                    <div class="row"><span>Método:</span> <span>${payment.paymentMethod}</span></div>
                    <div class="total row">
                        <span>MONTO PAGADO:</span>
                        <span>${formatCurrency(payment.paidAmount)}</span>
                    </div>
                    <div class="row"><span>Saldo Restante:</span> <span>${formatCurrency(payment.currentAccount.balance)}</span></div>
                    <div class="footer">
                        <p>¡Gracias por su pago!</p>
                    </div>
                    <script>window.onload = () => { window.print(); window.close(); }</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-lg mt-4 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-6 border-b pb-4 border-zinc-100 dark:border-zinc-800">
                <FaFileInvoiceDollar className="text-3xl text-green-600" />
                <h2 className="text-2xl font-bold">Registrar Pago a Cuenta</h2>
            </div>

            <div className="space-y-6">
                {/* Buscador de Clientes */}
                <div className="relative">
                    <label className="block text-sm font-semibold mb-2 opacity-70">1. Buscar Cliente</label>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                        <input
                            type="text"
                            placeholder="Nombre, Apellido o DNI..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            disabled={!!selectedClient}
                        />
                    </div>
                    
                    {/* Resultados del buscador */}
                    {searchText && !selectedClient && (
                        <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-xl overflow-hidden divide-y max-h-60 overflow-y-auto" style={{ backgroundColor: theme.bg2, borderColor: theme.bg3 }}>
                            {filteredClients.length > 0 ? (
                                filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        className="w-full p-3 text-left hover:bg-black/5 transition flex justify-between items-center"
                                        onClick={() => handleSelectClient(client)}
                                    >
                                        <div>
                                            <p className="font-bold">{client.lastName}, {client.firstName}</p>
                                            <p className="text-xs opacity-60">DNI: {client.dni}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-semibold opacity-50">Deuda actual:</p>
                                            <p className="font-bold text-red-500">{formatCurrency(client.currentAccount.balance)}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center opacity-50 italic">No se encontraron clientes con cuenta abierta.</div>
                            )}
                        </div>
                    )}

                    {selectedClient && (
                        <div className="mt-2 p-4 rounded-lg flex justify-between items-center border border-green-500/30 bg-green-500/10">
                            <div>
                                <p className="text-xs font-bold uppercase text-green-600">Cliente Seleccionado</p>
                                <p className="font-bold text-lg">{selectedClient.lastName}, {selectedClient.firstName}</p>
                                <p className="text-sm opacity-70">DNI: {selectedClient.dni}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold opacity-50 uppercase">Saldo Adeudado</p>
                                <p className="text-2xl font-black text-red-500">{formatCurrency(selectedClient.currentAccount.balance)}</p>
                                <button 
                                    className="text-xs text-blue-500 underline mt-1 hover:text-blue-700"
                                    onClick={() => setSelectedClient(null)}
                                >
                                    Cambiar cliente
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Formulario de Pago */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${!selectedClient ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-sm font-semibold mb-2 opacity-70">2. Monto a Pagar</label>
                        <div className="relative">
                            <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all font-bold text-xl"
                                style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2 opacity-70">3. Método de Pago</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg border outline-none focus:ring-2 transition-all font-semibold"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Tarjeta">Tarjeta</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold mb-2 opacity-70">Observaciones (Opcional)</label>
                        <textarea
                            placeholder="Ej: Pago de cuota de abril..."
                            className="w-full px-4 py-2 rounded-lg border outline-none focus:ring-2 transition-all h-20 resize-none"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <ThemedButton 
                    className="w-full !py-4 flex items-center justify-center gap-2 text-lg font-bold shadow-lg mt-4 disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={!selectedClient || !amount || isSubmitting}
                    onClick={handleSubmit}
                >
                    <FaCheckCircle /> {isSubmitting ? "Procesando..." : "Registrar Pago"}
                </ThemedButton>

                {lastPayment && (
                    <div className="mt-6 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500 text-white p-2 rounded-full">
                                <FaCheckCircle size={24} />
                            </div>
                            <div>
                                <p className="font-bold">Último pago registrado</p>
                                <p className="text-sm opacity-70">{formatCurrency(lastPayment.paidAmount)} - {lastPayment.paymentMethod}</p>
                            </div>
                        </div>
                        <ThemedButton 
                            className="!bg-zinc-700 !text-white flex items-center gap-2"
                            onClick={() => handlePrintTicket(lastPayment)}
                        >
                            Imprimir Ticket
                        </ThemedButton>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmPayment}
                message="Confirmar Pago"
            >
                <div className="space-y-2">
                    <p>Estás por registrar un pago de:</p>
                    <p className="text-2xl font-black text-center py-2" style={{ color: theme.success }}>
                        {formatCurrency(amount)}
                    </p>
                    <p className="text-sm">Cliente: <strong>{selectedClient?.lastName}, {selectedClient?.firstName}</strong></p>
                    <p className="text-sm">Método: <strong>{paymentMethod}</strong></p>
                </div>
            </ConfirmModal>

            <MessageModal 
                isOpen={message.isOpen} 
                onClose={() => setMessage({ ...message, isOpen: false })} 
                message={message.text} 
                type={message.type} 
            />
        </div>
    );
};

export default PaymentForm;
