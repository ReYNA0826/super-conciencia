import { useLang } from '../i18n/LanguageContext';
import { LEVELS } from '../data/levels';

type Props = {
  completed: number[];
  unlocked: boolean;
  onOpenLevel: (id: number) => void;
  onOpenPortal: () => void;
};

/**
 * Explorar: los siete niveles. La escena de Spline ya muestra el título y el portal arriba,
 * así que la lista va en la hoja inferior, con su propio scroll.
 *
 * Cada tarjeta dice su estado con palabras: «Disponible» o «Completado». La marca ✓ es solo
 * para lo que la persona terminó de verdad.
 */
export default function Universe({ completed, unlocked, onOpenLevel, onOpenPortal }: Props) {
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
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                  {lang === 'es' ? lvl.intentionEs : lvl.intentionEn}
                </div>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 7, color: isDone ? lvl.color : 'var(--ink)', opacity: isDone ? 1 : 0.55 }}>
                  {isFinal
                    ? t(locked ? 'sealed' : 'open')
                    : isDone ? `✓ ${t('statusDone')}` : t('statusAvailable')}
                </div>
              </button>
            );
          })}
        </div>
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
