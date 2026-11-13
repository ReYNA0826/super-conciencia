/**
 * Reuniones de conciencias: el calendario de meditaciones colectivas del
 * Santuario del Éter (nivel 7).
 *
 * Las fechas viven en la tabla `gatherings` de Supabase. Cualquiera puede leerlas;
 * solo se escriben desde el panel de Supabase. No guardan ningún dato de las personas:
 * quién está presente lo cuenta `presence.ts` en vivo y no se almacena.
 */
import { supabase } from './supabase';

export type Gathering = {
  id: string;
  startsAt: Date;
  minutes: number;
  titleEs: string;
  titleEn: string;
};

type Row = { id: string; starts_at: string; minutes: number; title_es: string; title_en: string };

const MINUTE = 60_000;
const LONGEST = 180; // minutos: ninguna reunión dura más (lo exige la tabla)

export function gatheringEnd(g: Gathering): number {
  return g.startsAt.getTime() + g.minutes * MINUTE;
}

/** ¿Está ocurriendo en este momento? */
export function isLive(g: Gathering, now: number): boolean {
  return now >= g.startsAt.getTime() && now < gatheringEnd(g);
}

/** Las próximas reuniones, incluida la que esté en curso. Vacío si no hay o no hay conexión. */
export async function loadUpcomingGatherings(limit = 4): Promise<Gathering[]> {
  if (!supabase) return [];
  const now = Date.now();
  const { data, error } = await supabase
    .from('gatherings')
    .select('id, starts_at, minutes, title_es, title_en')
    .gte('starts_at', new Date(now - LONGEST * MINUTE).toISOString())
    .order('starts_at', { ascending: true })
    .limit(limit + 4);
  if (error || !data) return [];
  return (data as Row[])
    .map((r) => ({
      id: r.id,
      startsAt: new Date(r.starts_at),
      minutes: r.minutes,
      titleEs: r.title_es,
      titleEn: r.title_en,
    }))
    .filter((g) => !Number.isNaN(g.startsAt.getTime()) && gatheringEnd(g) > now)
    .slice(0, limit);
}

/** Fecha y hora en el idioma de la app y en la hora del teléfono: "sábado, 22 de noviembre, 8:00 p. m." */
export function formatGathering(g: Gathering, lang: 'es' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es' : 'en', {
    weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(g.startsAt);
}
