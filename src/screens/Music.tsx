import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { LIBRARY, formatTime, trackUrl, type Mood } from '../data/music';
import { hasTier, showPlans, useTier } from '../lib/billing';
import { stopAmbient } from '../lib/ambient';

/**
 * «Música»: escuchar las canciones instrumentales de El Mapa de Tu Bienestar sin meditación.
 * Solo Premium (Plus o Gurú). La lista se ve para todos; al tocar una canción sin plan se
 * abre la pantalla de planes. Sigue con la siguiente canción al terminar.
 */
type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export default function Music() {
  const { t } = useLang();
  const premium = hasTier(useTier(), 'plus');
  const [mood, setMood] = useState<Mood>('calm');
  const [current, setCurrent] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const request = useRef(0);

  const list = LIBRARY.filter((tr) => tr.mood === mood);

  // Un solo reproductor para toda la pantalla; se detiene al salir.
  useEffect(() => {
    const el = new Audio();
    el.preload = 'auto';
    audio.current = el;
    const onTime = () => setPosition(el.currentTime);
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    return () => {
      el.pause();
      el.removeAttribute('src');
      el.load();
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      audio.current = null;
    };
  }, []);

  const play = async (index: number) => {
    if (!premium) { showPlans('plus'); return; }
    const el = audio.current;
    const track = LIBRARY[index];
    if (!el || !track) return;
    const run = ++request.current;
    stopAmbient(0.4); // que no suene la música de una meditación al mismo tiempo
    setCurrent(index);
    setStatus('loading');
    setPosition(0);
    setDuration(track.seconds);
    const url = await trackUrl(track.key);
    if (run !== request.current) return;
    if (!url) { setStatus('error'); return; }
    el.src = url;
    try {
      await el.play();
      if (run === request.current) setStatus('playing');
    } catch {
      if (run === request.current) setStatus('error');
    }
  };

  // Al terminar una canción, sigue con la próxima del mismo grupo (vuelve al inicio al final).
  const next = (step = 1) => {
    if (current === null) { void play(LIBRARY.indexOf(list[0])); return; }
    const group = LIBRARY.filter((tr) => tr.mood === LIBRARY[current].mood);
    const at = group.indexOf(LIBRARY[current]);
    const target = group[(at + step + group.length) % group.length];
    void play(LIBRARY.indexOf(target));
  };
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onEnded = () => nextRef.current(1);
    el.addEventListener('ended', onEnded);
    return () => el.removeEventListener('ended', onEnded);
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (current === null) { next(); return; }
    if (status === 'playing') { el.pause(); setStatus('paused'); }
    else if (status === 'paused') { void el.play().then(() => setStatus('playing')).catch(() => setStatus('error')); }
    else if (status === 'error') void play(current);
  };

  const seek = (value: number) => {
    const el = audio.current;
    if (!el || !duration) return;
    el.currentTime = value;
    setPosition(value);
  };

  const now = current !== null ? LIBRARY[current] : null;

  return (
    <div style={stage}>
      <div className="sc-panel sc-rise" style={panel}>
        <h2 style={title}>{t('musicTitle')}</h2>
        <p style={body}>{t('musicIntro')}</p>
        {!premium && (
          <button type="button" style={lockNote} onClick={() => showPlans('plus')}>
            {t('musicLocked')} · {t('seePlans')}
          </button>
        )}

        <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 12 }}>
          <button type="button" className="sc-chip" aria-pressed={mood === 'calm'} onClick={() => setMood('calm')}>{t('musicCalm')}</button>
          <button type="button" className="sc-chip" aria-pressed={mood === 'energy'} onClick={() => setMood('energy')}>{t('musicEnergy')}</button>
        </div>

        {now && (
          <div style={player} role="region" aria-label={t('musicNowPlaying')}>
            <span style={rowMeta}>{t('musicNowPlaying')}</span>
            <span style={{ ...rowTitle, color: 'var(--gold)', textAlign: 'center' }}>{now.title}</span>
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(duration))}
              value={Math.floor(position)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label={t('musicPosition')}
              style={{ width: '100%', accentColor: '#f6e3a8' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span style={rowMeta}>{formatTime(position)}</span>
              <span style={rowMeta}>{formatTime(duration)}</span>
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center' }}>
              <button type="button" className="sc-chip" onClick={() => next(-1)} aria-label={t('musicPrev')}>⏮</button>
              <button type="button" className="sc-btn" style={{ padding: '9px 22px', fontSize: 13 }} onClick={toggle}>
                {status === 'loading' ? t('musicLoading') : status === 'playing' ? t('pause') : t('play')}
              </button>
              <button type="button" className="sc-chip" onClick={() => next(1)} aria-label={t('musicNext')}>⏭</button>
            </div>
            {status === 'error' && <span style={{ ...rowMeta, opacity: 0.95 }} role="status">{t('musicLoadError')}</span>}
          </div>
        )}
        <ul style={listStyle}>
          {list.map((track) => {
            const index = LIBRARY.indexOf(track);
            const active = index === current;
            return (
              <li key={track.key}>
                <button
                  type="button"
                  style={{ ...row, borderColor: active ? 'var(--gold)' : 'var(--panel-border)' }}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => (active ? toggle() : void play(index))}
                >
                  <span style={{ ...rowTitle, color: active ? 'var(--gold)' : 'var(--ink)' }}>
                    {active && status === 'playing' ? '❚❚ ' : premium ? '▶ ' : '🔒 '}{track.title}
                  </span>
                  <span style={rowMeta}>{formatTime(track.seconds)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <span style={note}>{t('needsInternet')}</span>
      </div>
    </div>
  );
}

const stage: CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
  padding: 'calc(var(--safe-top) + 16px) 16px calc(var(--safe-bottom) + 18px + var(--tabbar))', pointerEvents: 'none',
};
const panel: CSSProperties = {
  pointerEvents: 'auto', width: '100%', maxWidth: 420, maxHeight: '82%', overflowY: 'auto', padding: '20px 20px 16px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
  background: 'rgba(18, 12, 51, 0.62)', boxShadow: '0 0 40px rgba(154, 111, 240, 0.25)',
};
const title: CSSProperties = { color: 'var(--gold)', fontSize: 17, letterSpacing: '0.14em', margin: 0, textTransform: 'uppercase' };
const body: CSSProperties = { fontSize: 12.5, lineHeight: 1.6, opacity: 0.8, margin: '8px 0 0' };
const lockNote: CSSProperties = {
  background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, letterSpacing: '0.06em', marginTop: 8, padding: '4px 8px',
};
const listStyle: CSSProperties = { listStyle: 'none', padding: 0, margin: '12px 0 0', width: '100%', display: 'flex', flexDirection: 'column', gap: 7 };
const row: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px',
  borderRadius: 14, border: '1px solid var(--panel-border)', background: 'rgba(18, 12, 51, 0.45)', color: 'var(--ink)', textAlign: 'left',
};
const rowTitle: CSSProperties = { fontSize: 14, lineHeight: 1.4 };
const rowMeta: CSSProperties = { fontSize: 11.5, letterSpacing: '0.04em', opacity: 0.7 };
const player: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%', marginTop: 12, padding: '12px 14px',
  borderRadius: 16, border: '1px solid var(--gold)', background: 'rgba(7, 10, 30, 0.55)',
};
const note: CSSProperties = { display: 'block', fontSize: 10.5, letterSpacing: '0.08em', opacity: 0.6, marginTop: 10 };
