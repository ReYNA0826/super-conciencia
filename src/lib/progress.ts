import { supabase } from './supabase';

const LOCAL_KEY = 'sc-completed';

function readLocal(): number[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function writeLocal(levels: number[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(levels)); } catch { /* ignore */ }
}

/** Carga los niveles completados: de Supabase si hay sesión, si no, de localStorage. */
export async function loadProgress(userId: string | null): Promise<number[]> {
  if (supabase && userId) {
    const { data, error } = await supabase.from('level_progress').select('level').eq('user_id', userId);
    if (!error && data) return data.map((r: { level: number }) => r.level);
  }
  return readLocal();
}

/** Marca un nivel como completado (nube + local). */
export async function saveLevel(userId: string | null, level: number): Promise<void> {
  if (supabase && userId) {
    await supabase.from('level_progress').upsert(
      { user_id: userId, level },
      { onConflict: 'user_id,level' },
    );
  }
  const cur = readLocal();
  if (!cur.includes(level)) writeLocal([...cur, level]);
}
