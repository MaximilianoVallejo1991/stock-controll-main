# Design: Free Tier Sleep Overlay

## Technical Approach

Three thin seams, no new infrastructure:

1. **DB → auth payload**: `store.isFreeTier` is written only through the existing SISTEMA `allowedFields` whitelist and read by the SPA only through the auth payload (`login` + `/api/auth/check`). No new endpoint for reading tier.
2. **Wake channel**: one new unauthenticated, DB-free `GET /api/health`.
3. **SPA**: one global `<SleepOverlay />` driven by a non-persisted zustand store plus a memory-only `wakeTracker` module. The axios response interceptor is the single write point for `lastRequestAt`.

## Verified Pre-Conditions (read before designing)

| Finding | Consequence for this design |
|---|---|
| `controllers/authController.js` `checkAuth` (L68-91) builds its payload **inline** and does **not** `include: { store: true }` — it does not use `buildUserPayload` | Must add `include: { store: true }` AND route `checkAuth` through `buildUserPayload`, or `isFreeTier` is missing after every F5 |
| `checkAuth` returns `lastName`; `buildUserPayload` does not. `userStore.partialize` reads `state.user.lastName` | `buildUserPayload` must gain `lastName` too, otherwise unifying regresses the persisted profile |
| `storesServices.create` `allowedFields` (L13-19) has **no** `isSistema` branch | `isFreeTier` is dropped on create by design; new stores rely on `@default(true)` |
| `DynamicForm.jsx` supports only `select` + plain `input`, and performs **no** value coercion (L317-353) | UI sends `"true"`/`"false"` strings. Boolean coercion must happen server-side in `storesServices.update` |
| `index.js` mounts a global limiter (1000 req / 15 min / IP) at L87, before all routes | `/api/health` is mounted **before** the limiter |
| `userStore.partialize` deliberately excludes `role`/`storeId` | `isFreeTier` is likewise never persisted; it lives only in the in-memory `user` |
| No `routes/health*` exists (confirmed, 15 route files) | New route file, not an extension |
| `stock-controll-main/package.json` has **no** test runner (dev/build/lint/preview only) | Frontend logic must be extracted to a plain module to stay testable; see Testing Strategy |

## Architecture Decisions

### Decision: `checkAuth` adopts `buildUserPayload`
**Choice**: Extend `buildUserPayload` with `lastName` + `isFreeTier`, then have `checkAuth` call it with `include: { rbacRole: true, store: true }`.
**Alternatives considered**: Duplicate the `isFreeTier` field in `checkAuth`'s inline literal.
**Rationale**: Two payload builders already drifted once (`lastName`). One builder means the tier signal cannot be present at login and absent after reload.

### Decision: `/api/health` is mounted before the global limiter and touches no DB
**Choice**: `app.use('/api/health', healthRoutes)` placed above `app.use(limiter)`; handler returns a static object.
**Alternatives considered**: Mount with the other routes; add a Prisma `SELECT 1`.
**Rationale**: The wake request is the one call that must never fail — a busy multi-terminal store behind one NAT IP must not spend its POS budget on wake pings. The endpoint does zero IO, so exempting it is cheap. A DB probe would also make "wake the web process" fail for an unrelated reason.

### Decision: Boolean coercion is server-side only
**Choice**: Normalize `isFreeTier` to a real Boolean inside `storesServices.update`, after the role check.
**Alternatives considered**: Coerce in `DynamicForm`.
**Rationale**: The service whitelist is already the authoritative boundary (per proposal). Touching `DynamicForm` would change behaviour for every entity in the app.

### Decision: SISTEMA exemption keys on the real role, ignoring `simulatedRole`
**Choice**: `isSistema = user?.role === 'SISTEMA' || user?.rbacRole === 'SISTEMA'` (same expression as `Stores.jsx` L6); `useUserStore.simulatedRole` is not consulted.
**Alternatives considered**: Respect simulation so SISTEMA can preview the overlay.
**Rationale**: Spec requires SISTEMA never be blocked "in any state, on any store". Support work must not be interrupted by a role the operator is only simulating.

### Decision: Overlay mounts below the `isInitializing` gate
**Choice**: `<SleepOverlay />` renders inside `ThemeProvider`, as a sibling of `<RouterProvider>`, i.e. after `App.jsx`'s existing `isInitializing` early return.
**Alternatives considered**: Mount above the gate.
**Rationale**: During bootstrap the only persisted user data is name/avatar — tier and role are unknown, so any tier decision would be a guess. The existing "Cargando Stock Control..." screen already covers that window.

### Decision: Wake floor via `Promise.all` with rejection absorbed
**Choice**: Absorb request rejection into a value before `Promise.all`, then re-surface it.
**Alternatives considered**: Bare `Promise.all([request, timer])`.
**Rationale**: `Promise.all` short-circuits on rejection — a failed health call would otherwise skip the 30s floor and flash the overlay.

### Decision: Wake failure surfaces a dedicated `error` phase with manual retry
**Choice**: The "Despertar" wake handler races `GET /api/health` against a 60s timeout (`Promise.race`, not `withWakeFloor`). On timeout or outright rejection, transition `wakeStore.phase` to `'error'` and stop — no automatic background retry. A "Reintentar" button re-runs the exact same handler, which re-enters `despertando` and restarts the 30s floor from that new attempt.
**Alternatives considered**: Silent auto-retry loop; let the request hang indefinitely under the 30s floor logic.
**Rationale**: `withWakeFloor` is for the *happy path* floor — it must not be reused for failure, or a dead backend would hang the overlay forever with no user-visible signal. User chose the simplest option: no silent retries.
**Revised 2026-11-18**: the timeout was originally 15s, chosen without cross-checking it against Render free-tier's documented real cold-start ceiling (~50s). A genuinely sleeping backend takes up to that long to actually finish booting, so the first "Despertar" click always hit the 15s client timeout before the real cold start completed — showing a misleading error for a backend that was fine, just still starting. The user caught this live ("el primer intento siempre falla, el segundo entra"), the textbook signature of a client timeout shorter than the real operation. Raised to 60s (margin above the ~50s ceiling) so a genuine cold start gets to finish before we give up on it. The 30s floor is unrelated and unaffected — it's a minimum for the success path, not a ceiling.
**Note**: This path only applies to the button-triggered wake. The login-triggered wake (`Login.jsx`) only calls `withWakeFloor(Promise.resolve(), startedAt)` *after* the login POST already resolved successfully — there is nothing left that can fail at that point, so no separate error handling is needed there. (`Login.jsx`'s `axios.post` itself has no artificial client-side timeout, so it naturally waits out a real cold start without needing this fix.)

### Decision: Frontend verification is manual in v1
**Choice**: Put all testable logic in `src/utils/wakeTracker.js` (pure, no React, no DOM) and verify overlay behaviour manually against the spec scenarios.
**Alternatives considered**: Introduce Vitest + Testing Library.
**Rationale**: The SPA has no test runner today; adding one is a separate change with its own config/CI surface. Backend units stay fully covered by the house runner.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (back) | `storesServices.update`: SISTEMA pushes `isFreeTier`; non-SISTEMA drops it; `"false"` coerces to `false` | `tests/tier/store-free-tier-gate.test.js`, house-style `assert()` + `process.exit(1)` |
| Unit (back) | `buildUserPayload` exposes `isFreeTier` for both login and `checkAuth` shapes | same script |
| Integration (back) | `GET /api/health` → 200, no auth required, repeated calls leave data untouched, mounted before the limiter | `tests/tier/health-endpoint.test.js` via the exported `app` |
| Unit (front) | `withWakeFloor` honours the floor from `startedAt`, and still waits the floor when the promise rejects; `getIdleMs` | Pure module — no runner exists today, so logic is isolated in `wakeTracker.js` ready for one |
| Manual (front) | The 8 spec scenarios | Scripted manual pass recorded in `sdd-verify` |

New backend scripts must be registered in `tests/run-all.js`.

## Migration / Rollout

Additive, single nullable-free column with a DB-side default — Postgres backfills existing rows to `true` in the same statement, satisfying the backfill scenario with no `UPDATE`. Following house convention, the SQL is hand-written and **not** executed against the deployed Supabase database without explicit human go-ahead. Rollback: remove `<SleepOverlay />` from `App.jsx`; the column and the health route become inert with no data migration.

## Open Questions

None. All proposal questions were closed on 2026-11-16.
