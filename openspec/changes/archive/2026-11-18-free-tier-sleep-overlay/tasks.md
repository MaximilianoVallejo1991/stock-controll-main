# Tasks: Free Tier Sleep Overlay

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | Backend ~180-230; Frontend ~260-320 (each is its own PR per repo) |
| 400-line budget risk | Low (both repos) |
| Chained PRs recommended | No |
| Delivery strategy | ask-on-risk |

## Phase 5: Frontend Foundation (`stock-controll-main`)

- [x] 5.1 Create `src/utils/wakeTracker.js` — `IDLE_THRESHOLD_MS`, `WAKE_FLOOR_MS`, in-memory `lastRequestAt`, `markRequest()`, `getIdleMs()`, `withWakeFloor()`.
- [x] 5.2 Create `src/store/wakeStore.js` — non-persisted zustand store: `phase`, `wakeStartedAt`, `setAsleep`, `beginWake`, `endWake`, `setError`.

## Phase 6: Frontend Hook & Overlay

- [x] 6.1 Create `src/hooks/useBackendIdle.js` — reads `isSistema`/`isFreeTier` from `userStore`; registers `visibilitychange`/`focus` listeners; promotes `idle → asleep` at threshold.
- [x] 6.2 Create `src/components/SleepOverlay.jsx` — `asleep` and `despertando` states, Spanish copy, themed via `useTheme()`.
- [x] 6.3 Add `error` phase to `SleepOverlay.jsx` — wake handler races `GET /api/health` against a 60s timeout; on timeout/rejection calls `setError()`.

## Phase 7: Frontend Integration

- [x] 7.1 `src/utils/axiosSetup.js`: success branch calls `markRequest()`.
- [x] 7.2 `src/App.jsx`: mount `<SleepOverlay />` inside `ThemeProvider`.
- [x] 7.3 `src/pages/Login.jsx`: add `beginWake(startedAt)` on submit before POST; reconcile post-response.
- [x] 7.4 `src/pages/Stores.jsx`: add SISTEMA-only `isFreeTier` select field and column.

## Phase 8: Manual Verification

- [x] 8.1 Manual pass of all 8 spec scenarios — all passed live against the local dev stack (2026-11-17 and 2026-11-18).

## Post-launch fix (2026-11-18): login no longer stalls silently during real cold starts

Both PRs merged to `main` and the migration applied to the live Supabase DB on 2026-11-17. User then tested the deployed app personally and found the real-world consequence of the original "neutral loading, then reconcile" login design: the generic "Ingresando..." text was shown for the ENTIRE real ~50s Render cold-start wait, and the branded `despertando` overlay only appeared briefly *after* the response already came back — the opposite of useful.

**Decision**: `beginWake(startedAt)` now fires immediately on submit, before the login POST, so the overlay covers the real wait end-to-end. This relaxes the original "SISTEMA never sees the overlay, including during their own login" rule: SISTEMA can now briefly see the generic `despertando` copy (not free-tier-branded) during their OWN slow login, dismissed immediately (no 30s floor) once the response confirms their role.

`Login.jsx`'s `isSubmitting` local state and the "Ingresando..." button text were removed as dead code — the global overlay already blocks all interaction once mounted.

Lint re-run after this fix: `npx eslint src/pages/Login.jsx` clean.

## Post-launch fix #2 (2026-11-18): wake timeout was shorter than the real cold-start ceiling

User reported from live testing: "cuando se duerme el primer intento de despertar siempre falla y el segundo entra" — the first "Despertar" click always errors out, the retry always succeeds.

**Root cause**: `SleepOverlay.jsx`'s `WAKE_TIMEOUT_MS` was 15s, but Render free-tier's real cold-start ceiling is up to ~50s. The client always gave up at 15s before the real cold start completed, showing a misleading "No pudimos despertar el servidor" for a backend that was fine, just still starting.

**Fix**: `WAKE_TIMEOUT_MS` raised from 15s to 60s (margin above the ~50s ceiling). The 30s floor is unrelated — it's a minimum for the success path, not a ceiling.
