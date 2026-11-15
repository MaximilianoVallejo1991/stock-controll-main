# Auth Session Client Specification

## Purpose

Defines where the session and sudo tokens live client-side, how they are
attached to requests, and how they are discarded, now that the backend
transports auth via `Authorization: Bearer` only — no cookies, no
credentialed requests. This is an atomic cutover paired with the backend
change (no transition window): only test accounts exist today, so both
repos deploy together and any temporary breakage from deploy-order skew is
an accepted risk, not something engineered around.

## Requirements

### Requirement: Session Token Storage

The frontend MUST read the session JWT from the response body of login and
password-setup requests and MUST store it in `sessionStorage`. The token
MUST NOT be persisted via `userStore.js`'s `localStorage`-backed
`partialize`.

#### Scenario: Login stores the token from the response body

- GIVEN a successful `POST /api/auth/login`
- WHEN the response resolves
- THEN the JWT from `res.data.token` MUST be written to `sessionStorage`
  before navigation

#### Scenario: Password setup stores the token from the response body

- GIVEN a successful password-setup request
- WHEN the response resolves
- THEN the JWT MUST be written to `sessionStorage` before navigation

#### Scenario: Token survives a hard refresh within the tab

- GIVEN a valid token in `sessionStorage`
- WHEN the tab is hard-refreshed
- THEN `checkSession()` MUST still authenticate using the stored token

### Requirement: Session Token Attachment

The global axios request interceptor in `axiosSetup.js` MUST attach
`Authorization: Bearer <token>` using the `sessionStorage` token on every
outgoing request. `axios.defaults.withCredentials` and all per-call
`withCredentials: true` options MUST be removed in this same change — no
cookie is ever transported, so there is nothing to defer.

#### Scenario: Every request carries the bearer header

- GIVEN a `sessionStorage` token exists
- WHEN any `/api/...` call is made through the shared axios instance
- THEN the request MUST include `Authorization: Bearer <token>`
- AND the request MUST NOT set `withCredentials`

#### Scenario: Request without a stored token omits the header

- GIVEN no token exists in `sessionStorage`
- WHEN a request is made
- THEN no `Authorization` header is attached

### Requirement: Sudo Token Handling

The frontend MUST hold the sudo JWT returned by `POST /api/auth/sudo` in
memory only (not `sessionStorage`, not `localStorage`) and MUST send it as
the `x-sudo-token` header on the specific follow-up elevated request only.

#### Scenario: Sudo token is captured in memory and attached once

- GIVEN a successful `POST /api/auth/sudo` response containing a sudo JWT
- WHEN the follow-up elevated request (e.g., admin creation/promotion) is
  sent
- THEN it MUST include `x-sudo-token: <sudo-jwt>`
- AND the sudo token MUST NOT be written to `sessionStorage` or
  `localStorage`

#### Scenario: Sudo token is lost on refresh mid-flow

- GIVEN a sudo token held in memory
- WHEN the tab is refreshed before the elevated request completes
- THEN the sudo token MUST be gone
- AND the user MUST re-confirm their password to obtain a new one

### Requirement: Logout Clears Client State

Logout MUST clear the `sessionStorage` session token and the in-memory sudo
token, and MUST still call `POST /api/auth/logout` (a no-op confirmation —
there is no server-side cookie to clear).

#### Scenario: Logout clears both tokens

- GIVEN an active session token and/or in-memory sudo token
- WHEN `logoutUser()` runs
- THEN the `sessionStorage` token MUST be removed
- AND the in-memory sudo token MUST be cleared
- AND `POST /api/auth/logout` MUST still be called
