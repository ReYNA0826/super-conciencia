import { supabase, hasBackend } from './supabase';

export type AppUser = { id: string; email: string | null };

function mapUser(u: { id: string; email?: string | null } | null | undefined): AppUser | null {
  return u ? { id: u.id, email: u.email ?? null } : null;
}

export { hasBackend };

export async function getCurrentUser(): Promise<AppUser | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return mapUser(data.session?.user ?? null);
}

export async function signInWithPassword(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'no-backend' };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUpWithPassword(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'no-backend' };
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Escucha cambios de sesión. Devuelve una función para desuscribirse. */
export function onAuthChange(cb: (user: AppUser | null) => void): () => void {
  if (!supabase) return () => { /* noop */ };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(mapUser(session?.user ?? null));
  });
  return () => data.subscription.unsubscribe();
}
