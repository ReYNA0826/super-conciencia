import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Cliente de Supabase. Devuelve null si aún no hay keys configuradas
 * (así la app corre en modo demo sin backend mientras montamos Supabase).
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const hasBackend = Boolean(supabase);
