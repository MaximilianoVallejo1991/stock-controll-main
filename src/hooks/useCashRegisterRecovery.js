import { useCallback, useState } from "react";
import { CASH_REGISTER_RECOVERY_CODES } from "../components/Modals/CashRegisterClosedModal";

// Centraliza el check `code && CASH_REGISTER_RECOVERY_CODES.includes(code)` que se
// repetía en cada catch de acción contra caja (open/close/movimiento/pago/venta).
export const useCashRegisterRecovery = () => {
    const [registerClosedError, setRegisterClosedError] = useState(null);

    const isRecoveryCode = useCallback((code) => {
        return Boolean(code && CASH_REGISTER_RECOVERY_CODES.includes(code));
    }, []);

    // Devuelve true si `err` corresponde a un código de recuperación (y ya dejó
    // `registerClosedError` seteado para abrir el CashRegisterClosedModal). Devuelve
    // false si el error es otro y el call site debe manejarlo con su propio flujo.
    const handleRecoveryError = useCallback((err) => {
        const code = err.response?.data?.code;
        if (!isRecoveryCode(code)) return false;
        setRegisterClosedError({ code, message: err.response?.data?.message });
        return true;
    }, [isRecoveryCode]);

    return {
        registerClosedError,
        setRegisterClosedError,
        isRecoveryCode,
        handleRecoveryError
    };
};
