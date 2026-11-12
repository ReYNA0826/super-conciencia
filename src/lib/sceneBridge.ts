/**
 * Puente entre la app y la escena de Spline "El Reino del Éter" (sala del nivel 7).
 *
 * La escena expone en runtime (window.SuperConciencia):
 *   openPortal(), setParticipants(n), setState(estado), setReducedMotion(bool)
 * Versiones anteriores exponían window.AetherPortal.setState('locked' | 'unlocked');
 * se mantiene como respaldo.
 *
 * Si la escena todavía no cargó, guardamos el último estado deseado y lo aplicamos
 * cuando SplineStage avise que terminó de cargar (markSceneReady).
 *
 * IMPORTANTE: todo esto es SOLO VISUAL. Quién puede entrar al portal lo decide el backend.
 */

export type PortalState = 'locked' | 'unlocked';
/** Estados de la sala: Reposo · Meditando · Cierre (botones de prueba de la escena). */
export type SanctuaryState = 'resting' | 'meditating' | 'closing';

type SuperConcienciaApi = {
  openPortal?: () => void;
  lockPortal?: () => void;
  setParticipants?: (n: number) => void;
  setState?: (s: string) => void;
  setReducedMotion?: (on: boolean) => void;
};

type LegacyPortalApi = {
  state?: PortalState;
  setState?: (s: PortalState) => void;
};

declare global {
  interface Window {
    SuperConciencia?: SuperConcienciaApi;
    AetherPortal?: LegacyPortalApi;
  }
}

const desired: {
  portal?: PortalState;
  participants?: number;
  state?: SanctuaryState;
  reducedMotion?: boolean;
} = {};

function api(): SuperConcienciaApi | undefined {
  return typeof window === 'undefined' ? undefined : window.SuperConciencia;
}

function post(type: string, value: unknown) {
  if (typeof window === 'undefined') return;
  // por si la escena vive en un iframe
  window.postMessage({ type, value }, '*');
}

function applyPortal(state: PortalState): boolean {
  const sc = api();
  if (state === 'unlocked' && sc?.openPortal) { sc.openPortal(); return true; }
  if (state === 'locked' && sc?.lockPortal) { sc.lockPortal(); return true; }
  const legacy = typeof window === 'undefined' ? undefined : window.AetherPortal;
  if (legacy?.setState) { legacy.setState(state); return true; }
  post('aether-portal-state', state);
  return false;
}

function applyParticipants(n: number): boolean {
  const sc = api();
  if (sc?.setParticipants) { sc.setParticipants(n); return true; }
  post('aether-participants', n);
  return false;
}

function applyState(s: SanctuaryState): boolean {
  const sc = api();
  if (sc?.setState) { sc.setState(s); return true; }
  post('aether-state', s);
  return false;
}

function applyReducedMotion(on: boolean): boolean {
  const sc = api();
  if (sc?.setReducedMotion) { sc.setReducedMotion(on); return true; }
  post('aether-reduced-motion', on);
  return false;
}

export function setPortalState(state: PortalState) {
  desired.portal = state;
  applyPortal(state);
}

export function setParticipants(n: number) {
  const safe = Math.max(0, Math.floor(n));
  desired.participants = safe;
  applyParticipants(safe);
}

export function setSanctuaryState(state: SanctuaryState) {
  desired.state = state;
  applyState(state);
}

export function setReducedMotion(on: boolean) {
  desired.reducedMotion = on;
  applyReducedMotion(on);
}

/** Respeta la preferencia del teléfono "Reducir movimiento". */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Llamar cuando la escena de Spline terminó de cargar: reaplica el último estado deseado. */
export function markSceneReady() {
  if (desired.reducedMotion === undefined) desired.reducedMotion = prefersReducedMotion();
  applyReducedMotion(desired.reducedMotion);
  if (desired.portal) applyPortal(desired.portal);
  if (desired.state) applyState(desired.state);
  if (desired.participants !== undefined) applyParticipants(desired.participants);
}
