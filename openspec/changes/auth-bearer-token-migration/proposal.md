# Proposal: Auth Bearer Token Migration (Frontend)

> **Cross-repo change.** Paired proposal lives at
> `stock-controll-back/openspec/changes/auth-bearer-token-migration/proposal.md`.
> Frontend and backend MUST ship together — see *Risks*.

## Intent

httpOnly cookie auth is broken in Chrome. This app (`*.vercel.app`) and the API
(`*.onrender.com`) are different sites, so Chrome blocks the `token` cookie as third-party
right after login and kicks the session. PR #9 added a same-origin Vercel proxy rewrite as a
stopgap; this change **replaces** it and reverts it in the same work — no separate revert commit.

The frontend becomes responsible for holding the JWT and attaching it explicitly on every
request via `Authorization: Bearer <token>`.

## Scope

### In Scope

- Read the session JWT from the login / setup-password **response body** and store it in `sessionStorage`.
- Inject `Authorization: Bearer <token>` in the existing `axiosSetup.js` request interceptor (same precedent as `x-store-id` / `x-simulated-role`).
- **Sudo flow**: read the short-lived sudo JWT (2 min) from the `POST /api/auth/sudo` response body, hold it **in memory only**, send it as `x-sudo-token` on the single follow-up elevated request.
- Logout: discard the sessionStorage token and the in-memory sudo token; keep calling `/api/auth/logout` (now a no-op confirmation).
- Remove `axios.defaults.withCredentials = true` and the redundant per-call `{ withCredentials: true }` options.
- **Revert PR #9** inside this change: `vercel.json` back to SPA-only rewrites (drop `/api/:path*` → Render), and `axiosSetup.js` `baseURL` back to `import.meta.env.VITE_API_URL || 'http://localhost:3000'` — no hardcoded host fallback; `VITE_API_URL` is required in production again.

### Out of Scope

- Token refresh or rotation. None exists today; "re-login on expiry" is unchanged (session length now governed solely by the backend's 5h JWT).
- Changing the 401 response-interceptor auto-logout/redirect — it is transport-agnostic.
- Touching the other 28 `/api/...` call sites — the global interceptor covers them all.
- Persisting the token to `localStorage` / the existing `user-storage` Zustand persist blob (**rejected**: survives browser restart, wider XSS exposure; `sessionStorage` is tab-scoped).
- Frontend automated tests — no test runner exists in this repo.

## Capabilities

### New Capabilities

- `auth-session-client`: where the session and sudo tokens live client-side, how they are attached to requests, and how they are discarded.

### Modified Capabilities

- None.

## Approach

1. Add a small **non-persisted** token module (sessionStorage-backed session token + in-memory sudo token). It MUST stay out of `userStore.js`'s `partialize`, which is localStorage-backed.
2. `axiosSetup.js`: extend the request interceptor with `Authorization: Bearer`; drop `withCredentials`; simplify `baseURL`.
3. `Login.jsx` / `PasswordSetup.jsx`: read `res.data.token` and store it before navigating.
4. `ConfirmAdminPasswordModal.jsx`: capture the sudo token in memory, hand it to the follow-up call as `x-sudo-token`.
5. `auth.js` `logoutUser()`: clear both tokens.
6. `vercel.json`: revert to the original SPA-only rewrite.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/utils/tokenStorage.js` (new) | New | sessionStorage session token + in-memory sudo token |
| `src/utils/axiosSetup.js` | Modified | Bearer injection, drop `withCredentials`, fix `baseURL` |
| `src/pages/Login.jsx` | Modified | Store token from response body |
| `src/pages/PasswordSetup.jsx` | Modified | Send setup token explicitly |
| `src/components/Modals/ConfirmAdminPasswordModal.jsx` | Modified | Sudo token capture + `x-sudo-token` |
| `src/utils/auth.js` | Modified | Clear both tokens on logout |
| `vercel.json` | Modified | Revert PR #9 proxy rewrite |
| 9 files with per-call `withCredentials` | Modified | Remove now-dead option |

## Review Workload Forecast

| Metric | Estimate |
|--------|----------|
| Frontend PR total | ~60–100 |
| Backend PR total | ~330–430 (incl. ~250–350 new test lines) |

- **400-line budget risk: Low** for this repo's PR; Medium for the paired backend PR.
- **Chained PRs recommended: Yes** — exactly two, one per repo (`B` backend, then `F` frontend).
  No further split: with no transition window to protect, nothing here can usefully ship alone.
- **Decision needed before apply: Yes** (`ask-on-risk`) — confirm the 2-PR shape.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cross-repo deploy skew — old frontend cookie-code vs new backend (or vice versa) breaks login entirely | Accepted | No real users yet (test accounts only). Backend and frontend deploy in the same window; if order is briefly misaligned, test sessions may break temporarily — accepted, not engineered around (no dual-accept transition period). |
| `VITE_API_URL` missing in Vercel after the proxy revert → all API calls 404 | Medium | User re-adds the env var before deploy; no hardcoded host fallback masks the misconfiguration (fail loud) |
| Session lost on tab close (sessionStorage) where the cookie previously survived | Low | Intended: tab-scoped is the security tradeoff; `checkSession()` still works across hard refresh within the tab |
| Sudo token held in memory is lost on refresh mid-flow | Low | Matches the existing 2-min cookie UX; user simply re-confirms the password |
| XSS can read the sessionStorage token (httpOnly cookie could not) | Medium | Accepted: the cookie is already unusable in Chrome; tab-scoped storage + 5h expiry bound the window |

## Rollback Plan

Revert the frontend commits (restores `withCredentials`, the PR #9 proxy rewrite and the
empty-string prod `baseURL`) **and** the paired backend commits in the same window.
Partial rollback of one repo breaks login — both or neither. No persisted client state to migrate.

## Dependencies

- Backend repo must ship the paired change in the same deploy window.
- `VITE_API_URL` must be set in Vercel production before deploy (user-managed).

## Success Criteria

- [ ] Login works in Chrome end-to-end with zero auth cookies involved.
- [ ] Every `/api/...` call carries `Authorization: Bearer <token>` via the global interceptor.
- [ ] Hard refresh within the tab restores the session through `checkSession()`.
- [ ] Sudo-gated admin creation/promotion succeeds after password confirmation and fails without it.
- [ ] `grep withCredentials` returns zero hits in the frontend.
- [ ] `vercel.json` contains no `/api/:path*` rewrite.
