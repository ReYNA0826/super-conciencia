import { useLang } from '../i18n/LanguageContext';
import { LEVELS } from '../data/levels';

type Props = {
  completed: number[];
  unlocked: boolean;
  onOpenLevel: (id: number) => void;
  onOpenPortal: () => void;
  onOpenProfile: () => void;
};

/**
 * Mapa de niveles. La escena de Spline ya muestra el título y el portal arriba,
 * así que la lista de meditaciones va en la hoja inferior, con su propio scroll.
 */
export default function Universe({ completed, unlocked, onOpenLevel, onOpenPortal, onOpenProfile }: Props) {
  const { lang, t } = useLang();

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="sc-sheet" style={sheet}>
        <div style={grid}>
          {LEVELS.map((lvl) => {
            const isDone = completed.includes(lvl.id);
            const isFinal = lvl.id === 7;
            const locked = isFinal && !unlocked;
            return (
              <button
                key={lvl.id}
                className="sc-panel"
                onClick={() => (isFinal ? onOpenPortal() : onOpenLevel(lvl.id))}
                style={{
                  padding: 12,
                  textAlign: 'left',
                  color: 'var(--ink)',
                  opacity: locked ? 0.55 : 1,
                  borderColor: isDone ? lvl.color : 'var(--panel-border)',
                  gridColumn: isFinal ? '1 / -1' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...dot, background: lvl.color }} />
                  <strong style={{ fontSize: 12 }}>
                    {lvl.id}. {lang === 'es' ? lvl.es : lvl.en}
                  </strong>
                  {isDone && <span style={{ marginLeft: 'auto', fontSize: 12, color: lvl.color }}>✓</span>}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                  {locked ? t('sealed') : lang === 'es' ? lvl.intentionEs : lvl.intentionEn}
                </div>
              </button>
            );
          })}
        </div>

        <button className="sc-btn" style={{ padding: '10px 22px', marginTop: 16 }} onClick={onOpenProfile}>
          {t('profile')}
        </button>
      </div>
    </div>
  );
}

const sheet: React.CSSProperties = {
  maxHeight: '62%',
  overflowY: 'auto',
};
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
  width: '100%',
  maxWidth: 520,
};
const dot: React.CSSProperties = { width: 10, height: 10, borderRadius: '50%', flex: '0 0 auto' };
