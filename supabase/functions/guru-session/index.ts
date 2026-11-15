// Puerta de entrada a Gurú: comprueba que la persona tiene «Premium con Gurú», cuenta sus
// minutos del mes y entrega un pase de un solo uso para conectar con el agente de ElevenLabs.
// No guarda nada de lo que se conversa: solo cuándo empezó y terminó cada sesión.
//
// Secretos (Supabase → Edge Functions → Secrets):
//   ELEVENLABS_API_KEY   clave con permiso de ElevenAgents
//   ELEVENLABS_AGENT_ID  id del agente Gurú
// Mientras falten, responde `not_configured` y la app conecta como antes (sin límite).
// El día del lanzamiento se activa en ElevenLabs que el agente exija autenticación.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const MONTHLY_SECONDS = 20 * 60; // 20 minutos al mes (decisión de Reyna, 15-nov-2026)
const MIN_TO_START = 30;

const KEY = Deno.env.get('ELEVENLABS_API_KEY');
const AGENT = Deno.env.get('ELEVENLABS_AGENT_ID');
const URL_ = Deno.env.get('SUPABASE_URL')!;
const db = createClient(URL_, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!KEY || !AGENT) return json({ error: 'not_configured' }, 503);

  const asUser = createClient(URL_, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await asUser.auth.getUser();
  if (!user) return json({ error: 'sign_in_required' }, 401);

  const body = await req.json().catch(() => ({}));

  if (body.action === 'end') {
    // Cierra la sesión con el tiempo que midió el servidor, nunca con lo que diga la app.
    const { data: s } = await db.from('guru_sessions').select('id, started_at, granted_seconds, ended_at')
      .eq('id', String(body.session_id ?? '')).eq('user_id', user.id).maybeSingle();
    if (s && !s.ended_at) {
      const elapsed = Math.ceil((Date.now() - new Date(s.started_at).getTime()) / 1000);
      await db.from('guru_sessions').update({
        ended_at: new Date().toISOString(), seconds: Math.max(0, Math.min(elapsed, s.granted_seconds)),
      }).eq('id', s.id);
    }
    const { data: used } = await db.rpc('guru_seconds_used', { p_user: user.id });
    return json({ ok: true, remaining_seconds: Math.max(0, MONTHLY_SECONDS - (used ?? 0)) });
  }

  // action: 'start' (o 'status' para solo consultar los minutos que quedan)
  const { data: sub } = await db.from('subscriptions').select('tier, expires_at').eq('user_id', user.id).maybeSingle();
  if (!sub || sub.tier !== 'guru' || new Date(sub.expires_at) <= new Date()) return json({ error: 'no_plan' }, 403);

  const { data: used } = await db.rpc('guru_seconds_used', { p_user: user.id });
  const remaining = Math.max(0, MONTHLY_SECONDS - (used ?? 0));
  if (body.action === 'status') return json({ remaining_seconds: remaining });
  if (remaining < MIN_TO_START) return json({ error: 'no_minutes', remaining_seconds: remaining }, 403);

  const r = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(AGENT)}`,
    { headers: { 'xi-api-key': KEY } });
  if (!r.ok) return json({ error: 'guru_unavailable' }, 502);
  const { token } = await r.json();

  const { data: session, error } = await db.from('guru_sessions')
    .insert({ user_id: user.id, granted_seconds: remaining }).select('id').single();
  if (error || !session) return json({ error: 'db' }, 500);
  return json({ token, session_id: session.id, remaining_seconds: remaining });
});
