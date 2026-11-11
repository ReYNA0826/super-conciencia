import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { signInWithPassword, signUpWithPassword } from '../lib/auth';

type Props = {
  onAuthed: () => void;
  onGuest: () => void;
};

export default function Auth({ onAuthed, onGuest }: Props) {
  const { t } = useLang();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
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
    <div style={wrap}>
      <h1 style={{ fontSize: 24, letterSpacing: '0.12em', color: 'var(--gold)', margin: 0 }}>
        {t('welcome')}
      </h1>

      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
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
        <button type="submit" className="sc-btn" disabled={busy} style={{ marginTop: 6 }}>
          {mode === 'in' ? t('signIn') : t('signUp')}
        </button>
      </form>

      {msg && <p style={{ fontSize: 12, opacity: 0.85, marginTop: 14, maxWidth: 320, color: '#ffd9a0' }}>{msg}</p>}

      <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null); }} style={linkBtn}>
        {mode === 'in' ? t('toSignUp') : t('toSignIn')}
      </button>

      <button onClick={onGuest} style={{ ...linkBtn, opacity: 0.6, marginTop: 4 }}>
        {t('guest')}
      </button>
    </div>
  );
}

const wrap: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '0 26px',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
};
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
  marginTop: 18,
  background: 'none',
  border: 'none',
  color: 'var(--ink)',
  fontSize: 12.5,
  letterSpacing: '0.04em',
  textDecoration: 'underline',
  opacity: 0.85,
};
