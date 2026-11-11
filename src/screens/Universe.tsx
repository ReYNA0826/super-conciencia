import { useLang } from '../i18n/LanguageContext';
import { LEVELS } from '../data/levels';

type Props = {
  completed: number[];
  unlocked: boolean;
  onOpenPortal: () => void;
  onOpenProfile: () => void;
  onComplete: (id: number) => void;
};

export default function Universe({ completed, unlocked, onOpenPortal, onOpenProfile, onComplete }: Props) {
  const { lang, t } = useLang();

  return (
    <div style={wrap}>
      <header style={{ textAlign: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, letterSpacing: '0.16em', margin: 0, color: 'var(--gold)' }}>
          {t('universeTitle')}
        </h1>
        <span style={{ fontSize: 11, letterSpacing: '0.1em', opacity: 0.7 }}>{t('universeSubtitle')}</span>
      </header>

      <div style={grid}>
        {LEVELS.map((lvl) => {
          const isDone = completed.includes(lvl.id);
          const isFinal = lvl.id === 7;
          const locked = isFinal && !unlocked;
          return (
            <button
              key={lvl.id}
              className="sc-panel"
              onClick={() => (isFinal ? onOpenPortal() : onComplete(lvl.id))}
              style={{
                padding: 14,
                textAlign: 'left',
                color: 'var(--ink)',
                opacity: locked ? 0.55 : 1,
                borderColor: isDone ? lvl.color : 'var(--panel-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ ...dot, background: lvl.color }} />
                <strong style={{ fontSize: 13 }}>{lang === 'es' ? lvl.es : lvl.en}</strong>
              </div>
              <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>
                {locked ? t('sealed') : lang === 'es' ? lvl.intentionEs : lvl.intentionEn}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
        <button className="sc-btn" style={{ padding: '10px 22px' }} onClick={onOpenProfile}>
          {t('profile')}
        </button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  padding: '24px 20px',
  paddingTop: 'calc(var(--safe-top) + 24px)',
  paddingBottom: 'calc(var(--safe-bottom) + 24px)',
};
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
  maxWidth: 520,
  margin: '0 auto',
};
const dot: React.CSSProperties = { width: 12, height: 12, borderRadius: '50%', flex: '0 0 auto' };
