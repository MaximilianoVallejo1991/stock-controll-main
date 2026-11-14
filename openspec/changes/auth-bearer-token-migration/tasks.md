# Tasks: Auth Bearer Token Migration — Frontend (PR F)

> Paired PR: `stock-controll-back` (PR B). Deploy after B, immediately. No test runner in this repo — Strict TDD does not apply; no test tasks are invented.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~55–90 (tokenStorage.js ~20 new; axiosSetup.js ~8; Login/PasswordSetup/Modal/auth.js ~2–3 each; vercel.json ~4; 8 files' dead `withCredentials` removal ~10) |
| 400-line budget risk | Low |
| Chained PRs recommended | No — already resolved as 1 of 2 independent, standalone PRs |
| Suggested split | Single PR F, as decided |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (not applicable — well under budget, no exception needed) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Token Storage
- [x] 1.1 Create `src/utils/tokenStorage.js`: `getToken`/`setToken` (sessionStorage key `auth-token`), `getSudoToken`/`setSudoToken` (module-level `let`, memory-only), `clearTokens()`.

## Phase 2: Transport Wiring
- [x] 2.1 `src/utils/axiosSetup.js`: request interceptor adds `Authorization: Bearer <getToken()>` and `x-sudo-token: <getSudoToken()>` when set; remove `axios.defaults.withCredentials = true`; `baseURL` → `import.meta.env.VITE_API_URL || 'http://localhost:3000'`; response interceptor's 401 branch also calls `clearTokens()`.

## Phase 3: Auth Flows
- [x] 3.1 `src/pages/Login.jsx`: call `setToken(res.data.token)` (or `res.data.setupToken` on the `requiresPasswordChange` branch) before navigating.
- [x] 3.2 `src/pages/PasswordSetup.jsx`: call `setToken(res.data.token)` on success, before navigating.
- [x] 3.3 `src/components/Modals/ConfirmAdminPasswordModal.jsx`: call `setSudoToken(res.data.sudoToken)` before `onConfirm()`; drop `{ withCredentials: true }` from the `/api/auth/sudo` call.
- [x] 3.4 `src/utils/auth.js`: `logoutUser()` calls `clearTokens()`; keep the `/api/auth/logout` call.

## Phase 4: Dead Option + Revert Cleanup
- [x] 4.1 Remove `{ withCredentials: true }` from the 8 remaining call sites: `exportHelper.js`, `useEntitySave.js`, `Details.jsx` (×2), `RegisterHistory.jsx`, `SalesHistory.jsx`, `SellerPerformance.jsx`, `SalesList.jsx`, `StockHistory.jsx` (×2).
- [x] 4.2 `vercel.json`: drop the `/api/:path*` → Render rewrite; keep the SPA-only rewrite.

## Phase 5: Verification
- [x] 5.1 Grep gate: zero hits for `withCredentials` in `src/`; `vercel.json` has no `/api/:path*` rewrite.
- [x] 5.2 Manual checklist (Chrome, post-deploy): login, hard refresh in-tab, logout, PIN→setup-password; sudo-gated admin create / toggle-active / reset-pin succeed with confirm and fail with 403 without it. (Static review done pre-deploy — see Issues Found; live-Chrome pass is the user's post-deploy responsibility, no backend available in this sandbox.)
