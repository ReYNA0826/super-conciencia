/**
 * Mantiene la pantalla encendida durante una práctica. Sin esto el teléfono se bloquea
 * solo a los pocos segundos de no tocarlo, y al bloquearse se corta la voz y la música.
 * Donde el sistema no lo permite, no hace nada.
 */
type Sentinel = { release: () => Promise<void> };
type WakeLockApi = { request: (type: 'screen') => Promise<Sentinel> };

let wanted = false;
let sentinel: Sentinel | null = null;

async function acquire() {
  const api = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock;
  if (!api || sentinel || !wanted || document.visibilityState !== 'visible') return;
  try {
    const lock = await api.request('screen');
    if (wanted) sentinel = lock; else void lock.release().catch(() => undefined);
  } catch { /* batería baja, sin permiso o sistema antiguo */ }
}

// El sistema suelta el permiso cuando la app pasa a segundo plano: se pide de nuevo al volver.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { sentinel = null; void acquire(); }
  });
}

export function keepAwake() {
  wanted = true;
  void acquire();
}

export function allowSleep() {
  wanted = false;
  const lock = sentinel;
  sentinel = null;
  if (lock) void lock.release().catch(() => undefined);
}
