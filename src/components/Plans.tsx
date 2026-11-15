import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import {
  billingAvailable, buyPlan, hasTier, loadPlans, restorePurchases, useTier,
  type PlanId, type PlanOffer, type Tier,
} from '../lib/billing';

const PRIVACY_URL = 'https://dreameducationus.com/super-conciencia-privacidad/';
// Términos de uso: el contrato estándar de Apple (EULA), como permite App Store Connect.
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

type Props = {
  /** Qué abrió la pantalla: lo que la persona quería usar. */
  need: Exclude<Tier, 'free'>;
  onClose: () => void;
  /** Se llama cuando ya tiene el acceso que necesitaba. */
  onUnlocked: () => void;
};

/** Pantalla de suscripciones: Suscripción y Suscripción superior, mensual o anual. */
export default function Plans({ need, onClose, onUnlocked }: Props) {
  const { t } = useLang();
  const tier = useTier();
  const [annual, setAnnual] = useState(true);
  const [offers, setOffers] = useState<PlanOffer[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { void loadPlans().then(setOffers); }, []);
  useEffect(() => { if (hasTier(tier, need)) onUnlocked(); }, [tier, need, onUnlocked]);

  const offer = (plan: PlanId) => offers?.find((o) => o.plan === plan);

  const buy = async (plan: PlanId) => {
    const o = offer(plan);
    if (!o || busy) return;
    setBusy(true);
    setMsg(null);
    const result = await buyPlan(o);
    setBusy(false);
    if (result === 'error') setMsg(t('plansError'));
  };

  const restore = async () => {
    setBusy(true);
    setMsg(null);
    const after = await restorePurchases();
    setBusy(false);
    if (after === 'free') setMsg(t('plansNothingToRestore'));
  };

  const cards: { tier: 'plus' | 'guru'; name: string; features: string[] }[] = [
    { tier: 'plus', name: t('planPlus'), features: [t('featLevels56'), t('featVoice'), t('featMusic'), t('featLibrary')] },
    { tier: 'guru', name: t('planGuru'), features: [t('featAllPlus'), t('featGuru')] },
  ];

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label={t('plansTitle')}>
      <div className="sc-panel sc-rise" style={panel}>
        <h2 style={title}>{t('plansTitle')}</h2>
        <p style={lead}>{need === 'guru' ? t('plansNeedGuru') : t('plansNeedPlus')}</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }} role="group" aria-label={t('plansBilling')}>
          <button type="button" className="sc-chip" aria-pressed={!annual} onClick={() => setAnnual(false)}>{t('monthly')}</button>
          <button type="button" className="sc-chip" aria-pressed={annual} onClick={() => setAnnual(true)}>{t('annual')}</button>
        </div>

        {cards.map((c) => {
          const plan = `${c.tier}_${annual ? 'annual' : 'monthly'}` as PlanId;
          const o = offer(plan);
          const current = tier === c.tier;
          const recommended = c.tier === need;
          return (
            <div key={c.tier} style={{ ...card, borderColor: recommended ? 'var(--gold)' : 'var(--panel-border)' }}>
              <span style={cardName}>{c.name}</span>
              <ul style={list}>{c.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {current ? (
                <span style={{ ...small, color: 'var(--gold)', opacity: 1 }}>✓ {t('planCurrent')}</span>
              ) : (
                <button className="sc-btn" disabled={!o || busy} onClick={() => buy(plan)} style={{ marginTop: 10 }}>
                  {o ? `${o.price} / ${annual ? t('perYear') : t('perMonth')}` : t('planUnavailable')}
                </button>
              )}
            </div>
          );
        })}

        {!billingAvailable && <p style={small}>{t('plansOnlyInApp')}</p>}
        {msg && <p style={{ ...small, opacity: 0.9 }} role="status">{msg}</p>}

        <p style={legal}>{t('plansLegal')}</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={TERMS_URL} target="_blank" rel="noreferrer" style={link}>{t('terms')}</a>
          <a href={PRIVACY_URL} target="_blank" rel="noreferrer" style={link}>{t('privacy')}</a>
          {billingAvailable && <button type="button" style={{ ...link, background: 'none', border: 'none' }} disabled={busy} onClick={restore}>{t('restorePurchases')}</button>}
        </div>
        <button style={quiet} onClick={onClose}>{t('notNow')}</button>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 20, background: 'rgba(7, 10, 30, 0.88)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 'calc(var(--safe-top) + 12px) 16px calc(var(--safe-bottom) + 12px)',
};
const panel: React.CSSProperties = {
  width: '100%', maxWidth: 420, maxHeight: '100%', overflowY: 'auto', padding: '20px 18px 14px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
  background: 'rgba(18, 12, 51, 0.92)', boxShadow: '0 0 40px rgba(154, 111, 240, 0.25)',
};
const title: React.CSSProperties = { color: 'var(--gold)', fontSize: 17, letterSpacing: '0.14em', margin: 0, textTransform: 'uppercase' };
const lead: React.CSSProperties = { fontSize: 14, lineHeight: 1.55, margin: '10px 0 0' };
const card: React.CSSProperties = {
  width: '100%', marginTop: 14, padding: '14px 14px 12px', borderRadius: 16, border: '1px solid var(--panel-border)',
  background: 'rgba(18, 12, 51, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center',
};
const cardName: React.CSSProperties = { fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' };
const list: React.CSSProperties = { margin: '8px 0 0', padding: '0 0 0 18px', fontSize: 13, lineHeight: 1.6, textAlign: 'left', alignSelf: 'stretch' };
const small: React.CSSProperties = { fontSize: 12, lineHeight: 1.5, opacity: 0.7, margin: '10px 0 0' };
const legal: React.CSSProperties = { fontSize: 10.5, lineHeight: 1.5, opacity: 0.6, margin: '14px 0 6px' };
const link: React.CSSProperties = { fontSize: 11.5, color: 'var(--ink)', opacity: 0.7, padding: 4 };
const quiet: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--ink)', opacity: 0.7, fontSize: 12.5,
  letterSpacing: '0.08em', marginTop: 8, padding: '6px 10px',
};
