# Manual QA Checklist — Auth Bearer Token Migration

## Context

This change replaced cookie-based auth (broken in Chrome due to third-party
cookie blocking between `vercel.app` and `onrender.com`) with
`Authorization: Bearer` headers. Both PRs are merged and deployed:

- Backend: `stock-controll-back#42` — live on Render.
- Frontend: `stock-controll-main#10` — live on Vercel.
- Follow-up: `stock-controll-main#11` — logout no longer blocks on the backend.

This checklist verifies the real, deployed behavior in Chrome. It was not
possible to run these against a live backend during implementation — this is
the first real exercise of the full flow end to end.

**Target**: `https://stockdetienda.vercel.app`
**Browser**: Chrome (the browser this migration exists to fix)
**Test accounts**: use existing test accounts — there are no real users yet,
breakage here has no production impact.

## How to read this document

Each test has **Steps**, **Expected Result**, and **Pass Criteria**. Run them
in order — some depend on state left by a previous one (e.g. being logged in).
Record PASS/FAIL and paste any unexpected response body/console error you see.

---

## 1. REST API Reference

All endpoints below are on the backend, reachable directly or through the
frontend's configured `VITE_API_URL`. No request in this flow ever sets or
reads a cookie — if you see `Set-Cookie` in any response, or a cookie named
`token`/`sudo` in DevTools → Application → Cookies, that's a bug.

### `POST /api/auth/login`
- Body: `{ email, password }`
- 200 (normal): `{ message, token, user: { id, email, firstName, lastName, role, storeId, profilePicture } }`
- 200 (must change password): `{ message, requiresPasswordChange: true, setupToken, user: { email } }`
- 401: `{ message }` — wrong credentials, or account deactivated

### `POST /api/auth/setup-password`
- Header: `Authorization: Bearer <setupToken>` (10 min expiry)
- Body: `{ newPassword }` (min 8 chars)
- 200: `{ message, token, user }`
- 401: missing/invalid/expired token
- 400: password missing or too short

### `GET /api/auth/check`
- Header: `Authorization: Bearer <token>`
- 200: `{ id, email, firstName, lastName, role, storeId, profilePicture }`
- 401: missing/invalid/expired token, **or** a token carrying a `purpose` claim (setup/sudo tokens must not authenticate as a session)

### `POST /api/auth/sudo`
- Header: `Authorization: Bearer <token>` (normal session token)
- Body: `{ password }`
- 200: `{ message, sudoToken }` (2 min expiry, bound to the caller's user id)
- 403: role is not `ADMINISTRADOR`/`SISTEMA` (checked **before** password comparison), or wrong password
- 400: password missing

### `POST /api/auth/logout`
- No auth required
- 200: `{ message }` — always succeeds, clears nothing server-side (stateless JWT)

### Sudo-gated actions (create/promote admin, via employee endpoints)
- Extra header: `x-sudo-token: <sudoToken>`
- Rejected (403-class error) if: missing, expired, wrong `purpose`, or `id` doesn't match the caller's own session token

---

## 2. Session Token Tests

### 2.1 Login stores the token correctly
**Steps**: Log in with a valid test account.
**Expected**: Redirects to the main panel. DevTools → Application →
Session Storage → should contain the session token. DevTools → Application →
Cookies → should contain **no** auth cookie.
**Pass**: Logged in, token in `sessionStorage`, zero auth cookies.

### 2.2 Session survives a hard refresh
**Steps**: While logged in, press F5.
**Expected**: Stays logged in, no redirect to login.
**Pass**: Still authenticated after refresh.

### 2.3 Session does NOT survive closing the tab/browser
**Steps**: Log in, fully close the browser (not just the tab in some cases —
close the whole window), reopen, navigate back to the app.
**Expected**: Redirected to login — `sessionStorage` is gone.
**Pass**: Logged out after a real browser close. (This is correct, intended
behavior — not a bug.)

### 2.4 `/api/stores` and `/api/auth/check` no longer 401 right after login
**Steps**: Log in, watch the Network tab for the immediate follow-up requests.
**Expected**: Both return 200 — this is the original bug this whole change
exists to fix.
**Pass**: No 401s immediately after a successful login, in Chrome specifically.

---

## 3. Logout Tests

### 3.1 Logout feels instant
**Steps**: While logged in, click logout.
**Expected**: Immediately clears session and redirects to login — should not
visibly wait on a network request, even if Render's backend is cold-starting.
**Pass**: No perceptible delay before redirect, regardless of backend latency.

### 3.2 Logout actually clears everything
**Steps**: After logging out, check DevTools → Application → Session Storage.
**Expected**: Empty — no leftover session or sudo token.
**Pass**: Session Storage is clean after logout.

---

## 4. Sudo (Admin Elevation) Tests

Requires logging in as a user with role `ADMINISTRADOR` or `SISTEMA`. The
sidebar entry **"Personal"** (route `/employees`) is only visible to those
roles.

### 4.1 Create a new admin — correct password
**Steps**:
1. Go to `/employees`, open the create-user form.
2. Fill in the fields, set role to `ADMINISTRADOR` or `SISTEMA`.
3. Submit — a confirmation modal ("Crear Administrador") should appear
   asking for your own password.
4. Enter the correct password and confirm.

**Expected**: `POST /api/auth/sudo` returns 200, then the actual user-creation
request succeeds carrying `x-sudo-token`. The new user appears in the list.
**Pass**: New admin user created successfully.

### 4.2 Create a new admin — wrong password
**Steps**: Same as 4.1, but enter an incorrect password in the modal.
**Expected**: `POST /api/auth/sudo` returns 403. No user is created. The modal
should surface an error, not close as if it succeeded.
**Pass**: Rejected, no user created, error shown.

### 4.3 Promote an existing user to admin
**Steps**: Go to an existing user's details page
(`/user/details/<id>`, reachable from the Personal list), change their role
to `ADMINISTRADOR` or `SISTEMA`, save.
**Expected**: Same confirmation-modal flow as 4.1; on success the user's role
updates.
**Pass**: Role change applied only after correct-password confirmation.

### 4.4 Sudo token expires after 2 minutes
**Steps**: Confirm sudo successfully (4.1), then **wait over 2 minutes**
without reloading the page, then attempt another sudo-gated action using the
same already-open session.
**Expected**: Must prompt for the password again — the old sudo token should
no longer work.
**Pass**: Re-prompted for password after the 2-minute window; the stale token
is rejected if somehow replayed.

### 4.5 Sudo token is lost on refresh
**Steps**: Open the sudo confirmation modal, but refresh the page (F5) before
entering the password.
**Expected**: Any in-memory sudo state is gone post-refresh. Retrying the
sudo-gated action must ask for the password again from scratch — it must not
be possible to resume with a previously-entered password.
**Pass**: No sudo state survives a refresh.

### 4.6 Non-admin roles can't reach the sudo-gated screens
**Steps**: Log in as `VENDEDOR` or `ENCARGADO`.
**Expected**: The "Personal" sidebar entry / `/employees` route should not be
reachable at all (blocked by role-based routing, unrelated to this specific
change — flag it as a separate bug if it IS reachable).
**Pass**: Route is inaccessible for non-admin roles.

---

## 5. Out of Scope / Known Accepted Items

Do **not** file these as bugs from this checklist — they're already known
and intentional:

- **No "remember me" across browser restarts.** `sessionStorage` is correct
  by design; this is not a persistence bug.
- **No token refresh.** Sessions expire fully after 5h and require a fresh
  login — this is unchanged UX from before the migration, not a regression.
- **Render cold-start latency** on the first request after inactivity is a
  separate, pre-existing infra issue (free tier spin-down), not part of this
  change — logout no longer *waits* on it (see 3.1), but a slow *first*
  request elsewhere in the app during cold-start is expected.
- **`RegisterHistory.jsx` hardcoded localhost URL** — pre-existing bug,
  unrelated to auth, already broken before this change.

---

## 6. Reporting Results

For each test above, report:
- PASS / FAIL
- If FAIL: exact request/response (Network tab), console errors, and repro
  steps if they differ from what's written here.

## Actual QA Results

**All 13 tests: PASS**. The original bug (Chrome kicking sessions due to third-party cookie blocking) is confirmed fixed. No regressions found in any area tested.

### Coverage Notes

- `4.4` and `4.5` scope items are already covered by the backend's automated test suite (`sudo-mode.test.js`), but the live-browser manual run confirmed the end-to-end UX is intact.
- Two test users (`QA Prueba`, `QA Prueba2`) remain in "tienda 1" for continued testing — not a cleanup defect, intentionally left for regression testing.
