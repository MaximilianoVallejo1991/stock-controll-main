import React, { useEffect, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { format } from "date-fns";
import { RiCloseLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";

export const SaleDetail = ({ isOpen, onClose, saleData }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

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

  // Extraer descuentos aplicados
  const discountSummary = saleData.discountSummary;
  const appliedDiscounts = discountSummary?.applied ?? saleData.appliedDiscounts ?? [];

  // Calcular valores
  const productsTotal = (saleData.items || saleData.orderDetails || []).reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  );
  const discountTotal = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);
  
  // Separar por tipo
  const itemDiscounts = appliedDiscounts.filter(d => d.productId);
  const orderDiscounts = appliedDiscounts.filter(d => !d.productId);

  // Calcular subtotal después de descuentos por producto, antes de globales
  const itemDiscountsTotal = itemDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const subtotalParcial = productsTotal - itemDiscountsTotal;

  // Helper para obtener descuentos de un producto
  const getProductDiscounts = (productId) => {
    return itemDiscounts.filter(d => d.productId === productId);
  };

  // Nombre del cliente
  const clientName = saleData.client 
    ? `${saleData.client.firstName} ${saleData.client.lastName}` 
    : "Consumidor Final";

  // Total a pagar
  const finalTotal = saleData.amount;

  // Total ahorrado (solo si hay descuentos)
  const hasAnyDiscount = discountTotal > 0;

  // Mensaje personalizado para "usted ahorró"
  const clienteNombre = saleData.client?.firstName || saleData.client?.lastName || saleData.client?.name;
  const mensajeAhorro = clienteNombre
    ? clienteNombre.charAt(0).toUpperCase() + clienteNombre.slice(1)
    : "Usted";

  // Línea separadora
  const Separator = () => (
    <div className="border-t border-dashed my-3" style={{ borderColor: theme.bg3 }}></div>
  );

  // Línea separadora gruesa
  const ThickSeparator = () => (
    <div className="border-t-2 border-current my-3 opacity-60"></div>
  );

  const handlePrint = () => {
    window.print();
  };

  const IconClose = RiCloseLine;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md p-6 rounded-lg shadow-xl print-container"
        style={{ backgroundColor: theme.bgcards, color: theme.text }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: theme.bg3 }}>
          <h1 className="text-xl font-bold">Venta Realizada con exito!</h1>

          <button onClick={onClose} className="p-1 hover:opacity-80 transition-opacity no-print">
            <IconClose size={24} color={theme.text} />
          </button>
        </div>

        {/* Fecha y ID */}
        <div className="mb-2 text-sm">
          <p><strong>Fecha:</strong> {format(new Date(saleData.createdAt || saleData.orderDate), 'dd/MM/yyyy HH:mm')}</p>
          <p><strong>ID Venta:</strong> <span className="font-mono">{saleData.id}</span></p>
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
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-70">Productos</h3>
          <Separator />
          
          {(saleData.items || saleData.orderDetails || []).map((item, index) => {
            const productId = item.productId || item.id;
            return (
              <React.Fragment key={index}>
                {/* Fila principal del producto */}
                <div className="flex justify-between items-center py-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name || item.product?.name || "Producto desconocido"}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="opacity-70">{item.quantity} x {formatCurrency(item.price)}</span>
                    <span className="font-medium w-20 text-right">+{formatCurrency(item.quantity * item.price)}</span>
                  </div>
                </div>
                
                {/* Descuentos del producto */}
                {getProductDiscounts(productId).map((discount, dIdx) => (
                  <div key={`${index}-${dIdx}`} className="flex justify-between py-1 pl-4 text-green-600 text-xs">
                    <div className="flex items-center gap-1">
                      {discount.percentage && (
                        <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded font-medium">
                          {discount.percentage}%
                        </span>
                      )}
                      <span>→ {discount.name || discount.reason || 'Descuento'}</span>
                    </div>
                    <span className="font-medium">-{formatCurrency(discount.amount)}</span>
                  </div>
                ))}
              </React.Fragment>
            );
          })}
          
          <Separator />
        </div>

        {/* Subtotal y descuentos globales (solo si hay globales) */}
        {orderDiscounts.length > 0 && (
          <div className="mb-4">
            {/* Subtotal sin globales */}
            <div className="flex justify-between items-center py-2">
              <span className="opacity-70 text-sm">Subtotal (sin globales)</span>
              <span className="font-medium">{formatCurrency(subtotalParcial)}</span>
            </div>
            
            {/* Descuentos globales */}
            {orderDiscounts.map((discount, idx) => (
              <div key={idx} className="flex justify-between py-1 text-green-600 text-sm">
                <div className="flex items-center gap-1">
                  {discount.percentage && (
                    <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded font-medium">
                      {discount.percentage}%
                    </span>
                  )}
                  <span>→ {discount.name || discount.reason || 'Descuento'}</span>
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
                {idx > 0 ? ", " : ""}{p.paymentMethod || p.method} {formatCurrency(p.amount)}
              </span>
            ))
          ) : (
            <span>
              {saleData.orderPayments?.[0]?.paymentMethod || saleData.orderPayments?.[0]?.method || saleData.paymentMethod || "Efectivo"} {formatCurrency(finalTotal)}
            </span>
          )}
        </div>

        <ThickSeparator />

        {/* Total a pagar */}
        <div className="flex justify-between text-xl font-bold p-3 rounded mb-4" style={{ backgroundColor: theme.bg }}>
          <span>Total a Pagar</span>
          <span style={{ color: theme.primary }}>{formatCurrency(finalTotal)}</span>
        </div>

        {/* USTED AHORRÓ - solo si hay descuentos, DESPUÉS del Total a Pagar */}
        {hasAnyDiscount && (
          <div className="text-green-600 font-semibold text-center mb-4">
            <span>{mensajeAhorro} AHORRÓ: {formatCurrency(discountTotal)}</span>
          </div>
        )}

        <div className="flex gap-4 no-print mt-4">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.bg3, color: theme.text }}
          >
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded font-semibold transition-opacity hover:opacity-90 text-white"
            style={{ backgroundColor: theme.primary }}
          >
            Cerrar
          </button>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SaleDetail;