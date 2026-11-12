import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { sendPasswordReset, signInWithPassword, signUpWithPassword } from '../lib/auth';

type Props = {
  /** Llegó por un enlace de correo que ya no sirve: se le explica y se le invita a entrar. */
  linkExpired?: boolean;
  onAuthed: () => void;
  onGuest: () => void;
};

/** 'in' entrar · 'up' crear cuenta · 'forgot' pedir el enlace para restablecer la contraseña */
type Mode = 'in' | 'up' | 'forgot';

export default function Auth({ linkExpired = false, onAuthed, onGuest }: Props) {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(linkExpired ? t('linkExpired') : null);
  useEffect(() => {
    if (linkExpired) setMsg(t('linkExpired'));
  }, [linkExpired, t]);

  const go = (next: Mode) => { setMode(next); setMsg(null); setPassword(''); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);

    if (mode === 'forgot') {
      const { error } = await sendPasswordReset(email.trim());
      setBusy(false);
      // Mismo mensaje exista o no la cuenta: no se revela quién está registrado.
      setMsg(t(error ? 'resetError' : 'resetSent'));
      return;
    }

    const fn = mode === 'in' ? signInWithPassword : signUpWithPassword;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) {
      setMsg(error === 'no-backend' ? t('authError') : error);
      return;
    }
    if (mode === 'up') setMsg(t('checkEmail'));
    else onAuthed();
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
    <div className="sc-sheet">
      <h1 style={{ fontSize: 20, letterSpacing: '0.12em', color: 'var(--gold)', margin: 0 }}>
        {mode === 'forgot' ? t('resetTitle') : t('welcome')}
      </h1>
      {mode === 'forgot' && (
        <p style={{ fontSize: 12.5, lineHeight: 1.5, opacity: 0.8, margin: '10px 0 0', maxWidth: 320 }}>{t('resetIntro')}</p>
      )}

      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={input}
        />
        {mode !== 'forgot' && (
          <input
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={input}
          />
        )}
        <button type="submit" className="sc-btn" disabled={busy} style={{ marginTop: 6 }}>
          {busy ? '…' : mode === 'in' ? t('signIn') : mode === 'up' ? t('signUp') : t('sendResetLink')}
        </button>
      </form>

      {msg && <p style={{ fontSize: 12, opacity: 0.85, marginTop: 14, maxWidth: 320, color: '#ffd9a0' }}>{msg}</p>}

      {mode === 'in' && (
        <button type="button" onClick={() => go('forgot')} style={linkBtn}>{t('forgotPassword')}</button>
      )}

      {mode === 'forgot' ? (
        <button type="button" onClick={() => go('in')} style={linkBtn}>{t('toSignIn')}</button>
      ) : (
        <button type="button" onClick={() => go(mode === 'in' ? 'up' : 'in')} style={linkBtn}>
          {mode === 'in' ? t('toSignUp') : t('toSignIn')}
        </button>
      )}

      <button type="button" onClick={onGuest} style={{ ...linkBtn, opacity: 0.6, marginTop: 4 }}>
        {t('guest')}
      </button>
    </div>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: '13px 16px',
  borderRadius: 14,
  border: '1px solid var(--panel-border)',
  background: 'rgba(18,12,51,0.5)',
  color: 'var(--ink)',
  fontSize: 15,
  outline: 'none',
};
const linkBtn: React.CSSProperties = {
  marginTop: 12,
  background: 'none',
  border: 'none',
  color: 'var(--ink)',
  fontSize: 12.5,
  letterSpacing: '0.04em',
  textDecoration: 'underline',
  opacity: 0.85,
};
