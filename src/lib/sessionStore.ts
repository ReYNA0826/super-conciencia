/**
 * Lo que el reproductor recuerda entre una visita y otra. Todo vive en el teléfono
 * (localStorage); nada de esto se envía a ningún servidor.
 *
 *  - Ajustes de la sesión: volumen de la voz, volumen de la música y cuánta guía se quiere.
 *  - Sesión interrumpida: dónde quedó la persona, para ofrecerle continuar.
 *  - Favoritas.
 */

export const GUIDES = ['frequent', 'balanced', 'spacious'] as const;
/** frequent = silencios más cortos · balanced = como se escribió · spacious = más silencio */
export type GuideMode = (typeof GUIDES)[number];
export const GUIDE_FACTOR: Record<GuideMode, number> = { frequent: 0.6, balanced: 1, spacious: 1.4 };

export type PlayerPrefs = { voiceVolume: number; musicVolume: number; guide: GuideMode };

const PREFS_KEY = 'sc-player-prefs';
const RESUME_KEY = 'sc-session-resume';
const FAV_KEY = 'sc-favorites';
const DEFAULTS: PlayerPrefs = { voiceVolume: 1, musicVolume: 0.6, guide: 'balanced' };

/** Una sesión interrumpida se ofrece para continuar durante tres días. */
const RESUME_TTL = 3 * 24 * 60 * 60 * 1000;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* sin espacio o modo privado */ }
}

const unit = (v: unknown, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;

export function loadPlayerPrefs(): PlayerPrefs {
  const raw = read<Partial<PlayerPrefs>>(PREFS_KEY) ?? {};
  return {
    voiceVolume: unit(raw.voiceVolume, DEFAULTS.voiceVolume),
    musicVolume: unit(raw.musicVolume, DEFAULTS.musicVolume),
    guide: GUIDES.includes(raw.guide as GuideMode) ? (raw.guide as GuideMode) : DEFAULTS.guide,
  };
}
export function savePlayerPrefs(prefs: PlayerPrefs) { write(PREFS_KEY, prefs); }

/** Punto donde quedó una sesión: bloque y segundos dentro de ese bloque (voz + silencio). */
export type ResumePoint = { sessionId: string; version: string; guide: GuideMode; index: number; offset: number; position: number; savedAt: number };

export function loadResume(sessionId: string): ResumePoint | null {
  const all = read<Record<string, ResumePoint>>(RESUME_KEY) ?? {};
  const point = all[sessionId];
  if (!point || Date.now() - point.savedAt > RESUME_TTL) return null;
  return point;
}
/** La sesión interrumpida más reciente que sigue vigente, si hay alguna. */
export function loadLatestResume(): ResumePoint | null {
  const all = read<Record<string, ResumePoint>>(RESUME_KEY) ?? {};
  const live = Object.values(all).filter((p) => p && Date.now() - p.savedAt <= RESUME_TTL);
  return live.sort((a, b) => b.savedAt - a.savedAt)[0] ?? null;
}
export function saveResume(point: ResumePoint) {
  const all = read<Record<string, ResumePoint>>(RESUME_KEY) ?? {};
  all[point.sessionId] = point;
  write(RESUME_KEY, all);
}
export function clearResume(sessionId: string) {
  const all = read<Record<string, ResumePoint>>(RESUME_KEY) ?? {};
  if (!(sessionId in all)) return;
  delete all[sessionId];
  write(RESUME_KEY, all);
}

export function loadFavorites(): string[] {
  const raw = read<unknown>(FAV_KEY);
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
}
/** Marca o desmarca una favorita y devuelve la lista nueva. */
export function toggleFavorite(sessionId: string): string[] {
  const cur = loadFavorites();
  const next = cur.includes(sessionId) ? cur.filter((id) => id !== sessionId) : [...cur, sessionId];
  write(FAV_KEY, next);
  return next;
}
