// DiscountSummaryModal.jsx — Estación de Cierre de Venta
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../utils/currency";
import {
  FaTimes, FaShoppingCart, FaChevronDown, FaChevronUp,
  FaFileInvoiceDollar, FaPlus, FaMagic, FaCheck
} from "react-icons/fa";
import { RiCloseLine } from "react-icons/ri";

const PAYMENT_METHODS = [
  { value: "Efectivo",         label: "💵 Efectivo",         short: "EFE" },
  { value: "Tarjeta",          label: "💳 Tarjeta",          short: "TAR" },
  { value: "Transferencia",    label: "🏦 Transferencia",    short: "TRA" },
  { value: "Cuenta Corriente", label: "📒 Cuenta Corriente", short: "C.C." },
];

const DiscountSummaryModal = ({
  isOpen,
  onClose,
  onConfirm,           // (finalBreakdown) => void
  cart,
  client,
  preview,
  isLoading,
  total,               // subtotal bruto sin descuentos
  preferredRuleIds = [],
  excludedRuleIds = [],
  onToggleRule,
  onClearAll,
  onReset,
  onPaymentChange,     // (breakdown) => void  — dispara recálculo en NewSale
  isProcessing = false,
}) => {
  const { theme } = useTheme();
  const scrollRef = useRef(null);

  // ── Estado local de pagos ──────────────────────────────────────────────────
  const [isSplit, setIsSplit] = useState(false);
  const [singleMethod, setSingleMethod] = useState("Efectivo");
  const [splitBreakdown, setSplitBreakdown] = useState([]);
  const [newMethod, setNewMethod] = useState("Efectivo");
  const [newAmount, setNewAmount] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  // ── Valores derivados del preview ─────────────────────────────────────────
  const productsTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const appliedDiscounts = preview?.appliedDiscounts ?? [];
  const discountTotal   = preview?.discountTotal ?? 0;
  const finalTotal      = preview?.finalTotal ?? (productsTotal - discountTotal);
  const itemDiscounts   = appliedDiscounts.filter(d => d.productId);
  const orderDiscounts  = appliedDiscounts.filter(d => !d.productId);
  const itemDiscountsTotal = itemDiscounts.reduce((s, d) => s + d.amount, 0);
  const subtotalParcial    = productsTotal - itemDiscountsTotal;
  const hasAnyDiscount     = discountTotal > 0;
  const getProductDiscounts = (pid) => itemDiscounts.filter(d => d.productId === pid && d.amount > 0);

  // ── Breakdown activo ───────────────────────────────────────────────────────
  // IMPORTANTE: para método único usamos productsTotal (pre-descuento) como amount.
  // Esto evita la referencia circular donde el preview recalcula el descuento
  // sobre el total ya descontado. El monto real (finalTotal) se envía solo
  // al confirmar la venta, no al endpoint de preview.
  const activeBreakdown = isSplit
    ? splitBreakdown
    : [{ method: singleMethod, amount: productsTotal }];

  const totalPaid  = activeBreakdown.reduce((s, p) => s + p.amount, 0);
  const remaining  = Math.max(0, finalTotal - totalPaid);
  const isCovered  = !isSplit || (splitBreakdown.length > 0 && Math.abs(totalPaid - finalTotal) < 0.01);

  // ── Cuenta Corriente ───────────────────────────────────────────────────────
  const hasCCPayment = activeBreakdown.some(p => p.method === "Cuenta Corriente");
  const ccAmount     = activeBreakdown.find(p => p.method === "Cuenta Corriente")?.amount || 0;
  const isPureCC     = activeBreakdown.length === 1 && hasCCPayment;

  // ── Reset al abrir ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setIsSplit(false);
      setSingleMethod("Efectivo");
      setSplitBreakdown([]);
      setNewMethod("Efectivo");
      setNewAmount("");
      setShowConfig(false);
    }
  }, [isOpen]);

  // ── Notificar cambio de pagos al padre (con debounce 300ms) ───────────────
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onPaymentChange?.(activeBreakdown);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [singleMethod, splitBreakdown, isSplit, isOpen]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [preview, isOpen]);

  if (!isOpen) return null;

  // ── Handlers de pagos ──────────────────────────────────────────────────────
  const handleToggleSplit = (val) => {
    setIsSplit(val);
    if (!val) setSplitBreakdown([]);
  };

  const handleSingleMethodChange = (method) => {
    if (method === "Cuenta Corriente") {
      if (!client) { alert("Debe seleccionar un cliente para Cuenta Corriente."); return; }
      if (!client.currentAccount || client.currentAccount.status !== "OPEN") {
        alert("El cliente no tiene una cuenta corriente abierta."); return;
      }
    }
    setSingleMethod(method);
  };

  const handleAddPayment = () => {
    const amt = parseFloat(newAmount);
    if (!amt || amt <= 0) return;
    if (newMethod === "Cuenta Corriente") {
      if (!client) { alert("Debe seleccionar un cliente para Cuenta Corriente."); return; }
      if (!client.currentAccount || client.currentAccount.status !== "OPEN") {
        alert("El cliente no tiene una cuenta corriente abierta."); return;
      }
    }
    const capped = Math.min(amt, remaining > 0 ? remaining : amt);
    setSplitBreakdown(prev => [...prev, { method: newMethod, amount: capped }]);
    setNewAmount("");
  };

  const handleUpdatePayment = (idx, method, amount) => {
    setSplitBreakdown(prev => prev.map((p, i) => i === idx ? { method, amount } : p));
  };

  const handleRemovePayment = (idx) => {
    setSplitBreakdown(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = () => {
    if (!isCovered) return;
    // Para método único, enviamos finalTotal (precio post-descuento real) como amount,
    // NO productsTotal, para que el OrderPayment quede correcto en la DB.
    const confirmBreakdown = isSplit
      ? activeBreakdown
      : [{ method: singleMethod, amount: finalTotal }];
    onConfirm(confirmBreakdown);
  };

  // ── UI Helpers ─────────────────────────────────────────────────────────────
  const Separator     = () => <div className="border-t border-dashed my-3" style={{ borderColor: theme.bg3 }} />;
  const ThickSeparator = () => <div className="border-t-2 border-current my-3 opacity-60" />;

  const clientName = client
    ? `${client.firstName} ${client.lastName}${client.dni ? ` (DNI: ${client.dni})` : ""}`
    : "Consumidor Final";
  const mensajeAhorro = client?.firstName
    ? client.firstName.charAt(0).toUpperCase() + client.firstName.slice(1)
    : "Usted";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
        style={{ backgroundColor: theme.bgcards, color: theme.text }}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center p-4 border-b relative overflow-hidden" style={{ borderColor: theme.bg3 }}>
          {hasCCPayment && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse" />}
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaShoppingCart />
            {hasCCPayment ? (
              <span className="flex flex-col">
                <span>Resumen de Operación</span>
                <span className="text-[10px] uppercase tracking-tighter text-orange-500 font-black">
                  {isPureCC ? "Generación de Deuda Total" : `Deuda Parcial (${formatCurrency(ccAmount)})`}
                </span>
              </span>
            ) : "Estación de Cierre"}
          </h2>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* ── Contenido ────────────────────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">

          {/* Alerta CC */}
          {hasCCPayment && (
            <div className="mb-4 p-2.5 rounded-lg border border-dashed flex items-center gap-3 bg-orange-500/5 text-orange-600 border-orange-500/30">
              <div className="p-2 rounded-full bg-orange-500/10"><FaFileInvoiceDollar size={16} /></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-tight">Atención Vendedor</span>
                <p className="text-[11px] opacity-80 leading-tight">
                  Esta operación impactará en el <b>Saldo Deudor</b> del cliente.
                  {ccAmount > 0 && ` Monto a financiar: ${formatCurrency(ccAmount)}`}
                </p>
              </div>
            </div>
          )}

          {/* Overlay de carga */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex justify-center items-start pt-20 bg-white/20 backdrop-blur-[1px]">
              <div className="bg-white/80 p-3 rounded-full shadow-lg border animate-pulse">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: theme.primary }} />
              </div>
            </div>
          )}

          {/* Cliente */}
          <div className="mb-4">
            <p className="text-base font-medium">
              <span className="font-semibold">Cliente: </span>{clientName}
            </p>
          </div>

          {/* Productos */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide opacity-70">Productos</h3>
            <Separator />
            {cart.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center py-2">
                  <div className="flex-1"><p className="font-medium text-sm">{item.name}</p></div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="opacity-70">{item.quantity} x {formatCurrency(item.price)}</span>
                    <span className="font-medium w-20 text-right">+{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
                {getProductDiscounts(item.id).map((d, dIdx) => (
                  <div key={dIdx} className="flex justify-between py-1 pl-4 text-green-600 text-xs">
                    <div className="flex items-center gap-1">
                      {d.percentage && <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded font-medium">{d.percentage}%</span>}
                      <span>→ {d.name || d.reason || "Descuento"}</span>
                    </div>
                    <span className="font-medium">-{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
            <Separator />
          </div>

          {/* Descuentos globales */}
          {orderDiscounts.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center py-2">
                <span className="opacity-70 text-sm">Subtotal (sin globales)</span>
                <span className="font-medium">{formatCurrency(subtotalParcial)}</span>
              </div>
              {orderDiscounts.map((d, idx) => (
                <div key={idx} className="flex justify-between py-1 text-green-600 text-sm">
                  <div className="flex items-center gap-1">
                    {d.percentage && <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded font-medium">{d.percentage}%</span>}
                    <span>→ {d.name || d.reason || "Descuento"}</span>
                  </div>
                  <span className="font-medium">-{formatCurrency(d.amount)}</span>
                </div>
              ))}
              <Separator />
            </div>
          )}

          <ThickSeparator />

          {/* Total */}
          <div className="flex justify-between text-2xl font-black mb-4">
            <span>Total a Pagar</span>
            <span style={{ color: theme.primary }}>{formatCurrency(finalTotal)}</span>
          </div>

          {/* ── EDITOR DE PAGOS ──────────────────────────────────────────── */}
          <div className="rounded-xl border p-4 mb-4 space-y-3" style={{ backgroundColor: theme.bg, borderColor: theme.border }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black uppercase tracking-widest opacity-60">Método de Pago</p>
              <label className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer select-none bg-blue-500/10 px-2 py-1 rounded-lg text-blue-600 transition-all active:scale-95">
                <input
                  type="checkbox"
                  checked={isSplit}
                  onChange={e => handleToggleSplit(e.target.checked)}
                  className="accent-blue-500 cursor-pointer"
                />
                <span className="uppercase">Pago Combinado</span>
              </label>
            </div>

            {/* Modo Simple */}
            {!isSplit ? (
              <div className="flex flex-col gap-1">
                <select
                  value={singleMethod}
                  onChange={e => handleSingleMethodChange(e.target.value)}
                  className="w-full p-3 rounded-xl outline-none border-2 font-bold transition-all shadow-sm focus:border-blue-500"
                  style={{
                    backgroundColor: theme.bgcards,
                    color: theme.text,
                    borderColor: singleMethod === "Cuenta Corriente" ? "#f97316" : theme.border
                  }}
                >
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {singleMethod === "Cuenta Corriente" && (
                  <span className="text-[10px] text-orange-500 font-black uppercase flex items-center gap-1 px-1 animate-pulse">
                    ⚠️ Generando deuda al cliente
                  </span>
                )}
              </div>
            ) : (
              /* Modo Combinado */
              <div className="flex flex-col gap-2">
                {/* Lista de pagos */}
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                  {splitBreakdown.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold shadow-sm"
                      style={{ backgroundColor: theme.bgcards, border: `1px solid ${theme.border}` }}
                    >
                      <span className="opacity-80">{p.method}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={p.amount}
                          step="0.01"
                          className="w-24 rounded px-2 py-0.5 font-mono text-right outline-none focus:ring-1 ring-blue-500"
                          style={{ backgroundColor: theme.bg, color: theme.text }}
                          onChange={e => handleUpdatePayment(i, p.method, parseFloat(e.target.value) || 0)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(i)}
                          className="p-1 rounded-full hover:bg-red-500/10 transition-colors"
                          style={{ color: theme.danger }}
                        >
                          <RiCloseLine size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Badge de saldo restante */}
                <div
                  className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase text-center transition-all ${!isCovered ? "cursor-pointer hover:opacity-80 active:scale-95 border-2 border-dashed" : ""}`}
                  onClick={() => !isCovered && setNewAmount(remaining.toFixed(2))}
                  style={{
                    backgroundColor: isCovered ? theme.successBg : theme.dangerBg,
                    color: isCovered ? theme.successText : theme.dangerText,
                    borderColor: isCovered ? "transparent" : theme.danger
                  }}
                >
                  {isCovered ? "✓ Total cubierto" : `Falta cubrir: ${formatCurrency(remaining)} · Tocá para completar`}
                </div>

                {/* Agregar nuevo pago */}
                {!isCovered && (
                  <div className="flex gap-1.5 items-center">
                    <select
                      value={newMethod}
                      onChange={e => setNewMethod(e.target.value)}
                      className="p-2 rounded-xl outline-none text-[10px] font-bold flex-shrink-0 border shadow-sm"
                      style={{ backgroundColor: theme.bgcards, color: theme.text, borderColor: theme.border }}
                    >
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.short}</option>)}
                    </select>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAddPayment()}
                        placeholder={formatCurrency(remaining)}
                        className="w-full p-2 pr-8 rounded-xl outline-none text-xs font-mono border-2 focus:border-blue-500"
                        style={{ backgroundColor: theme.bgcards, color: theme.text, borderColor: theme.border }}
                      />
                      {remaining > 0 && (
                        <button
                          type="button"
                          onClick={() => setNewAmount(remaining.toFixed(2))}
                          className="absolute right-1 p-1 text-blue-500"
                        >
                          <FaMagic size={10} />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      className="p-2 rounded-xl text-white shadow-lg active:scale-90 transition-transform"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <FaCheck size={12} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configuración de Descuentos */}
          {(appliedDiscounts.length > 0 || preview?.interchangeableDiscounts?.length > 0) && (
            <div
              className="mb-4 p-3 rounded text-xs border"
              style={{ backgroundColor: theme.bg3, color: theme.text, borderColor: theme.primary + "40" }}
            >
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
                <div className="mt-4 pt-3 border-t border-dashed" style={{ borderColor: theme.primary + "20" }}>
                  <div className="flex justify-between items-center mb-3">
                    <p className="opacity-60 font-medium">Tope Máximo: {preview.maxDiscountPct}%</p>
                    <div className="flex gap-2">
                      <button onClick={e => { e.stopPropagation(); onReset(); }} className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors font-bold uppercase">Reiniciar</button>
                      <button onClick={e => { e.stopPropagation(); onClearAll(); }} className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors font-bold uppercase">Quitar todos</button>
                    </div>
                  </div>
                  <p className="opacity-70 mb-3 text-[11px] italic">Seleccioná qué reglas priorizar. El cupo se gestiona automáticamente.</p>
                  <div className="space-y-2">
                    {(() => {
                      const map = new Map();
                      (preview.appliedDiscounts || []).forEach(r => map.set(r.ruleId, { ...r, isApplied: true }));
                      (preview.interchangeableDiscounts || []).forEach(r => { if (!map.has(r.ruleId)) map.set(r.ruleId, { ...r, isApplied: false }); });
                      const rules = Array.from(map.values()).sort((a, b) => {
                        const la = a.productId ? 0 : 1, lb = b.productId ? 0 : 1;
                        if (la !== lb) return la - lb;
                        return (b.priority || 0) - (a.priority || 0);
                      });
                      const spaceUsed = rules.filter(r => preferredRuleIds.includes(r.ruleId)).reduce((s, r) => s + (r.nominalImpact || 0), 0);
                      const remSpace = (preview.maxDiscountAmount || 0) - spaceUsed;
                      return rules.map((rule, idx) => {
                        const isMarked = preferredRuleIds.includes(rule.ruleId);
                        const isApplied = appliedDiscounts.some(d => d.ruleId === rule.ruleId);
                        const isBlocked = !isMarked && (rule.nominalImpact || 0) > (remSpace + 0.01);
                        return (
                          <button
                            key={rule.ruleId || idx}
                            disabled={isBlocked || isLoading}
                            onClick={() => onToggleRule(rule.ruleId)}
                            className="w-full flex justify-between items-center p-3 rounded border transition-all text-left"
                            style={{
                              backgroundColor: isMarked ? theme.primary + "15" : theme.bg,
                              borderColor: isMarked ? theme.primary : (isBlocked ? theme.text + "20" : theme.bg3),
                              opacity: isBlocked ? 0.5 : 1,
                              cursor: isBlocked ? "not-allowed" : "pointer",
                              borderStyle: isMarked ? "solid" : "dashed"
                            }}
                          >
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-xs uppercase" style={{ color: isMarked ? theme.primary : theme.text }}>{rule.name}</p>
                                {isApplied && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500 text-white font-black uppercase tracking-tighter">Aplicado</span>}
                              </div>
                              <p className="text-[10px] opacity-50 font-medium">
                                {rule.productId ? "📦 Descuento Producto" : "🌍 Descuento Global"}
                                {isBlocked && " • ❌ Sin cupo"}
                                {!isMarked && !isBlocked && " • 🔓 Disponible"}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div className="flex flex-col items-end">
                                <span className="font-black text-sm" style={{ color: isMarked ? theme.primary : theme.text + "60" }}>{rule.percentage}%</span>
                                <span className="text-[9px] opacity-40">Impacto: {formatCurrency(rule.nominalImpact)}</span>
                              </div>
                              <div
                                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors"
                                style={{ borderColor: isMarked ? theme.primary : theme.text + "20", backgroundColor: isMarked ? theme.primary : "transparent" }}
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

          {/* Ahorro */}
          {hasAnyDiscount && (
            <div className="text-green-600 font-semibold text-center mt-2">
              {mensajeAhorro} AHORRARÁ: {formatCurrency(discountTotal)}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div className="p-4 border-t flex gap-3" style={{ borderColor: theme.bg3 }}>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 p-3 rounded-xl font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.bg, color: theme.text }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !isCovered || isProcessing}
            className="flex-1 p-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            style={{ backgroundColor: hasCCPayment ? "#ea580c" : theme.primary, color: "white" }}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                {hasCCPayment && <FaFileInvoiceDollar size={18} />}
                {!isCovered
                  ? `Falta ${formatCurrency(remaining)}`
                  : hasCCPayment
                    ? (isPureCC ? "Cargar en Cuenta Corriente" : "Confirmar Venta Combinada")
                    : "Realizar Venta"
                }
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountSummaryModal;
