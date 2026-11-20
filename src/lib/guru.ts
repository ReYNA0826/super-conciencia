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

/** El micrófono no está disponible o la persona no dio permiso. */
export class GuruMicError extends Error {
  constructor(public reason: 'denied' | 'unavailable', detail?: string) {
    super(detail ?? reason);
  }
}

/** Texto corto del error para mostrarlo y dejarlo en el registro del servidor. */
export function describeError(e: unknown): string {
  if (e instanceof Error) return `${e.name}: ${e.message}`.slice(0, 300);
  return String(e).slice(0, 300);
}

/**
 * Deja en la consola por qué falló Gurú en el teléfono. La pantalla de Gurú también muestra
 * este texto en pequeño para poder diagnosticarlo sin herramientas de desarrollo.
 */
export function reportGuruError(stage: string, e: unknown): void {
  console.error('guru_client_error', stage, describeError(e));
}

/**
 * Pide el micrófono antes de abrir la sesión. Así el iPhone muestra su aviso de permiso y,
 * si la persona lo negó antes, la app puede decirle dónde activarlo.
 */
async function ensureMicrophone(): Promise<void> {
  const media = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
  if (!media?.getUserMedia) throw new GuruMicError('unavailable', 'navigator.mediaDevices.getUserMedia no existe');
  // iPhone: las meditaciones y la música dejan la sesión de audio en 'playback', y con eso
  // el micrófono no abre («AudioSession category is not compatible with audio capture»).
  // Se devuelve a 'auto' (como al abrir la app, cuando Gurú sí funciona): así el sistema la
  // cambia solo a grabar y reproducir mientras se conversa, con el sonido por el altavoz.
  // Al volver a una meditación, el reproductor la pone otra vez en 'playback'.
  try {
    const audioSession = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (audioSession) audioSession.type = 'auto';
  } catch { /* no disponible en este sistema */ }
  try {
    const stream = await media.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  } catch (e) {
    const name = (e as { name?: string } | null)?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new GuruMicError('denied', describeError(e));
    throw e;
  }
}

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
  try {
    await ensureMicrophone();
  } catch (e) {
    reportGuruError('microphone', e);
    throw e;
  }
  const pass = await requestPass();
  const voiceId = VOICE_IDS[voice];
  let timer: number | undefined;
  const closeOnServer = () => {
    window.clearTimeout(timer);
    if (pass && supabase) void supabase.functions.invoke('guru-session', { body: { action: 'end', session_id: pass.sessionId } }).catch(() => undefined);
  };
  let conversation: Awaited<ReturnType<typeof import('@elevenlabs/client').Conversation.startSession>>;
  try {
    // El SDK pesa: se carga solo cuando el usuario decide conversar.
    const { Conversation } = await import('@elevenlabs/client');
    conversation = await Conversation.startSession({
      ...(pass ? { conversationToken: pass.token } : { agentId: AGENT_ID }),
      connectionType: 'webrtc',
      ...(voiceId ? { overrides: { tts: { voiceId } } } : {}),
      onModeChange: ({ mode }) => onStatus(mode === 'speaking' ? 'speaking' : 'listening'),
      onDisconnect: () => { closeOnServer(); onStatus('ended'); },
      onError: (message: string, context?: unknown) => { reportGuruError('during_session', `${message} ${describeError(context)}`); onStatus('error'); },
    });
  } catch (e) {
    closeOnServer(); // no se conectó: no se cobra ese tiempo
    reportGuruError('start_session', e);
    throw e;
  }
  // Al agotarse los minutos del mes, la conversación termina sola.
  if (pass) timer = window.setTimeout(() => { void conversation.endSession(); }, pass.seconds * 1000);
  return { end: () => conversation.endSession() };
}
