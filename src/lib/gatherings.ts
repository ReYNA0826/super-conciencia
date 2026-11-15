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

// --- Registro a los encuentros astrales (código de invitación o pago por evento) --------

/** Ids de los encuentros en los que esta persona ya está registrada. */
export async function loadMyRegistrations(userId: string | null): Promise<Set<string>> {
  if (!supabase || !userId) return new Set();
  const { data, error } = await supabase.from('gathering_registrations').select('gathering_id').eq('user_id', userId);
  if (error || !data) return new Set();
  return new Set((data as { gathering_id: string }[]).map((r) => r.gathering_id));
}

export async function registerWithCode(gatheringId: string, code: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('register_gathering_with_code', { p_gathering: gatheringId, p_code: code });
  return !error && data === true;
}

/**
 * Registro por pago: el servidor solo lo acepta cuando la tienda confirmó la compra (aviso de
 * RevenueCat), y eso puede tardar unos segundos; por eso se reintenta un rato.
 * También sirve para usar una compra confirmada que quedó sin registrar.
 */
export async function registerPaid(gatheringId: string, attempts = 8): Promise<boolean> {
  if (!supabase) return false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data, error } = await supabase.rpc('register_gathering_paid', { p_gathering: gatheringId });
    if (!error && data === true) return true;
    if (attempt < attempts - 1) await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}
