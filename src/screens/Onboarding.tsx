import { useLang } from '../i18n/LanguageContext';

export default function Onboarding({ onBegin }: { onBegin: () => void }) {
  const { lang, setLang, t } = useLang();

  return (
    <div style={wrap}>
      <h1 style={{ fontSize: 30, letterSpacing: '0.14em', color: 'var(--gold)', margin: 0 }}>
        SÚPER CONCIENCIA
      </h1>
      <p style={{ opacity: 0.85, marginTop: 10, maxWidth: 320 }}>{t('tagline')}</p>

      <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
        {(['es', 'en'] as const).map((l) => (
          <button
            key={l}
            className="sc-btn"
            onClick={() => setLang(l)}
            style={{ opacity: lang === l ? 1 : 0.55, padding: '10px 20px' }}
          >
            {l === 'es' ? 'Español' : 'English'}
          </button>
        ))}
      </div>

      <button className="sc-btn" style={{ marginTop: 36 }} onClick={onBegin}>
        {t('begin')}
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
  padding: '0 24px',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
};
