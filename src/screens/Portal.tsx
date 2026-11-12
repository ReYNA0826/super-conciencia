import { useLang } from '../i18n/LanguageContext';
import Sanctuary from './Sanctuary';

type Props = { unlocked: boolean; onBack: () => void; onComplete: () => void };

export default function Portal({ unlocked, onBack, onComplete }: Props) {
  const { t } = useLang();

  // Portal abierto: el Santuario del Éter (entrada, meditación, conversación con Gurú).
  if (unlocked) return <Sanctuary onBack={onBack} onComplete={onComplete} />;

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
