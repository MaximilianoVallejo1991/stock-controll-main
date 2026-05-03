import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import DataTable from "../DataTable";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { formatCurrency } from "../../utils/currency";
import ThemedButton from "../ThemedButton";
import OpenAccountModal from "./OpenAccountModal";
import useUserStore from "../../store/userStore";
import { ROLES } from "../../constants/roles";

const AccountList = () => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { theme } = useTheme();
    const navigate = useNavigate();
    const activeStore = useUserStore((state) => state.activeStore);
    const user = useUserStore((state) => state.user);
    const simulatedRole = useUserStore((state) => state.simulatedRole);
    const currentRole = (simulatedRole || user?.role)?.toUpperCase();

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get("/api/accounts");
            setAccounts(res.data);
        } catch (err) {
            console.error("Error fetching accounts:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const columns = useMemo(() => [
        {
            header: "Cliente",
            accessorKey: "client",
            cell: ({ row }) => {
                const client = row.original.client;
                return `${client.lastName}, ${client.firstName}`;
            }
        },
        {
            header: "DNI",
            accessorKey: "client.dni"
        },
        {
            header: "Saldo Adeudado",
            accessorKey: "balance",
            cell: ({ getValue }) => (
                <span className="font-bold" style={{ color: getValue() > 0 ? theme.danger : theme.success }}>
                    {formatCurrency(getValue())}
                </span>
            )
        },
        {
            header: "Estado",
            accessorKey: "status",
            cell: ({ getValue }) => (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getValue() === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {getValue() === 'OPEN' ? 'ABIERTA' : 'CERRADA'}
                </span>
            )
        },
        {
            header: "Acciones",
            id: "actions",
            cell: ({ row }) => (
                <button
                    className="text-blue-500 hover:text-blue-700 transition cursor-pointer"
                    onClick={() => navigate(`/accounts/details/${row.original.id}`)}
                    title="Ver detalle de cuenta"
                >
                    <FaEye size={18} />
                </button>
            ),
        },
    ], [theme, navigate]);

    const filteredAccounts = useMemo(() => {
        if (currentRole === ROLES.SISTEMA) return accounts;
        return accounts.filter(acc => acc.storeId === activeStore);
    }, [accounts, currentRole, activeStore]);

    const canOpenAccount = [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO].includes(currentRole);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Listado de Cuentas</h2>
                    <p className="text-sm opacity-70">Gestioná el crédito y saldos de tus clientes.</p>
                </div>
                {canOpenAccount && (
                    <ThemedButton onClick={() => setIsModalOpen(true)}>
                        Abrir Nueva Cuenta
                    </ThemedButton>
                )}
            </div>

            {isLoading ? (
                <div className="text-center py-10 animate-pulse">Cargando cuentas...</div>
            ) : (
                <DataTable columns={columns} data={filteredAccounts} />
            )}

            <OpenAccountModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchAccounts();
                }}
            />
        </div>
    );
};

export default AccountList;
