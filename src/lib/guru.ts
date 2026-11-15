/**
 * Conversación de voz con Gurú (agente de ElevenLabs).
 *
 * PRIVACIDAD: iniciar una sesión enciende el micrófono y envía la voz del usuario a
 * ElevenLabs. Solo debe llamarse después de que el usuario acepte el aviso de
 * consentimiento del santuario. Nada de esto se ejecuta al cargar la app.
 */
import type { VoiceChoice } from './prefs';
import { supabase } from './supabase';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

/** Voces opcionales por preferencia. Si no están configuradas se usa la voz del agente. */
const VOICE_IDS: Record<VoiceChoice, string | undefined> = {
  female: import.meta.env.VITE_GURU_VOICE_FEMALE,
  male: import.meta.env.VITE_GURU_VOICE_MALE,
};

export const guruConfigured = Boolean(AGENT_ID);

export type GuruStatus = 'connecting' | 'listening' | 'speaking' | 'ended' | 'error';
export type GuruSession = { end: () => Promise<void> };

/** Minutos de Gurú del mes agotados (plan Premium con Gurú: 20 minutos al mes). */
export class GuruLimitError extends Error {}

type Pass = { token: string; sessionId: string; seconds: number };

/**
 * Pide al servidor un pase para conversar (función `guru-session`): comprueba el plan y los
 * minutos del mes. Devuelve null si el servidor aún no tiene esa puerta activada, y entonces se
 * conecta directo como antes. Lanza GuruLimitError si ya no quedan minutos.
 */
async function requestPass(): Promise<Pass | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('guru-session', { body: { action: 'start' } });
  if (!error && data?.token) return { token: data.token, sessionId: data.session_id, seconds: data.remaining_seconds };
  const body = await (error as { context?: Response } | null)?.context?.json?.().catch(() => null);
  if (body?.error === 'no_minutes') throw new GuruLimitError();
  return null; // no configurado, sin plan en el servidor todavía o sin conexión: vía directa
}

export async function startGuru(
  voice: VoiceChoice,
  onStatus: (status: GuruStatus) => void,
): Promise<GuruSession> {
  if (!AGENT_ID) throw new Error('guru-not-configured');
  onStatus('connecting');
  const pass = await requestPass();
  // El SDK pesa: se carga solo cuando el usuario decide conversar.
  const { Conversation } = await import('@elevenlabs/client');
  const voiceId = VOICE_IDS[voice];
  let timer: number | undefined;
  const closeOnServer = () => {
    window.clearTimeout(timer);
    if (pass && supabase) void supabase.functions.invoke('guru-session', { body: { action: 'end', session_id: pass.sessionId } }).catch(() => undefined);
  };
  let conversation: Awaited<ReturnType<typeof Conversation.startSession>>;
  try {
    conversation = await Conversation.startSession({
      ...(pass ? { conversationToken: pass.token } : { agentId: AGENT_ID }),
      connectionType: 'webrtc',
      ...(voiceId ? { overrides: { tts: { voiceId } } } : {}),
      onModeChange: ({ mode }) => onStatus(mode === 'speaking' ? 'speaking' : 'listening'),
      onDisconnect: () => { closeOnServer(); onStatus('ended'); },
      onError: () => onStatus('error'),
    });
  } catch (e) {
    closeOnServer(); // no se conectó: no se cobra ese tiempo
    throw e;
  }
  // Al agotarse los minutos del mes, la conversación termina sola.
  if (pass) timer = window.setTimeout(() => { void conversation.endSession(); }, pass.seconds * 1000);
  return { end: () => conversation.endSession() };
}
