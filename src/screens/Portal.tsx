import { useLang } from '../i18n/LanguageContext';

export default function Portal({ unlocked, onBack }: { unlocked: boolean; onBack: () => void }) {
  const { t } = useLang();

  // Dentro del Reino del Éter la sala es la protagonista: solo un botón discreto para volver.
  if (unlocked) {
    return (
      <div style={openBar}>
        <button className="sc-btn" style={{ padding: '10px 22px', fontSize: 13, pointerEvents: 'auto' }} onClick={onBack}>
          {t('back')}
        </button>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div className="sc-panel" style={{ padding: 28, maxWidth: 360, textAlign: 'center' }}>
        <h2 style={{ color: 'var(--gold)', letterSpacing: '0.12em', marginTop: 0 }}>
          {t('universeTitle')}
        </h2>
        <p style={{ fontSize: 13, letterSpacing: '0.08em', opacity: 0.9 }}>
          {unlocked ? t('open') : t('sealed')}
        </p>
        {!unlocked && (
          <p style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}>{t('portalLockedMsg')}</p>
        )}
        <button className="sc-btn" style={{ marginTop: 18 }} onClick={onBack}>
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
  padding: '0 24px',
};

const openBar: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 'calc(var(--safe-bottom) + 20px)',
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
};
