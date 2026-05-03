import React from "react";
import { CreditCard } from "lucide-react";
import ThemedButton from "../../../components/ThemedButton";

const EntityActionButtons = ({
    entity,
    data,
    isEditing,
    canEditCurrentEntity,
    handleOpenCurrentAccount,
    navigate,
    toggleEdit,
    handleCancel
}) => {
    return (
        <div className="flex gap-2">
            {/* Acciones de Cuenta Corriente para Clientes */}
            {entity === "clients" && (!data.currentAccount || data.currentAccount.status === "CLOSED") && canEditCurrentEntity && (
                <ThemedButton
                    onClick={handleOpenCurrentAccount}
                    className="flex items-center gap-2"
                >
                    <CreditCard size={18} />
                    {data.currentAccount ? "Reabrir Cuenta Corriente" : "Abrir Cuenta Corriente"}
                </ThemedButton>
            )}

            {entity === "clients" && data.currentAccount && data.currentAccount.status === "OPEN" && (
                <ThemedButton
                    variant="secondary"
                    onClick={() => navigate(`/accounts/details/${data.currentAccount.id}`)}
                    className="flex items-center gap-2"
                >
                    <CreditCard size={18} />
                    Cuenta Corriente
                </ThemedButton>
            )}

            {/* Botón Principal Editar/Cancelar */}
            {canEditCurrentEntity && (
                <ThemedButton
                    onClick={isEditing ? handleCancel : toggleEdit}
                    variant={isEditing ? "secondary" : "primary"}
                >
                    {isEditing ? "Cancelar" : "Editar"}
                </ThemedButton>
            )}
        </div>
    );
};

export default EntityActionButtons;
