import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useTheme } from "../../context/ThemeContext";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import ConfirmModal from "../../components/Modals/ConfirmModal"; // IMPORT MODAL
import { formatCurrency } from "../../utils/currency";
import { parseCurrency } from "../../utils/currency";

const CashRegister = ({ onGoToPOS }) => {
    const { theme } = useTheme();
    const [currentRegister, setCurrentRegister] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isCajaExpanded, setIsCajaExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState("gestion"); // NEW: mobile tab state

    // Movement Detail Modal State
    const [selectedMovement, setSelectedMovement] = useState(null);

    // Open Confirmation State
    const [showOpenConfirm, setShowOpenConfirm] = useState(false);

    // Close Confirmation & Observation State
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [calculatedDiff, setCalculatedDiff] = useState(0);
    const [observation, setObservation] = useState("");

    // Movement Form State
    const [movType, setMovType] = useState("EXPENSE");
    const [movAmount, setMovAmount] = useState("");
    const [movAmountDisplay, setMovAmountDisplay] = useState("");
    const [movDescription, setMovDescription] = useState("");
    const [showMovementConfirm, setShowMovementConfirm] = useState(false); // MODAL STATE

    const leftColRef = useRef(null);
    const rightColRef = useRef(null);
    const [showScrollUpLeft, setShowScrollUpLeft] = useState(false);
    const [showScrollDownLeft, setShowScrollDownLeft] = useState(false);
    const [showScrollUpRight, setShowScrollUpRight] = useState(false);
    const [showScrollDownRight, setShowScrollDownRight] = useState(false);

    // Escape key handler for all modals
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape") {
            if (showOpenConfirm) { setShowOpenConfirm(false); setPassword(""); setError(""); }
            if (showCloseConfirm) { setShowCloseConfirm(false); setPassword(""); setError(""); }
            if (showMovementConfirm) { setShowMovementConfirm(false); }
            if (selectedMovement) { setSelectedMovement(null); }
        }
    }, [showOpenConfirm, showCloseConfirm, showMovementConfirm, selectedMovement]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const checkScroll = (ref, setUp, setDown) => {
        if (ref.current) {
            const { scrollTop, scrollHeight, clientHeight } = ref.current;
            setUp(scrollTop > 10);
            setDown(scrollTop + clientHeight < scrollHeight - 10);
        }
    };

    const scrollToExtreme = (ref, toBottom) => {
        if (ref.current) {
            ref.current.scrollTo({
                top: toBottom ? ref.current.scrollHeight : 0,
                behavior: "smooth"
            });
        }
    };

    useEffect(() => {
        const leftEl = leftColRef.current;
        const rightEl = rightColRef.current;
        const handleScrollLeft = () => checkScroll(leftColRef, setShowScrollUpLeft, setShowScrollDownLeft);
        const handleScrollRight = () => checkScroll(rightColRef, setShowScrollUpRight, setShowScrollDownRight);

        if (leftEl) {
            leftEl.addEventListener("scroll", handleScrollLeft);
            checkScroll(leftColRef, setShowScrollUpLeft, setShowScrollDownLeft);
        }
        if (rightEl) {
            rightEl.addEventListener("scroll", handleScrollRight);
            checkScroll(rightColRef, setShowScrollUpRight, setShowScrollDownRight);
        }

        return () => {
            if (leftEl) leftEl.removeEventListener("scroll", handleScrollLeft);
            if (rightEl) rightEl.removeEventListener("scroll", handleScrollRight);
        };
    }, [history, currentRegister, isCajaExpanded]);

    // Helper: sincroniza el displayAmount con el valor numérico del state
    const handleAmountBlur = () => {
        const num = parseCurrency(amount);
        if (!isNaN(num) && num > 0) {
            setAmount(num);
        }
    };

    const handleMovAmountBlur = () => {
        const num = parseCurrency(movAmount);
        if (!isNaN(num) && num > 0) {
            setMovAmount(num);
        }
    };

    const fetchData = async () => {
        try {
            const res = await axios.get("/api/caja/current");
            setCurrentRegister(res.data);

            if (res.data) {
                const histRes = await axios.get("/api/caja/history");
                setHistory(histRes.data);
            } else {
                setHistory([]);
            }
            setError("");
        } catch (err) {
            setError("No se pudo cargar el estado de la caja");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calcula los totales por método de pago de una orden.
     * Para ventas COMBINADAS usa el desglose de orderPayments.
     * Para ventas simples usa amoutPayed directamente.
     */
    const getOrderTotals = (order) => {
        const totals = { efectivo: 0, transferencia: 0, tarjeta: 0, otros: 0 };
        if (order.orderPayments && order.orderPayments.length > 0) {
            order.orderPayments.forEach(p => {
                const m = (p.paymentMethod || '').toLowerCase();
                if (m === 'efectivo')          totals.efectivo      += p.amount;
                else if (m === 'transferencia') totals.transferencia += p.amount;
                else if (m === 'tarjeta')       totals.tarjeta       += p.amount;
                // CUENTA_CORRIENTE y otros no se suman a caja física
            });
        } else {
            // Fallback para órdenes sin desglose
            const m = (order.paymentMethod || 'efectivo').toLowerCase();
            if (m === 'efectivo')           totals.efectivo      += order.amoutPayed;
            else if (m === 'transferencia') totals.transferencia += order.amoutPayed;
            else if (m === 'tarjeta')       totals.tarjeta       += order.amoutPayed;
            else if (m !== 'cuenta_corriente' && m !== 'combinado') totals.efectivo += order.amoutPayed;
        }
        return totals;
    };

    // Al cargar, si la caja ya está abierta, mantener el panel colapsado (salvo decisión del usuario)
    useEffect(() => {
        if (currentRegister) {
            setIsCajaExpanded(false);
        } else {
            setIsCajaExpanded(true); // Si está cerrada, mejor tenerlo abierto para que la abra
        }
    }, [currentRegister?.id]);

    useEffect(() => { fetchData() }, []);

    const handleOpenInitial = (e) => {
        e.preventDefault();
        const num = parseCurrency(amount);
        if (!num || isNaN(num)) {
            setError("Debe informar un monto válido inicial.");
            return;
        }
        setAmount(num);
        setShowOpenConfirm(true);
    };

    const executeOpen = async (e) => {
        if (e) e.preventDefault();
        try {
            await axios.post("/api/caja/open", { openingAmount: amount, password });
            setAmount("");
            setPassword("");
            setShowOpenConfirm(false);
            setIsCajaExpanded(false); // Colapsar el panel al abrir exitosamente
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleCloseInitial = (e) => {
        e.preventDefault();
        const num = parseCurrency(amount);
        if (!num || isNaN(num)) {
            setError("Complete el arqueo físico para cerrar.");
            return;
        }
        setAmount(num);

        // Calculate expected to see if there is a difference
        // Usamos getOrderTotals para manejar correctamente ventas COMBINADAS
        let fisico = currentRegister.openingAmount;
        history.forEach(item => {
            if (item._typeModel === 'ORDER') {
                const t = getOrderTotals(item);
                fisico += t.efectivo;
            } else {
                if (item.type === 'INCOME') fisico += item.amount;
                else if (item.type === 'EXPENSE') fisico -= item.amount;
            }
        });

        const diff = parseFloat(amount) - fisico;
        setCalculatedDiff(diff);
        setShowCloseConfirm(true); // Always show modal to ask for password
    };

    const executeClose = async (e) => {
        if (e) e.preventDefault();
        if (Math.abs(calculatedDiff) > 0.01 && !observation.trim()) {
            setError("La observación es obligatoria porque la caja no cuadra.");
            return;
        }

        try {
            await axios.post("/api/caja/close", {
                closingAmount: amount,
                password,
                observation
            });
            setAmount("");
            setPassword("");
            setObservation("");
            setShowCloseConfirm(false);
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
        }
    };

    const handleMovementSubmit = (e) => {
        e.preventDefault();
        setShowMovementConfirm(true); // TRIGGER MODAL INSTEAD OF WINDOW.CONFIRM
    };

    const executeMovement = async () => {
        try {
            await axios.post("/api/movimientos", {
                type: movType,
                amount: movAmount,
                description: movDescription
            });
            setMovAmount("");
            setMovDescription("");
            setError("");
            setShowMovementConfirm(false);
            await fetchData();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setShowMovementConfirm(false);
        }
    };

    if (loading) return <div className="p-8 italic opacity-60">Sincronizando caja con la central...</div>;

    return (
        <div className="flex flex-col h-full overflow-hidden relative p-2 pb-6">
            
            {/* MOBILE TABS SELECTOR */}
            <div className="flex lg:hidden mb-4 p-1 rounded-xl bg-black/5 dark:bg-white/5 shrink-0">
                <button 
                    onClick={() => setActiveTab("gestion")}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'gestion' ? 'shadow-md scale-[1.02]' : 'opacity-50'}`}
                    style={{ backgroundColor: activeTab === 'gestion' ? theme.bgcards : 'transparent', color: theme.text }}
                >
                    💼 Gestión
                </button>
                <button 
                    onClick={() => setActiveTab("actividad")}
                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'actividad' ? 'shadow-md scale-[1.02]' : 'opacity-50'}`}
                    style={{ backgroundColor: activeTab === 'actividad' ? theme.bgcards : 'transparent', color: theme.text }}
                >
                    📜 Actividad
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 relative">

            {/* OPEN REGISTER MODAL */}
            {showOpenConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm px-4" onClick={() => { setShowOpenConfirm(false); setPassword(""); setError(""); }}>
                    <form onSubmit={executeOpen} className="p-6 rounded-xl shadow-lg w-full max-w-sm" style={{ backgroundColor: theme.bg3, color: theme.text, borderTop: `4px solid ${theme.success}` }} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Apertura de Turno</h2>
                        <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 font-mono mb-4 text-center text-lg shadow-inner">
                            Declarado: <span className="font-bold text-green-500">{formatCurrency(amount)}</span>
                        </div>
                        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                        <div className="flex flex-col gap-2 mb-6">
                            <label className="text-sm font-semibold opacity-80">Reintroduzca su Clave para confirmar</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoFocus className="p-3 outline-none rounded-lg text-lg ring-1 shadow-inner w-full" style={{ backgroundColor: theme.bg, borderColor: theme.bgcards, color: theme.text }} placeholder="****" />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => { setShowOpenConfirm(false); setPassword(""); setError(""); }} className="px-4 py-2 rounded font-bold opacity-80 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Cancelar</button>
                            <button type="submit" className="px-5 py-2 rounded font-bold text-white shadow-md active:scale-95 transition-transform" style={{ backgroundColor: theme.success }}>Abrir Caja</button>
                        </div>
                    </form>
                </div>
            )}

            {/* CLOSE REGISTER MODAL */}
            {showCloseConfirm && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm px-4" onClick={() => { setShowCloseConfirm(false); setPassword(""); setError(""); }}>
                    <form onSubmit={executeClose} className="p-6 rounded-xl shadow-lg w-full max-w-sm" style={{ backgroundColor: theme.bg3, color: theme.text, borderTop: `4px solid ${theme.danger}` }} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Cierre de Turno</h2>

                        <div className="p-3 rounded-lg bg-black/5 dark:bg-white/5 font-mono mb-4 flex flex-col gap-1 shadow-inner text-sm">
                            <div className="flex justify-between"><span>Arqueo Físico:</span><span className="font-bold">{formatCurrency(amount)}</span></div>
                            <div className="flex justify-between opacity-70 border-t pt-1 mt-1 border-current"><span>Esperado Sistema:</span><span>{formatCurrency(parseFloat(amount) - calculatedDiff)}</span></div>
                        </div>

                        {Math.abs(calculatedDiff) > 0.01 && (
                            <div className="p-3 rounded-lg mb-4 text-sm font-semibold border" style={{ backgroundColor: theme.dangerBg, color: theme.dangerText, borderColor: theme.danger }}>
                                ⚠️ {calculatedDiff > 0 ? "EXCEDENTE" : "FALTANTE"} de {formatCurrency(Math.abs(calculatedDiff))} detectado.
                                <div className="mt-2 text-xs flex flex-col gap-1">
                                    <label>Justificación Comercial (Requerida):</label>
                                    <textarea required value={observation} onChange={e => setObservation(e.target.value)} className="w-full p-2 outline-none rounded text-black bg-white/90 border border-current shadow-inner" placeholder="Escriba aquí..."></textarea>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm mb-2 font-bold bg-red-100 dark:bg-red-900/30 p-2 rounded">{error}</p>}

                        <div className="flex flex-col gap-2 mb-6">
                            <label className="text-sm font-semibold opacity-80">Reintroduzca su Clave para finalizar</label>
                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="p-3 outline-none rounded-lg text-lg ring-1 shadow-inner w-full" style={{ backgroundColor: theme.bg, borderColor: theme.bgcards, color: theme.text }} placeholder="****" />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => { setShowCloseConfirm(false); setPassword(""); setError(""); setObservation(""); }} className="px-4 py-2 rounded font-bold opacity-80 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Cancelar</button>
                            <button type="submit" className="px-5 py-2 rounded font-bold text-white shadow-md active:scale-95 transition-transform" style={{ backgroundColor: theme.danger }}>Forzar Cierre</button>
                        </div>
                    </form>
                </div>
            )}

            <ConfirmModal
                isOpen={showMovementConfirm}
                onClose={() => setShowMovementConfirm(false)}
                onConfirm={executeMovement}
                message={`¿Confirmar registro de ${movType === 'EXPENSE' ? 'EGRESO' : 'INGRESO'} por ${formatCurrency(movAmount)}?`}
            >
                <div className="text-sm opacity-80 mt-2 p-2 rounded bg-black/10 dark:bg-white/10 font-mono">
                    Motivo: {movDescription}
                </div>
            </ConfirmModal>

            {/* LEFT COLUMN: Open/Close & Controls */}
            <div className={`h-full flex flex-col relative overflow-hidden pr-2 ${activeTab !== 'gestion' ? 'hidden lg:flex' : 'flex'}`}>
                {showScrollUpLeft && (
                    <button
                        onClick={() => scrollToExtreme(leftColRef, false)}
                        className="absolute top-2 left-1/2 -translate-x-1/2 z-20 p-1.5 rounded-full shadow-lg animate-bounce opacity-70 hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: theme.bg3, color: theme.text }}
                    >
                        <FaChevronUp size={14} />
                    </button>
                )}
                <div className="flex flex-col gap-6 h-full overflow-y-auto no-scrollbar pb-12 lg:pb-0" ref={leftColRef}>

                    {/* CAJA CARD (Accordion) */}
                    <div
                        className="p-6 sm:p-8 rounded-xl w-full flex flex-col transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 shrink-0"
                        style={{ backgroundColor: theme.bgcards, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                        onClick={() => setIsCajaExpanded(!isCajaExpanded)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-bold flex items-center gap-2">🏦 Gestión de Caja Diaria</h2>
                            <button className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                                {isCajaExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        </div>

                        {error && !showOpenConfirm && !showCloseConfirm && <div className="p-3 my-2 border rounded relative text-sm font-semibold" style={{ backgroundColor: theme.dangerBg, color: theme.dangerText, borderColor: theme.danger }}>{error}</div>}

                        {/* ALWAYS VISIBLE STATUS HEADER */}
                        <div className="mt-2" onClick={(e) => { if (isCajaExpanded) e.stopPropagation(); }}>
                            {currentRegister ? (
                                <div className="p-3 rounded-lg border flex flex-col gap-1 shadow-sm" style={{ backgroundColor: theme.bg3, borderColor: theme.success }}>
                                    <span className="flex items-center gap-2 font-bold text-base" style={{ color: theme.success }}>
                                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: theme.success }}></span><span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: theme.success }}></span></span>
                                        Caja Activa
                                    </span>
                                    <p className="text-xs opacity-80">Por: {currentRegister.openedByUser?.firstName}</p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg border flex items-center gap-2" style={{ backgroundColor: theme.dangerBg, color: theme.dangerText, borderColor: theme.danger }}>
                                    <span className="text-lg">❌</span>
                                    <b className="text-sm">Caja Cerrada</b>
                                </div>
                            )}
                        </div>

                        {/* EXPANDABLE DETAILS & FORM */}
                        {isCajaExpanded && (
                            <div className="mt-6 pt-4 border-t animate-fade-in" style={{ borderColor: theme.bg3 }} onClick={(e) => e.stopPropagation()}>
                                {currentRegister ? (
                                    <form onSubmit={handleCloseInitial} className="flex flex-col gap-4">
                                        <div className="text-sm opacity-80 gap-1 flex flex-col px-2">
                                            <p><b>Apertura (Hora):</b> {new Date(currentRegister.openedAt).toLocaleString()}</p>
                                            <p className="border-t pt-2 mt-1" style={{ borderColor: theme.bg }}><b>Dinero Inicial Informado:</b> <span className="font-mono text-base">{formatCurrency(currentRegister.openingAmount)}</span></p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-sm">Cierre de caja: Dinero Físico Existente ($)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                required
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                onBlur={handleAmountBlur}
                                                onFocus={() => setAmount(parseCurrency(amount) || "")}
                                                className="p-3 outline-none rounded-lg text-lg ring-1 transition-shadow shadow-inner w-full"
                                                style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                                                placeholder="Ej: 52000,50"
                                            />
                                        </div>
                                        <p className="text-xs opacity-60 text-right">{amount ? formatCurrency(parseCurrency(amount)) : ""}</p>
                                        <button type="submit" className="mt-2 p-3 sm:p-4 rounded-lg font-bold transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide" style={{ backgroundColor: theme.danger, color: "#fff" }}>
                                            🔒 CERRAR CAJA
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleOpenInitial} className="flex flex-col gap-4">
                                        <p className="text-sm opacity-90 px-2">El sistema <b>bloqueará</b> preventivamente registros de ventas y movimientos hasta que reportes el flujo inicial.</p>

                                        <div className="flex flex-col gap-2">
                                            <label className="font-semibold text-sm">Dinero Físico en Gaveta ($)</label>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                required
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                onBlur={handleAmountBlur}
                                                onFocus={() => setAmount(parseCurrency(amount) || "")}
                                                className="p-3 outline-none rounded-lg ring-1 text-lg transition-shadow flex w-full"
                                                style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                                                placeholder="Vuelto base, Ej: 5000,00"
                                            />
                                        </div>
                                        <p className="text-xs opacity-60 text-right">{amount ? formatCurrency(parseCurrency(amount)) : ""}</p>
                                        <button type="submit" className="mt-2 p-3 sm:p-4 rounded-lg font-bold transition-transform active:scale-95 shadow-lg uppercase tracking-wide flex justify-center" style={{ backgroundColor: theme.success, color: "#fff" }}>
                                            🗝️ CONTINUAR APERTURA
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    {/* MOVEMENTS FORM (only if open) */}
                    {currentRegister && !showCloseConfirm && (
                        <div className="p-6 rounded-xl flex flex-col gap-2 shrink-0 mb-4" style={{ backgroundColor: theme.bgcards, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
                            <h3 className="text-xl font-bold mb-3 border-b pb-2" style={{ borderColor: theme.bg3 }}>Nuevo Registro (no ventas)</h3>

                            <form onSubmit={handleMovementSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold opacity-80">Ruta Financiera</label>
                                    <select value={movType} onChange={e => setMovType(e.target.value)} className="p-3 rounded outline-none w-full border font-bold shadow-sm" style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: movType === 'EXPENSE' ? theme.danger : theme.success }}>
                                        <option value="EXPENSE">🔻 SALIDA (Gastos / Pagos / Retiros)</option>
                                        <option value="INCOME">🔺 ENTRADA (Inyección / Aportes)</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold opacity-80">Motivo (Requerido)</label>
                                    <input type="text" required value={movDescription} onChange={e => setMovDescription(e.target.value)} placeholder="Ej: Pago Proveedor / Compra de bolsas..." className="p-2.5 rounded-lg outline-none border mb-2 shadow-inner focus:ring-1 transition-shadow" style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }} />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-semibold opacity-80">Importe ($)</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        required
                                        value={movAmount}
                                        onChange={e => setMovAmount(e.target.value)}
                                        onBlur={handleMovAmountBlur}
                                        onFocus={() => setMovAmount(parseCurrency(movAmount) || "")}
                                        className="p-2.5 rounded-lg outline-none border shadow-inner text-lg font-mono focus:ring-1 transition-shadow"
                                        style={{ backgroundColor: theme.bg, borderColor: theme.bg3, color: theme.text }}
                                        placeholder="0,00"
                                    />
                                    <p className="text-xs opacity-60 text-right">{movAmount ? formatCurrency(parseCurrency(movAmount)) : ""}</p>
                                </div>


                                <button type="submit" className="p-4 mt-1 font-bold rounded-lg text-white shadow-md transition-transform active:scale-95 flex justify-center uppercase tracking-wide w-full" style={{ backgroundColor: movType === 'EXPENSE' ? theme.danger : theme.success }}>
                                    Registrar Movimiento $
                                </button>
                            </form>
                        </div>
                    )}
                </div> {/* Closes leftColRef (305) */}
                {showScrollDownLeft && (
                    <button
                        onClick={() => scrollToExtreme(leftColRef, true)}
                        className="absolute bottom-16 lg:bottom-4 left-1/2 -translate-x-1/2 z-20 p-1.5 rounded-full shadow-lg animate-bounce opacity-70 hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: theme.bg3, color: theme.text }}
                    >
                        <FaChevronDown size={14} />
                    </button>
                )}
            </div> {/* Closes left main container (295) */}

            {/* RIGHT COLUMN: History Timeline */}
            <div className={`p-6 rounded-xl flex flex-col h-full overflow-hidden relative ${activeTab !== 'actividad' ? 'hidden lg:flex' : 'flex'}`} style={{ backgroundColor: theme.bgcards, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}>
                <h3 className="text-xl font-bold mb-4 border-b pb-2 flex justify-between items-center shrink-0" style={{ borderColor: theme.bg3 }}>
                    Actividad del Turno Actual
                    <span className="text-xs px-2 py-1 rounded font-normal" style={{ backgroundColor: theme.infoBg, color: theme.infoText }}>Historial Combinado</span>
                </h3>

                <div className="flex-1 relative overflow-hidden flex flex-col">
                    {showScrollUpRight && (
                        <button
                            onClick={() => scrollToExtreme(rightColRef, false)}
                            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 p-1 rounded-full shadow-md animate-bounce opacity-70 hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: theme.bg3, color: theme.text }}
                        >
                            <FaChevronUp size={12} />
                        </button>
                    )}

                    <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-20" ref={rightColRef}>
                        {history.length === 0 && !currentRegister ? (
                            <p className="opacity-60 italic text-sm text-center py-8">
                                Aún no hay ventas ni movimientos en esta caja.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {history.map((item, idx) => {
                                    const isOrder = item._typeModel === 'ORDER';
                                    const isIncome = isOrder || item.type === 'INCOME';
                                    const isCombined = isOrder && item.orderPayments?.length > 1;

                                    // Ícono por método de pago
                                    const methodIcon = (m = '') => {
                                        const ml = m.toLowerCase();
                                        if (ml === 'efectivo')           return '💵';
                                        if (ml === 'transferencia')      return '🏦';
                                        if (ml === 'tarjeta')            return '💳';
                                        if (ml === 'cuenta_corriente')   return '📒';
                                        return '💰';
                                    };
                                    const methodLabel = (m = '') => {
                                        const ml = m.toLowerCase();
                                        if (ml === 'efectivo')           return 'Efectivo';
                                        if (ml === 'transferencia')      return 'Transferencia';
                                        if (ml === 'tarjeta')            return 'Tarjeta';
                                        if (ml === 'cuenta_corriente')   return 'Cta. Cte.';
                                        return m;
                                    };

                                    let label = '';
                                    let color = '';
                                    let bgColor = '';

                                    if (isOrder) {
                                        label = 'VENTA POS';
                                        color = theme.info;
                                        bgColor = theme.infoBg;
                                    } else if (item.type === 'INCOME') {
                                        label = 'INGRESO';
                                        color = theme.success;
                                        bgColor = theme.successBg;
                                    } else {
                                        label = 'EGRESO';
                                        color = theme.danger;
                                        bgColor = theme.dangerBg;
                                    }

                                    const clientName = isOrder
                                        ? (item.client ? `${item.client.firstName} ${item.client.lastName || ''}`.trim() : 'Consumidor Final')
                                        : null;

                                    const desc = isOrder
                                        ? `Venta a ${clientName}`
                                        : (item.description || 'Libre disponibilidad / Sin referencia formal');

                                    const timeStr = new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    const userName = item.user?.firstName || 'Cajero';

                                    // ── Venta COMBINADA: card agrupador ────────────────────────────
                                    if (isCombined) {
                                        return (
                                            <div
                                                key={idx}
                                                className="border-2 rounded-xl overflow-hidden"
                                                style={{ borderColor: theme.info + '60' }}
                                            >
                                                {/* Encabezado del grupo */}
                                                <div
                                                    className="px-3 pt-3 pb-2 flex justify-between items-start cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                                    onClick={() => setSelectedMovement(item)}
                                                    title="Ver detalle completo"
                                                >
                                                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                        <div className="flex gap-2 items-center flex-wrap">
                                                            <span className="font-bold px-1.5 py-0.5 text-[9px] rounded border border-current whitespace-nowrap" style={{ color, backgroundColor: bgColor }}>
                                                                {label}
                                                            </span>
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap" style={{ color: theme.info, borderColor: theme.info + '50', backgroundColor: theme.infoBg }}>
                                                                COMBINADO
                                                            </span>
                                                            <span className="font-mono text-sm font-bold shrink-0" style={{ color: theme.success }}>
                                                                +{formatCurrency(item.amount)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs opacity-70 truncate">{desc}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end text-[10px] opacity-60 ml-2 border-l pl-2 shrink-0" style={{ borderColor: theme.bg3 }}>
                                                        <span className="font-semibold">{timeStr}</span>
                                                        <span>{userName}</span>
                                                    </div>
                                                </div>

                                                {/* Sub-items: uno por método de pago */}
                                                <div className="flex flex-col gap-1 px-2 pb-2">
                                                    {item.orderPayments.map((p, pIdx) => (
                                                        <div
                                                            key={pIdx}
                                                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
                                                            style={{ backgroundColor: theme.bg, borderLeft: `3px solid ${theme.info}40` }}
                                                        >
                                                            <span className="flex items-center gap-1.5 font-medium opacity-80">
                                                                <span>{methodIcon(p.paymentMethod)}</span>
                                                                <span>{methodLabel(p.paymentMethod)}</span>
                                                            </span>
                                                            <span className="font-mono font-bold" style={{ color: p.paymentMethod?.toLowerCase() === 'cuenta_corriente' ? '#f97316' : theme.success }}>
                                                                {p.paymentMethod?.toLowerCase() === 'cuenta_corriente' ? '📒 ' : '+'}
                                                                {formatCurrency(p.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ── Venta simple o movimiento manual ───────────────────────────
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedMovement(item)}
                                            className="p-3 border rounded-lg flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                            style={{ borderColor: theme.bg3 }}
                                            title="Ver detalle completo"
                                        >
                                            <div className="flex flex-col text-sm max-w-[65%] md:max-w-[75%]">
                                                <div className="flex gap-2 items-center flex-wrap">
                                                    <span className="font-bold px-1.5 py-0.5 text-[9px] md:text-[10px] rounded border border-current whitespace-nowrap" style={{ color: color, backgroundColor: bgColor }}>
                                                        {label}
                                                    </span>
                                                    {isOrder && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold opacity-70 border px-1 rounded" style={{ borderColor: theme.bg3 }}>
                                                            <span>{methodIcon(item.orderPayments?.[0]?.paymentMethod || item.paymentMethod)}</span>
                                                            <span className="uppercase">{methodLabel(item.orderPayments?.[0]?.paymentMethod || item.paymentMethod)}</span>
                                                        </span>
                                                    )}
                                                    <span className="font-mono text-sm md:text-base font-semibold shrink-0" style={{ color: isIncome ? theme.success : theme.danger }}>
                                                        {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
                                                    </span>
                                                </div>
                                                <p className="opacity-70 mt-1 truncate text-xs md:text-sm" title={desc}>{desc}</p>
                                            </div>
                                            <div className="flex flex-col items-end text-[10px] md:text-xs opacity-60 ml-2 border-l pl-2 min-w-[70px] md:min-w-[80px]" style={{ borderColor: theme.bg3 }}>
                                                <span className="font-semibold">{timeStr}</span>
                                                <span className="truncate max-w-[60px] md:max-w-28 text-right" title={userName}>{userName}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* STARTING RECORD */}
                                {currentRegister && (
                                    <div className="p-3 border rounded-lg flex justify-between items-center bg-black/5 dark:bg-white/5 opacity-80 mt-2" style={{ borderColor: theme.bg3 }}>
                                        <div className="flex flex-col text-sm max-w-[75%]">
                                            <div className="flex gap-2 items-center">
                                                <span className="font-bold px-1.5 py-0.5 text-[10px] rounded border border-current whitespace-nowrap" style={{ color: theme.success, backgroundColor: theme.successBg }}>
                                                    APERTURA DE CAJA
                                                </span>
                                                <span className="font-mono text-base font-semibold" style={{ color: theme.success }}>
                                                    +{formatCurrency(currentRegister.openingAmount)}
                                                </span>
                                            </div>
                                            <p className="opacity-70 mt-1 truncate">Monto inicial declarado en gaveta</p>
                                        </div>
                                        <div className="flex flex-col items-end text-xs opacity-60 ml-2 border-l pl-2 min-w-[80px]" style={{ borderColor: theme.bg3 }}>
                                            <span className="font-semibold">{new Date(currentRegister.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="truncate max-w-28 text-right" title={currentRegister.openedByUser?.firstName}>{currentRegister.openedByUser?.firstName || 'Sistema'}</span>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>

                    {showScrollDownRight && (
                        <button
                            onClick={() => scrollToExtreme(rightColRef, true)}
                            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 p-1 rounded-full shadow-md animate-bounce opacity-70 hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: theme.bg3, color: theme.text }}
                        >
                            <FaChevronDown size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* REAL-TIME TOTALS FOOTER */}
            {currentRegister && (
                <div className="fixed lg:absolute bottom-4 left-4 right-4 lg:bottom-6 lg:right-6 lg:left-auto lg:w-[calc(50%-1.5rem)] p-3 rounded-xl border shadow-2xl z-40 grid grid-cols-3 gap-2 animate-in slide-in-from-bottom-4 duration-300" style={{ borderColor: theme.bg3, backgroundColor: theme.bgcards }}>

                    {(() => {
                        let fisico = currentRegister.openingAmount;
                        let transferencias = 0;
                        let tarjetas = 0;

                        // getOrderTotals desglosa ventas COMBINADAS usando orderPayments
                        history.forEach(item => {
                            if (item._typeModel === 'ORDER') {
                                const t = getOrderTotals(item);
                                fisico        += t.efectivo;
                                transferencias += t.transferencia;
                                tarjetas       += t.tarjeta;
                            } else {
                                if (item.type === 'INCOME') fisico += item.amount;
                                else if (item.type === 'EXPENSE') fisico -= item.amount;
                            }
                        });

                        return (
                            <>
                                <div className="flex flex-col items-center justify-center border-r" style={{ borderColor: theme.bg3 }}>
                                    <span className="text-[9px] md:text-[10px] font-bold opacity-60 uppercase mb-0.5 md:mb-1 flex items-center gap-1 text-green-500 shrink-0">💵 <span className="hidden xs:inline">Efectivo</span></span>
                                    <span className="font-mono font-bold text-xs md:text-base">{formatCurrency(fisico)}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center border-r" style={{ borderColor: theme.bg3 }}>
                                    <span className="text-[9px] md:text-[10px] font-bold opacity-60 uppercase mb-0.5 md:mb-1 flex items-center gap-1 text-blue-500 shrink-0">🏦 <span className="hidden xs:inline">Transf.</span></span>
                                    <span className="font-mono font-bold text-xs md:text-base">{formatCurrency(transferencias)}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center">
                                    <span className="text-[9px] md:text-[10px] font-bold opacity-60 uppercase mb-0.5 md:mb-1 flex items-center gap-1 text-orange-500 shrink-0">💳 <span className="hidden xs:inline">Tarjeta</span></span>
                                    <span className="font-mono font-bold text-xs md:text-base">{formatCurrency(tarjetas)}</span>
                                </div>
                            </>
                        );
                    })()}

                </div>
            )}

            {/* MOVEMENT DETAIL MODAL */}
            {selectedMovement && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 backdrop-blur-sm px-4" onClick={() => setSelectedMovement(null)}>
                    <div className="p-6 rounded-xl shadow-lg w-full max-w-sm relative" style={{ backgroundColor: theme.bg3, color: theme.text }} onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4 border-b pb-2" style={{ borderColor: theme.bg }}>Detalle de Movimiento</h2>

                        <div className="flex flex-col gap-3 text-sm">
                            <p><b>Fecha:</b> {new Date(selectedMovement.date || selectedMovement.createdAt).toLocaleString()}</p>

                            {selectedMovement._typeModel === 'ORDER' ? (
                                <>
                                    <p><b>Tipo:</b> <span className="text-blue-500 font-bold">VENTA POS</span></p>
                                    <p><b>Monto Facturado:</b> {formatCurrency(selectedMovement.amount)}</p>
                                    <p><b>Método de Pago:</b> {selectedMovement.paymentMethod || 'Efectivo'}</p>
                                    <p><b>Cajero:</b> {selectedMovement.user?.firstName} {selectedMovement.user?.lastName}</p>
                                    <p><b>Cliente:</b> {selectedMovement.client ? `${selectedMovement.client.firstName} ${selectedMovement.client.lastName}` : 'Consumidor Final'}</p>
                                    <p><b>ID Venta:</b> <span className="font-mono text-xs">{selectedMovement.id}</span></p>
                                </>
                            ) : (
                                <>
                                    <p><b>Tipo:</b> <span className={`font-bold ${selectedMovement.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>{selectedMovement.type === 'INCOME' ? 'INGRESO' : 'EGRESO'} Manual</span></p>
                                    <p><b>Monto Informado:</b> {formatCurrency(selectedMovement.amount)}</p>
                                    <p><b>Operario Responsable:</b> {selectedMovement.user?.firstName} {selectedMovement.user?.lastName}</p>
                                    <p><b>Motivo Comercial:</b> <span className="opacity-80 block mt-1 p-2 rounded bg-black/5 dark:bg-white/5">{selectedMovement.description || 'Sin justificación'}</span></p>
                                    <p><b>ID Movimiento:</b> <span className="font-mono text-xs">{selectedMovement.id}</span></p>
                                </>
                            )}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setSelectedMovement(null)}
                                className="px-5 py-2 rounded font-bold text-white shadow-md active:scale-95 transition-transform"
                                style={{ backgroundColor: theme.primary }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default CashRegister;
