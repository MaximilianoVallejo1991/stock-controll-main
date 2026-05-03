import React from "react";
import { translateField } from "../../../utils/translator";
import { EMPLOYEE_ROLES_DET, ROLES } from "../../../constants/roles";
import { formatCurrency } from "../../../utils/currency";
import { format } from "date-fns";
import ThemedButton from "../../../components/ThemedButton";

const EntityDetailsForm = ({
    formData,
    data,
    isEditing,
    entity,
    entityFieldRules,
    theme,
    handleChange,
    categories,
    pendingStockAdjustment,
    setPendingStockAdjustment,
    setIsStockModalOpen,
    setAdminPasswordAction,
    setIsAdminPasswordOpen,
}) => {

    const renderValue = (value, key) => {
        if (value === null || value === undefined) return "—";
        if (key === "password") return "••••••••";
        if (key.toLowerCase().includes("date")) {
            try { return format(new Date(value), "dd/MM/yyyy HH:mm"); }
            catch { return String(value); }
        }
        if (Array.isArray(value)) return value.length === 0 ? "—" : `${value.length} elementos`;
        if (typeof value === "object") {
            if ("name" in value) return value.name;
            if ("label" in value) return value.label;
            return JSON.stringify(value);
        }
        if (["price", "cost", "total", "amount"].includes(key)) return formatCurrency(value);
        return String(value);
    };

    const isReadOnly = (key) => entityFieldRules?.readOnly?.includes(key);

    const renderEditField = (key, value) => {
        // Campo de categoría en productos
        if (key === "categoryId" && entity === "products") {
            return (
                <div className="flex gap-2">
                    <select
                        value={formData.categoryId || ""}
                        onChange={(e) => handleChange({ target: { name: "categoryId", value: e.target.value } })}
                        name="categoryId"
                        className="w-full p-2.5 rounded-lg border outline-none"
                        style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                    >
                        <option value="">Seleccionar categoría...</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id} style={{ backgroundColor: theme.bg, color: theme.text }}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        // Campo de contraseña en usuarios: botón de blanqueo
        if (key === "password" && entity === "user") {
            return (
                <ThemedButton
                    type="button"
                    onClick={() => {
                        setAdminPasswordAction("reset");
                        setIsAdminPasswordOpen(true);
                    }}
                >
                    Blanquear Clave
                </ThemedButton>
            );
        }

        // Campo de rol en usuarios
        if (key === "role" && entity === "user") {
            const isSistema = data?.role === ROLES.SISTEMA || formData.role === ROLES.SISTEMA;
            return (
                <select
                    name="role"
                    value={formData.role || ""}
                    onChange={(e) => handleChange({ target: { name: "role", value: e.target.value } })}
                    className="w-full p-2.5 rounded-lg border outline-none"
                    style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                    disabled={isSistema}
                >
                    <option value="">Seleccionar rol...</option>
                    {isSistema && (
                        <option value={ROLES.SISTEMA} style={{ backgroundColor: theme.bg, color: theme.text }}>
                            Sistema
                        </option>
                    )}
                    {EMPLOYEE_ROLES_DET.map((r) => (
                        <option key={r.value} value={r.value} style={{ backgroundColor: theme.bg, color: theme.text }}>
                            {r.label}
                        </option>
                    ))}
                </select>
            );
        }

        // Campo de stock en productos
        if (key === "stock" && entity === "products") {
            return (
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-lg">
                        {pendingStockAdjustment ? data.stock + pendingStockAdjustment.amount : value}
                    </span>
                    {pendingStockAdjustment && (
                        <span className="text-xs italic text-blue-500">
                            ({pendingStockAdjustment.amount > 0 ? '+' : ''}{pendingStockAdjustment.amount} Pendiente)
                        </span>
                    )}
                    <ThemedButton
                        type="button"
                        onClick={() => setIsStockModalOpen(true)}
                        className="py-1 px-3 text-xs"
                    >
                        Ajustar Stock
                    </ThemedButton>
                    {pendingStockAdjustment && (
                        <button
                            onClick={() => setPendingStockAdjustment(null)}
                            className="text-red-500 text-xs underline cursor-pointer"
                        >
                            Cancelar ajuste
                        </button>
                    )}
                </div>
            );
        }

        // Input genérico
        return (
            <input
                type="text"
                name={key}
                value={formData[key] ?? ""}
                onChange={handleChange}
                className="w-full p-2.5 rounded-lg border outline-none"
                style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
            />
        );
    };

    const renderReadValue = (key, value) => {
        if (entity === "products" && key === "categoryId") {
            return data?.category?.name || "—";
        }
        return renderValue(value, key);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            {Object.entries(formData)
                .filter(([key]) => {
                    const baseExcluded = [
                        "id", "storeId", "image", "isActive", "orders", "payments",
                        "Image", "createdAt", "updatedAt", "profilePicture", "category",
                        "cuit", "tempPassword", "mustChangePassword", "roleId", "rbacRole", "currentAccount"
                    ];
                    if (baseExcluded.includes(key)) return false;
                    if (entityFieldRules?.hide?.includes(key)) return false;
                    if (key === "fullName" && entity !== "suppliers") return false;
                    return true;
                })
                .map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1.5">
                        <label
                            className="text-[10px] font-bold uppercase tracking-wider opacity-50"
                            style={{ color: theme.colorsubtitlecard }}
                        >
                            {translateField(key)}
                        </label>

                        {isEditing && !isReadOnly(key)
                            ? renderEditField(key, value)
                            : (
                                <p className="text-sm font-medium" style={{ color: theme.colorsubtitlecard }}>
                                    {renderReadValue(key, value)}
                                </p>
                            )
                        }
                    </div>
                ))}
        </div>
    );
};

export default EntityDetailsForm;
