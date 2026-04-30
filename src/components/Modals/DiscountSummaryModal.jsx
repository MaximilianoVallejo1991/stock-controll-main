// DiscountSummaryModal.jsx
// Modal que muestra el desglose de productos, descuentos aplicados y total a pagar

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../utils/currency";
import { FaTimes, FaShoppingCart, FaChevronDown, FaChevronUp, FaFileInvoiceDollar } from "react-icons/fa";

const DiscountSummaryModal = ({
  isOpen,
  onClose,
  onConfirm,
  cart,
  client,
  preview,
  isLoading,
  paymentBreakdown,
  total,
  preferredRuleIds = [],
  excludedRuleIds = [],
  onToggleRule,
  onClearAll,
  onReset
}) => {
  const { theme } = useTheme();
  const [showConfig, setShowConfig] = useState(false);
  const scrollContainerRef = useRef(null);

  // Efecto para bajar al final del scroll automáticamente cuando cambia el contenido
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
        // Usamos setTimeOut mínimo para esperar a que el DOM se actualice con el nuevo alto
        setTimeout(() => {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }
  }, [preview, isOpen]);

  // No renderizar si no está abierto
  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm();
  };

  // Calcular valores
  const productsTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const appliedDiscounts = preview?.appliedDiscounts ?? [];
  const discountTotal = preview?.discountTotal ?? appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);

  // Separar descuentos por producto (ITEM) de globales (ORDER)
  const itemDiscounts = appliedDiscounts.filter(d => d.productId);
  const orderDiscounts = appliedDiscounts.filter(d => !d.productId);

  // Calcular subtotal después de descuentos por producto, antes de globales
  const itemDiscountsTotal = itemDiscounts.reduce((sum, d) => sum + d.amount, 0);
  const subtotalParcial = productsTotal - itemDiscountsTotal;

  // Helper para obtener descuentos de un producto
  const getProductDiscounts = (productId) => {
    return itemDiscounts.filter(d => d.productId === productId && d.amount > 0);
  };

  // Nombre del cliente
  const clientName = client
    ? `${client.firstName} ${client.lastName} ${client.dni ? `(DNI: ${client.dni})` : ''}`
    : "Consumidor Final";

  // Total a pagar
  const finalTotal = preview?.finalTotal ?? (productsTotal - discountTotal);

  // Calcular total ahorrado (solo si hay descuentos)
  const totalSavings = discountTotal;
  const hasAnyDiscount = totalSavings > 0;

  // Mensaje personalizado para "usted ahorró"
  const clienteNombre = client?.firstName || client?.lastName || client?.name;
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

  const hasCCPayment = paymentBreakdown.some(p => p.method === "Cuenta Corriente");
  const ccAmount = paymentBreakdown.find(p => p.method === "Cuenta Corriente")?.amount || 0;
  const isPureCC = paymentBreakdown.length === 1 && hasCCPayment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-lg shadow-xl flex flex-col"
        style={{ backgroundColor: theme.bgcards, color: theme.text }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b relative overflow-hidden" style={{ borderColor: theme.bg3 }}>
          {hasCCPayment && (
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse"></div>
          )}
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaShoppingCart />
            {hasCCPayment ? (
              <span className="flex flex-col">
                <span>Resumen de Operación</span>
                <span className="text-[10px] uppercase tracking-tighter text-orange-500 font-black">
                  {isPureCC ? "Generación de Deuda Total" : `Generación de Deuda Parcial (${formatCurrency(ccAmount)})`}
                </span>
              </span>
            ) : "Resumen de Venta"}
          </h2>
          <button onClick={onClose} className="p-1 hover:opacity-70 transition-opacity">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 custom-scrollbar relative"
        >
          {/* Alerta discreta de CC */}
          {hasCCPayment && (
            <div className="mb-4 p-2.5 rounded-lg border border-dashed flex items-center gap-3 bg-orange-500/5 text-orange-600 border-orange-500/30">
              <div className="p-2 rounded-full bg-orange-500/10">
                <FaFileInvoiceDollar size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-tight">Atención Vendedor</span>
                <p className="text-[11px] opacity-80 leading-tight">
                  Esta operación impactará en el <b>Saldo Deudor</b> del cliente. 
                  {ccAmount > 0 && ` Monto a financiar: ${formatCurrency(ccAmount)}`}
                </p>
              </div>
            </div>
          )}

          {/* Overlay de carga (No intrusivo para preservar el scroll) */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex justify-center items-start pt-20 bg-white/20 backdrop-blur-[1px]">
              <div className="bg-white/80 p-3 rounded-full shadow-lg border animate-pulse">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: theme.primary }}></div>
              </div>
            </div>
          )}

          {/* Info del cliente */}
          <div className="mb-4">
            <p className="text-base font-medium">
              <span className="font-semibold">Cliente: </span>
              {clientName}
            </p>
          </div>
          {/* ... resto del contenido igual ... */}

              {/* Productos */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-70">Productos</h3>
                <Separator />

                {cart.map((item, idx) => (
                  <div key={idx}>
                    {/* Fila principal del producto */}
                    <div className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="opacity-70">{item.quantity} x {formatCurrency(item.price)}</span>
                        <span className="font-medium w-20 text-right">+{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    </div>

                    {/* Descuentos del producto (indentados) */}
                    {getProductDiscounts(item.id).map((discount, dIdx) => (
                      <div key={`${idx}-${dIdx}`} className="flex justify-between py-1 pl-4 text-green-600 text-xs">
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
                  </div>
                ))}

                <Separator />
              </div>

              {/* Subtotal parcial y descuentos globales (solo si hay globales) */}
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
              <div className="mb-4">
                <p className="text-sm">
                  <span className="font-medium">Métodos de Pago: </span>
                  {paymentBreakdown.map((p, idx) => (
                    <span key={idx}>
                      {idx > 0 ? ", " : ""}{p.method}
                    </span>
                  ))}
                </p>
              </div>

              <ThickSeparator />

              {/* Total a pagar */}
              <div className="flex justify-between text-xl font-bold mb-2">
                <span>Total a Pagar</span>
                <span style={{ color: theme.primary }}>{formatCurrency(finalTotal)}</span>
              </div>

              {/* Sección de Configuración de Descuentos (Permanente si hay reglas) */}
              {(preview?.appliedDiscounts?.length > 0 || preview?.interchangeableDiscounts?.length > 0) && (
                <div 
                  className="mb-4 p-3 rounded text-xs border"
                  style={{ 
                    backgroundColor: theme.bg3, 
                    color: theme.text,
                    borderColor: theme.primary + '40'
                  }}
                >
                  {/* Trigger para colapsar/expandir */}
                  <div 
                    className="flex justify-between items-center cursor-pointer select-none"
                    onClick={() => setShowConfig(!showConfig)}
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-lg">⚙️</span>
                       <div>
                          <p className="font-bold">Configuración de Descuentos</p>
                          {preview?.capApplied && (
                            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-tight">
                              Hay descuentos intercambiables disponibles
                            </p>
                          )}
                       </div>
                    </div>
                    {showConfig ? <FaChevronUp className="opacity-50" /> : <FaChevronDown className="opacity-50" />}
                  </div>

                  {showConfig && (
                    <div className="mt-4 pt-3 border-t border-dashed" style={{ borderColor: theme.primary + '20' }}>
                      {/* Controles Rápidos */}
                      <div className="flex justify-between items-center mb-3">
                        <p className="opacity-60 font-medium">Tope Máximo: {preview.maxDiscountPct}%</p>
                        <div className="flex gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); onReset(); }}
                             className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors font-bold uppercase"
                           >
                             Reiniciar
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                             className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors font-bold uppercase"
                           >
                             Quitar todos
                           </button>
                        </div>
                      </div>
                      
                      <p className="opacity-70 mb-3 text-[11px] italic">
                        Seleccioná qué reglas priorizar. El cupo se gestiona automáticamente.
                      </p>
                      
                      {/* Lista de Descuentos */}
                      <div className="space-y-2">
                    {(() => {
                      const allRulesMap = new Map();
                      
                      // 1. Unificar reglas del preview
                      (preview.appliedDiscounts || []).forEach(r => {
                         allRulesMap.set(r.ruleId, { ...r, isApplied: true });
                      });
                      (preview.interchangeableDiscounts || []).forEach(r => {
                         if (!allRulesMap.has(r.ruleId)) {
                           allRulesMap.set(r.ruleId, { ...r, isApplied: false });
                         }
                      });
                      
                      // 2. Orden Estable: Prioridad (DESC) y Capa (ITEM > ORDER)
                      const unifiedRules = Array.from(allRulesMap.values())
                        .sort((a, b) => {
                          // Prioridad 1: Capa (ITEM primero)
                          const layerA = a.productId || a.type === 'ITEM' ? 0 : 1;
                          const layerB = b.productId || b.type === 'ITEM' ? 0 : 1;
                          if (layerA !== layerB) return layerA - layerB; 
                          
                          // Prioridad 2: Valor de Prioridad (DESC)
                          const prioA = a.priority || 0;
                          const prioB = b.priority || 0;
                          if (prioA !== prioB) return prioB - prioA;

                          // Prioridad 3 (Tie-breaker): Nombre (Alfabético)
                          return a.name.localeCompare(b.name);
                        });

                      // 3. Lógica de Gestión de Cupo (Slot Management)
                      // Calculamos cuánto espacio ocupan los que el usuario TIENE MARCADOS (Preferred)
                      const spaceUsedByPreferred = unifiedRules
                        .filter(r => preferredRuleIds.includes(r.ruleId))
                        .reduce((sum, r) => sum + (r.nominalImpact || 0), 0);
                      
                      const remainingSpace = preview.maxDiscountAmount - spaceUsedByPreferred;

                      return unifiedRules.map((rule, idx) => {
                        const isMarked = preferredRuleIds.includes(rule.ruleId);
                        const isApplied = preview.appliedDiscounts?.some(d => d.ruleId === rule.ruleId);
                        
                        // Una regla está "Bloqueada" si: 
                        // No está marcada Y su impacto nominal supera el espacio que queda libre.
                        const cannotFit = (rule.nominalImpact || 0) > (remainingSpace + 0.01); // Margen de error decimal
                        const isBlocked = !isMarked && cannotFit;

                        return (
                          <button
                            key={rule.ruleId || idx}
                            disabled={isBlocked || isLoading}
                            onClick={() => onToggleRule(rule.ruleId)}
                            className="w-full flex justify-between items-center p-3 rounded border transition-all text-left"
                            style={{ 
                              backgroundColor: isMarked ? theme.primary + '15' : theme.bg,
                              borderColor: isMarked ? theme.primary : (isBlocked ? theme.text + '20' : theme.bg3),
                              opacity: isBlocked ? 0.5 : 1,
                              cursor: isBlocked ? 'not-allowed' : 'pointer',
                              borderStyle: isMarked ? 'solid' : 'dashed'
                            }}
                          >
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs uppercase" style={{ color: isMarked ? theme.primary : theme.text }}>
                                  {rule.name}
                                </p>
                                {isApplied && (
                                   <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500 text-white font-black uppercase tracking-tighter">
                                     Aplicado
                                   </span>
                                )}
                              </div>
                              <p className="text-[10px] opacity-50 font-medium">
                                {rule.productId ? '📦 Descuento Producto' : '🌍 Descuento Global'}
                                {isBlocked && ' • ❌ Sin cupo suficiente'}
                                {!isMarked && !isBlocked && ' • 🔓 Disponible'}
                              </p>
                            </div>
                            
                            <div className="text-right flex items-center gap-3">
                              <div className="flex flex-col items-end">
                                <span className="font-black text-sm" style={{ color: isMarked ? theme.primary : theme.text + '60' }}>
                                  {rule.percentage}%
                                </span>
                                <span className="text-[9px] opacity-40">
                                  Impacto: {formatCurrency(rule.nominalImpact)}
                                </span>
                              </div>
                              
                              <div 
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors`}
                                style={{ 
                                  borderColor: isMarked ? theme.primary : theme.text + '20',
                                  backgroundColor: isMarked ? theme.primary : 'transparent'
                                }}
                              >
                                {isMarked && <span className="text-white text-xs">✓</span>}
                              </div>
                            </div>
                          </button>
                        );
                      });
                    })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* USTED AHORRÓ - solo si hay descuentos, DESPUÉS del Total a Pagar */}
              {hasAnyDiscount && (
                <div className="text-green-600 font-semibold text-center mt-2">
                  <span>{mensajeAhorro} AHORRARÁ: {formatCurrency(totalSavings)}</span>
                </div>
              )}
        </div>

        {/* Botones de acción */}
        <div className="p-4 border-t flex gap-3" style={{ borderColor: theme.bg3 }}>
          <button
            onClick={onClose}
            className="flex-1 p-3 rounded font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: theme.bg, color: theme.text }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmClick}
            className="flex-1 p-3 rounded font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-md flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: hasCCPayment ? "#ea580c" : theme.primary, 
              color: "white" 
            }}
            disabled={isLoading}
          >
            {hasCCPayment && <FaFileInvoiceDollar size={18} />}
            {hasCCPayment ? (isPureCC ? "Cargar en Cuenta Corriente" : "Confirmar Venta Combinada") : "Realizar Venta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountSummaryModal;
