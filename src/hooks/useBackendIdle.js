/**
 * useBackendIdle.js
 * ─────────────────────────────────────────────────────────────────
 * Promotes wakeStore.phase from 'idle' to 'asleep' when the tab
 * regains visibility/focus after the backend has been idle past
 * IDLE_THRESHOLD_MS. No setInterval, no polling — background tabs
 * and OS sleep throttle timers, so idle is only re-evaluated on
 * visibilitychange/focus events (per spec: "Idle Detection via
 * lastRequestAt").
 *
 * SISTEMA (real role, ignoring simulatedRole) and non-free-tier
 * stores never register listeners — SISTEMA must never see the
 * overlay, in any state, on any store (per spec).
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect } from 'react';
import useUserStore from '../store/userStore';
import useWakeStore from '../store/wakeStore';
import { getIdleMs, IDLE_THRESHOLD_MS } from '../utils/wakeTracker';

const useBackendIdle = () => {
  const user = useUserStore((state) => state.user);
  const setAsleep = useWakeStore((state) => state.setAsleep);

  const isSistema = user?.role === 'SISTEMA' || user?.rbacRole === 'SISTEMA';
  const isFreeTier = user?.isFreeTier ?? false;

  useEffect(() => {
    if (isSistema || !isFreeTier || !user) {
      return;
    }

    const evaluateIdle = () => {
      // No re-dormir si ya hay un wake en curso (despertando/error) — si no,
      // un refocus durante el cold start de Render reinicia 'asleep' encima
      // de un wake() en vuelo y dos llamadas terminan pisándose el phase.
      if (
        useWakeStore.getState().phase === 'idle' &&
        document.visibilityState === 'visible' &&
        getIdleMs() >= IDLE_THRESHOLD_MS
      ) {
        setAsleep();
      }
    };

    document.addEventListener('visibilitychange', evaluateIdle);
    window.addEventListener('focus', evaluateIdle);

    return () => {
      document.removeEventListener('visibilitychange', evaluateIdle);
      window.removeEventListener('focus', evaluateIdle);
    };
  }, [isSistema, isFreeTier, user, setAsleep]);
};

export default useBackendIdle;
