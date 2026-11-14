import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLang } from '../i18n/LanguageContext';
import type { StringKey } from '../i18n/strings';
import {
  FREE_PRESET, getSession, isFreeSession, sessionAudioUrls, sessionMinutes, sessionSilences, sessionVoiceSeconds, versionOf,
} from '../data/sessions';
import { createSessionPlayer, type PlayerSnapshot, type SessionPlayer } from '../lib/sessionPlayer';
import {
  GUIDES, clearResume, loadFavorites, loadPlayerPrefs, loadResume, savePlayerPrefs, saveResume, toggleFavorite,
  type GuideMode, type PlayerPrefs,
} from '../lib/sessionStore';
import {
  MUSICS, MUSIC_LABEL, VOICES, loadSanctuaryPrefs, saveSanctuaryPrefs,
  type SanctuaryPrefs, type VoiceChoice,
} from '../lib/prefs';
import { pauseAmbient, resumeAmbient, setAmbientVolume, startAmbient, stopAmbient } from '../lib/ambient';
import { setSanctuaryState } from '../lib/sceneBridge';
import WorldBackdrop, { WORLD_IMAGE } from '../components/WorldBackdrop';

/**
 * Reproductor de una meditación grabada, de principio a fin.
 *
 *   preparar (guía, voz, música; continuar o empezar) → escuchando → cierre
 *
 * Durante la práctica se puede pausar, retroceder 15 segundos, ajustar por separado el
 * volumen de la voz y el de la música, guardar la sesión en favoritas y «Terminar y
 * regresar», que no corta el audio: pasa al cierre de la meditación.
 * Si la persona sale a la mitad, al volver se le ofrece continuar donde quedó.
 */
type Props = {
  sessionId: string;
  onClose: () => void;
  /** Terminó la sesión completa. Recibe el nivel del recorrido, si pertenece a uno. */
  onComplete: (level?: number) => void;
};

type Stage = 'setup' | 'playing' | 'done';

const BACK_SECONDS = 15;
const GUIDE_LABEL: Record<GuideMode, StringKey> = {
  frequent: 'guideFrequent', balanced: 'guideBalanced', spacious: 'guideSpacious',
};
const VOICE_LABEL: Record<VoiceChoice, StringKey> = { female: 'voiceFemale', male: 'voiceMale' };

type WakeLock = { release: () => Promise<void> };

export default function Session({ sessionId, onClose, onComplete }: Props) {
  const { lang, t } = useLang();
  const session = getSession(sessionId);

  const [stage, setStage] = useState<Stage>('setup');
  const [prefs, setPrefs] = useState<SanctuaryPrefs>(loadSanctuaryPrefs);
  const [player, setPlayerPrefs] = useState<PlayerPrefs>(loadPlayerPrefs);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [snap, setSnap] = useState<PlayerSnapshot | null>(null);
  const [endedEarly, setEndedEarly] = useState(false);
  const [resume] = useState(() => loadResume(sessionId));

  const engine = useRef<SessionPlayer | null>(null);
  const early = useRef(false);
  const lastSave = useRef(0);
  const wake = useRef<WakeLock | null>(null);

  // Niveles gratis: voz, música y guía fijas (sin selector). Suscripción: lo que elija la persona.
  const free = isFreeSession(session);
  const voice = free ? FREE_PRESET.voice : prefs.voice;
  const music = free ? FREE_PRESET.music : prefs.music;
  const guide = free ? FREE_PRESET.guide : player.guide;
  const version = versionOf(lang, voice);
  const minutes = useMemo(
    () => (session ? sessionMinutes(session, version, guide) : 0),
    [session, version, guide],
  );

  const updatePrefs = (patch: Partial<SanctuaryPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveSanctuaryPrefs(next);
  };
  const updatePlayer = (patch: Partial<PlayerPrefs>) => {
    const next = { ...player, ...patch };
    setPlayerPrefs(next);
    savePlayerPrefs(next);
    if (patch.voiceVolume !== undefined) engine.current?.setVoiceVolume(next.voiceVolume);
    if (patch.musicVolume !== undefined) setAmbientVolume(next.musicVolume);
  };

  // Mantener la pantalla encendida mientras suena (si el teléfono lo permite).
  const holdScreen = () => {
    const api = (navigator as unknown as { wakeLock?: { request: (type: 'screen') => Promise<WakeLock> } }).wakeLock;
    if (!api || wake.current) return;
    void api.request('screen').then((lock) => { wake.current = lock; }).catch(() => undefined);
  };
  const releaseScreen = () => {
    void wake.current?.release().catch(() => undefined);
    wake.current = null;
  };

  const remember = (s: PlayerSnapshot) => {
    if (!session || s.phase === 'done') return;
    saveResume({
      sessionId, version, guide, index: s.index, offset: s.offset, position: s.position, savedAt: Date.now(),
    });
  };

  const begin = (from?: { index: number; offset: number }) => {
    if (!session) return;
    early.current = false;
    setEndedEarly(false);
    const created = createSessionPlayer({
      urls: sessionAudioUrls(session, version),
      durations: sessionVoiceSeconds(session, version),
      silences: sessionSilences(session, guide),
      voiceVolume: player.voiceVolume,
      start: from,
      onChange: (s) => {
        setSnap(s);
        // Guarda el punto cada pocos segundos y al pausar, para poder continuar después.
        if (!s.playing || Date.now() - lastSave.current > 5000) { lastSave.current = Date.now(); remember(s); }
      },
      onDone: () => {
        clearResume(sessionId);
        releaseScreen();
        stopAmbient(6);
        setStage('done');
        if (!early.current) onComplete(session.level);
      },
    });
    engine.current = created;
    setStage('playing');
    // Todo esto ocurre dentro del toque: los teléfonos solo dejan sonar lo que empieza así.
    created.play();
    startAmbient(music);
    setAmbientVolume(player.musicVolume);
    holdScreen();
  };

  const toggle = () => {
    const p = engine.current;
    if (!p || !snap) return;
    if (snap.playing) { p.pause(); pauseAmbient(); releaseScreen(); } else { p.play(); resumeAmbient(); holdScreen(); }
  };

  const lastIndex = (session?.blocks.length ?? 1) - 1;
  const inClosing = Boolean(snap && snap.index >= lastIndex);

  /** «Terminar y regresar»: en vez de cortar, pasa al cierre; si ya está en el cierre, sale. */
  const endGently = () => {
    const p = engine.current;
    if (!p || !snap) return;
    if (inClosing) { leave(); return; }
    early.current = true;
    setEndedEarly(true);
    clearResume(sessionId);
    if (!snap.playing) resumeAmbient();
    p.goToClosing();
  };

  const leave = () => {
    const s = engine.current?.snapshot();
    if (s && s.phase !== 'done' && !early.current) remember(s);
    onClose();
  };

  // Al salir de la pantalla: guardar dónde quedó, soltar el audio y la pantalla.
  useEffect(() => () => {
    engine.current?.destroy();
    engine.current = null;
    releaseScreen();
    stopAmbient(0.4);
    setSanctuaryState('resting');
    document.body.dataset.focus = '0';
  }, []);

  // La escena acompaña la práctica.
  useEffect(() => {
    document.body.dataset.focus = stage === 'playing' ? '1' : '0';
    if (stage === 'playing') setSanctuaryState(inClosing ? 'closing' : 'meditating');
    else if (stage === 'done') setSanctuaryState('closing');
  }, [stage, inClosing]);

  // Controles del sistema (pantalla bloqueada, audífonos).
  useEffect(() => {
    const media = navigator.mediaSession;
    if (!media || !session || stage !== 'playing') return;
    try {
      media.metadata = new MediaMetadata({ title: session.title[lang], artist: 'Súper Conciencia' });
      media.setActionHandler('play', () => { engine.current?.play(); resumeAmbient(); });
      media.setActionHandler('pause', () => { engine.current?.pause(); pauseAmbient(); });
      media.setActionHandler('seekbackward', () => engine.current?.back(BACK_SECONDS));
    } catch { /* no disponible */ }
    return () => {
      try {
        media.setActionHandler('play', null);
        media.setActionHandler('pause', null);
        media.setActionHandler('seekbackward', null);
      } catch { /* no disponible */ }
    };
  }, [stage, session, lang]);

  if (!session) {
    return (
      <div style={wrap}>
        <Card><button className="sc-btn" onClick={onClose}>{t('back')}</button></Card>
      </div>
    );
  }

  const isFavorite = favorites.includes(sessionId);
  const favoriteBtn = (
    <button
      type="button"
      style={iconBtn}
      aria-pressed={isFavorite}
      aria-label={t(isFavorite ? 'removeFavorite' : 'addFavorite')}
      onClick={() => setFavorites(toggleFavorite(sessionId))}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
        <path d="M12 20s-7-4.4-7-9.6A4.1 4.1 0 0 1 12 7.600 4.100 4.100 0 0 1 19 10.400C19 15.600 12 20 12 20z" />
      </svg>
    </button>
  );

  const left = snap ? Math.max(0, snap.total - snap.position) : 0;
  const clock = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
  const backdrop = session.level ? WORLD_IMAGE[session.level] : undefined;

  return (
    <div style={wrap} className="sc-over">
      {backdrop && <WorldBackdrop src={backdrop} />}

      {stage === 'setup' && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <button type="button" style={iconBtn} aria-label={t('back')} onClick={onClose}>←</button>
            <span style={{ ...kicker, flex: 1 }}>{t('guidedMeditation')} · {minutes} min</span>
            {favoriteBtn}
          </div>
          <h2 style={title}>{session.title[lang]}</h2>
          <p style={about}>{session.about[lang]}</p>

          {free ? (
            <span style={note}>{t('freePresetNote')}</span>
          ) : (<>
          <Row label={t('sessionGuide')}>
            {GUIDES.map((g) => (
              <Chip key={g} on={player.guide === g} onClick={() => updatePlayer({ guide: g })}>{t(GUIDE_LABEL[g])}</Chip>
            ))}
          </Row>
          <Row label={t('voice')}>
            {VOICES.map((v) => (
              <Chip key={v} on={prefs.voice === v} onClick={() => updatePrefs({ voice: v })}>{t(VOICE_LABEL[v])}</Chip>
            ))}
          </Row>
          <Row label={t('music')}>
            {MUSICS.map((m) => (
              <Chip key={m} on={prefs.music === m} onClick={() => updatePrefs({ music: m })}>{t(MUSIC_LABEL[m])}</Chip>
            ))}
          </Row>
          </>)}

          {resume ? (
            <div style={stack}>
              <button className="sc-btn" onClick={() => begin({ index: resume.index, offset: resume.offset })}>
                {t('resumeAt').replace('{m}', String(Math.max(1, Math.round(resume.position / 60))))}
              </button>
              <button style={quiet} onClick={() => { clearResume(sessionId); begin(); }}>{t('startOver')}</button>
            </div>
          ) : (
            <div style={stack}>
              <button className="sc-btn" onClick={() => begin()}>{t('beginSession')}</button>
            </div>
          )}
          <span style={note}>{t('needsInternet')}</span>
        </Card>
      )}

      {stage === 'playing' && snap && (
        <Card soft>
          <span style={kicker}>{session.title[lang]}</span>
          <p style={caption}>{session.blocks[snap.index]?.[lang]}</p>
          {snap.voiceMissing && <span style={{ ...note, color: '#ffd9a0', opacity: 1 }} role="status">{t('voiceOffline')}</span>}

          <div style={track} role="progressbar" aria-valuemin={0} aria-valuemax={Math.round(snap.total)} aria-valuenow={Math.round(snap.position)}>
            <div style={{ ...trackFill, width: `${Math.min(100, (snap.position / snap.total) * 100)}%` }} />
          </div>
          <span style={{ ...note, marginTop: 6 }}>
            {endedEarly ? t('closingNow') : t('timeLeft').replace('{t}', clock)}
          </span>

          <div style={controls}>
            <button type="button" style={iconBtn} aria-label={t('back15')} onClick={() => engine.current?.back(BACK_SECONDS)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12a8 8 0 1 0 2.600-5.900" />
                <path d="M4 4.500v4h4" />
                <text x="12" y="15.500" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">15</text>
              </svg>
            </button>
            <button className="sc-btn" style={{ padding: '11px 30px' }} onClick={toggle}>
              {snap.playing ? t('pause') : t('play')}
            </button>
            {favoriteBtn}
          </div>

          <Slider label={t('voiceVolume')} value={player.voiceVolume} onChange={(v) => updatePlayer({ voiceVolume: v })} />
          <Slider label={t('musicVolume')} value={player.musicVolume} onChange={(v) => updatePlayer({ musicVolume: v })} />

          <button style={quiet} onClick={endGently}>{t(inClosing ? 'leaveNow' : 'endAndReturn')}</button>
        </Card>
      )}

      {stage === 'done' && (
        <Card>
          <span style={kicker}>{session.title[lang]}</span>
          <p style={caption}>{t(endedEarly ? 'sessionEndedEarly' : 'sessionDone')}</p>
          <div style={stack}>
            <button className="sc-btn" onClick={onClose}>{t('back')}</button>
          </div>
          <div style={{ marginTop: 10 }}>{favoriteBtn}</div>
        </Card>
      )}
    </div>
  );
}

function Card({ children, soft = false }: { children: ReactNode; soft?: boolean }) {
  return (
    <div className="sc-panel sc-rise" style={{ ...card, background: soft ? 'rgba(18, 12, 51, 0.5)' : 'rgba(18, 12, 51, 0.68)' }}>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ width: '100%', marginTop: 12 }}>
      <div style={rowLabel}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="sc-chip" aria-pressed={on} onClick={onClick}>{children}</button>;
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={sliderRow}>
      <span style={{ ...rowLabel, margin: 0, flex: '0 0 96px', textAlign: 'left' }}>{label}</span>
      <input
        className="sc-range"
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
      />
    </label>
  );
}

const wrap: React.CSSProperties = {
  position: 'relative',
  zIndex: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: 'calc(var(--safe-top) + 16px) 16px calc(var(--safe-bottom) + 18px)',
};
const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  maxHeight: '86%',
  overflowY: 'auto',
  padding: '18px 20px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 0 40px rgba(154, 111, 240, 0.25)',
};
const kicker: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.9 };
const title: React.CSSProperties = { fontSize: 20, letterSpacing: '0.04em', margin: '10px 0 0', color: 'var(--ink)' };
const about: React.CSSProperties = { fontSize: 13, lineHeight: 1.55, opacity: 0.85, margin: '8px 0 0' };
const caption: React.CSSProperties = { fontSize: 17, lineHeight: 1.6, margin: '12px 0 0', minHeight: 54 };
const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: 18, width: '100%' };
const quiet: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--ink)', opacity: 0.7, fontSize: 12.5,
  letterSpacing: '0.08em', marginTop: 10, padding: '8px 10px',
};
const note: React.CSSProperties = { display: 'block', fontSize: 10.5, letterSpacing: '0.08em', opacity: 0.6, marginTop: 10 };
const rowLabel: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 7 };
const controls: React.CSSProperties = { display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', margin: '12px 0 6px' };
const iconBtn: React.CSSProperties = {
  flex: '0 0 auto', width: 44, height: 44, minHeight: 0, borderRadius: '50%', display: 'grid', placeItems: 'center',
  background: 'rgba(18, 12, 51, 0.45)', border: '1px solid rgba(246, 227, 168, 0.3)', color: 'var(--gold)', fontSize: 18, padding: 0,
};
const track: React.CSSProperties = { width: '100%', height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.16)', marginTop: 16, overflow: 'hidden' };
const trackFill: React.CSSProperties = { height: '100%', background: 'var(--gold)', borderRadius: 4, transition: 'width 0.5s linear' };
const sliderRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginTop: 10 };
