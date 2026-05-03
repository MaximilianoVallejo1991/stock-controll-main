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
                    SALE: { label: "VENTA", color: "text-red-600 bg-red-50" },
                    PAYMENT: { label: "PAGO", color: "text-green-600 bg-green-50" },
                    ADJUSTMENT: { label: "AJUSTE", color: "text-amber-600 bg-amber-50" }
                };
                const t = types[getValue()] || { label: getValue(), color: "bg-gray-100" };
                return <span className={`px-2 py-1 rounded font-bold text-[10px] ${t.color}`}>{t.label}</span>;
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
                <span className={getValue() > 0 ? "text-green-600 font-bold" : ""}>
                    {formatCurrency(getValue())}
                </span>
            )
        },
        {
            header: "Deuda Generada",
            accessorKey: "debtAmount",
            cell: ({ getValue }) => (
                <span className={getValue() > 0 ? "text-red-600 font-bold" : ""}>
                    {formatCurrency(getValue())}
                </span>
            )
        }
    ], []);

    if (isLoading) return <div className="p-10 text-center animate-pulse">Cargando detalles de cuenta...</div>;
    if (!account) return <div className="p-10 text-center">No se encontró la cuenta.</div>;

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 print:m-0 print:p-0">
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden print:shadow-none print:border-none">
                <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-inner print:hidden">
                            {account.client.lastName[0]}{account.client.firstName[0]}
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black">{account.client.lastName}, {account.client.firstName}</h1>
                            <div className="flex gap-2 items-center mt-1">
                                <span className="text-xs font-bold opacity-50 uppercase tracking-widest">DNI: {account.client.dni}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter print-force-bg ${account.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {account.status === 'OPEN' ? 'CUENTA ABIERTA' : 'CUENTA CERRADA'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-end min-w-[200px] print:border-none print:bg-transparent">
                        <p className="text-xs font-bold opacity-50 uppercase mb-1">Saldo Actual</p>
                        <p className={`text-3xl font-black ${account.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
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
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                    <FaFileInvoiceDollar className="text-2xl text-blue-600" />
                    <h2 className="text-xl font-bold">Historial de Movimientos</h2>
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
