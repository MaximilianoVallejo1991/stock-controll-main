/**
 * discountService.js
 * ─────────────────────────────────────────────────────────────────
 * Cliente API para el módulo de descuentos.
 * Encapsula todas las llamadas HTTP a /api/discounts.
 *
 * Patrón: axios con baseURL y cookies configuradas globalmente
 * en utils/axiosSetup.js. No repetir configuración acá.
 *
 * Endpoints disponibles (backend ya implementado):
 *  GET    /api/discounts           → listar reglas de la tienda (activas + inactivas)
 *  GET    /api/discounts/:id       → detalle de una regla
 *  POST   /api/discounts           → crear regla (discount.create)
 *  PUT    /api/discounts/:id       → editar regla (discount.update)
 *  PATCH  /api/discounts/:id/activate   → reactivar regla (discount.update)
 *  PATCH  /api/discounts/:id/deactivate → desactivar regla —soft delete— (discount.delete)
 *  POST   /api/discounts/preview   → calcular descuentos SIN persistir (discount.read)
 * ─────────────────────────────────────────────────────────────────
 */

import axios from 'axios';

// ─────────────────────────────────────────────────────────────────
// CRUD de Reglas
// ─────────────────────────────────────────────────────────────────

/**
 * Lista todas las reglas de descuento de la tienda activa.
 * @returns {Promise<DiscountRule[]>}
 */
export const getAllDiscounts = () =>
  axios.get('/api/discounts').then((res) => res.data);

/**
 * Obtiene el detalle de una regla por ID.
 * @param {string} id
 * @returns {Promise<DiscountRule>}
 */
export const getDiscountById = (id) =>
  axios.get(`/api/discounts/${id}`).then((res) => res.data);

/**
 * Crea una nueva regla de descuento.
 * El backend deriva internamente `layer` y `createdBy`.
 * @param {CreateDiscountRuleDTO} body
 * @returns {Promise<DiscountRule>}
 */
export const createDiscount = (body) =>
  axios.post('/api/discounts', body).then((res) => res.data);

/**
 * Edita una regla existente.
 * @param {string} id
 * @param {UpdateDiscountRuleDTO} body
 * @returns {Promise<DiscountRule>}
 */
export const updateDiscount = (id, body) =>
  axios.put(`/api/discounts/${id}`, body).then((res) => res.data);

/**
 * Desactiva una regla (soft delete). Preserva el historial de auditoría.
 * Requiere permiso discount.delete (ADMINISTRADOR+).
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deactivateDiscount = (id) =>
  axios.patch(`/api/discounts/${id}/deactivate`).then((res) => res.data);

/**
 * Elimina permanentemente una regla de descuento.
 * Requiere permiso discount.delete (ADMINISTRADOR+).
 * @param {string} id
 * @returns {Promise<void>}
 */
export const deleteDiscount = (id) =>
  axios.delete(`/api/discounts/${id}`).then((res) => res.data);

/**
 * Reactiva una regla previamente desactivada.
 * @param {string} id
 * @returns {Promise<void>}
 */
export const activateDiscount = (id) =>
  axios.patch(`/api/discounts/${id}/activate`).then((res) => res.data);

// ─────────────────────────────────────────────────────────────────
// Preview del Motor
// ─────────────────────────────────────────────────────────────────

/**
 * Calcula descuentos para un carrito SIN persistir ningún dato.
 * Usa el mismo motor que la venta real →  el frontend NUNCA calcula descuentos.
 *
 * @param {PreviewRequestDTO} payload
 * @param {CartItem[]}  payload.items          — [{ id, quantity }]
 * @param {string}      [payload.clientId]     — cliente seleccionado (puede ser null)
 * @param {string[]}    [payload.paymentMethods] — métodos elegidos ([] si aún no se eligió)
 *
 * @returns {Promise<DiscountResult>}
 * @returns {number}   .originalTotal
 * @returns {number}   .discountTotal
 * @returns {number}   .finalTotal           ← usar este para el total en el POS
 * @returns {object[]} .appliedDiscounts      ← descuentos ya aplicados (mostrar en boleta)
 * @returns {object[]} .conditionalDiscounts  ← ej: "Pagando en efectivo: 5% más"
 * @returns {string[]} .warnings              ← reglas saltadas por el motor (info)
 */
export const previewDiscounts = (payload) =>
  axios.post('/api/discounts/preview', payload).then((res) => res.data);
