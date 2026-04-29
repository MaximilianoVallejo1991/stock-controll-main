import React, { useEffect, useCallback, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { format } from "date-fns";
import { RiCloseLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";
import axios from "axios";
import useUserStore from "../../store/userStore";

// Roles que tienen permiso para anular ventas (espeja el RBAC del backend)
const CANCEL_ALLOWED_ROLES = ["SISTEMA", "ADMINISTRADOR", "ENCARGADO"];

export const SaleDetail = ({ isOpen, onClose, saleData, onCancelSuccess }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useUserStore();

  // ── Estado del modal de anulación ──────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelPassword, setCancelPassword] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const canCancel =
    saleData?.status !== "CANCELLED" &&
    CANCEL_ALLOWED_ROLES.includes(user?.role);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        if (showCancelModal) {
          setShowCancelModal(false);
        } else {
          onClose();
        }
      }
    },
    [onClose, showCancelModal]
  );

  useEffect(() => {
    if (isOpen && saleData) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, saleData, handleKeyDown]);

  if (!isOpen || !saleData) return null;

  // ── Cálculos de totales ─────────────────────────────────────────
  const discountSummary = saleData.discountSummary;
  const appliedDiscounts = discountSummary?.applied ?? saleData.appliedDiscounts ?? [];
  const productsTotal = (saleData.items || saleData.orderDetails || []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountTotal = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const itemDiscounts = appliedDiscounts.filter((d) => d.productId);
  const orderDiscounts = appliedDiscounts.filter((d) => !d.productId);
  const itemDiscountsTotal = itemDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const subtotalParcial = productsTotal - itemDiscountsTotal;

  const getProductDiscounts = (productId) =>
    itemDiscounts.filter((d) => d.productId === productId);

  const clientName = saleData.client
    ? `${saleData.client.firstName} ${saleData.client.lastName}`
    : "Consumidor Final";

  const finalTotal = saleData.amount;
  const hasAnyDiscount = discountTotal > 0;
  const clienteNombre =
    saleData.client?.firstName ||
    saleData.client?.lastName ||
    saleData.client?.name;
  const mensajeAhorro = clienteNombre
    ? clienteNombre.charAt(0).toUpperCase() + clienteNombre.slice(1)
    : "Usted";

  const isCancelled = saleData.status === "CANCELLED";

  // ── Handlers de anulación ───────────────────────────────────────
  const openCancelModal = () => {
    setCancelPassword("");
    setCancelError(null);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelPassword("");
    setCancelError(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelPassword.trim()) {
      setCancelError("Ingresá tu contraseña para confirmar la anulación.");
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      await axios.patch(`/api/sales/${saleData.id}/cancel`, {
        password: cancelPassword,
      });
      closeCancelModal();
      onClose();
      if (onCancelSuccess) onCancelSuccess();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Error al anular la venta. Intentá de nuevo.";
      setCancelError(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Helpers visuales ────────────────────────────────────────────
  const Separator = () => (
    <div className="border-t border-dashed my-3" style={{ borderColor: theme.bg3 }} />
  );
  const ThickSeparator = () => (
    <div className="border-t-2 border-current my-3 opacity-60" />
  );

  const handlePrint = () => window.print();

  const IconClose = RiCloseLine;

  return (
    <>
      {/* ── Modal principal del detalle de venta ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md p-6 rounded-lg shadow-xl print-container relative"
          style={{ backgroundColor: theme.bgcards, color: theme.text }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex justify-between items-center mb-4 pb-2 border-b"
            style={{ borderColor: theme.bg3 }}
          >
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {isCancelled ? "Venta Anulada" : "Venta Realizada con éxito!"}
              </h1>
              {isCancelled && (
                <span className="text-xs font-bold px-2 py-0.5 rounded border border-red-500 text-red-500">
                  ANULADA
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:opacity-80 transition-opacity no-print"
            >
              <IconClose size={24} color={theme.text} />
            </button>
          </div>

          {/* Fecha y ID */}
          <div className="mb-2 text-sm">
            <p>
              <strong>Fecha:</strong>{" "}
              {format(
                new Date(saleData.createdAt || saleData.orderDate),
                "dd/MM/yyyy HH:mm"
              )}
            </p>
            <p>
              <strong>ID Venta:</strong>{" "}
              <span className="font-mono">{saleData.id}</span>
            </p>
          </div>

          {/* Cliente */}
          <div className="mb-4">
            <p className="text-base font-medium">
              <span className="font-semibold">Cliente: </span>
              {clientName}
            </p>
          </div>

          {/* Productos */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-70">
              Productos
            </h3>
            <Separator />
            {(saleData.items || saleData.orderDetails || []).map(
              (item, index) => {
                const productId = item.productId || item.id;
                return (
                  <React.Fragment key={index}>
                    <div className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.name ||
                            item.product?.name ||
                            "Producto desconocido"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="opacity-70">
                          {item.quantity} x {formatCurrency(item.price)}
                        </span>
                        <span className="font-medium w-20 text-right">
                          +{formatCurrency(item.quantity * item.price)}
                        </span>
                      </div>
                    </div>
                    {getProductDiscounts(productId).map((discount, dIdx) => (
                      <div
                        key={`${index}-${dIdx}`}
                        className="flex justify-between py-1 pl-4 text-green-600 text-xs"
                      >
                        <div className="flex items-center gap-1">
                          {discount.percentage && (
                            <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded font-medium">
                              {discount.percentage}%
                            </span>
                          )}
                          <span>
                            → {discount.name || discount.reason || "Descuento"}
                          </span>
                        </div>
                        <span className="font-medium">
                          -{formatCurrency(discount.amount)}
                        </span>
                      </div>
                    ))}
                  </React.Fragment>
                );
              }
            )}
            <Separator />
          </div>

          {/* Subtotal y descuentos globales */}
          {orderDiscounts.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center py-2">
                <span className="opacity-70 text-sm">Subtotal (sin globales)</span>
                <span className="font-medium">{formatCurrency(subtotalParcial)}</span>
              </div>
              {orderDiscounts.map((discount, idx) => (
                <div key={idx} className="flex justify-between py-1 text-green-600 text-sm">
                  <div className="flex items-center gap-1">
                    {discount.percentage && (
                      <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded font-medium">
                        {discount.percentage}%
                      </span>
                    )}
                    <span>→ {discount.name || discount.reason || "Descuento"}</span>
                  </div>
                  <span className="font-medium">-{formatCurrency(discount.amount)}</span>
                </div>
              ))}
              <Separator />
            </div>
          )}

          {/* Métodos de pago */}
          <div className="mb-4 text-sm">
            <span className="font-medium">Métodos de Pago: </span>
            {saleData.orderPayments && saleData.orderPayments.length > 1 ? (
              saleData.orderPayments.map((p, idx) => (
                <span key={idx}>
                  {idx > 0 ? ", " : ""}
                  {p.paymentMethod || p.method} {formatCurrency(p.amount)}
                </span>
              ))
            ) : (
              <span>
                {saleData.orderPayments?.[0]?.paymentMethod ||
                  saleData.orderPayments?.[0]?.method ||
                  saleData.paymentMethod ||
                  "Efectivo"}{" "}
                {formatCurrency(finalTotal)}
              </span>
            )}
          </div>

          <ThickSeparator />

          {/* Total */}
          <div
            className="flex justify-between text-xl font-bold p-3 rounded mb-2"
            style={{ backgroundColor: theme.bg }}
          >
            <span>Total Venta</span>
            <span style={{ color: isCancelled ? theme.danger : theme.primary }}>
              {isCancelled ? (
                <s className="opacity-50">{formatCurrency(finalTotal)}</s>
              ) : (
                formatCurrency(finalTotal)
              )}
            </span>
          </div>

          {/* Información de Cuenta Corriente (si aplica) */}
          {(() => {
            const ccPayment = (saleData.orderPayments || []).find(p => (p.paymentMethod || p.method) === "Cuenta Corriente");
            if (ccPayment && !isCancelled) {
              return (
                <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
                  <div className="flex justify-between font-bold">
                    <span>A Cuenta Corriente:</span>
                    <span>{formatCurrency(ccPayment.amount)}</span>
                  </div>
                  {saleData.client?.currentAccount && (
                    <div className="flex justify-between text-xs mt-1 opacity-80">
                      <span>Nuevo Saldo Total Cliente:</span>
                      <span>{formatCurrency(saleData.client.currentAccount.balance)}</span>
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Usted ahorró */}
          {hasAnyDiscount && !isCancelled && (
            <div className="text-green-600 font-semibold text-center mb-4">
              <span>
                {mensajeAhorro} AHORRÓ: {formatCurrency(discountTotal)}
              </span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 no-print mt-4">
            {!isCancelled && (
              <button
                onClick={handlePrint}
                className="flex-1 py-2 rounded font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.bg3, color: theme.text }}
              >
                Imprimir
              </button>
            )}

            {canCancel && (
              <button
                id="btn-anular-venta"
                onClick={openCancelModal}
                className="flex-1 py-2 rounded font-semibold transition-opacity hover:opacity-90 text-white"
                style={{ backgroundColor: "#dc2626" }}
              >
                Anular Venta
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 py-2 rounded font-semibold transition-opacity hover:opacity-90 text-white"
              style={{ backgroundColor: theme.primary }}
            >
              Cerrar
            </button>
          </div>
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container {
              position: absolute; left: 0; top: 0;
              width: 100%; height: 100%;
              margin: 0; padding: 20px;
              box-shadow: none;
              background: white !important;
              color: black !important;
            }
            .no-print { display: none !important; }
          }
        `}</style>
      </div>

      {/* ── Modal de confirmación con contraseña ── */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeCancelModal}
        >
          <div
            className="w-full max-w-sm p-6 rounded-xl shadow-2xl"
            style={{ backgroundColor: theme.bgcards, color: theme.text }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal de anulación */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#fee2e2" }}
              >
                <span className="text-red-600 text-xl font-bold">!</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">Confirmar Anulación</h2>
                <p className="text-sm opacity-60">
                  ID: {saleData.id?.slice(-6).toUpperCase()}
                </p>
              </div>
            </div>

            <p className="text-sm mb-1 opacity-80">
              Esta acción anulará la venta y{" "}
              <strong>devolverá el stock automáticamente</strong>. No se puede
              deshacer.
            </p>
            <p className="text-sm mb-4 opacity-80">
              Ingresá tu contraseña para confirmar:
            </p>

            {/* Campo contraseña */}
            <input
              id="input-cancel-password"
              type="password"
              autoFocus
              value={cancelPassword}
              onChange={(e) => {
                setCancelPassword(e.target.value);
                setCancelError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmCancel()}
              placeholder="Tu contraseña"
              className="w-full p-3 rounded-lg outline-none mb-3 border text-sm"
              style={{
                backgroundColor: theme.bg,
                color: theme.text,
                borderColor: cancelError ? "#dc2626" : theme.bg3,
              }}
            />

            {/* Mensaje de error */}
            {cancelError && (
              <p
                className="text-xs mb-3 px-2 py-1.5 rounded"
                style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
              >
                {cancelError}
              </p>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={closeCancelModal}
                disabled={cancelLoading}
                className="flex-1 py-2 rounded-lg font-semibold text-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: theme.bg3, color: theme.text }}
              >
                Cancelar
              </button>
              <button
                id="btn-confirmar-anulacion"
                onClick={handleConfirmCancel}
                disabled={cancelLoading || !cancelPassword.trim()}
                className="flex-1 py-2 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#dc2626" }}
              >
                {cancelLoading ? "Anulando..." : "Anular Venta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SaleDetail;