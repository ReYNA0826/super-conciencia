/**
 * Conversación de voz con Gurú (agente de ElevenLabs).
 *
 * PRIVACIDAD: iniciar una sesión enciende el micrófono y envía la voz del usuario a
 * ElevenLabs. Solo debe llamarse después de que el usuario acepte el aviso de
 * consentimiento del santuario. Nada de esto se ejecuta al cargar la app.
 */
import type { VoiceChoice } from './prefs';

const AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

/** Voces opcionales por preferencia. Si no están configuradas se usa la voz del agente. */
const VOICE_IDS: Record<VoiceChoice, string | undefined> = {
  female: import.meta.env.VITE_GURU_VOICE_FEMALE,
  male: import.meta.env.VITE_GURU_VOICE_MALE,
};

export const guruConfigured = Boolean(AGENT_ID);

export type GuruStatus = 'connecting' | 'listening' | 'speaking' | 'ended' | 'error';
export type GuruSession = { end: () => Promise<void> };

export async function startGuru(
  voice: VoiceChoice,
  onStatus: (status: GuruStatus) => void,
): Promise<GuruSession> {
  if (!AGENT_ID) throw new Error('guru-not-configured');
  onStatus('connecting');
  // El SDK pesa: se carga solo cuando el usuario decide conversar.
  const { Conversation } = await import('@elevenlabs/client');
  const voiceId = VOICE_IDS[voice];
  const conversation = await Conversation.startSession({
    agentId: AGENT_ID,
    connectionType: 'webrtc',
    ...(voiceId ? { overrides: { tts: { voiceId } } } : {}),
    onModeChange: ({ mode }) => onStatus(mode === 'speaking' ? 'speaking' : 'listening'),
    onDisconnect: () => onStatus('ended'),
    onError: () => onStatus('error'),
  });
  return { end: () => conversation.endSession() };
}
