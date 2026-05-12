/**
 * DiscountFormModal.jsx
 * ─────────────────────────────────────────────────────────────────
 * Modal para crear y editar reglas de descuento.
 *
 * Props:
 *  - isOpen: boolean        — controla visibilidad
 *  - onClose: fn            — callback para cerrar
 *  - rule: DiscountRule|null — null = crear, objeto = editar
 *  - onSuccess: fn(rule)    — callback tras crear/editar exitosamente
 *
 * Usa: Modal.jsx (base), ThemedButton, discountService
 * No usa: axios directo, lógica de negocio, DynamicForm (incompatible)
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import Modal from '../Modals/Modal';
import ThemedButton from '../ThemedButton';
import { useTheme } from '../../context/ThemeContext';
import { DISCOUNT_TYPES, DISCOUNT_TYPE_META } from '../../constants/discountConstants';
import { createDiscount, updateDiscount } from '../../services/discountService';
import EntitySearchSelect from './EntitySearchSelect';
import UniversalRuleBuilder from './UniversalRuleBuilder';
import { v } from '../../styles/variables';

// ─────────────────────────────────────────────────────────────────
// Estado inicial del formulario — refleja el contrato del backend
// ─────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  // ── Campos base (compartidos por legacy y universal) ──────────
  name:        '',
  percentage:  '',
  description: '',
  startsAt:    '',
  endsAt:      '',
  isCombinable:  true,
  allowPartial:  false,
  isActive:      true,
  // ── Campos legacy — conditions dinámicas por tipo ─────────────
  type:             '',
  minQuantity:      '',
  quantityMode:     'global',
  productIds:       [],
  categoryIds:      [],
  maxUnits:         '',
  minAmount:        '',
  clientIds:        [],
  categoryIdsDiscount: [],
  allClients:       false,
  recurrence:       null,
  // ── Campos universales (prefijo u_ para evitar colisión) ──────
  u_targetMode:     'all',      // 'all' | 'products' | 'categories'
  u_productIds:     [],
  u_categoryIds:    [],
  u_paymentMethods: [],
  u_minAmount:      '',
  u_allClients:     true,
  u_clientIds:      [],
  u_minQuantity:    '',
  u_maxUnits:       '',
};

// ─────────────────────────────────────────────────────────────────
// Opciones de tipo para el select
// ─────────────────────────────────────────────────────────────────
const TYPE_OPTIONS = Object.entries(DISCOUNT_TYPE_META).map(([value, { label }]) => ({
  value,
  label,
}));

// ─────────────────────────────────────────────────────────────────
// Construye el objeto `conditions` según el tipo — SIN lógica de negocio
// ─────────────────────────────────────────────────────────────────
function buildConditions(type, form) {
  switch (type) {
    case DISCOUNT_TYPES.QUANTITY:
      // Modo global: solo minQuantity
      if (form.quantityMode === 'global' || !form.quantityMode) {
        return { minQuantity: Number(form.minQuantity) };
      }
      // Modo producto
      if (form.quantityMode === 'product') {
        return { 
          minQuantity: Number(form.minQuantity),
          productIds: form.productIds 
        };
      }
      // Modo categoría
      if (form.quantityMode === 'category') {
        return { 
          minQuantity: Number(form.minQuantity),
          categoryIds: form.categoryIds
        };
      }
      return { minQuantity: Number(form.minQuantity) };

    case DISCOUNT_TYPES.LIMITED_STOCK:
      return {
        productIds: form.productIds,
        maxUnits:   Number(form.maxUnits),
      };

    case DISCOUNT_TYPES.MIN_AMOUNT:
      return { minAmount: Number(form.minAmount) };

    case DISCOUNT_TYPES.CASH_PAYMENT:
      // Automático — el frontend no muestra input, el backend lo valida
      return { paymentMethods: ['EFECTIVO'] };

    case DISCOUNT_TYPES.CLIENT:
      return form.allClients
        ? { allClients: true }
        : { clientIds: form.clientIds };

    case DISCOUNT_TYPES.PRODUCT:
      return { productIds: form.productIds };

    case DISCOUNT_TYPES.CATEGORY:
      return { categoryIds: form.categoryIdsDiscount || [] };

    case DISCOUNT_TYPES.SPECIAL_DATE:
      // Recurrencia opcional
      return form.recurrence ? { recurrence: form.recurrence } : {};

    default:
      return {};
  }
}

// ─────────────────────────────────────────────────────────────────
// LEGACY: Popula el formulario desde una regla existente
// ─────────────────────────────────────────────────────────────────
function ruleToForm(rule) {
  const c = rule.conditions ?? {};
  
  let quantityMode = 'global';
  if (c.productIds && c.productIds.length > 0) quantityMode = 'product';
  else if (c.categoryIds && c.categoryIds.length > 0) quantityMode = 'category';
  
  return {
    ...INITIAL_FORM,
    name:        rule.name       ?? '',
    percentage:  rule.percentage ?? '',
    type:        rule.type       ?? '',
    description: rule.description ?? '',
    startsAt:    rule.startsAt   ? rule.startsAt.split('T')[0] : '',
    endsAt:      rule.endsAt     ? rule.endsAt.split('T')[0]   : '',
    isCombinable: rule.isCombinable ?? true,
    allowPartial: rule.allowPartial ?? false,
    isActive:      rule.isActive ?? true,
    minQuantity: c.minQuantity   ?? '',
    quantityMode,
    productIds:  c.productIds    ?? [],
    categoryIds: c.categoryIds   ?? [],
    maxUnits:    c.maxUnits      ?? '',
    minAmount:   c.minAmount     ?? '',
    clientIds:   c.clientIds     ?? [],
    categoryIdsDiscount: c.categoryIds ?? [],
    allClients:  c.allClients    ?? false,
    recurrence:  c.recurrence    ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL: Popula el formulario desde una regla universal existente (SC-3.1)
// ─────────────────────────────────────────────────────────────────
function ruleToFormUniversal(rule) {
  const cu = rule.conditionsUniversal ?? {};
  const target = cu.target;
  const tc = cu.ticketConditions ?? {};
  const ic = cu.itemConditions ?? {};
  const cs = cu.constraints ?? {};

  let u_targetMode = 'all';
  if (target?.productIds?.length > 0) u_targetMode = 'products';
  else if (target?.categoryIds?.length > 0) u_targetMode = 'categories';

  return {
    ...INITIAL_FORM,
    name:        rule.name        ?? '',
    percentage:  rule.percentage  ?? '',
    description: rule.description ?? '',
    startsAt:    rule.startsAt    ? rule.startsAt.split('T')[0] : '',
    endsAt:      rule.endsAt      ? rule.endsAt.split('T')[0]   : '',
    isCombinable: rule.isCombinable ?? true,
    allowPartial: rule.allowPartial ?? false,
    isActive:      rule.isActive ?? true,
    u_targetMode,
    u_productIds:     target?.productIds  ?? [],
    u_categoryIds:    target?.categoryIds ?? [],
    u_paymentMethods: tc.paymentMethods   ?? [],
    u_minAmount:      tc.minAmount        ?? '',
    u_allClients:     tc.allClients       ?? true,
    u_clientIds:      tc.clientIds        ?? [],
    u_minQuantity:    ic.minQuantity      ?? '',
    u_maxUnits:       cs.maxUnits         ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL: Construye conditionsUniversal desde el form (SC-3.2)
// Omite campos vacíos para no enviar null innecesario
// ─────────────────────────────────────────────────────────────────
function buildConditionsUniversal(form) {
  const cu = {};

  // target (AXIOM-4: null = ORDER, con contenido = ITEM)
  if (form.u_targetMode === 'products' && form.u_productIds?.length > 0) {
    cu.target = { productIds: form.u_productIds };
  } else if (form.u_targetMode === 'categories' && form.u_categoryIds?.length > 0) {
    cu.target = { categoryIds: form.u_categoryIds };
  }
  // u_targetMode = 'all' → sin target (ORDER level)

  // ticketConditions — solo incluir campos con valor real
  const tc = {};
  if (form.u_paymentMethods?.length > 0) tc.paymentMethods = form.u_paymentMethods;
  if (form.u_minAmount && Number(form.u_minAmount) > 0) tc.minAmount = Number(form.u_minAmount);
  if (form.u_allClients) {
    tc.allClients = true;
  } else if (form.u_clientIds?.length > 0) {
    tc.clientIds = form.u_clientIds;
  }
  if (Object.keys(tc).length > 0) cu.ticketConditions = tc;

  // itemConditions
  if (form.u_minQuantity && Number(form.u_minQuantity) >= 1) {
    cu.itemConditions = { minQuantity: Number(form.u_minQuantity) };
  }

  // constraints
  if (form.u_maxUnits && Number(form.u_maxUnits) >= 1) {
    cu.constraints = { maxUnits: Number(form.u_maxUnits) };
  }

  return cu;
}

// ─────────────────────────────────────────────────────────────────
// UNIVERSAL: Validación local del builder (SC-3.2)
// ─────────────────────────────────────────────────────────────────
function validateUniversal(form) {
  const errors = {};

  if (!form.name.trim()) errors.name = 'El nombre es obligatorio.';
  if (!form.percentage || Number(form.percentage) <= 0 || Number(form.percentage) >= 100)
    errors.percentage = 'El porcentaje debe ser entre 0.01 y 99.99.';
  if (form.startsAt && form.endsAt && form.startsAt > form.endsAt)
    errors.startsAt = 'La fecha de inicio debe ser anterior a la de fin.';

  // Target: si elige productos/categorias debe seleccionar al menos uno
  if (form.u_targetMode === 'products' && (form.u_productIds ?? []).length === 0)
    errors.u_productIds = 'Seleccioná al menos un producto.';
  if (form.u_targetMode === 'categories' && (form.u_categoryIds ?? []).length === 0)
    errors.u_categoryIds = 'Seleccioná al menos una categoría.';

  // Clientes: si no es allClients, debe seleccionar clientes
  if (!form.u_allClients && (form.u_clientIds ?? []).length === 0)
    errors.u_clientIds = 'Seleccioná al menos un cliente o marcá "Todos los clientes".';

  return errors;
}

// ─────────────────────────────────────────────────────────────────
// Validación local — no replica el backend, solo previene envíos vacíos
// ─────────────────────────────────────────────────────────────────
function validate(form) {
  const errors = {};

  if (!form.name.trim())
    errors.name = 'El nombre es obligatorio.';

  if (!form.percentage || Number(form.percentage) <= 0 || Number(form.percentage) >= 100)
    errors.percentage = 'El porcentaje debe ser entre 0.01 y 99.99.';

  if (!form.type)
    errors.type = 'Seleccioná un tipo de descuento.';

  // Validación de fechas: startsAt <= endsAt
  if (form.startsAt && form.endsAt && form.startsAt > form.endsAt)
    errors.startsAt = 'La fecha de inicio debe ser anterior a la de fin.';

  // Validaciones de conditions según tipo
  switch (form.type) {
    case DISCOUNT_TYPES.QUANTITY:
      if (!form.minQuantity || Number(form.minQuantity) < 1)
        errors.minQuantity = 'La cantidad mínima debe ser al menos 1.';
      // Validar según modo
      if (form.quantityMode === 'product' && form.productIds.length === 0)
        errors.productIds = 'Seleccioná al menos un producto.';
      if (form.quantityMode === 'category' && form.categoryIds.length === 0)
        errors.categoryIds = 'Seleccioná al menos una categoría.';
      break;

    case DISCOUNT_TYPES.LIMITED_STOCK:
      if (form.productIds.length === 0)
        errors.productIds = 'Seleccioná al menos un producto.';
      if (!form.maxUnits || Number(form.maxUnits) < 1)
        errors.maxUnits = 'Las unidades máximas deben ser al menos 1.';
      break;

    case DISCOUNT_TYPES.MIN_AMOUNT:
      if (!form.minAmount || Number(form.minAmount) <= 0)
        errors.minAmount = 'El monto mínimo debe ser mayor a 0.';
      break;

    case DISCOUNT_TYPES.CLIENT:
      if (!form.allClients && form.clientIds.length === 0)
        errors.clientIds = 'Seleccioná al menos un cliente o marcá "Todos los clientes".';
      break;

    case DISCOUNT_TYPES.PRODUCT:
      if (form.productIds.length === 0)
        errors.productIds = 'Seleccioná al menos un producto.';
      break;

    case DISCOUNT_TYPES.CATEGORY:
      if ((form.categoryIdsDiscount || []).length === 0)
        errors.categoryIds = 'Seleccioná al menos una categoría.';
      break;

    default:
      break;
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────
// Subcomponente: campo de formulario con estilo del proyecto
// ─────────────────────────────────────────────────────────────────
const FormField = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {error && (
      <p className="text-xs" style={{ color: 'var(--color-danger, #ef4444)' }}>
        {error}
      </p>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Subcomponente: sección de conditions dinámica según el tipo
// ─────────────────────────────────────────────────────────────────
const DynamicConditions = ({ type, form, onChange, errors, inputStyle }) => {
  if (!type) return null;

  const handleMultiSelect = (field, value) => {
    const current = form[field] ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange(field, updated);
  };

  switch (type) {
    case DISCOUNT_TYPES.QUANTITY:
      return (
        <div className="flex flex-col gap-4">
          <FormField label="Cantidad mínima de unidades" error={errors.minQuantity}>
            <input
              type="number"
              min={1}
              value={form.minQuantity}
              onChange={(e) => onChange('minQuantity', e.target.value)}
              style={inputStyle}
              className="w-full p-2 border rounded"
            />
          </FormField>
          
          <FormField label="Aplicar a">
            <select
              value={form.quantityMode || 'global'}
              onChange={(e) => onChange('quantityMode', e.target.value)}
              style={inputStyle}
              className="w-full p-2 border rounded"
            >
              <option value="global">Todas las compras (global)</option>
              <option value="product">Producto específico</option>
              <option value="category">Categoría específica</option>
            </select>
          </FormField>
          
          {form.quantityMode === 'product' && (
            <FormField label="Seleccionar producto" error={errors.productIds}>
              <EntitySearchSelect
                endpoint="products"
                selectedIds={form.productIds}
                onChange={(ids) => onChange('productIds', ids)}
                labelField="name"
                subLabelField="barcode"
                placeholder="Buscar producto por nombre o código..."
              />
            </FormField>
          )}
          
          {form.quantityMode === 'category' && (
            <FormField label="Seleccionar categoría" error={errors.categoryIds}>
              <EntitySearchSelect
                endpoint="categories"
                selectedIds={form.categoryIds}
                onChange={(ids) => onChange('categoryIds', ids)}
                labelField="name"
                placeholder="Buscar categoría..."
              />
            </FormField>
          )}
        </div>
      );

    case DISCOUNT_TYPES.MIN_AMOUNT:
      return (
        <FormField label="Monto mínimo de compra ($)" error={errors.minAmount}>
          <input
            type="number"
            min={1}
            value={form.minAmount}
            onChange={(e) => onChange('minAmount', e.target.value)}
            style={inputStyle}
            className="w-full p-2 border rounded"
          />
        </FormField>
      );

    case DISCOUNT_TYPES.CASH_PAYMENT:
      return (
        <div
          className="rounded-lg p-3 text-sm"
          style={{ backgroundColor: inputStyle.backgroundColor, border: `1px solid ${inputStyle.borderColor}` }}
        >
          💵 Este descuento se aplica automáticamente cuando el pago es <strong>100% en efectivo</strong>. No requiere configuración adicional.
        </div>
      );

    case DISCOUNT_TYPES.LIMITED_STOCK:
      return (
        <div className="flex flex-col gap-4">
          <FormField label="Seleccionar productos" error={errors.productIds}>
            <EntitySearchSelect
              endpoint="products"
              selectedIds={form.productIds}
              onChange={(ids) => onChange('productIds', ids)}
              labelField="name"
              subLabelField="barcode"
              placeholder="Buscar producto por nombre o código..."
            />
          </FormField>
          <FormField label="Unidades máximas de descuento" error={errors.maxUnits}>
            <input
              type="number"
              min={1}
              value={form.maxUnits}
              onChange={(e) => onChange('maxUnits', e.target.value)}
              style={inputStyle}
              className="w-full p-2 border rounded"
            />
            <span className="text-xs" style={{ opacity: 0.6 }}>
              Cantidad total de unidades que pueden usar este descuento
            </span>
          </FormField>
        </div>
      );

    case DISCOUNT_TYPES.PRODUCT:
      return (
        <FormField label="Seleccionar productos" error={errors.productIds}>
          <EntitySearchSelect
            endpoint="products"
            selectedIds={form.productIds}
            onChange={(ids) => onChange('productIds', ids)}
            labelField="name"
            subLabelField="barcode"
            placeholder="Buscar producto por nombre o código..."
          />
        </FormField>
      );

    case DISCOUNT_TYPES.CATEGORY:
      return (
        <FormField label="Seleccionar categorías" error={errors.categoryIds}>
          <EntitySearchSelect
            endpoint="categories"
            selectedIds={form.categoryIdsDiscount || []}
            onChange={(ids) => onChange('categoryIdsDiscount', ids)}
            labelField="name"
            placeholder="Buscar categoría..."
          />
        </FormField>
      );

    case DISCOUNT_TYPES.CLIENT:
      return (
        <>
          <FormField label="" error={null}>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.allClients}
                onChange={(e) => onChange('allClients', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Aplicar a todos los clientes</span>
            </label>
          </FormField>
          {!form.allClients && (
            <FormField label="Seleccionar clientes" error={errors.clientIds}>
              <EntitySearchSelect
                endpoint="clients"
                selectedIds={form.clientIds}
                onChange={(ids) => onChange('clientIds', ids)}
                labelFormat={(c) => c.firstName + (c.lastName ? ' ' + c.lastName : '')}
                labelField="firstName"
                placeholder="Buscar cliente por nombre..."
              />
            </FormField>
          )}
        </>
      );

    case DISCOUNT_TYPES.SPECIAL_DATE:
      return (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-lg p-3 text-sm"
            style={{ backgroundColor: inputStyle.backgroundColor, border: `1px solid ${inputStyle.borderColor}` }}
          >
            📅 Este descuento aplica dentro del rango de fechas configurado en la sección principal.
          </div>
          <FormField label="" error={null}>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.recurrence === 'YEARLY'}
                onChange={(e) => onChange('recurrence', e.target.checked ? 'YEARLY' : null)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Repetir anualmente</span>
            </label>
            <span className="text-xs" style={{ opacity: 0.6 }}>
              El descuento se reactivará automáticamente cada año en las mismas fechas
            </span>
          </FormField>
        </div>
      );

    default:
      return null;
  }
};

// ─────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────
const DiscountFormModal = ({ isOpen, onClose, rule = null, onSuccess, onDelete, onToggleActive }) => {
  const { theme } = useTheme();
  const isEditing = Boolean(rule);

  // SC-3.1: Detectar engineVersion auto desde la regla, o 'universal' por defecto al crear
  // En modo creación, se fuerza siempre a 'universal' (el toggle está oculto)
  const [engineVersion, setEngineVersion] = useState('universal');

  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiWarning, setApiWarning] = useState(null);

  // Poblar formulario al abrir. Detectar engineVersion de la regla (SC-3.1)
  useEffect(() => {
    if (isOpen) {
      if (rule) {
        const version = rule.engineVersion ?? 'legacy';
        setEngineVersion(version);
        setForm(version === 'universal' ? ruleToFormUniversal(rule) : ruleToForm(rule));
      } else {
        // SC-3.1: Forzar siempre universal al crear — UI legacy ocultada
        setEngineVersion('universal');
        setForm(INITIAL_FORM);
      }
      setErrors({});
      setApiError(null);
      setApiWarning(null);
    }
  }, [isOpen, rule]);

  const inputStyle = {
    backgroundColor: theme.bg,
    color:           theme.text,
    borderColor:     theme.border,
    borderRadius:    v.borderRadius,
  };

  // Actualizador genérico para campos base
  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Al cambiar el tipo, limpiar conditions previas para evitar envíos sucios
      ...(field === 'type' ? {
        minQuantity: '', quantityMode: 'global', productIds: [], categoryIds: [], 
        maxUnits: '', minAmount: '', clientIds: [], categoryIdsDiscount: [], 
        allClients: false, recurrence: null,
      } : {}),
    }));
    // Limpiar el error del campo modificado
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
    // Limpiar advertencia si el usuario corrige el porcentaje
    if (field === 'percentage') {
      setApiWarning(null);
    }
  };

  // Handler para habilitar/deshabilitar
  const handleToggleActive = () => {
    if (onToggleActive && rule) {
      onToggleActive(rule.id, !form.isActive);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar según el engine activo
    const validationErrors = engineVersion === 'universal'
      ? validateUniversal(form)
      : validate(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError(null);
    setApiWarning(null);

    // Construir el payload correcto según engineVersion (SC-3.2)
    let payload;
    if (engineVersion === 'universal') {
      payload = {
        name:               form.name.trim(),
        percentage:         Number(form.percentage),
        description:        form.description.trim() || undefined,
        startsAt:           form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt:             form.endsAt   ? new Date(form.endsAt).toISOString()   : undefined,
        engineVersion:      'universal',
        isCombinable:       form.isCombinable,
        allowPartial:       form.allowPartial,
        conditionsUniversal: buildConditionsUniversal(form),
        // type: null para universales (backend ya no lo requiere)
      };
    } else {
      // Payload legacy — intacto, sin cambios (SC-3.3)
      payload = {
        name:        form.name.trim(),
        percentage:  Number(form.percentage),
        isCombinable: form.isCombinable,
        allowPartial: form.allowPartial,
        type:        form.type,
        description: form.description.trim() || undefined,
        startsAt:    form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt:      form.endsAt   ? new Date(form.endsAt).toISOString()   : undefined,
        conditions:  buildConditions(form.type, form),
      };
    }

    try {
      const result = isEditing
        ? await updateDiscount(rule.id, payload)
        : await createDiscount(payload);

      if (result.warning) {
        setApiWarning(result.warning);
        // Notificamos éxito pero NO cerramos para mostrar el aviso
        onSuccess?.(result);
      } else {
        onSuccess?.(result);
        onClose();
      }
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      {/* Wrapper con scroll interno solo cuando el contenido excede el viewport */}
      <div className="max-h-[85vh] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

        {/* Título */}
        <h2 className="text-lg font-bold" style={{ color: theme.colortitlecard }}>
          {isEditing ? `Editar: ${rule.name}` : 'Nueva regla de descuento'}
        </h2>

        {/* Badge de engine en modo edición */}
        {isEditing && (
          <div
            className="text-xs px-2 py-1 rounded w-fit"
            style={{
              backgroundColor: engineVersion === 'universal' ? 'var(--color-primary, #6366f1)' : theme.border,
              color: engineVersion === 'universal' ? '#fff' : theme.text,
            }}
          >
            {engineVersion === 'universal' ? '✨ Rule Builder (universal)' : '🎯 Regla clásica (legacy)'}
          </div>
        )}

        {/* ── ADVERTENCIA DE SEGURIDAD (Movidada al tope) ─────── */}
        {apiWarning && (
          <div
            className="rounded-lg p-4 text-sm border-l-4 flex flex-col gap-2 mb-4 animate-in fade-in slide-in-from-top duration-300"
            style={{ 
              backgroundColor: '#fff6e0', // Mas amarillo
              borderColor: '#f59e0b',
              color: '#92400e'
            }}
          >
            <div className="flex items-start gap-2 font-bold text-base">
              <span>{apiWarning}</span>
            </div>
            <p className="text-sm opacity-90">
              <strong>IMPORTANTE:</strong> La regla fue persistida, pero el blindaje automático la limitará al tope de la tienda. 
              Esta advertencia aparece porque intentaste crear una regla que excede la política de seguridad.
            </p>
            <button 
              type="button"
              onClick={onClose}
              className="mt-2 w-full px-4 py-2 rounded bg-amber-400 hover:bg-amber-500 transition-colors font-bold text-sm text-amber-950 shadow-sm"
            >
              Entendido, continuar
            </button>
          </div>
        )}

        {/* ── Campos base ─────────────────────────────────────── */}
        <FormField label="Nombre de la regla" error={errors.name}>
          <input
            type="text"
            placeholder="Ej: Descuento por mayor"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            style={inputStyle}
            className="w-full p-2 border rounded"
          />
        </FormField>

        <FormField label="Descripción (opcional)" error={null}>
          <input
            type="text"
            placeholder="Ej: Promoción de temporada alta"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={inputStyle}
            className="w-full p-2 border rounded"
          />
        </FormField>

        {/* Porcentaje + Tipo — el tipo solo existe en reglas legacy (SC-3.2) */}
        {engineVersion === 'universal' ? (
          <div className="flex flex-col gap-3">
            <FormField label="Porcentaje (%)" error={errors.percentage}>
              <input
                type="number"
                min={0.01}
                max={99.99}
                step={0.01}
                placeholder="10"
                value={form.percentage}
                onChange={(e) => handleChange('percentage', e.target.value)}
                style={inputStyle}
                className="w-full p-2 border rounded"
              />
            </FormField>

            <FormField label="Combinable" error={errors.isCombinable}>
              <select
                value={form.isCombinable === false ? 'no' : 'si'}
                onChange={(e) => handleChange('isCombinable', e.target.value === 'si')}
                style={inputStyle}
                className="w-full p-2 border rounded"
              >
                <option value="si">✅ Combinable (se suma con otros)</option>
                <option value="no">❌ No combinable (prioriza mayor beneficio)</option>
              </select>
            </FormField>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Porcentaje (%)" error={errors.percentage}>
              <input
                type="number"
                min={0.01}
                max={99.99}
                step={0.01}
                placeholder="10"
                value={form.percentage}
                onChange={(e) => handleChange('percentage', e.target.value)}
                style={inputStyle}
                className="w-full p-2 border rounded"
              />
            </FormField>

            <FormField label="Tipo de descuento" error={errors.type}>
              <select
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                style={inputStyle}
                className="w-full p-2 border rounded"
              >
                <option value="">Seleccioná un tipo</option>
                {TYPE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </FormField>
          </div>
        )}

        {/* ── Fechas de vigencia ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Fecha de inicio (opcional)" error={errors.startsAt}>
            <input
              type="date"
              value={form.startsAt}
              onChange={(e) => handleChange('startsAt', e.target.value)}
              style={inputStyle}
              className="w-full p-2 border rounded"
            />
          </FormField>
          <FormField label="Fecha de fin (opcional)" error={errors.endsAt}>
            <input
              type="date"
              value={form.endsAt}
              onChange={(e) => handleChange('endsAt', e.target.value)}
              style={inputStyle}
              className="w-full p-2 border rounded"
            />
          </FormField>
        </div>

        {/* ── Divider ─────────────────────────────────────────── */}
        {(engineVersion === 'legacy' ? form.type : true) && (
          <div className="border-t" style={{ borderColor: theme.border }} />
        )}

        {/* ── Conditions: renderizado condicional por engine ─── */}
        {engineVersion === 'universal' ? (
          <UniversalRuleBuilder
            form={form}
            onChange={handleChange}
            errors={errors}
            inputStyle={inputStyle}
          />
        ) : (
          <DynamicConditions
            type={form.type}
            form={form}
            onChange={handleChange}
            errors={errors}
            inputStyle={inputStyle}
          />
        )}

        {/* ── Error de API ─────────────────────────────────────── */}
        {apiError && (
          <div
            className="rounded-lg p-3 text-sm"
            style={{ backgroundColor: theme.dangerBg, color: theme.dangerText }}
          >
            {apiError}
          </div>
        )}


        {/* ── Acciones ────────────────────────────────────────── */}
        <div className="flex justify-between gap-3 pt-2">
          <div className="flex gap-3">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 rounded font-medium transition-colors text-sm"
                style={{
                  backgroundColor: theme.dangerBg,
                  color: theme.dangerText,
                }}
              >
                Eliminar
              </button>
            )}
            {isEditing && onToggleActive && (
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={loading}
                className="px-4 py-2 rounded font-medium transition-colors text-sm"
                style={{
                  backgroundColor: form.isActive ? theme.dangerBg : theme.successBg,
                  color: form.isActive ? theme.dangerText : theme.successText,
                }}
              >
                {form.isActive ? 'Deshabilitar' : 'Habilitar'}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <ThemedButton type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </ThemedButton>
            <ThemedButton type="submit" disabled={loading}>
              {loading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear regla'}
            </ThemedButton>
          </div>
        </div>

        </form>
      </div>
    </Modal>
  );
};

export default DiscountFormModal;
