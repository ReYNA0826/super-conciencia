/**
 * Meditaciones grabadas: las que tienen voz de principio a fin.
 *
 * Cada una se grabó por bloques en cuatro versiones: español e inglés, con voz femenina
 * (Katie) y masculina (Felix). Los audios viven en la nube (Supabase Storage, bucket
 * público `meditaciones`) para no engordar la app; por eso necesitan internet.
 *
 * Un bloque = un audio de voz + el silencio de práctica que le sigue. Con «más guía» o
 * «más silencio» cambia solo el silencio; la voz es la misma.
 *
 * Guiones: docs/guiones (nivel 1) y docs/agente (Gurú). Duraciones medidas de los audios:
 * sessionDurations.ts, que se genera con scripts/medir-audios.py.
 */
import type { Lang } from '../i18n/strings';
import type { MusicChoice, VoiceChoice } from '../lib/prefs';
import { GUIDE_FACTOR, type GuideMode } from '../lib/sessionStore';
import { MEDITATIONS } from './meditations';
import { SESSION_DURATIONS } from './sessionDurations';

export type SessionBlock = {
  /** Frase corta que se muestra mientras suena el bloque. La locución completa está en el audio. */
  es: string;
  en: string;
  /** Silencio de práctica después de la voz, en segundos (modo equilibrado). */
  silence: number;
};

export type RecordedSession = {
  id: string;
  /** Nivel del recorrido al que pertenece; al terminarla, ese nivel queda completado. */
  level?: number;
  /** Dónde se ofrece: en el recorrido de niveles o en la biblioteca de Gurú. */
  shelf: 'path' | 'guru';
  title: { es: string; en: string };
  about: { es: string; en: string };
  blocks: SessionBlock[];
};

export type SessionVersion = `${Lang}-${'f' | 'm'}`;

export function versionOf(lang: Lang, voice: VoiceChoice): SessionVersion {
  return `${lang}-${voice === 'female' ? 'f' : 'm'}`;
}

const STORAGE = import.meta.env.VITE_SUPABASE_URL as string | undefined;

/** Sin la dirección de Supabase no hay de dónde traer los audios. */
export const recordedSessionsAvailable = Boolean(STORAGE);

export function sessionAudioUrls(session: RecordedSession, version: SessionVersion): string[] {
  return session.blocks.map((_, i) =>
    `${STORAGE}/storage/v1/object/public/meditaciones/${session.id}/${version}/${String(i + 1).padStart(2, '0')}.m4a`);
}

/** Duración medida de cada audio de voz; si falta alguna, se estima en 50 s. */
export function sessionVoiceSeconds(session: RecordedSession, version: SessionVersion): number[] {
  const measured = SESSION_DURATIONS[session.id]?.[version] ?? [];
  return session.blocks.map((_, i) => measured[i] ?? 50);
}

export function sessionSilences(session: RecordedSession, guide: GuideMode): number[] {
  return session.blocks.map((b) => Math.round(b.silence * GUIDE_FACTOR[guide]));
}

/** Minutos totales de la sesión con esa versión y esa cantidad de guía. */
export function sessionMinutes(session: RecordedSession, version: SessionVersion, guide: GuideMode): number {
  const voice = sessionVoiceSeconds(session, version).reduce((a, b) => a + b, 0);
  const silence = sessionSilences(session, guide).reduce((a, b) => a + b, 0);
  return Math.max(1, Math.round((voice + silence) / 60));
}

// Silencio que sigue a cada parte del nivel 1 (docs/guiones/nivel-1-el-despertar.md).
const LEVEL_1_SILENCES = [8, 15, 15, 20, 35, 35, 70, 20, 70, 35, 45, 80, 130, 20, 10]; // 14-nov: alargados para llegar a 15–16 min

export const SESSIONS: RecordedSession[] = [
  {
    id: 'nivel-1',
    level: 1,
    shelf: 'path',
    title: { es: 'El Despertar', en: 'Awakening' },
    about: {
      es: 'Tu primera práctica: detenerte, respirar y estar aquí. No necesitas experiencia.',
      en: 'Your first practice: pausing, breathing and being here. No experience needed.',
    },
    blocks: (MEDITATIONS[1] ?? []).map((p, i) => ({ es: p.es, en: p.en, silence: LEVEL_1_SILENCES[i] ?? 20 })),
  },
  {
    id: 'cuidarme',
    shelf: 'guru',
    title: { es: 'Un espacio para cuidarme', en: 'A space to care for myself' },
    about: {
      es: 'Cuidado emocional. Un rato para acompañarte, sin exigirte sentir nada en particular.',
      en: 'Emotional care. Time to keep yourself company, with nothing you have to feel.',
    },
    blocks: [
      { es: 'Bienvenida. Haz espacio para cuidarte, sin exigirte sentir nada.', en: 'Welcome. Make space to care for yourself, with nothing you have to feel.' },
      { es: 'Nota cómo se apoya tu cuerpo. Elige un punto sencillo de atención.', en: 'Notice how your body is supported. Choose a simple point of attention.' },
      { es: 'Si la atención se fue: «pensando». Y vuelve a tu ancla.', en: 'If your attention drifts: “thinking.” Then return to your anchor.' },
      { es: '¿Cómo llegas a este momento? No hace falta profundizar.', en: 'How do you arrive at this moment? There is no need to go deeper.' },
      { es: 'Por ahora puedes dejar una tarea sin resolver.', en: 'For now, you can leave one task unsolved.' },
      { es: 'Vuelve a notar qué te sostiene.', en: 'Notice again what is holding you.' },
      { es: 'Prueba unas palabras que puedas aceptar hoy.', en: 'Try a few words you can accept today.' },
      { es: 'Deja las palabras. Nota un detalle fuera de ti.', en: 'Let the words go. Notice one detail outside of you.' },
      { es: '¿Qué gesto de cuidado me resultaría posible hoy?', en: 'What gesture of care would be possible for me today?' },
      { es: 'No hay una emoción que debas llevarte.', en: 'There is no emotion you must take with you.' },
      { es: 'Nos acercamos al final, sin prisa.', en: 'We move toward the end, without hurry.' },
      { es: 'Un último espacio tranquilo. Seguir o terminar es tu decisión.', en: 'One last quiet space. Continuing or finishing is your choice.' },
      { es: 'La práctica termina aquí. Vuelve a tu ritmo.', en: 'The practice ends here. Return at your own pace.' },
    ].map((b, i, all) => ({ ...b, silence: i === all.length - 1 ? 28 : 65 })),
  },
  // Niveles 2–4: guiones en docs/guiones/niveles-2-3-4-borrador.md (es) y niveles-2-3-4-en.md (en),
  // aprobados por Reyna el 14-nov. Silencios ajustados tras medir los audios para llegar a ~16 min.
  ...LEVELS_2_TO_4(),
];

type Caption = [es: string, en: string, silence: number];

function levelSession(level: number, id: string, title: [string, string], about: [string, string], caps: Caption[]): RecordedSession {
  return {
    id, level, shelf: 'path',
    title: { es: title[0], en: title[1] },
    about: { es: about[0], en: about[1] },
    blocks: caps.map(([es, en, silence]) => ({ es, en, silence })),
  };
}

function LEVELS_2_TO_4(): RecordedSession[] {
  return [
    levelSession(2, 'nivel-2', ['La Calma', 'Inner Calm'], [
      'Pequeños momentos de quietud. No necesitas sentir calma para empezar.',
      "Small moments of stillness. You don't need to feel calm to begin.",
    ], [
      ['Bienvenida. Puedes empezar exactamente como estás.', 'Welcome. You can begin exactly as you are.', 8],
      ['Acomódate. Algo te sostiene ahora mismo.', 'Settle in. Something is holding you right now.', 15],
      ['Reconoce cómo llegas hoy.', 'Notice how you arrive today.', 20],
      ['Acompaña la respiración, tal como está.', 'Keep your breath company, just as it is.', 30],
      ['La salida del aire. Quizá algo descansa.', 'The out-breath. Perhaps something rests.', 35],
      ['Descansa la atención en el apoyo de tu cuerpo.', "Rest your attention on your body's support.", 35],
      ['Escucha los sonidos y el silencio que los rodea.', 'Listen to the sounds and the silence around them.', 70],
      ['Si aparece inquietud, obsérvala con curiosidad.', 'If restlessness appears, observe it with curiosity.', 25],
      ['La pausa: una respiración antes de seguir un pensamiento.', 'The pause: one breath before following a thought.', 70],
      ['El lago (opcional). Si no te ayuda, siente tus manos.', "The lake (optional). If it doesn't help, feel your hands.", 30],
      ['La esfera turquesa (opcional).', 'The turquoise sphere (optional).', 40],
      ['Al salir el aire: «calma». Una invitación.', 'As the air goes out: “calm.” An invitation.', 90],
      ['Quietud. Silencio largo.', 'Stillness. A long silence.', 160],
      ['Nota cómo estás, sin exigir un cambio.', 'Notice how you are, without demanding a change.', 25],
      ['Recuerda la pausa durante tu día. Gracias.', 'Remember the pause during your day. Thank you.', 10],
    ]),
    levelSession(3, 'nivel-3', ['La Presencia', 'Presence'], [
      'Atención a lo que vives ahora: el cuerpo, los sonidos, las sensaciones.',
      "Attention to what you're living now: the body, the sounds, the sensations.",
    ], [
      ['Bienvenida. Estar donde ya estás.', 'Welcome. Being where you already are.', 8],
      ['Una postura cómoda y despierta.', 'A comfortable, awake posture.', 15],
      ['Elige tu ancla: respiración, manos o pies.', 'Choose your anchor: breath, hands or feet.', 30],
      ['Los pies y el suelo.', 'Feet and floor.', 30],
      ['Pies y tobillos.', 'Feet and ankles.', 5],
      ['Piernas y cadera.', 'Legs and hips.', 5],
      ['Espalda y vientre.', 'Back and belly.', 5],
      ['Pecho y hombros.', 'Chest and shoulders.', 5],
      ['Brazos y manos.', 'Arms and hands.', 5],
      ['Cuello, cara y cabeza.', 'Neck, face and head.', 20],
      ['Si hay incomodidad, tú decides dónde poner la atención.', 'If there is discomfort, you decide where to place your attention.', 25],
      ['Escucha lo que hay.', 'Listen to what is there.', 70],
      ['El aire sobre tu piel.', 'The air on your skin.', 30],
      ['Los pensamientos aparecen y se van. Vuelve a tu ancla.', 'Thoughts appear and pass. Return to your anchor.', 70],
      ['Un pensamiento no es una orden.', 'A thought is not an order.', 30],
      ['La luz clara (opcional).', 'The clear light (optional).', 40],
      ['Al entrar: «aquí». Al salir: «ahora».', 'Breathing in: “here.” Breathing out: “now.”', 90],
      ['Presencia abierta. Silencio largo.', 'Open presence. A long silence.', 160],
      ['Lleva esta atención a lo que hagas después.', 'Carry this attention into what you do next.', 25],
      ['Hoy, una actividad con toda tu atención. Gracias.', 'Today, one activity with your full attention. Thank you.', 10],
    ]),
    levelSession(4, 'nivel-4', ['El Corazón', 'The Heart'], [
      'Amabilidad hacia ti y hacia los demás, sin forzar ningún sentimiento.',
      'Kindness toward yourself and others, without forcing any feeling.',
    ], [
      ['Bienvenida. Un poco de espacio para la amabilidad.', 'Welcome. A little space for kindness.', 8],
      ['Si te ayuda, una mano en el pecho.', 'If it helps, a hand on your chest.', 15],
      ['Siente unas respiraciones, tal como vienen.', 'Feel a few breaths, just as they come.', 25],
      ['¿Cómo le hablaría a alguien que quiero?', 'How would I speak to someone I love?', 35],
      ['Que pueda estar en paz. Que pueda tratarme con paciencia.', 'May I be at peace. May I treat myself with patience.', 70],
      ['Si cuesta, vuelve a lo sencillo.', "If it's hard, come back to something simple.", 25],
      ['Alguien que te cuida, un lugar o tus manos. Tú eliges.', 'Someone who cares for you, a place, or your hands. You choose.', 40],
      ['Que estés en paz. Que estés bien.', 'May you be at peace. May you be well.', 65],
      ['Alguien que casi no conoces también quiere estar bien.', 'Someone you barely know also wants to be well.', 50],
      ['Gratitud sin obligación.', 'Gratitude without obligation.', 40],
      ['La esfera cálida (opcional).', 'The warm sphere (optional).', 40],
      ['Al salir el aire: «gracias».', 'As the air goes out: “thank you.”', 90],
      ['Descanso del corazón. Silencio largo.', 'The heart at rest. A long silence.', 160],
      ['La amabilidad empieza por ti.', 'Kindness starts with you.', 25],
      ['Háblate como a alguien que quieres. Gracias.', 'Speak to yourself as to someone you love. Thank you.', 10],
    ]),
  ];
}

/**
 * Plan gratis (decisión de Reyna, 14-nov): los niveles 1–4 son la meditación estándar de ~16 min,
 * con voz, música y cantidad de guía PREDETERMINADAS, sin selector. Elegir voz y música es de la
 * suscripción. Para cambiar la voz o la música de lo gratis, solo se toca FREE_PRESET.
 */
export const FREE_LEVELS_MAX = 4;
export const FREE_PRESET: { voice: VoiceChoice; music: MusicChoice; guide: GuideMode } = {
  voice: 'female',   // Katie
  music: 'santuario', // «Santuario del Éter», música propia de El Mapa de Tu Bienestar
  guide: 'balanced',
};

export function isFreeSession(session: RecordedSession | undefined): boolean {
  return session?.level !== undefined && session.level <= FREE_LEVELS_MAX;
}

export function getSession(id: string): RecordedSession | undefined {
  return SESSIONS.find((s) => s.id === id);
}

/** La meditación grabada de un nivel del recorrido, si ya existe. */
export function sessionForLevel(level: number): RecordedSession | undefined {
  return SESSIONS.find((s) => s.level === level);
}
