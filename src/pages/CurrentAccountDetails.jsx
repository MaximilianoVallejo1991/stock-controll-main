import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";
import DataTable from "../components/DataTable";
import ThemedButton from "../components/ThemedButton";
import { formatCurrency } from "../utils/currency";
import { format } from "date-fns";
import { FaArrowLeft, FaBan, FaCheckCircle, FaPrint } from "react-icons/fa";
import MessageModal from "../components/Modals/MessageModal";
import ConfirmModal from "../components/Modals/ConfirmModal";
import RegisterPaymentModal from "../components/Modals/RegisterPaymentModal";
import { FaFileInvoiceDollar, FaDollarSign } from "react-icons/fa";
import useUserStore from "../store/userStore";
import { ROLES } from "../constants/roles";


const CurrentAccountDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [account, setAccount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ isOpen: false, text: "", type: "info" });
    const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const user = useUserStore((state) => state.user);
    const simulatedRole = useUserStore((state) => state.simulatedRole);
    const currentRole = (simulatedRole || user?.role)?.toUpperCase();
    
    const canManageAccount = [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO].includes(currentRole);

    const fetchAccountData = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/api/accounts/${id}`);
            setAccount(res.data);
        } catch (err) {
            console.error("Error fetching account details:", err);
            setMessage({ isOpen: true, text: "Error al cargar los detalles de la cuenta.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccountData();
    }, [id]);

    const handleCloseAccount = async () => {
        setIsConfirmCloseOpen(false);
        try {
            await axios.patch(`/api/accounts/${id}/close`);
            setMessage({ isOpen: true, text: "Cuenta cerrada exitosamente.", type: "success" });
            fetchAccountData();
        } catch (err) {
            setMessage({
                isOpen: true,
                text: err.response?.data?.message || "No se pudo cerrar la cuenta.",
                type: "error"
            });
        }
    };

    const handleRegisterPayment = async (paymentData) => {
        setIsPaymentModalOpen(false);
        try {
            await axios.post("/api/accounts/payment", {
                clientId: account.clientId,
                ...paymentData
            });
            setMessage({ isOpen: true, text: "Pago registrado exitosamente.", type: "success" });
            fetchAccountData(); // Recargar saldo y movimientos
        } catch (err) {
            setMessage({
                isOpen: true,
                text: err.response?.data?.message || "No se pudo registrar el pago.",
                type: "error"
            });
        }
    };

    const columns = useMemo(() => [
        {
            header: "Fecha",
            accessorKey: "createdAt",
            cell: ({ getValue }) => format(new Date(getValue()), "dd/MM/yyyy HH:mm")
        },
        {
            header: "Tipo",
            accessorKey: "type",
            cell: ({ getValue }) => {
                const types = {
                    SALE: { label: "VENTA", bg: theme.dangerBg, text: theme.dangerText },
                    PAYMENT: { label: "PAGO", bg: theme.successBg, text: theme.successText },
                    ADJUSTMENT: { label: "AJUSTE", bg: theme.warning + '25', text: theme.warning }
                };
                const t = types[getValue()] || { label: getValue(), bg: theme.bg, text: theme.text };
                return (
                    <span 
                        className="px-2 py-1 rounded font-bold text-[10px] transition-colors"
                        style={{ backgroundColor: t.bg, color: t.text }}
                    >
                        {t.label}
                    </span>
                );
            }
        },
        {
            header: "Descripción",
            accessorKey: "description"
        },
        {
            header: "Total",
            accessorKey: "totalAmount",
            cell: ({ getValue }) => formatCurrency(getValue())
        },
        {
            header: "Pagado",
            accessorKey: "paidAmount",
            cell: ({ getValue }) => (
                <span className="font-bold" style={{ color: getValue() > 0 ? theme.successText : theme.text }}>
                    {formatCurrency(getValue())}
                </span>
            )
        },
        {
            header: "Deuda Generada",
            accessorKey: "debtAmount",
            cell: ({ getValue }) => (
                <span className="font-bold" style={{ color: getValue() > 0 ? theme.dangerText : theme.text }}>
                    {formatCurrency(getValue())}
                </span>
            )
        }
    ], []);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: theme.bg, color: theme.text }}>
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="w-12 h-12 border-4 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="font-bold">Cargando detalles de cuenta...</p>
            </div>
        </div>
    );

    if (!account) return (
        <div className="min-h-screen flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: theme.bg, color: theme.text }}>
            <div className="text-center p-8 rounded-2xl border" style={{ backgroundColor: theme.bgcards, borderColor: theme.border }}>
                <p className="text-xl font-bold">No se encontró la cuenta.</p>
                <ThemedButton className="mt-4" onClick={() => navigate("/accounts")}>Volver</ThemedButton>
            </div>
        </div>
    );

    return (
        <div 
            className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 print:m-0 print:p-0 transition-colors duration-300"
            style={{ color: theme.text }}
        >
            {/* Encabezado formal solo para impresión */}
            <div className="hidden print:flex justify-between items-end border-b-2 border-black pb-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Reporte de Cuenta Corriente</h1>
                    <p className="text-xs font-bold opacity-70">Generado el: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">StockControl</p>
                    <p className="text-[10px]">Gestión Integral de Negocios</p>
                </div>
            </div>

            <button
                onClick={() => navigate("/accounts")}
                className="flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-all mb-2 no-print"
            >
                <FaArrowLeft /> Volver a Cuentas
            </button>

            {/* Header de Cuenta */}
            <div 
                className="rounded-2xl shadow-xl border overflow-hidden print:shadow-none print:border-none transition-all duration-300"
                style={{ backgroundColor: theme.bgcards, borderColor: theme.border }}
            >
                <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4 items-center">
                        <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg print:hidden transition-transform hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.colorToggle})` }}
                        >
                            {account.client.lastName[0]}{account.client.firstName[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black">{account.client.lastName}, {account.client.firstName}</h1>
                            <div className="flex gap-2 items-center mt-1">
                                <span className="text-xs font-bold opacity-50 uppercase tracking-widest">DNI: {account.client.dni}</span>
                                <span 
                                    className="px-3 py-1 rounded-full text-[10px] font-black tracking-tighter print-force-bg transition-colors"
                                    style={{ 
                                        backgroundColor: account.status === 'OPEN' ? theme.successBg : theme.dangerBg,
                                        color: account.status === 'OPEN' ? theme.successText : theme.dangerText
                                    }}
                                >
                                    {account.status === 'OPEN' ? 'CUENTA ABIERTA' : 'CUENTA CERRADA'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div 
                        className="p-4 sm:p-6 rounded-2xl border flex flex-col items-end min-w-[220px] print:border-none print:bg-transparent shadow-inner transition-all"
                        style={{ backgroundColor: theme.bg, borderColor: theme.border }}
                    >
                        <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.2em] mb-1">Saldo Adeudado</p>
                        <p className={`text-4xl font-black tracking-tighter ${account.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {formatCurrency(account.balance)}
                        </p>
                        <div className="flex gap-2 mt-4 no-print">
                            {canManageAccount && account.status === 'OPEN' && account.balance === 0 && (
                                <ThemedButton
                                    className="!bg-red-600 !text-white !py-1 text-xs flex items-center gap-1"
                                    onClick={() => setIsConfirmCloseOpen(true)}
                                >
                                    <FaBan size={10} /> Cerrar Cuenta
                                </ThemedButton>
                            )}
                            {canManageAccount && account.status === 'OPEN' && (
                                <ThemedButton
                                    className="!bg-green-600 !text-white !py-1 text-xs flex items-center gap-1"
                                    onClick={() => setIsPaymentModalOpen(true)}
                                >
                                    <FaDollarSign size={10} /> Registrar Pago
                                </ThemedButton>
                            )}
                            <ThemedButton
                                className="!bg-zinc-700 !text-white !py-1 text-xs flex items-center gap-1"
                                onClick={() => window.print()}
                            >
                                <FaPrint size={10} /> Imprimir Estado
                            </ThemedButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado de Movimientos */}
            <div 
                className="rounded-3xl shadow-2xl border p-6 sm:p-10 transition-all duration-500"
                style={{ backgroundColor: theme.bgcards, borderColor: theme.border }}
            >
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl" style={{ backgroundColor: theme.primary + '20' }}>
                            <FaFileInvoiceDollar className="text-2xl" style={{ color: theme.primary }} />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight" style={{ color: theme.text }}>Historial de Movimientos</h2>
                    </div>
                    <div className="hidden sm:block text-xs font-bold opacity-40 uppercase tracking-widest">
                        {account.movements?.length || 0} Registros
                    </div>
                </div>

                <DataTable columns={columns} data={account.movements} />
            </div>

            <ConfirmModal
                isOpen={isConfirmCloseOpen}
                onClose={() => setIsConfirmCloseOpen(false)}
                onConfirm={handleCloseAccount}
                message="¿Cerrar Cuenta Corriente?"
            >
                <p className="text-sm">Al cerrar la cuenta, el cliente ya no podrá realizar compras a crédito hasta que se vuelva a abrir.</p>
            </ConfirmModal>

            <MessageModal
                isOpen={message.isOpen}
                onClose={() => setMessage({ ...message, isOpen: false })}
                message={message.text}
                type={message.type}
            />

            <RegisterPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onConfirm={handleRegisterPayment}
                currentBalance={account.balance}
            />
        </div>
    );
};

export default CurrentAccountDetails;
