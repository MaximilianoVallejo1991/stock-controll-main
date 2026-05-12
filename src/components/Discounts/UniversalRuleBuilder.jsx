/**
 * UniversalRuleBuilder.jsx
 * ─────────────────────────────────────────────────────────────────
 * UI de Rule Builder para reglas universales (engineVersion: "universal").
 *
 * Renderiza los toggles y selectores para configurar conditionsUniversal:
 *  - target: Todos (ORDER) | Productos específicos | Categorías (ITEM)
 *  - ticketConditions: paymentMethods, minAmount, allClients/clientIds
 *  - itemConditions: minQuantity
 *  - constraints: maxUnits
 *
 * Props:
 *  - form: object      — estado del formulario universal
 *  - onChange: fn      — (field, value) → actualizar estado
 *  - errors: object    — errores de validación por campo
 *  - inputStyle: object — estilos del tema actual
 *
 * Spec: SC-3.2
 * ─────────────────────────────────────────────────────────────────
 */

import EntitySearchSelect from './EntitySearchSelect';

// Métodos de pago válidos en el sistema (case-sensitive)
// Referencia: NewSale.jsx y cajaServices.js
const PAYMENT_METHODS = [
  { value: 'Efectivo',      label: '💵 Efectivo' },
  { value: 'Tarjeta',      label: '💳 Tarjeta' },
  { value: 'Transferencia', label: '🏦 Transferencia' },
];

// Subcomponente reutilizable de campo
const FormField = ({ label, error, children, hint }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium">{label}</label>}
    {children}
    {hint && <span className="text-xs" style={{ opacity: 0.6 }}>{hint}</span>}
    {error && (
      <p className="text-xs" style={{ color: 'var(--color-danger, #ef4444)' }}>
        {error}
      </p>
    )}
  </div>
);

// Subcomponente: sección colapsable con título
const Section = ({ title, icon, children, inputStyle }) => (
  <div
    className="rounded-lg p-3 flex flex-col gap-3"
    style={{
      backgroundColor: inputStyle.backgroundColor,
      border: `1px solid ${inputStyle.borderColor}`,
    }}
  >
    <p className="text-sm font-semibold" style={{ opacity: 0.8 }}>
      {icon} {title}
    </p>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────
const UniversalRuleBuilder = ({ form, onChange, errors, inputStyle }) => {
  // ── Handlers ─────────────────────────────────────────────────
  const togglePaymentMethod = (method) => {
    const current = form.u_paymentMethods ?? [];
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    onChange('u_paymentMethods', updated);
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ── SECCIÓN 1: Target — define el LAYER ──────────────── */}
      <Section title="¿A qué aplica el descuento?" icon="🎯" inputStyle={inputStyle}>

        <FormField label="Objetivo del descuento" error={null}>
          <select
            value={form.u_targetMode ?? 'all'}
            onChange={(e) => {
              onChange('u_targetMode', e.target.value);
              // Limpiar selecciones previas al cambiar modo
              onChange('u_productIds', []);
              onChange('u_categoryIds', []);
            }}
            style={inputStyle}
            className="w-full p-2 border rounded"
          >
            <option value="all">🌐 Toda la orden (global)</option>
            <option value="products">🏷️ Productos específicos</option>
            <option value="categories">🗂️ Categorías específicas</option>
          </select>
        </FormField>

        {/* Target Products */}
        {form.u_targetMode === 'products' && (
          <FormField
            label="Seleccionar productos"
            error={errors.u_productIds}
            hint="El descuento aplica solo a estos productos (ITEM level)"
          >
            <EntitySearchSelect
              endpoint="products"
              selectedIds={form.u_productIds ?? []}
              onChange={(ids) => onChange('u_productIds', ids)}
              labelField="name"
              subLabelField="barcode"
              placeholder="Buscar producto por nombre o código..."
            />
          </FormField>
        )}

        {/* Target Categories */}
        {form.u_targetMode === 'categories' && (
          <FormField
            label="Seleccionar categorías"
            error={errors.u_categoryIds}
            hint="El descuento aplica a todos los productos de estas categorías (ITEM level)"
          >
            <EntitySearchSelect
              endpoint="categories"
              selectedIds={form.u_categoryIds ?? []}
              onChange={(ids) => onChange('u_categoryIds', ids)}
              labelField="name"
              placeholder="Buscar categoría..."
            />
          </FormField>
        )}

        {/* Hint para modo global */}
        {(form.u_targetMode === 'all' || !form.u_targetMode) && (
          <p className="text-xs" style={{ opacity: 0.6 }}>
            Se aplicará sobre el subtotal residual de toda la orden (ORDER level).
          </p>
        )}
      </Section>

      {/* ── SECCIÓN 2: Condiciones del ticket ────────────────── */}
      <Section title="Condiciones del ticket (opcional)" icon="🎫" inputStyle={inputStyle}>

        {/* Payment Methods */}
        <FormField label="Métodos de pago habilitados" hint="Sin marcar = aplica a todos los métodos">
          <div className="flex flex-wrap gap-2 pt-1">
            {PAYMENT_METHODS.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-1.5 cursor-pointer select-none text-sm px-2 py-1 rounded"
                style={{
                  border: `1px solid ${inputStyle.borderColor}`,
                  backgroundColor: (form.u_paymentMethods ?? []).includes(value)
                    ? 'var(--color-primary, #6366f1)'
                    : inputStyle.backgroundColor,
                  color: (form.u_paymentMethods ?? []).includes(value)
                    ? '#fff'
                    : inputStyle.color,
                }}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={(form.u_paymentMethods ?? []).includes(value)}
                  onChange={() => togglePaymentMethod(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </FormField>

        {/* Allow Partial Toggle (Only if payment methods are selected) */}
        {(form.u_paymentMethods ?? []).length > 0 && (
          <div className="flex flex-col gap-2 p-3 rounded bg-black/5 dark:bg-white/5 border border-dashed border-primary/30">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.allowPartial ?? false}
                onChange={(e) => onChange('allowPartial', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-semibold">Permitir descuento proporcional en pagos parciales</span>
            </label>
            <p className="text-[11px] leading-tight opacity-70">
              Si está activado, el {form.percentage || 'X'}% se aplicará solo sobre el monto pagado con los medios seleccionados. 
              Si está desactivado, el descuento solo aplicará si el cliente paga el total de la orden con estos medios.
            </p>
          </div>
        )}

        {/* Min Amount */}
        <FormField
          label="Monto mínimo del ticket ($)"
          error={errors.u_minAmount}
          hint="Dejar vacío si no hay monto mínimo"
        >
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="Ej: 5000"
            value={form.u_minAmount ?? ''}
            onChange={(e) => onChange('u_minAmount', e.target.value)}
            style={inputStyle}
            className="w-full p-2 border rounded"
          />
        </FormField>

        {/* Clientes */}
        <FormField label="Clientes habilitados">
          <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
            <input
              type="checkbox"
              checked={form.u_allClients ?? true}
              onChange={(e) => {
                onChange('u_allClients', e.target.checked);
                if (e.target.checked) onChange('u_clientIds', []);
              }}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Todos los clientes</span>
          </label>
          {!form.u_allClients && (
            <EntitySearchSelect
              endpoint="clients"
              selectedIds={form.u_clientIds ?? []}
              onChange={(ids) => onChange('u_clientIds', ids)}
              labelFormat={(c) => c.firstName + (c.lastName ? ' ' + c.lastName : '')}
              labelField="firstName"
              placeholder="Buscar cliente por nombre..."
            />
          )}
          {errors.u_clientIds && (
            <p className="text-xs" style={{ color: 'var(--color-danger, #ef4444)' }}>
              {errors.u_clientIds}
            </p>
          )}
        </FormField>

      </Section>

      {/* ── SECCIÓN 3: Condiciones por ítem ──────────────────── */}
      <Section title="Condiciones por ítem (opcional)" icon="📦" inputStyle={inputStyle}>
        <FormField
          label="Cantidad mínima de unidades por producto"
          error={errors.u_minQuantity}
          hint="Dejar vacío si no hay cantidad mínima requerida"
        >
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Ej: 3"
            value={form.u_minQuantity ?? ''}
            onChange={(e) => onChange('u_minQuantity', e.target.value)}
            style={inputStyle}
            className="w-full p-2 border rounded"
          />
        </FormField>
      </Section>

      {/* ── SECCIÓN 4: Restricciones ─────────────────────────── */}
      <Section title="Restricciones (opcional)" icon="⚙️" inputStyle={inputStyle}>
        <FormField
          label="Unidades máximas con descuento"
          error={errors.u_maxUnits}
          hint="Máximo de unidades que pueden recibir este descuento (vacío = ilimitado)"
        >
          <input
            type="number"
            min={1}
            step={1}
            placeholder="Ej: 10"
            value={form.u_maxUnits ?? ''}
            onChange={(e) => onChange('u_maxUnits', e.target.value)}
            style={inputStyle}
            className="w-full p-2 border rounded"
          />
        </FormField>
      </Section>

    </div>
  );
};

export default UniversalRuleBuilder;
