/**
 * wakeTracker.js
 * ─────────────────────────────────────────────────────────────────
 * Pure, memory-only module for tracking API idle time and enforcing
 * a minimum "wake" display floor. No React, no DOM — kept testable
 * even though this project has no test runner today (see design.md
 * "Decision: Frontend verification is manual in v1").
 *
 * lastRequestAt lives in memory ONLY — never persisted to
 * localStorage, consistent with userStore.partialize excluding
 * role/storeId.
 * ─────────────────────────────────────────────────────────────────
 */

export const IDLE_THRESHOLD_MS = 15 * 60 * 1000;
export const WAKE_FLOOR_MS = 30 * 1000;

let lastRequestAt = Date.now();

/** Called from the axios response interceptor on every successful response. */
export const markRequest = () => {
  lastRequestAt = Date.now();
};

/** Elapsed ms since the last successful API response. */
export const getIdleMs = () => Date.now() - lastRequestAt;

/**
 * Awaits `promise` but never resolves/rejects before WAKE_FLOOR_MS has
 * elapsed since `startedAt`. Rejection is absorbed as a value before
 * Promise.all (which short-circuits on reject) and re-surfaced after
 * the floor, so a failed request still respects the 30s minimum.
 */
export const withWakeFloor = async (promise, startedAt = Date.now()) => {
  const remaining = Math.max(0, WAKE_FLOOR_MS - (Date.now() - startedAt));
  const [settled] = await Promise.all([
    promise.then((v) => ({ ok: true, v }), (e) => ({ ok: false, e })),
    new Promise((r) => setTimeout(r, remaining)),
  ]);
  if (!settled.ok) throw settled.e;
  return settled.v;
};
