/**
 * Conteo real de presencias en el Santuario del Éter (meditación colectiva).
 *
 * Usa "presencia" de Supabase Realtime: cada persona que entra al santuario se
 * anuncia en un canal compartido y todos reciben cuántas hay en ese momento.
 *
 * PRIVACIDAD: solo se comparte un identificador aleatorio que se crea al entrar y
 * se descarta al salir. No viaja el correo, el nombre ni la cuenta de nadie, y no
 * se guarda nada en la base de datos.
 */
import { supabase } from './supabase';

const TOPIC = 'santuario-del-eter';

// Entrar y salir se encadenan: evita chocar con una salida que aún no termina.
let queue: Promise<unknown> = Promise.resolve();

export function joinSanctuary(onCount: (count: number) => void): () => void {
  const client = supabase;
  if (!client) return () => { /* sin backend no hay conteo */ };

  let left = false;
  let channel: ReturnType<typeof client.channel> | null = null;

  queue = queue.then(() => {
    if (left) return;
    const key = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ch = client.channel(TOPIC, { config: { presence: { key } } });
    channel = ch;
    ch.on('presence', { event: 'sync' }, () => {
      if (!left) onCount(Object.keys(ch.presenceState()).length);
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED' && !left) void ch.track({ since: Date.now() });
    });
  }).catch(() => undefined);

  return () => {
    left = true;
    queue = queue.then(async () => {
      if (channel) await client.removeChannel(channel);
    }).catch(() => undefined);
  };
}
