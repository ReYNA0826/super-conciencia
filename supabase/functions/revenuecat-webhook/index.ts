// Recibe los avisos de RevenueCat (compras, renovaciones, cancelaciones) y guarda en la base
// qué plan tiene cada persona y qué encuentros pagó. Es la única vía por la que se escribe
// `subscriptions` y `purchase_credits`: la app nunca puede darse acceso a sí misma.
//
// Secretos (Supabase → Edge Functions → Secrets):
//   REVENUECAT_WEBHOOK_SECRET  el mismo valor que se pone en RevenueCat → Integrations →
//                              Webhooks → «Authorization header value» (sin la palabra Bearer).
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (!SECRET) return json({ error: 'not_configured' }, 503);
  const auth = req.headers.get('Authorization') ?? '';
  if (auth !== SECRET && auth !== `Bearer ${SECRET}`) return json({ error: 'unauthorized' }, 401);

  const event = (await req.json().catch(() => null))?.event;
  if (!event?.type) return json({ error: 'bad_request' }, 400);

  // La persona es el id de su cuenta de la app (uuid de Supabase). Las compras hechas como
  // invitado llegan con un id anónimo: se ignoran hasta que inicie sesión (RevenueCat reenvía).
  const ids: string[] = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])];
  const userId = ids.find((id) => typeof id === 'string' && UUID.test(id));
  if (!userId) return json({ ok: true, skipped: 'anonymous' });

  // Compra de una sola vez: un encuentro astral.
  if (event.type === 'NON_RENEWING_PURCHASE') {
    if (String(event.product_id ?? '').startsWith('sc_encuentro') && event.transaction_id) {
      const { error } = await db.from('purchase_credits').upsert(
        { transaction_id: String(event.transaction_id), user_id: userId, product_id: String(event.product_id) },
        { onConflict: 'transaction_id', ignoreDuplicates: true });
      if (error) return json({ error: 'db' }, 500);
    }
    return json({ ok: true });
  }

  // Suscripciones: se guarda el plan y hasta cuándo vale. Una cancelación no quita el acceso:
  // sigue hasta la fecha de vencimiento; al vencer llega EXPIRATION con esa fecha ya pasada.
  const entitlements: string[] = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
  const tier = entitlements.includes('guru') ? 'guru' : entitlements.includes('suscripcion') ? 'plus' : null;
  if (!tier || !event.expiration_at_ms) return json({ ok: true, skipped: event.type });
  const expires = new Date(Number(event.expiration_at_ms));

  // Al cambiar de plan pueden llegar avisos del plan viejo: no dejar que acorten uno vigente mejor.
  const { data: current } = await db.from('subscriptions').select('tier, expires_at').eq('user_id', userId).maybeSingle();
  if (current && current.tier === 'guru' && tier === 'plus' && new Date(current.expires_at) > new Date()
      && event.type !== 'PRODUCT_CHANGE') {
    return json({ ok: true, skipped: 'kept_higher_tier' });
  }
  const { error } = await db.from('subscriptions').upsert(
    { user_id: userId, tier, expires_at: expires.toISOString(), updated_at: new Date().toISOString() });
  if (error) return json({ error: 'db' }, 500);
  return json({ ok: true });
});
