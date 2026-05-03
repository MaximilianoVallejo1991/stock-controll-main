import { useState, useEffect, useCallback } from "react";
import ThemedButton from "../ThemedButton";
import { useTheme } from "../../context/ThemeContext";
import { DollarSign, CreditCard, Wallet, MessageSquare } from "lucide-react";

const RegisterPaymentModal = ({ isOpen, onClose, onConfirm, currentBalance }) => {
    const { theme } = useTheme();
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");

    const handleKeyDown = useCallback((e) => {
        if (e.key === "Escape" && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
            // Por defecto sugerimos el saldo total si es positivo
            if (currentBalance > 0) {
                setAmount(currentBalance.toString());
            }
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleKeyDown, currentBalance]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Debes ingresar un monto válido mayor a 0.");
            return;
        }

        onConfirm({
            amount: numAmount,
            paymentMethod,
            description: description.trim() || `Pago de cuenta corriente - ${paymentMethod}`
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-5 border"
                style={{ backgroundColor: theme.bg2, borderColor: theme.bg4, color: theme.text }}
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                        <DollarSign className="text-green-500" /> Registrar Pago
                    </h2>
                    <p className="opacity-70 text-sm">Saldo pendiente: <strong>${currentBalance.toLocaleString()}</strong></p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold opacity-80 flex items-center gap-2">
                            <Wallet size={14} /> Monto a pagar:
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="p-2 border rounded font-bold text-lg"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold opacity-80 flex items-center gap-2">
                            <CreditCard size={14} /> Método de Pago:
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="p-2 border rounded"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                        >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                            <option value="DEBITO">Tarjeta de Débito</option>
                            <option value="CREDITO">Tarjeta de Crédito</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold opacity-80 flex items-center gap-2">
                            <MessageSquare size={14} /> Notas / Descripción:
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="p-2 border rounded resize-none text-sm"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                            placeholder="Ej. Entrega parcial, Pago total mes de Mayo..."
                            rows="2"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-bold bg-red-100 dark:bg-red-900/30 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-2">
                        <ThemedButton type="button" onClick={onClose} className="!bg-transparent border !text-current">
                            Cancelar
                        </ThemedButton>
                        <ThemedButton type="submit" className="!bg-green-600 !text-white">
                            Confirmar Pago
                        </ThemedButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPaymentModal;
