/**
 * Regla de acceso al portal (nivel 7) y puente visual hacia la escena.
 * El candado/desbloqueo en la escena es SOLO VISUAL — la autorización real la decide el backend.
 */
export { setPortalState, type PortalState } from './sceneBridge';

/** Regla de desbloqueo: 6 niveles completados O invitación válida. */
export function isPortalUnlocked(completedLevels: number[], hasInvite: boolean): boolean {
  const firstSix = [1, 2, 3, 4, 5, 6];
  const didSix = firstSix.every((n) => completedLevels.includes(n));
  return didSix || hasInvite;
}
