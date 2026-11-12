/**
 * Invitaciones al nivel 7 (Santuario del Éter).
 *
 * Las reglas las hace cumplir el servidor (funciones create_invitation y
 * redeem_invitation en Supabase): solo invita quien completó los niveles 1–6,
 * máximo 3 por persona, y cada código sirve para una sola persona.
 */
import { supabase } from './supabase';

export const MAX_INVITATIONS = 3;

export type MyInvitation = { code: string; redeemed: boolean };
export type InviteState = { hasInvite: boolean; mine: MyInvitation[] };
export type InviteError = 'not_authenticated' | 'levels_incomplete' | 'limit_reached' | 'invalid_code' | 'unknown';

export const NO_INVITES: InviteState = { hasInvite: false, mine: [] };

const KNOWN: InviteError[] = ['not_authenticated', 'levels_incomplete', 'limit_reached', 'invalid_code'];
function toError(message: string | undefined): InviteError {
  return KNOWN.find((k) => message?.includes(k)) ?? 'unknown';
}

type Row = { code: string; created_by: string | null; redeemed_by: string | null; redeemed_at: string | null };

/** Lo que este usuario puede ver: las invitaciones que creó y la que canjeó. */
export async function loadInviteState(userId: string | null): Promise<InviteState> {
  if (!supabase || !userId) return NO_INVITES;
  const { data, error } = await supabase
    .from('invitations')
    .select('code, created_by, redeemed_by, redeemed_at')
    .order('created_at', { ascending: true });
  if (error || !data) return NO_INVITES;
  const rows = data as Row[];
  return {
    hasInvite: rows.some((r) => r.redeemed_by === userId),
    mine: rows.filter((r) => r.created_by === userId).map((r) => ({ code: r.code, redeemed: Boolean(r.redeemed_at) })),
  };
}

export async function createInvitation(): Promise<{ code: string } | { error: InviteError }> {
  if (!supabase) return { error: 'not_authenticated' };
  const { data, error } = await supabase.rpc('create_invitation');
  if (error || typeof data !== 'string') return { error: toError(error?.message) };
  return { code: data };
}

export async function redeemInvitation(code: string): Promise<{ error: InviteError | null }> {
  if (!supabase) return { error: 'not_authenticated' };
  const { error } = await supabase.rpc('redeem_invitation', { p_code: code });
  return { error: error ? toError(error.message) : null };
}
