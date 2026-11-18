# Archive Report: Free Tier Sleep Overlay

**Date Archived**: 2026-11-18
**Change Name**: free-tier-sleep-overlay
**Artifact Store Mode**: hybrid
**Status**: ARCHIVED — frontend fully implemented, tested, deployed; two post-launch fixes merged; verification complete with 0 CRITICAL issues

---

## Executive Summary

The `free-tier-sleep-overlay` change has been fully implemented, tested, verified, and shipped across both repositories (`stock-controll-back` PR#44, `stock-controll-main` PR#14, both merged to main). The frontend scope (Phase 5-8) is 100% complete: all implementation tasks checked, 8/8 manual verification scenarios passed live against the deployed app, zero CRITICAL findings. Two post-launch fixes (PR#15, PR#16) were merged after the original PR, both found by the project owner testing the live deploy personally.

---

## What Shipped

### New Capabilities
- **free-tier-sleep-overlay**: global overlay (`asleep`/`despertando`/`error` states) mounted once in `App.jsx`, driven by `useBackendIdle` (visibilitychange/focus, no polling) and `wakeStore` (non-persisted phase).

### Modified Capabilities
- `Login.jsx`: shows the overlay immediately on submit (post-launch fix), reconciles into the correct state once role/tier are known.
- `Stores.jsx` / `EntityDetailsForm.jsx`: SISTEMA-only `isFreeTier` toggle (list field + detail-page select, the latter added after a manual-verification bug find).

---

## Test & Verification

- **Manual verification**: 8/8 spec scenarios passed live against a running local backend (idle→asleep, SISTEMA exemption incl. while simulating a role, 30s floor on free-tier login, immediate login for paid/SISTEMA, tier toggle takes effect immediately, phone-width layout, health-check failure→error+Reintentar, retry recovery).
- **sdd-verify**: PASS (0 CRITICAL) on first pass found and required a fix for a real bug — `withWakeFloor` wrapping the failure race caused errors to always wait the 30s floor instead of failing fast. Fixed, re-verified independently (0 CRITICAL confirmed via a fresh Node simulation, not just the orchestrator's claim).
- **Pre-PR `/code-review --high`**: found and fixed 2 more issues — a concurrency race in `useBackendIdle.js` (re-triggering `asleep` while a wake was already in flight) and a leaked `setTimeout`.
- **Lint**: 88 pre-existing problems throughout, unchanged by this change at every checkpoint.

---

## Post-Launch Fixes (both merged after PR#14)

1. **PR#15 — Overlay shown immediately on login submit**: the real ~50s cold-start wait happened during the login POST, but the branded overlay only appeared *after* the response — the opposite of useful. Found live by the project owner. Fixed: `beginWake()` now fires on submit, before role/tier are known; relaxes "SISTEMA never sees it during login" to "dismissed immediately once role is confirmed, no floor."
2. **PR#16 — Wake timeout raised 15s → 60s**: the original 15s timeout was shorter than Render's real ~50s cold-start ceiling, so the first "Despertar" click always timed out before a genuinely sleeping backend finished booting, showing a misleading error; the retry always succeeded because the backend was already warm by then. Found live: "el primer intento siempre falla y el segundo entra."

---

## Artifacts & Traceability

| Artifact | Topic Key |
|----------|---|
| Spec (frontend) | sdd/free-tier-sleep-overlay/spec |
| Design (frontend) | sdd/free-tier-sleep-overlay/design |
| Tasks (frontend) | sdd/free-tier-sleep-overlay/tasks |
| Verify Report (frontend) | sdd/free-tier-sleep-overlay/verify-report-frontend |
| Archive Report (frontend) | sdd/free-tier-sleep-overlay/archive-report-frontend |

**Living spec**: `openspec/specs/free-tier-sleep-overlay/spec.md` — reflects final, corrected behavior (identical content in both repos).

---

## Live State

- Both PRs merged to main (backend#44, frontend#14).
- `isFreeTier` migration applied to the live Supabase DB.
- Feature is live in production with both post-launch fixes applied (frontend#15, frontend#16).

---

## SDD Cycle Closure

**Status**: ARCHIVED
**Next Phase**: None — fully shipped and closed.
