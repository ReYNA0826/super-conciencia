/**
 * Puente hacia el "Portal State module" que ya vive dentro de la escena de Spline.
 * La escena expone en runtime:  window.AetherPortal.setState('unlocked' | 'locked')
 * y también escucha postMessage({ type: 'aether-portal-state', state }).
 *
 * El candado/desbloqueo es SOLO VISUAL — la autorización real la decide el backend.
 */
type PortalState = 'locked' | 'unlocked';

declare global {
  interface Window {
    AetherPortal?: {
      state: PortalState;
      setState: (s: PortalState) => void;
      lock: () => void;
      unlock: () => void;
    };
  }
}

export function setPortalState(state: PortalState) {
  if (typeof window === 'undefined') return;
  if (window.AetherPortal?.setState) {
    window.AetherPortal.setState(state);
  } else {
    // la escena puede vivir en un iframe: avisamos por postMessage
    window.postMessage({ type: 'aether-portal-state', state }, '*');
  }
}

/** Regla de desbloqueo: 6 niveles completados O invitación válida. */
export function isPortalUnlocked(completedLevels: number[], hasInvite: boolean): boolean {
  const firstSix = [1, 2, 3, 4, 5, 6];
  const didSix = firstSix.every((n) => completedLevels.includes(n));
  return didSix || hasInvite;
}
