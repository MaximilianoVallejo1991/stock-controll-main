// src/pages/sales/SalesDashboard.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NewSale from "./NewSale";
import CashRegister from "./CashRegister";
import { useTheme } from "../../context/ThemeContext";

export const SalesDashboard = () => {
    const { theme } = useTheme();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("pos"); // pos, register

    // Reset to "pos" tab whenever the user navigates into this route (e.g. from Sidebar)
    useEffect(() => {
        setActiveTab("pos");
    }, [location.key]);

    return (
        <div className="h-full w-full flex flex-col pt-4 overflow-hidden" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>

            <div className="flex flex-wrap gap-4 px-6 border-b" style={{ borderColor: theme.bg3 }}>
                <button
                    onClick={() => setActiveTab("pos")}
                    className={`pb-3 font-bold transition-all flex items-center gap-2 ${activeTab === "pos" ? "" : "opacity-60 hover:opacity-100 hover:border-b-[3px] hover:border-black/10 dark:hover:border-white/10"}`}
                    style={activeTab === "pos" ? { color: theme.success, borderBottom: `3px solid ${theme.success}` } : {}}
                >
                    <span className="text-xl">🛒</span> Venta POS
                </button>
                <button
                    onClick={() => setActiveTab("register")}
                    className={`pb-3 font-bold transition-all flex items-center gap-2 ${activeTab === "register" ? "" : "opacity-60 hover:opacity-100 hover:border-b-[3px] hover:border-black/10 dark:hover:border-white/10"}`}
                    style={activeTab === "register" ? { color: theme.info, borderBottom: `3px solid ${theme.info}` } : {}}
                >
                    <span className="text-xl">🏦</span> Caja y Movimientos
                </button>
            </div>

            <div className="flex-1 overflow-hidden bg-black/5 dark:bg-white/5 flex flex-col relative">
                {activeTab === "pos" && <div className="absolute inset-0 overflow-y-auto custom-scrollbar no-scrollbar"><NewSale /></div>}
                {activeTab === "register" && <div className="absolute inset-0 p-2 sm:p-4 overflow-hidden no-scrollbar"><CashRegister /></div>}
            </div>
        </div>
    );
};
