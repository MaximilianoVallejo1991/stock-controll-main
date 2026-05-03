import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import AccountList from "../components/CurrentAccount/AccountList";
import PaymentForm from "../components/CurrentAccount/PaymentForm";
import useUserStore from "../store/userStore";
import { ROLES } from "../constants/roles";

export const CurrentAccounts = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("accounts"); // accounts, payment
    const user = useUserStore((state) => state.user);
    const simulatedRole = useUserStore((state) => state.simulatedRole);
    const currentRole = (simulatedRole || user?.role)?.toUpperCase();

    // Reset to "accounts" tab whenever the user navigates into this route
    useEffect(() => {
        // If coming from another page, reset tab. 
        // If it was already in /accounts but just a re-navigation, maybe keep it?
        // Let's reset for now to keep it consistent with SalesDashboard.
        setActiveTab("accounts");
    }, [location.key]);

    return (
        <div className="h-full w-full flex flex-col pt-4 overflow-hidden" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>
            
            <div className="flex flex-wrap gap-4 px-6 border-b" style={{ borderColor: theme.bg3 }}>
                <button
                    onClick={() => setActiveTab("accounts")}
                    className={`pb-3 font-bold transition-all flex items-center gap-2 ${activeTab === "accounts" ? "" : "opacity-60 hover:opacity-100 hover:border-b-[3px] hover:border-black/10 dark:hover:border-white/10"}`}
                    style={activeTab === "accounts" ? { color: theme.success, borderBottom: `3px solid ${theme.success}` } : {}}
                >
                    <span className="text-xl">📋</span> Cuentas Corrientes
                </button>

                {[ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO].includes(currentRole) && (
                    <button
                        onClick={() => setActiveTab("payment")}
                        className={`pb-3 font-bold transition-all flex items-center gap-2 ${activeTab === "payment" ? "" : "opacity-60 hover:opacity-100 hover:border-b-[3px] hover:border-black/10 dark:hover:border-white/10"}`}
                        style={activeTab === "payment" ? { color: theme.info, borderBottom: `3px solid ${theme.info}` } : {}}
                    >
                        <span className="text-xl">💰</span> Cobrar Cuota
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden bg-black/5 dark:bg-white/5 flex flex-col relative">
                {activeTab === "accounts" && <div className="absolute inset-0 overflow-y-auto custom-scrollbar no-scrollbar"><AccountList /></div>}
                {activeTab === "payment" && <div className="absolute inset-0 p-2 sm:p-4 overflow-y-auto custom-scrollbar no-scrollbar"><PaymentForm /></div>}
            </div>
        </div>
    );
};

export default CurrentAccounts;
