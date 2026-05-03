/**
 * ESTE ARCHIVO NO DEBE USARSE.
 * Fue renombrado a EntityDetailsForm.jsx para evitar colisión de nombres
 * con src/components/DynamicForm.jsx (formulario de creación de entidades).
 *
 * Importá desde: ../components/EntityDetailsForm
 */
export { default } from "./EntityDetailsForm";


const DynamicForm = ({
    formData,
    isEditing,
    entity,
    entityFieldRules,
    theme,
    handleChange,
    categories,
    handleStockAdjust,
    pendingStockAdjustment
}) => {
    
    const renderValue = (value, key) => {
        if (value === null || value === undefined) return "—";
        if (key === "password") return "********";
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            {Object.entries(formData)
                .filter(([key]) => {
                    const baseExcluded = ["id", "storeId", "image", "isActive", "orders", "payments", "Image", "createdAt", "updatedAt", "profilePicture", "category", "cuit", "tempPassword", "mustChangePassword", "roleId", "rbacRole", "currentAccount"];
                    if (baseExcluded.includes(key)) return false;
                    if (entityFieldRules?.hide?.includes(key)) return false;
                    if (key === "fullName" && entity !== "suppliers") return false;
                    return true;
                })
                .map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1.5 group">
                        <label className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: theme.colorsubtitlecard }}>
                            {translateField(key)}
                        </label>

                        {isEditing && !isReadOnly(key) ? (
                            <>
                                {key === "categoryId" && entity === "products" ? (
                                    <select
                                        value={formData.categoryId || ""}
                                        onChange={handleChange}
                                        name="categoryId"
                                        className="w-full p-2.5 rounded-lg border focus:ring-2 outline-none transition-all"
                                        style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                                    >
                                        <option value="">Sin categoría</option>
                                        {categories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                ) : key === "role" && entity === "user" ? (
                                    <select
                                        value={formData.role || ""}
                                        onChange={handleChange}
                                        name="role"
                                        className="w-full p-2.5 rounded-lg border focus:ring-2 outline-none"
                                        style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                                    >
                                        {EMPLOYEE_ROLES_DET.map((r) => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={key === "password" ? "password" : "text"}
                                        name={key}
                                        value={formData[key] || ""}
                                        onChange={handleChange}
                                        className="w-full p-2.5 rounded-lg border focus:ring-2 outline-none"
                                        style={{ backgroundColor: theme.bg, borderColor: theme.bg4, color: theme.text }}
                                    />
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium leading-relaxed">
                                    {renderValue(value, key)}
                                </span>
                                {key === "stock" && entity === "products" && isEditing && (
                                    <button
                                        onClick={handleStockAdjust}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${pendingStockAdjustment ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                                    >
                                        {pendingStockAdjustment ? `AJUSTE: ${pendingStockAdjustment.amount}` : "AJUSTAR"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
        </div>
    );
};

export default DynamicForm;
