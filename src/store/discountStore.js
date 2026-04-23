/**
 * discountStore.js
 * ─────────────────────────────────────────────────────────────────
 * Store Zustand exclusivo del panel de administración de descuentos.
 *
 * Responsabilidad única: estado de la lista de reglas y UI del panel admin.
 * El preview del POS vive en posStore.js (separación de responsabilidades).
 *
 * Patrón: create() sin persist — igual que posStore.js.
 * ─────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';

const useDiscountStore = create((set) => ({

  // ─────────────────────────────────────────────────────────────────
  // Estado del Panel de Administración
  // ─────────────────────────────────────────────────────────────────

  /** Lista de reglas de la tienda activa. Se carga desde GET /api/discounts */
  rules: [],

  /** true mientras se está haciendo fetch de la lista de reglas */
  isLoadingRules: false,

  /** Mensaje de error del último fetch, o null */
  rulesError: null,

  /** Regla seleccionada para editar en el modal. null = ninguna / modal cerrado */
  selectedRule: null,

  /** Filtro activo en el panel. 'all' | 'active' | 'inactive' */
  filter: 'all',

  // ─────────────────────────────────────────────────────────────────
  // Acciones
  // ─────────────────────────────────────────────────────────────────

  setRules:        (rules)     => set({ rules }),
  setLoadingRules: (isLoading) => set({ isLoadingRules: isLoading }),
  setRulesError:   (error)     => set({ rulesError: error }),
  setSelectedRule: (rule)      => set({ selectedRule: rule }),
  setFilter:       (filter)    => set({ filter }),

  /**
   * Actualiza o agrega una regla en el array local
   * tras una operación exitosa de create/update/toggle.
   */
  upsertRule: (updatedRule) =>
    set((state) => {
      const exists = state.rules.some((r) => r.id === updatedRule.id);
      return {
        rules: exists
          ? state.rules.map((r) => (r.id === updatedRule.id ? updatedRule : r))
          : [...state.rules, updatedRule],
      };
    }),

  // ─────────────────────────────────────────────────────────────────
  // Reset
  // ─────────────────────────────────────────────────────────────────

  reset: () =>
    set({
      rules: [],
      isLoadingRules: false,
      rulesError: null,
      selectedRule: null,
      filter: 'all',
    }),
}));

export default useDiscountStore;
