import { useState, useEffect, useCallback } from "react";
import MessageModal from "./MessageModal";
import ThemedButton from "../ThemedButton";
import { useTheme } from "../../context/ThemeContext";

const StockAdjustModal = ({ isOpen, onClose, onConfirm, currentStock }) => {
    const { theme } = useTheme();
    const [action, setAction] = useState("add"); // "add" or "subtract"
    const [amount, setAmount] = useState("");
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
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        const numAmount = parseInt(amount, 10);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Debes ingresar una cantidad válida mayor a 0.");
            return;
        }

        if (action === "subtract" && numAmount > currentStock) {
            setError(`No puedes quitar más del stock actual (${currentStock}).`);
            return;
        }

        if (!description.trim()) {
            setError("Debes ingresar un motivo para el ajuste.");
            return;
        }

        // Emit positive or negative amount
        const finalAmount = action === "add" ? numAmount : -numAmount;
        onConfirm(finalAmount, description);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-md p-6 rounded-2xl shadow-xl flex flex-col gap-5 border"
                style={{ backgroundColor: theme.bg2, borderColor: theme.bg4, color: theme.text }}
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    <h2 className="text-xl font-bold mb-1">Ajustar Stock</h2>
                    <p className="opacity-70 text-sm">Stock actual: <strong>{currentStock}</strong></p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="stockAction"
                                value="add"
                                checked={action === "add"}
                                onChange={() => setAction("add")}
                                className="accent-blue-500"
                            />
                            <span className={action === "add" ? "font-bold text-green-500" : ""}>Agregar (+)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="stockAction"
                                value="subtract"
                                checked={action === "subtract"}
                                onChange={() => setAction("subtract")}
                                className="accent-blue-500"
                            />
                            <span className={action === "subtract" ? "font-bold text-red-500" : ""}>Quitar (-)</span>
                        </label>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold opacity-80">Cantidad a {action === "add" ? "sumar" : "restar"}:</label>
                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="p-2 border rounded"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                            placeholder="Ej. 10"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold opacity-80">Motivo del ajuste (Obligatorio):</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="p-2 border rounded resize-none"
                            style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                            placeholder="Ej. Mercadería dañada, Ingreso de proveedor..."
                            rows="2"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-bold bg-red-100 dark:bg-red-900/30 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-2">
                        <ThemedButton type="button" onClick={onClose} variant="secondary">
                            Cancelar
                        </ThemedButton>
                        <ThemedButton type="submit">
                            Confirmar Ajuste
                        </ThemedButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustModal;
