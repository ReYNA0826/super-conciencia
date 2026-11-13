/**
 * Meditaciones grabadas con la voz de Gurú (Santuario del Éter).
 *
 * Cada meditación se grabó por bloques, en cuatro versiones: español e inglés, con voz
 * femenina (Katie) y masculina (Felix). Los audios viven en la nube (Supabase Storage,
 * bucket público `meditaciones`) para no engordar la app; por eso necesitan internet.
 *
 * La duración se elige al empezar: la voz es la misma y cambia el silencio de práctica
 * que sigue a cada bloque (ver docs/agente/guiones-cuidado-emocional-y-autoestima.md).
 */
import type { Lang } from '../i18n/strings';
import type { VoiceChoice } from '../lib/prefs';

/** Lo que se muestra en pantalla mientras suena el bloque. La locución completa está en el audio. */
export type RecordedBlock = { es: string; en: string };

export type RecordedSession = {
  id: string;
  title: { es: string; en: string };
  about: { es: string; en: string };
  blocks: RecordedBlock[];
};

export const SESSION_MINUTES = [20, 25, 30] as const;
export type SessionMinutes = (typeof SESSION_MINUTES)[number];

/** Segundos de cada bloque (voz + silencio) según la duración total. El último siempre dura un minuto. */
const WINDOW: Record<SessionMinutes, number> = { 20: 95, 25: 120, 30: 145 };
const LAST_WINDOW = 60;

export function blockSeconds(minutes: SessionMinutes, index: number, count: number): number {
  return index === count - 1 ? LAST_WINDOW : WINDOW[minutes];
}

export function sessionSeconds(minutes: SessionMinutes, count: number): number {
  return WINDOW[minutes] * (count - 1) + LAST_WINDOW;
}

const STORAGE = import.meta.env.VITE_SUPABASE_URL as string | undefined;

/** Sin la dirección de Supabase no hay de dónde traer los audios. */
export const recordedSessionsAvailable = Boolean(STORAGE);

export function sessionAudioUrl(id: string, lang: Lang, voice: VoiceChoice, index: number): string {
  const folder = `${lang}-${voice === 'female' ? 'f' : 'm'}`;
  const file = String(index + 1).padStart(2, '0');
  return `${STORAGE}/storage/v1/object/public/meditaciones/${id}/${folder}/${file}.m4a`;
}

export const GURU_SESSIONS: RecordedSession[] = [
  {
    id: 'cuidarme',
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
    ],
  },
];
