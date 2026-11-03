import ConfirmModal from "./ConfirmModal";

/**
 * The three 409 codes `cajaServices` / `salesServices` / `movimientosServices` /
 * `currentAccountServices` can raise when a cash-binding operation races a register
 * open/close (see design.md Decision 6/7). Exported so callers can gate on a single
 * source of truth instead of re-typing the list to decide whether to render this modal
 * or fall back to the generic `alert()`.
 */
export const CASH_REGISTER_RECOVERY_CODES = [
  "CASH_REGISTER_CLOSED",
  "CASH_REGISTER_ALREADY_CLOSED",
  "CASH_REGISTER_ALREADY_OPEN",
];

// Per-code recovery action. `CASH_REGISTER_CLOSED` is the shared code for the three
// stale-binding 409s (sale / movement / CC payment) — the backend already sends the
// action-specific copy ("...confirmabas la venta/el movimiento/el pago...") as `message`,
// so `fallbackMessage` here is only a safety net if `message` is ever missing.
const RECOVERY_BY_CODE = {
  CASH_REGISTER_CLOSED: {
    confirmText: "Abrir caja",
    fallbackMessage:
      "La caja se cerró mientras confirmabas la operación. Abrí la caja de nuevo para continuar.",
  },
  CASH_REGISTER_ALREADY_CLOSED: {
    confirmText: "Actualizar",
    fallbackMessage:
      "La caja ya fue cerrada desde otra terminal. Actualizá la pantalla para ver el cierre vigente.",
  },
  CASH_REGISTER_ALREADY_OPEN: {
    confirmText: "Actualizar",
    fallbackMessage:
      "Otra terminal abrió la caja de esta tienda hace un instante. Actualizá la pantalla para operar sobre la caja vigente.",
  },
};

/**
 * Shared 409 recovery modal for cash-register stale-binding / lost-race errors.
 * Wraps the existing `ConfirmModal`; derives the single recovery action (button label +
 * what `onAction` is expected to do) from `code`.
 *
 * The caller owns `onAction` (navigate to the register tab for `CASH_REGISTER_CLOSED`,
 * or refetch/refresh for the two `ALREADY_*` codes — see design.md Decision 7) and is
 * responsible for only opening this modal when `code` is one of
 * `CASH_REGISTER_RECOVERY_CODES`. Any other/missing code is NOT this component's
 * concern — the caller keeps its existing generic `alert()` fallback for that case.
 */
const CashRegisterClosedModal = ({ isOpen, onClose, code, message, onAction }) => {
  const recovery = RECOVERY_BY_CODE[code];
  if (!recovery) return null;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onAction}
      message={message || recovery.fallbackMessage}
      confirmText={recovery.confirmText}
    />
  );
};

export default CashRegisterClosedModal;
