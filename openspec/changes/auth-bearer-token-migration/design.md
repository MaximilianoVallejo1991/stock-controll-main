# Design: Auth Bearer Token Migration — Frontend

> **Cross-repo design.** Paired half: `stock-controll-back/openspec/changes/auth-bearer-token-migration/design.md`.
> Specs: `auth-session-client` (here), `auth-token-transport` (backend).
> Supersedes the earlier 3-slice / dual-accept design — see *Rollout*.

## Technical Approach

The frontend takes over holding the JWT. One new ~12-line module holds it; the **existing**
`axiosSetup.js` request interceptor attaches it — the same precedent that already injects
`x-store-id` / `x-simulated-role`. No new abstraction, no new dependency, no store coupling.

Because the interceptor is global, the ~30 `/api/...` call sites stay untouched, including the four
sudo-gated ones (`Details.jsx` ×2, `useEntitySave.js`, `DynamicForm.jsx`).

**No cookie fallback and no transition window**: `withCredentials` and the PR #9 proxy rewrite are
removed in this same PR, because the backend stops accepting cookies in its paired PR.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Where the token lives | `src/utils/tokenStorage.js`: session token in `sessionStorage`, sudo token in a module-level `let` | A field in `userStore.js` (Zustand) | **Nothing renders off the token** — only the interceptor and the auth flows read it. Zustand buys reactivity nobody needs, and a store field would still need `sessionStorage` to survive hard refresh. The interceptor already reads storage directly today |
| Why a module at all | The sudo token needs one shared in-memory cell reachable from both the modal and the interceptor | Inline `sessionStorage` calls at each site | Once that module exists, the session-token accessors belong there too — otherwise the `auth-token` key is a magic string in 4 files |
| Persistence | Never added to `partialize` | `localStorage` / the `user-storage` persist blob | Locked: tab-scoped only (`user-storage` is localStorage-backed) |
| Sudo header delivery | Interceptor attaches `x-sudo-token` whenever the in-memory token is set | Threading the header through each sudo-gated call | 4 call sites across 3 files — manual threading risks missing one and silently losing elevation. Verified safe: there is **no third-party axios call** in the app, so no token leaks off-origin |
| Setup-password token | Stored in the **same** `sessionStorage` slot; the interceptor sends it as `Authorization: Bearer` like any other | A second storage slot / explicit header | Exactly what the `token` cookie already did; the backend discriminates via the `purpose` claim (and now rejects it in `authMiddleware`). Zero extra state, `PasswordSetup.jsx` needs no header code |
| Sudo token expiry | No client-side timer; overwritten on next sudo, cleared on logout | `setTimeout` self-clear | The backend is the authority (2 min); a stale header is simply rejected |
| `withCredentials` + PR #9 revert | Both inside this same PR | Separate revert PR / later cleanup | There is no transition to protect: the paired backend PR already refuses cookies. A standalone revert deploy would mean cross-origin cookie auth — the exact Chrome bug this change exists to fix |

## Data Flow

```
Login / PasswordSetup ──> res.data.token | res.data.setupToken ──> setToken()   [sessionStorage]
ConfirmAdminPasswordModal ──> res.data.sudoToken ──────────────> setSudoToken() [memory]

any axios request ──> request interceptor ──> + Authorization: Bearer <token>
                                              + x-sudo-token (if set)
                                              + x-store-id / x-simulated-role (existing)

401 response ──> response interceptor ──> clearTokens() + remove user-storage + redirect '/'
hard refresh (same tab) ──> sessionStorage survives ──> checkSession() ──> user restored
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/utils/tokenStorage.js` | Create | `getToken/setToken` (sessionStorage key `auth-token`), `getSudoToken/setSudoToken`, `clearTokens()` |
| `src/utils/axiosSetup.js` | Modify | Inject `Authorization` + `x-sudo-token` in the existing interceptor; delete `axios.defaults.withCredentials`; `baseURL` → `import.meta.env.VITE_API_URL \|\| 'http://localhost:3000'`; 401 branch also calls `clearTokens()` |
| `src/pages/Login.jsx` | Modify | `setToken(res.data.token)` — or `res.data.setupToken` on the `requiresPasswordChange` branch — before navigating |
| `src/pages/PasswordSetup.jsx` | Modify | `setToken(res.data.token)` on success (the request itself needs no change) |
| `src/components/Modals/ConfirmAdminPasswordModal.jsx` | Modify | `setSudoToken(res.data.sudoToken)` before `onConfirm()`; drop `{ withCredentials: true }` |
| `src/utils/auth.js` | Modify | `clearTokens()` on logout; keep the `/api/auth/logout` call (now a no-op confirmation) |
| `vercel.json` | Modify | Drop the `/api/:path*` → Render rewrite; SPA rewrite only |
| 8 files with per-call `withCredentials` (`exportHelper.js`, `useEntitySave.js`, `Details.jsx` ×2, `RegisterHistory.jsx`, `SalesHistory.jsx`, `SellerPerformance.jsx`, `SalesList.jsx`, `StockHistory.jsx` ×2) | Modify | Remove the now-dead option |

## Interfaces

```js
// src/utils/tokenStorage.js — no reactivity, read directly by the interceptor
export const getToken = () => sessionStorage.getItem('auth-token');
export const setToken = (t) => sessionStorage.setItem('auth-token', t);
let sudoToken = null;                       // memory only: never survives a refresh, by design
export const setSudoToken = (t) => { sudoToken = t; };
export const getSudoToken = () => sudoToken;
export const clearTokens = () => { sessionStorage.removeItem('auth-token'); sudoToken = null; };
```

## Testing Strategy

| Layer | What | How |
|---|---|---|
| Automated | — | No test runner exists in this repo and none is added (locked) |
| Manual (post-deploy, Chrome) | Login, hard refresh in-tab, logout, PIN → setup-password, sudo-gated admin create / toggle-active / reset-pin, and the same three sudo ops **without** confirming the password (must 403) | Checklist in the apply phase |
| Grep gates | `withCredentials` → 0 hits; `vercel.json` has no `/api/:path*` | Before PR |

## Migration / Rollout

**One frontend PR** (`F`), the second of exactly two slices in this change (`B` = backend repo).
They are separate only because they are separate repos and separate deploys.

Deploy **after** `B` is live, immediately after. Auth is broken between the two deploys —
**accepted**: test accounts only, no real users.

`VITE_API_URL` must be set in Vercel production before deploy; there is deliberately no host
fallback, so a missing var fails loud instead of silently hitting the wrong origin.

Rollback: revert `F` and `B` together. No persisted client state to migrate — stale `auth-token`
entries die with the tab.

## Open Questions

- [ ] `RegisterHistory.jsx:111` hardcodes `http://localhost:3000/api/sales/...` — broken in production
      today and after this change. Out of scope; flag to the user as a separate one-line fix.
