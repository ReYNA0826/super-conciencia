import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { LEVELS } from '../data/levels';
import { MEDITATIONS } from '../data/meditations';
import { setSanctuaryState } from '../lib/sceneBridge';

type Props = {
  level: number;
  onClose: () => void;
  onComplete: (level: number) => void;
};

export default function Meditation({ level, onClose, onComplete }: Props) {
  const { lang, t } = useLang();
  const phases = MEDITATIONS[level] ?? [];
  const info = LEVELS.find((l) => l.id === level);

  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || done || phases.length === 0) return;
    const ms = (phases[idx]?.seconds ?? 20) * 1000;
    timer.current = window.setTimeout(() => {
      if (idx < phases.length - 1) {
        setIdx((i) => i + 1);
      } else {
        setDone(true);
        onComplete(level);
      }
    }, ms);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [idx, playing, done, phases, level, onComplete]);

  // La sala acompaña la sesión: Meditando durante la práctica, Cierre en la última fase
  // o al terminar, y Reposo al salir.
  const isLast = phases.length > 0 && idx === phases.length - 1;
  useEffect(() => {
    setSanctuaryState(done || isLast ? 'closing' : 'meditating');
  }, [done, isLast]);
  useEffect(() => () => setSanctuaryState('resting'), []);

  const phase = phases[idx];
  const accent = info?.color ?? '#9a6ff0';

  return (
    <div style={wrap}>
      <button onClick={onClose} style={closeBtn} aria-label={t('close')}>✕</button>

      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.16em', opacity: 0.7, color: accent }}>
          {t('level')} {level}
        </span>
        <h2 style={{ fontSize: 19, letterSpacing: '0.1em', margin: '6px 0 0', color: 'var(--gold)' }}>
          {lang === 'es' ? info?.es : info?.en}
        </h2>
      </div>

      {/* orbe que respira */}
      <div style={{ ...orb, boxShadow: `0 0 80px 10px ${accent}66`, background:
        `radial-gradient(circle at 50% 40%, #ffffff 0%, ${accent} 45%, #2a1550 100%)` }} />

      {!done ? (
        <p style={phaseText}>{lang === 'es' ? phase?.es : phase?.en}</p>
      ) : (
        <p style={phaseText}>{t('meditationDone')}</p>
      )}

      {/* progreso por fases */}
      <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
        {phases.map((_, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: i <= idx ? accent : 'rgba(255,255,255,0.18)',
            transition: 'background .6s ease',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        {!done ? (
          <button className="sc-btn" onClick={() => setPlaying((p) => !p)} style={{ padding: '10px 26px' }}>
            {playing ? t('pause') : t('play')}
          </button>
        ) : (
          <button className="sc-btn" onClick={onClose} style={{ padding: '10px 26px' }}>
            {t('back')}
          </button>
        )}
      </div>

      <span style={voiceNote}>{t('voiceSoon')}</span>

      <style>{`@keyframes scBreathe {
        0%,100% { transform: scale(0.9); opacity: .85; }
        50% { transform: scale(1.12); opacity: 1; }
      }`}</style>
    </div>
  );
}

const wrap: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 22,
  padding: '0 26px',
  paddingTop: 'var(--safe-top)',
  paddingBottom: 'var(--safe-bottom)',
  textAlign: 'center',
};
const orb: React.CSSProperties = {
  width: 150,
  height: 150,
  borderRadius: '50%',
  animation: 'scBreathe 7s ease-in-out infinite',
};
const phaseText: React.CSSProperties = {
  fontSize: 17,
  lineHeight: 1.6,
  maxWidth: 360,
  minHeight: 56,
  margin: 0,
  color: 'var(--ink)',
  transition: 'opacity .5s ease',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(var(--safe-top) + 16px)',
  right: 18,
  width: 40,
  height: 40,
  borderRadius: '50%',
  border: '1px solid var(--panel-border)',
  background: 'rgba(18,12,51,0.5)',
  color: 'var(--gold)',
  fontSize: 15,
};
const voiceNote: React.CSSProperties = {
  fontSize: 10.5,
  letterSpacing: '0.08em',
  opacity: 0.5,
  marginTop: 6,
};
