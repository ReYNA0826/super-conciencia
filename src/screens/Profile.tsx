import { useLang } from '../i18n/LanguageContext';
import { LEVELS } from '../data/levels';
import type { AppUser } from '../lib/auth';

type Props = {
  completed: number[];
  unlocked: boolean;
  user: AppUser | null;
  onSignOut: () => void;
  onBack: () => void;
};

export default function Profile({ completed, unlocked, user, onSignOut, onBack }: Props) {
  const { lang, setLang, t } = useLang();

  return (
    <div style={wrap}>
      <h2 style={{ color: 'var(--gold)', letterSpacing: '0.12em' }}>{t('profile')}</h2>

      {user?.email && (
        <p style={{ fontSize: 12.5, opacity: 0.8, marginTop: -6 }}>{user.email}</p>
      )}

      <section className="sc-panel" style={{ padding: 18, width: '100%', maxWidth: 420 }}>
        <h3 style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 0 }}>{t('progress')}</h3>
        {LEVELS.map((lvl) => {
          const isFinal = lvl.id === 7;
          const done = isFinal ? unlocked : completed.includes(lvl.id);
          return (
            <div key={lvl.id} style={row}>
              <span style={{ ...dot, background: done ? lvl.color : 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontSize: 12, opacity: done ? 1 : 0.6 }}>
                {lang === 'es' ? lvl.es : lvl.en}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>
                {isFinal && !unlocked ? t('sealed') : done ? '✓' : ''}
              </span>
            </div>
          );
        })}
      </section>

      <section className="sc-panel" style={{ padding: 18, width: '100%', maxWidth: 420, marginTop: 14 }}>
        <h3 style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 0 }}>{t('language')}</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['es', 'en'] as const).map((l) => (
            <button key={l} className="sc-btn" style={{ padding: '8px 16px', opacity: lang === l ? 1 : 0.55 }} onClick={() => setLang(l)}>
              {l === 'es' ? 'Español' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        <button className="sc-btn" onClick={onBack}>{t('back')}</button>
        {user && (
          <button className="sc-btn" onClick={onSignOut} style={{ background: 'rgba(60,30,80,0.5)' }}>
            {t('signOut')}
          </button>
        )}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 'calc(var(--safe-top) + 28px) 20px calc(var(--safe-bottom) + 28px)',
};
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' };
const dot: React.CSSProperties = { width: 10, height: 10, borderRadius: '50%', flex: '0 0 auto' };
