/**
 * wakeStore.js
 * ─────────────────────────────────────────────────────────────────
 * Zustand store for the global free-tier sleep overlay phase.
 *
 * Patrón: create() sin persist — igual que discountStore.js /
 * posStore.js. El tier/estado de despertar es señal sensible y
 * volátil, no debe sobrevivir un F5.
 * ─────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';

const useWakeStore = create((set) => ({
  /** 'idle' | 'asleep' | 'despertando' | 'error' */
  phase: 'idle',

  /** Timestamp (ms) de cuando arrancó el intento de wake actual, o null */
  wakeStartedAt: null,

  /** idle -> asleep. Solo debe ser llamado desde useBackendIdle. */
  setAsleep: () => set({ phase: 'asleep' }),

  /** asleep|idle -> despertando. startedAt marca el inicio del piso de 30s. */
  beginWake: (startedAt = Date.now()) => set({ phase: 'despertando', wakeStartedAt: startedAt }),

  /** despertando -> idle. Wake exitoso. */
  endWake: () => set({ phase: 'idle', wakeStartedAt: null }),

  /** despertando -> error. Timeout o rechazo del health check. */
  setError: () => set({ phase: 'error' }),
}));

export default useWakeStore;
