import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { redeemInvitation } from '../lib/invitations';
import Sanctuary from './Sanctuary';

type Props = {
  unlocked: boolean;
  /** Tiene cuenta: puede canjear una invitación. */
  signedIn: boolean;
  /** Se canjeó una invitación: la app vuelve a consultar el acceso. */
  onRedeemed: () => void;
  onBack: () => void;
  onComplete: () => void;
  /** Abre una meditación grabada en el reproductor. */
  onOpenSession: (id: string) => void;
};

export default function Portal({ unlocked, signedIn, onRedeemed, onBack, onComplete, onOpenSession }: Props) {
  const { t } = useLang();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Portal abierto: el Santuario del Éter (entrada, meditación, conversación con Gurú).
  if (unlocked) return <Sanctuary onBack={onBack} onComplete={onComplete} onOpenSession={onOpenSession} />;

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true); setMsg(null);
    const { error } = await redeemInvitation(code);
    setBusy(false);
    if (error) {
      setMsg(t(error === 'invalid_code' ? 'inviteInvalid' : error === 'not_authenticated' ? 'invitationsNeedAccount' : 'inviteError'));
      return;
    }
    onRedeemed(); // al confirmarse el acceso, esta pantalla se convierte en el santuario
  };

  return (
    <div style={wrap}>
      <div className="sc-panel" style={{ padding: 28, maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--gold)', letterSpacing: '0.12em', marginTop: 0 }}>
          {t('universeTitle')}
        </h2>
        <p style={{ fontSize: 13, letterSpacing: '0.08em', opacity: 0.9 }}>{t('sealed')}</p>
        <p style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>{t('portalLockedMsg')}</p>

        <div style={divider} />
        <p style={{ fontSize: 12.5, letterSpacing: '0.06em', margin: '0 0 10px' }}>{t('haveInvitation')}</p>
        {signedIn ? (
          <form onSubmit={redeem} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ETER-XXXX-XXXX"
              aria-label={t('inviteCode')}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={20}
              style={input}
            />
            <button type="submit" className="sc-btn" disabled={busy || !code.trim()} style={{ padding: '11px 20px', fontSize: 14 }}>
              {busy ? '…' : t('useInvitation')}
            </button>
          </form>
        ) : (
          <p style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6, margin: 0 }}>{t('invitationsNeedAccount')}</p>
        )}
        {msg && <p style={{ fontSize: 12, color: '#ffd9a0', margin: '12px 0 0' }}>{msg}</p>}

        <button className="sc-btn" style={{ marginTop: 18, background: 'none', border: 'none', fontSize: 13, opacity: 0.8 }} onClick={onBack}>
          {t('back')}
        </button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 24px var(--tabbar)',
};
const divider: React.CSSProperties = { height: 1, background: 'var(--panel-border)', opacity: 0.5, margin: '18px 0 16px' };
const input: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid var(--panel-border)',
  background: 'rgba(18,12,51,0.5)',
  color: 'var(--gold)',
  fontSize: 15,
  letterSpacing: '0.12em',
  textAlign: 'center',
  outline: 'none',
};
