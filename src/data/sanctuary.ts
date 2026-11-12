import { MEDITATIONS, type MeditationPhase } from './meditations';
import type { DurationChoice, GoalChoice } from '../lib/prefs';

/** Frase de apertura según el objetivo elegido. Mismo tono que meditations.ts. */
export const GOAL_INTRO: Record<GoalChoice, { es: string; en: string }> = {
  calm: {
    es: 'Tu intención es la calma. Deja que todo se aquiete.',
    en: 'Your intention is calm. Let everything grow quiet.',
  },
  focus: {
    es: 'Tu intención es la claridad. Reúne tu atención en un solo punto.',
    en: 'Your intention is clarity. Gather your attention to a single point.',
  },
  rest: {
    es: 'Tu intención es el descanso. Suelta el peso del día.',
    en: 'Your intention is rest. Let go of the weight of the day.',
  },
  connection: {
    es: 'Tu intención es la conexión. Ábrete a lo que vive en ti.',
    en: 'Your intention is connection. Open to what lives within you.',
  },
};

/**
 * Sesión del santuario: la frase del objetivo + las fases del nivel 7, repartidas
 * en proporción para que el total dure exactamente los minutos elegidos.
 */
export function buildSanctuarySession(minutes: DurationChoice, goal: GoalChoice): MeditationPhase[] {
  const base: MeditationPhase[] = [{ ...GOAL_INTRO[goal], seconds: 20 }, ...(MEDITATIONS[7] ?? [])];
  const total = minutes * 60;
  const sum = base.reduce((acc, p) => acc + p.seconds, 0);
  let used = 0;
  return base.map((p, i) => {
    const seconds = i === base.length - 1 ? total - used : Math.round((p.seconds * total) / sum);
    used += seconds;
    return { ...p, seconds };
  });
}
