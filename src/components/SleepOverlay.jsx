/**
 * SleepOverlay.jsx
 * ─────────────────────────────────────────────────────────────────
 * Global overlay explaining Render free-tier cold starts to
 * non-SISTEMA users on free-tier stores. Self-contained — no props,
 * mounted once in App.jsx. Renders null on 'idle'.
 *
 * - useBackendIdle() drives idle -> asleep promotion.
 * - 'asleep': art + copy + "Despertar" button.
 * - 'despertando': copy + animation, no button (also reached from
 *   Login.jsx's wake trigger on submit).
 * - 'error': copy + "Reintentar" button, reached only from a
 *   failed/timed-out wake attempt (button-triggered wake only —
 *   the login-triggered wake never fails because it only waits out
 *   the 30s floor after the login POST already resolved).
 * ─────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import useWakeStore from '../store/wakeStore';
import useBackendIdle from '../hooks/useBackendIdle';
import { useTheme } from '../context/ThemeContext';
import ThemedButton from './ThemedButton';
import { withWakeFloor } from '../utils/wakeTracker';

const WAKE_TIMEOUT_MS = 15 * 1000;

const COPY = {
  asleep: {
    title: 'El servidor está en reposo',
    body: 'Tu plan gratuito pone el servidor en reposo luego de 15 minutos sin actividad. Despertarlo demora unos segundos.',
    button: 'Despertar',
  },
  despertando: {
    title: 'Despertando el servidor...',
    body: 'Esto puede demorar hasta 30 segundos. No cierres esta ventana.',
  },
  error: {
    title: 'No pudimos despertar el servidor',
    body: 'Puede ser una conexión lenta. Probá de nuevo en unos segundos.',
    button: 'Reintentar',
  },
};

const SleepOverlay = () => {
  useBackendIdle();

  const { theme } = useTheme();
  const phase = useWakeStore((state) => state.phase);
  const beginWake = useWakeStore((state) => state.beginWake);
  const endWake = useWakeStore((state) => state.endWake);
  const setError = useWakeStore((state) => state.setError);

  if (phase === 'idle') {
    return null;
  }

  const wake = async () => {
    const startedAt = Date.now();
    beginWake(startedAt);
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('timeout')), WAKE_TIMEOUT_MS);
    });
    try {
      // La carrera contra el timeout debe poder fallar YA, sin piso de espera.
      // El piso de 30s se aplica recién después de confirmar éxito (withWakeFloor
      // vuelve siempre resuelto, así que envolver la carrera acá haría que un
      // fallo espere igual los 30s completos antes de mostrar el error).
      await Promise.race([axios.get('/api/health'), timeout]);
      clearTimeout(timeoutId); // la request ganó la carrera, el timeout queda sin uso
      await withWakeFloor(Promise.resolve(), startedAt);
      endWake();
    } catch {
      clearTimeout(timeoutId);
      setError();
    }
  };

  const copy = COPY[phase];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: theme.bgAlpha || 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="w-full max-w-sm rounded shadow-md p-6 text-center flex flex-col items-center gap-4"
        style={{ backgroundColor: theme.bg2, color: theme.text }}
      >
        {phase === 'despertando' ? (
          <div className="text-6xl animate-bounce" aria-hidden="true">🤖💤</div>
        ) : (
          <div className="text-6xl w-32 sm:w-48" aria-hidden="true">
            {phase === 'error' ? '🤖⚠️' : '🤖💤'}
          </div>
        )}

        <h2 className="text-xl font-bold">{copy.title}</h2>
        <p className="text-sm">{copy.body}</p>

        {phase === 'asleep' && (
          <ThemedButton onClick={wake}>{COPY.asleep.button}</ThemedButton>
        )}

        {phase === 'error' && (
          <ThemedButton onClick={wake}>{COPY.error.button}</ThemedButton>
        )}
      </div>
    </div>
  );
};

export default SleepOverlay;
