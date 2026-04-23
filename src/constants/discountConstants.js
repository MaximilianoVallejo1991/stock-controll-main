/**
 * discountConstants.js
 * ─────────────────────────────────────────────────────────────────
 * Constantes de PRESENTACIÓN del módulo de descuentos.
 * Solo metadata visual — sin lógica de negocio.
 *
 * El backend es la única fuente de verdad para layer, prioridades y validaciones.
 * ─────────────────────────────────────────────────────────────────
 */

// Enum DiscountType — espeja el enum Prisma del backend.
// Evita strings sueltos en los componentes.
export const DISCOUNT_TYPES = {
  QUANTITY:      'QUANTITY',
  CASH_PAYMENT:  'CASH_PAYMENT',
  CLIENT:        'CLIENT',
  SPECIAL_DATE:  'SPECIAL_DATE',
  PRODUCT:       'PRODUCT',
  CATEGORY:      'CATEGORY',
  MIN_AMOUNT:    'MIN_AMOUNT',
  LIMITED_STOCK: 'LIMITED_STOCK',
};

/**
 * Metadata de presentación por tipo de descuento.
 * Únicamente usado para renderizar etiquetas e iconos en la UI.
 * No contiene información de reglas de negocio.
 */
export const DISCOUNT_TYPE_META = {
  [DISCOUNT_TYPES.QUANTITY]:      { label: 'Por Cantidad',      icon: '📦' },
  [DISCOUNT_TYPES.CASH_PAYMENT]:  { label: 'Pago en Efectivo',  icon: '💵' },
  [DISCOUNT_TYPES.CLIENT]:        { label: 'Cliente',           icon: '👤' },
  [DISCOUNT_TYPES.SPECIAL_DATE]:  { label: 'Fecha Especial',    icon: '📅' },
  [DISCOUNT_TYPES.PRODUCT]:       { label: 'Producto',          icon: '🏷️' },
  [DISCOUNT_TYPES.CATEGORY]:      { label: 'Categoría',         icon: '🗂️' },
  [DISCOUNT_TYPES.MIN_AMOUNT]:    { label: 'Monto Mínimo',      icon: '💰' },
  [DISCOUNT_TYPES.LIMITED_STOCK]: { label: 'Stock Limitado',    icon: '⏳' },
};

/**
 * Traduce el JSON de `conditions` a un texto legible para el usuario.
 * NO hace validaciones de negocio, solo presenta la información.
 *
 * @param {string} type  — DiscountType
 * @param {object} conditions — JSON almacenado en la regla
 * @returns {string} texto amigable
 */
export function conditionsToText(type, conditions) {
  if (!conditions) return '—';

  switch (type) {
    case DISCOUNT_TYPES.QUANTITY:
      return `Mínimo ${conditions.minQuantity ?? '?'} unidades`;

    case DISCOUNT_TYPES.CASH_PAYMENT:
      return 'Aplica solo en pagos 100% en efectivo';

    case DISCOUNT_TYPES.CLIENT:
      if (conditions.allClients) return 'Aplica a todos los clientes';
      return `Aplica a ${conditions.clientIds?.length ?? 0} cliente(s) seleccionado(s)`;

    case DISCOUNT_TYPES.SPECIAL_DATE:
      return 'Aplica en la fecha configurada';

    case DISCOUNT_TYPES.PRODUCT:
      return `Aplica a ${conditions.productIds?.length ?? 0} producto(s) seleccionado(s)`;

    case DISCOUNT_TYPES.CATEGORY:
      return `Aplica a ${conditions.categoryIds?.length ?? 0} categoría(s) seleccionada(s)`;

    case DISCOUNT_TYPES.MIN_AMOUNT:
      return `En compras de $${conditions.minAmount?.toLocaleString('es-AR') ?? '?'} o más`;

    case DISCOUNT_TYPES.LIMITED_STOCK:
      return `Promo limitada — máx. ${conditions.maxUnits ?? '?'} unidades`;

    default:
      return '—';
  }
}
