/**
 * Biblioteca de «Música»: canciones instrumentales propias de Reyna (El Mapa de Tu Bienestar)
 * para escuchar sin meditación. Solo Premium (Plus o Gurú).
 *
 * Los audios viven en el bucket privado `premium`, carpeta `musica/` (originales en
 * store-assets/musica-app, nivelados a −16 LUFS, AAC 160 kbps). El servidor solo entrega
 * direcciones firmadas a quien tiene una suscripción vigente. Para agregar una canción:
 * subir `musica/<clave>.m4a` al bucket y añadirla a LIBRARY.
 */
import { supabase } from '../lib/supabase';

export type Mood = 'calm' | 'energy';
export type Track = { key: string; title: string; seconds: number; mood: Mood };

export const LIBRARY: Track[] = [
  // Calma: también se pueden usar de fondo en las meditaciones.
  { key: 'santuario', title: 'Santuario del Éter', seconds: 268, mood: 'calm' },
  { key: 'refugio', title: 'Éter · Mi refugio interior', seconds: 255, mood: 'calm' },
  { key: 'horizontal-de-luz', title: 'Horizontal de Luz', seconds: 260, mood: 'calm' },
  { key: 'sea-tides', title: 'Sea Tides at 432', seconds: 360, mood: 'calm' },
  { key: 'open-horizon', title: 'Open Horizon', seconds: 360, mood: 'calm' },
  { key: 'stillness-within', title: 'Stillness Within', seconds: 180, mood: 'calm' },
  { key: 'forest-dawn', title: 'Forest Dawn Stillness', seconds: 180, mood: 'calm' },
  { key: 'bosque', title: 'Bosque al Amanecer', seconds: 254, mood: 'calm' },
  { key: 'amanecer', title: 'Amanecer Discreto', seconds: 219, mood: 'calm' },
  { key: 'mar', title: 'La Calma · Mar en reposo', seconds: 210, mood: 'calm' },
  { key: 'ceremonial', title: 'Resonante, austero y ceremonial', seconds: 429, mood: 'calm' },
  { key: 'saturno', title: 'La Súper Conciencia de Saturno', seconds: 189, mood: 'calm' },
  { key: 'mente', title: 'La mente', seconds: 179, mood: 'calm' },
  // Energía: para escuchar; no se ofrecen de fondo en las meditaciones.
  { key: 'despierta-tu-poder', title: 'Despierta tu poder', seconds: 191, mood: 'energy' },
  { key: 'invencible', title: 'Invencible', seconds: 193, mood: 'energy' },
  { key: 'renacer', title: 'Renacer', seconds: 197, mood: 'energy' },
  { key: 'fuerza-infinita', title: 'Fuerza infinita', seconds: 169, mood: 'energy' },
  { key: 'soy-energia', title: 'Soy energía', seconds: 175, mood: 'energy' },
  { key: 'mas-alla-del-miedo', title: 'Más allá del miedo', seconds: 187, mood: 'energy' },
  { key: 'vuela-mas-alto', title: 'Vuela más alto', seconds: 164, mood: 'energy' },
  { key: 'nada-me-detiene', title: 'Nada me detiene', seconds: 250, mood: 'energy' },
  { key: 'todo-es-posible', title: 'Todo es posible', seconds: 269, mood: 'energy' },
  { key: 'euphoric-ascent', title: 'Euphoric Ascent', seconds: 256, mood: 'energy' },
];

/** Dirección firmada (2 h) de una canción. null si no se pudo (sin cuenta, sin plan o sin conexión). */
export async function trackUrl(key: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from('premium').createSignedUrl(`musica/${key}.m4a`, 7200);
  return error || !data?.signedUrl ? null : data.signedUrl;
}

export function formatTime(total: number): string {
  const s = Math.max(0, Math.floor(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
