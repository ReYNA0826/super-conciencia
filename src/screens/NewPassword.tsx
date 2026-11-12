import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { updatePassword } from '../lib/auth';

/**
 * Contraseña nueva. Se llega aquí desde el enlace de "restablecer contraseña" del correo,
 * que abre la app ya con sesión; solo falta que la persona escriba su contraseña nueva.
 */
export default function NewPassword({ onDone }: { onDone: () => void }) {
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 6) { setMsg(t('passwordTooShort')); return; }
    if (password !== repeat) { setMsg(t('passwordsDontMatch')); return; }
    setBusy(true);
    setMsg(null);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) { setMsg(t('passwordSaveError')); return; }
    onDone();
  };

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="sc-sheet">
        <h1 style={{ fontSize: 20, letterSpacing: '0.12em', color: 'var(--gold)', margin: 0 }}>
          {t('newPasswordTitle')}
        </h1>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={t('newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={input}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder={t('repeatPassword')}
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            required
            minLength={6}
            style={input}
          />
          <button type="submit" className="sc-btn" disabled={busy} style={{ marginTop: 6 }}>
            {busy ? '…' : t('savePassword')}
          </button>
        </form>
        {msg && <p style={{ fontSize: 12, opacity: 0.85, marginTop: 14, maxWidth: 320, color: '#ffd9a0' }}>{msg}</p>}
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
