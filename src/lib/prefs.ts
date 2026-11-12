/**
 * Preferencias del Santuario del Éter (duración, voz, música, objetivo).
 * Se guardan solo en el teléfono (localStorage); no se envían a ningún servidor.
 */
export const DURATIONS = [3, 5, 10, 20] as const;
export const VOICES = ['female', 'male'] as const;
export const MUSICS = ['nature', 'ethereal', 'piano', 'silence'] as const;
export const GOALS = ['calm', 'focus', 'rest', 'connection'] as const;

export type DurationChoice = (typeof DURATIONS)[number];
export type VoiceChoice = (typeof VOICES)[number];
export type MusicChoice = (typeof MUSICS)[number];
export type GoalChoice = (typeof GOALS)[number];

export type SanctuaryPrefs = {
  minutes: DurationChoice;
  voice: VoiceChoice;
  music: MusicChoice;
  goal: GoalChoice;
};

const KEY = 'sc-sanctuary-prefs';
const DEFAULTS: SanctuaryPrefs = { minutes: 5, voice: 'female', music: 'ethereal', goal: 'calm' };

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function loadSanctuaryPrefs(): SanctuaryPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<SanctuaryPrefs>;
    return {
      minutes: pick(DURATIONS, raw.minutes, DEFAULTS.minutes),
      voice: pick(VOICES, raw.voice, DEFAULTS.voice),
      music: pick(MUSICS, raw.music, DEFAULTS.music),
      goal: pick(GOALS, raw.goal, DEFAULTS.goal),
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveSanctuaryPrefs(prefs: SanctuaryPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}
