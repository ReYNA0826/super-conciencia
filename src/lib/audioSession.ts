/**
 * Tipo de sesión de audio del iPhone (navigator.audioSession, solo existe en iOS/Safari).
 *
 *  - 'playback': música y voz guía suenan aunque el teléfono esté en silencio. Con este
 *    tipo el micrófono queda bloqueado.
 *  - 'play-and-record': necesario para conversar con Gurú (micrófono + voz a la vez).
 *
 * Por eso cada parte de la app pide el tipo que necesita justo antes de sonar, en lugar
 * de fijarlo una sola vez: si no, después de una meditación Gurú no podría escuchar.
 */
export type AudioSessionType = 'auto' | 'playback' | 'play-and-record';

export function setAudioSession(type: AudioSessionType) {
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== type) session.type = type;
  } catch { /* no disponible en este sistema */ }
}
