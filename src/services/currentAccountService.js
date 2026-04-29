import axios from 'axios';

/**
 * currentAccountService.js
 * ─────────────────────────────────────────────────────────────────
 * Cliente API para el módulo de cuentas corrientes.
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Lista todas las cuentas corrientes de la tienda.
 * @param {string} status - 'OPEN' | 'CLOSED' (opcional)
 */
export const getAllAccounts = (status) =>
  axios.get('/api/accounts', { params: { status } }).then((res) => res.data);

/**
 * Obtiene la cuenta corriente de un cliente específico.
 * @param {string} clientId
 */
export const getAccountByClient = (clientId) =>
  axios.get(`/api/accounts/client/${clientId}`).then((res) => res.data);

/**
 * Obtiene el detalle completo de una cuenta corriente por ID.
 * @param {string} id
 */
export const getAccountDetail = (id) =>
  axios.get(`/api/accounts/${id}`).then((res) => res.data);

/**
 * Abre una cuenta corriente para un cliente.
 * @param {string} clientId
 */
export const openAccount = (clientId) =>
  axios.post('/api/accounts/open', { clientId }).then((res) => res.data);

/**
 * Cierra una cuenta corriente (debe tener saldo 0).
 * @param {string} id
 */
export const closeAccount = (id) =>
  axios.patch(`/api/accounts/${id}/close`).then((res) => res.data);

/**
 * Registra un pago a cuenta corriente.
 * @param {object} data - { clientId, amount, paymentMethod, description }
 */
export const registerPayment = (data) =>
  axios.post('/api/accounts/payment', data).then((res) => res.data);
