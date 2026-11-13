import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLang } from '../i18n/LanguageContext';
import type { StringKey } from '../i18n/strings';
import { setParticipants, setSanctuaryState } from '../lib/sceneBridge';
import { joinSanctuary } from '../lib/presence';
import { formatGathering, isLive, loadUpcomingGatherings, type Gathering } from '../lib/gatherings';
import { pauseAmbient, resumeAmbient, startAmbient, stopAmbient } from '../lib/ambient';
import { buildSanctuarySession } from '../data/sanctuary';
import { guruConfigured, startGuru, type GuruSession, type GuruStatus } from '../lib/guru';
import { pauseVoice, playVoice, resumeVoice, stopVoice, unlockVoice } from '../lib/voice';
import {
  GURU_SESSIONS, SESSION_MINUTES, blockSeconds, recordedSessionsAvailable, sessionAudioUrl, sessionSeconds,
  type RecordedSession, type SessionMinutes,
} from '../data/guruSessions';
import {
  DURATIONS, GOALS, MUSICS, VOICES,
  loadSanctuaryPrefs, saveSanctuaryPrefs,
  type GoalChoice, type MusicChoice, type SanctuaryPrefs, type VoiceChoice,
} from '../lib/prefs';

/**
 * Santuario del Éter (nivel 7). La sala 3D es la protagonista; la interfaz son
 * paneles de cristal abajo, y durante la práctica casi desaparece.
 *
 *   entrada → preparar → meditando → cierre
 *           ↘ aviso de voz → conversando con Gurú → cierre
 *           ↘ meditaciones con Gurú (grabadas) → escuchando → cierre
 *           ↘ calendario de reuniones de conciencias
 */
type Step = 'entry' | 'setup' | 'meditating' | 'consent' | 'guru' | 'closing' | 'calendar' | 'library' | 'recorded';

type Props = { onBack: () => void; onComplete: () => void };

const VOICE_LABEL: Record<VoiceChoice, StringKey> = { female: 'voiceFemale', male: 'voiceMale' };
const MUSIC_LABEL: Record<MusicChoice, StringKey> = {
  nature: 'musicNature', ethereal: 'musicEthereal', piano: 'musicPiano', silence: 'musicSilence',
};
const GOAL_LABEL: Record<GoalChoice, StringKey> = {
  calm: 'goalCalm', focus: 'goalFocus', rest: 'goalRest', connection: 'goalConnection',
};
const GURU_LABEL: Partial<Record<GuruStatus, StringKey>> = {
  connecting: 'guruConnecting', listening: 'guruListening', speaking: 'guruSpeaking', error: 'guruError',
};

export default function Sanctuary({ onBack, onComplete }: Props) {
  const { lang, t } = useLang();
  const [step, setStep] = useState<Step>('entry');
  const [prefs, setPrefs] = useState<SanctuaryPrefs>(loadSanctuaryPrefs);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [guruStatus, setGuruStatus] = useState<GuruStatus | null>(null);
  const [guruNote, setGuruNote] = useState(false);
  const guru = useRef<GuruSession | null>(null);
  const guruRun = useRef(0);

  // Meditación colectiva: cuántas presencias hay en el santuario en este momento.
  // La sala 3D las refleja (setParticipants) y la interfaz lo dice en una línea.
  const [presences, setPresences] = useState<number | null>(null);
  useEffect(() => joinSanctuary((count) => {
    setPresences(count);
    setParticipants(count);
  }), []);
  const presenceLine = presences === null ? null
    : presences <= 1 ? t('presenceAlone')
      : t('presenceMany').replace('{n}', String(presences));

  // Reuniones de conciencias: las próximas fechas de meditación colectiva.
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let alive = true;
    void loadUpcomingGatherings().then((list) => { if (alive) setGatherings(list); });
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);
  const upcoming = gatherings.filter((g) => g.startsAt.getTime() + g.minutes * 60_000 > now);
  const liveNow = upcoming.find((g) => isLive(g, now)) ?? null;
  const gatheringLine = liveNow ? t('gatheringLive')
    : upcoming[0] ? t('gatheringNext').replace('{when}', formatGathering(upcoming[0], lang))
      : null;

  const update = (patch: Partial<SanctuaryPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveSanctuaryPrefs(next);
  };

  // ── Meditación ────────────────────────────────────────────────────────────
  const phases = useMemo(() => buildSanctuarySession(prefs.minutes, prefs.goal), [prefs.minutes, prefs.goal]);
  const total = prefs.minutes * 60;
  const idx = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < phases.length; i++) {
      acc += phases[i].seconds;
      if (elapsed < acc) return i;
    }
    return phases.length - 1;
  }, [phases, elapsed]);

  useEffect(() => {
    if (step !== 'meditating' || !playing) return;
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [step, playing]);

  useEffect(() => {
    if (step === 'meditating' && elapsed >= total) {
      setStep('closing');
      onComplete();
    }
  }, [step, elapsed, total, onComplete]);

  const beginMeditation = () => {
    setElapsed(0);
    setPlaying(true);
    setStep('meditating');
    startAmbient(prefs.music); // dentro del toque: los teléfonos lo exigen para sonar
  };

  const togglePlaying = () => {
    if (playing) pauseAmbient(); else resumeAmbient();
    setPlaying(!playing);
  };

  // ── Meditaciones con Gurú (grabadas) ──────────────────────────────────────
  const [recorded, setRecorded] = useState<RecordedSession>(GURU_SESSIONS[0]);
  const [recMinutes, setRecMinutes] = useState<SessionMinutes>(25);
  const [recElapsed, setRecElapsed] = useState(0);
  const [recPlaying, setRecPlaying] = useState(true);
  const recSpoken = useRef(-1); // último bloque cuya voz ya se lanzó
  const recCount = recorded.blocks.length;
  const recTotal = sessionSeconds(recMinutes, recCount);
  const recIdx = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < recCount; i++) {
      acc += blockSeconds(recMinutes, i, recCount);
      if (recElapsed < acc) return i;
    }
    return recCount - 1;
  }, [recMinutes, recCount, recElapsed]);

  const speakBlock = (index: number) => {
    if (recSpoken.current === index) return;
    recSpoken.current = index;
    playVoice(sessionAudioUrl(recorded.id, lang, prefs.voice, index), 1);
  };

  const beginRecorded = () => {
    setRecElapsed(0);
    setRecPlaying(true);
    setStep('recorded');
    // Dentro del toque: los teléfonos solo dejan sonar lo que empieza con un toque.
    unlockVoice();
    recSpoken.current = -1;
    speakBlock(0);
    startAmbient(prefs.music);
  };

  useEffect(() => {
    if (step !== 'recorded' || !recPlaying) return;
    const id = window.setInterval(() => setRecElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, [step, recPlaying]);

  // Al pasar de bloque suena su voz; al terminar el tiempo, cierre.
  useEffect(() => {
    if (step !== 'recorded') return;
    if (recElapsed >= recTotal) { setStep('closing'); return; }
    speakBlock(recIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recIdx, recElapsed >= recTotal]);

  const toggleRecorded = () => {
    if (recPlaying) { pauseVoice(); pauseAmbient(); } else { resumeVoice(); resumeAmbient(); }
    setRecPlaying(!recPlaying);
  };

  // La voz grabada se calla al salir de la práctica o del santuario.
  useEffect(() => {
    if (step !== 'recorded') stopVoice();
  }, [step]);
  useEffect(() => () => stopVoice(), []);

  const recRemaining = Math.max(0, recTotal - recElapsed);
  const recClock = `${Math.floor(recRemaining / 60)}:${String(recRemaining % 60).padStart(2, '0')}`;

  // La música acompaña solo la práctica: sale con suavidad al cerrar o al irse.
  useEffect(() => {
    if (step !== 'meditating' && step !== 'recorded') stopAmbient(4);
  }, [step]);
  useEffect(() => () => stopAmbient(0.4), []);

  // ── La sala acompaña: Meditando en la práctica, Cierre al final, Reposo en lo demás ──
  const lastPhase = idx === phases.length - 1;
  useEffect(() => {
    if (step === 'meditating') setSanctuaryState(lastPhase ? 'closing' : 'meditating');
    else if (step === 'recorded') setSanctuaryState(recIdx === recCount - 1 ? 'closing' : 'meditating');
    else if (step === 'closing') setSanctuaryState('closing');
    else setSanctuaryState('resting');
  }, [step, lastPhase, recIdx, recCount]);
  useEffect(() => () => setSanctuaryState('resting'), []);

  // ── Gurú ──────────────────────────────────────────────────────────────────
  const stopGuru = () => {
    guruRun.current += 1; // invalida cualquier conexión que siga en camino
    const session = guru.current;
    guru.current = null;
    if (session) void session.end().catch(() => undefined);
  };
  useEffect(() => stopGuru, []);

  const activateVoice = async () => {
    if (!guruConfigured) { setGuruNote(true); return; }
    const run = ++guruRun.current;
    setStep('guru');
    try {
      const session = await startGuru(prefs.voice, (status) => {
        if (guruRun.current !== run) return;
        if (status === 'ended') { guru.current = null; setStep('closing'); return; }
        setGuruStatus(status);
      });
      if (guruRun.current !== run) { void session.end().catch(() => undefined); return; }
      guru.current = session;
    } catch {
      if (guruRun.current === run) setGuruStatus('error');
    }
  };

  const endConversation = () => {
    const wasError = guruStatus === 'error';
    stopGuru();
    setGuruStatus(null);
    setStep(wasError ? 'entry' : 'closing');
  };

  const remaining = Math.max(0, total - elapsed);
  const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;

  return (
    <div style={stage}>
      {/* Siempre a la vista: salir del santuario y volver a la lista de niveles. */}
      <button style={homeBtn} onClick={onBack} aria-label={t('home')}>← {t('home')}</button>
      {step === 'entry' && (
        <Panel>
          <h2 style={title}>{t('sanctuaryName')}</h2>
          <p style={lead}>{t('sanctuaryWelcome')}</p>
          <p style={body}>{t('sanctuaryIntro')}</p>
          {presenceLine && <span style={{ ...note, color: 'var(--gold)', opacity: 0.85 }} role="status">{presenceLine}</span>}
          {gatheringLine && <span style={{ ...note, marginTop: 4, opacity: 0.85 }}>{gatheringLine}</span>}
          <div style={stack}>
            <button className="sc-btn" onClick={() => setStep('setup')}>{liveNow ? t('gatheringJoin') : t('enterMeditation')}</button>
            {recordedSessionsAvailable && (
              <button className="sc-btn" onClick={() => setStep('library')}>{t('guruSessions')}</button>
            )}
            <button className="sc-btn" onClick={() => { setGuruNote(false); setStep('consent'); }}>{t('talkToGuru')}</button>
            <button className="sc-btn" onClick={() => setStep('calendar')}>{t('gatherings')}</button>
          </div>
          <button style={quiet} onClick={onBack}>{t('back')}</button>
        </Panel>
      )}

      {step === 'setup' && (
        <Panel>
          <h2 style={title}>{t('enterMeditation')}</h2>
          <Row label={t('duration')}>
            {DURATIONS.map((m) => (
              <Chip key={m} on={prefs.minutes === m} onClick={() => update({ minutes: m })}>{m} min</Chip>
            ))}
          </Row>
          <Row label={t('voice')}>
            {VOICES.map((v) => (
              <Chip key={v} on={prefs.voice === v} onClick={() => update({ voice: v })}>{t(VOICE_LABEL[v])}</Chip>
            ))}
          </Row>
          <Row label={t('music')}>
            {MUSICS.map((m) => (
              <Chip key={m} on={prefs.music === m} onClick={() => update({ music: m })}>{t(MUSIC_LABEL[m])}</Chip>
            ))}
          </Row>
          <Row label={t('goal')}>
            {GOALS.map((g) => (
              <Chip key={g} on={prefs.goal === g} onClick={() => update({ goal: g })}>{t(GOAL_LABEL[g])}</Chip>
            ))}
          </Row>
          <button className="sc-btn" style={{ marginTop: 18 }} onClick={beginMeditation}>{t('beginMeditation')}</button>
          <span style={note}>{t('voiceSoon')}</span>
          <button style={quiet} onClick={() => setStep('entry')}>{t('back')}</button>
        </Panel>
      )}

      {step === 'meditating' && (
        <Panel soft>
          <p style={phaseText}>{lang === 'es' ? phases[idx]?.es : phases[idx]?.en}</p>
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 14 }}>
            {phases.map((_, i) => (
              <span key={i} style={{ ...dot, background: i <= idx ? 'var(--gold)' : 'rgba(255,255,255,0.22)' }} />
            ))}
          </div>
          <span style={{ ...note, marginTop: 10 }}>
            {clock}{presences !== null && presences > 1 ? ` · ${t('presenceMany').replace('{n}', String(presences))}` : ''}
          </span>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
            <button className="sc-btn" style={{ padding: '9px 22px', fontSize: 13 }} onClick={togglePlaying}>
              {playing ? t('pause') : t('play')}
            </button>
            <button style={{ ...quiet, marginTop: 0 }} onClick={() => setStep('closing')}>{t('leaveGently')}</button>
          </div>
        </Panel>
      )}

      {step === 'consent' && (
        <Panel>
          <h2 style={title}>{t('talkToGuru')}</h2>
          <p style={lead}>{t('guruGreeting')}</p>
          <p style={body}>{t('guruConsent')}</p>
          <div style={stack}>
            <button className="sc-btn" onClick={activateVoice}>{t('activateVoice')}</button>
          </div>
          {guruNote && <span style={note}>{t('guruNotReady')}</span>}
          <button style={quiet} onClick={() => setStep('entry')}>{t('notNow')}</button>
        </Panel>
      )}

      {step === 'guru' && (
        <Panel soft>
          <div className="sc-guru-orb" data-speaking={guruStatus === 'speaking'} style={orb} aria-hidden />
          <p style={{ ...lead, marginTop: 14 }} role="status">
            {t(GURU_LABEL[guruStatus ?? 'connecting'] ?? 'guruConnecting')}
          </p>
          <button className="sc-btn" style={{ padding: '9px 22px', fontSize: 13, marginTop: 6 }} onClick={endConversation}>
            {guruStatus === 'error' ? t('back') : t('endConversation')}
          </button>
        </Panel>
      )}

      {step === 'library' && (
        <Panel>
          <h2 style={title}>{t('guruSessions')}</h2>
          <p style={body}>{t('guruSessionsIntro')}</p>
          <ul style={dateList}>
            {GURU_SESSIONS.map((s) => {
              const on = s.id === recorded.id;
              return (
                <li key={s.id} style={{ ...dateItem, padding: 0, borderColor: on ? 'var(--gold)' : 'var(--panel-border)' }}>
                  <button type="button" style={sessionBtn} aria-pressed={on} onClick={() => setRecorded(s)}>
                    <span style={dateWhen}>{s.title[lang]}</span>
                    <span style={dateMeta}>{s.about[lang]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Row label={t('duration')}>
            {SESSION_MINUTES.map((m) => (
              <Chip key={m} on={recMinutes === m} onClick={() => setRecMinutes(m)}>{m} min</Chip>
            ))}
          </Row>
          <Row label={t('voice')}>
            {VOICES.map((v) => (
              <Chip key={v} on={prefs.voice === v} onClick={() => update({ voice: v })}>{t(VOICE_LABEL[v])}</Chip>
            ))}
          </Row>
          <Row label={t('music')}>
            {MUSICS.map((m) => (
              <Chip key={m} on={prefs.music === m} onClick={() => update({ music: m })}>{t(MUSIC_LABEL[m])}</Chip>
            ))}
          </Row>
          <button className="sc-btn" style={{ marginTop: 18 }} onClick={beginRecorded}>{t('beginMeditation')}</button>
          <span style={note}>{t('needsInternet')}</span>
          <button style={quiet} onClick={() => setStep('entry')}>{t('back')}</button>
        </Panel>
      )}

      {step === 'recorded' && (
        <Panel soft>
          <span style={{ ...note, marginTop: 0, marginBottom: 8, color: 'var(--gold)', opacity: 0.85 }}>{recorded.title[lang]}</span>
          <p style={phaseText}>{recorded.blocks[recIdx]?.[lang]}</p>
          <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 14 }}>
            {recorded.blocks.map((_, i) => (
              <span key={i} style={{ ...dot, width: 6, height: 6, background: i <= recIdx ? 'var(--gold)' : 'rgba(255,255,255,0.22)' }} />
            ))}
          </div>
          <span style={{ ...note, marginTop: 10 }}>
            {recClock}{presences !== null && presences > 1 ? ` · ${t('presenceMany').replace('{n}', String(presences))}` : ''}
          </span>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
            <button className="sc-btn" style={{ padding: '9px 22px', fontSize: 13 }} onClick={toggleRecorded}>
              {recPlaying ? t('pause') : t('play')}
            </button>
            <button style={{ ...quiet, marginTop: 0 }} onClick={() => setStep('closing')}>{t('leaveGently')}</button>
          </div>
        </Panel>
      )}

      {step === 'calendar' && (
        <Panel>
          <h2 style={title}>{t('gatherings')}</h2>
          <p style={body}>{t('gatheringsIntro')}</p>
          {upcoming.length === 0 && <p style={lead}>{t('gatheringsEmpty')}</p>}
          {upcoming.length > 0 && (
            <ul style={dateList}>
              {upcoming.map((g) => {
                const live = isLive(g, now);
                return (
                  <li key={g.id} style={{ ...dateItem, borderColor: live ? 'var(--gold)' : 'var(--panel-border)' }}>
                    <span style={dateWhen}>{formatGathering(g, lang)}</span>
                    <span style={dateMeta}>
                      {lang === 'es' ? g.titleEs : g.titleEn} · {g.minutes} min
                    </span>
                    {live && <span style={{ ...dateMeta, color: 'var(--gold)', opacity: 1 }} role="status">{t('gatheringLive')}</span>}
                  </li>
                );
              })}
            </ul>
          )}
          {liveNow && (
            <div style={stack}>
              <button className="sc-btn" onClick={() => setStep('setup')}>{t('gatheringJoin')}</button>
            </div>
          )}
          {upcoming.length > 0 && <span style={note}>{t('gatheringLocalTime')}</span>}
          <button style={quiet} onClick={() => setStep('entry')}>{t('back')}</button>
        </Panel>
      )}

      {step === 'closing' && (
        <Panel>
          <p style={lead}>{t('sanctuaryClosing')}</p>
          <div style={stack}>
            <button className="sc-btn" onClick={() => setStep('entry')}>{t('sanctuaryName')}</button>
          </div>
          <button style={quiet} onClick={onBack}>{t('back')}</button>
        </Panel>
      )}
    </div>
  );
}

function Panel({ children, soft = false }: { children: ReactNode; soft?: boolean }) {
  return (
    <div className="sc-panel sc-rise" style={{ ...panel, background: soft ? 'rgba(18, 12, 51, 0.38)' : 'rgba(18, 12, 51, 0.62)' }}>
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
  return (
    <button type="button" className="sc-chip" aria-pressed={on} onClick={onClick}>{children}</button>
  );
}

// La escena queda libre para tocarse; solo los paneles reciben toques.
const stage: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: 'calc(var(--safe-top) + 16px) 16px calc(var(--safe-bottom) + 18px)',
  pointerEvents: 'none',
};
const panel: React.CSSProperties = {
  pointerEvents: 'auto',
  width: '100%',
  maxWidth: 420,
  maxHeight: '78%',
  overflowY: 'auto',
  padding: '20px 20px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  boxShadow: '0 0 40px rgba(154, 111, 240, 0.25)',
};
const title: React.CSSProperties = { color: 'var(--gold)', fontSize: 17, letterSpacing: '0.14em', margin: 0, textTransform: 'uppercase' };
const lead: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.6, margin: '12px 0 0', whiteSpace: 'pre-line' };
const body: React.CSSProperties = { fontSize: 12.5, lineHeight: 1.6, opacity: 0.8, margin: '8px 0 0' };
const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18, width: '100%', maxWidth: 280 };
const quiet: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--ink)', opacity: 0.7, fontSize: 12.5,
  letterSpacing: '0.08em', marginTop: 14, padding: '6px 10px',
};
const note: React.CSSProperties = { display: 'block', fontSize: 10.5, letterSpacing: '0.08em', opacity: 0.6, marginTop: 10 };
const rowLabel: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.65, marginBottom: 7 };
const dateList: React.CSSProperties = { listStyle: 'none', padding: 0, margin: '14px 0 0', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 };
const dateItem: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 3, padding: '11px 14px', borderRadius: 14,
  border: '1px solid var(--panel-border)', background: 'rgba(18, 12, 51, 0.45)',
};
const sessionBtn: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 3, width: '100%', padding: '11px 14px',
  background: 'none', border: 'none', color: 'var(--ink)', textAlign: 'center', borderRadius: 14,
};
const dateWhen: React.CSSProperties = { fontSize: 14, lineHeight: 1.4 };
const dateMeta: React.CSSProperties = { fontSize: 11.5, letterSpacing: '0.04em', opacity: 0.7 };
const phaseText: React.CSSProperties = { fontSize: 17, lineHeight: 1.6, margin: 0, minHeight: 54 };
const dot: React.CSSProperties = { width: 7, height: 7, borderRadius: '50%', transition: 'background .6s ease' };
const orb: React.CSSProperties = {
  width: 64, height: 64, borderRadius: '50%',
  background: 'radial-gradient(circle at 50% 40%, #ffffff 0%, #bfeaf4 35%, #9a6ff0 100%)',
  boxShadow: '0 0 40px 6px rgba(191, 234, 244, 0.45)',
};

const homeBtn: React.CSSProperties = {
  pointerEvents: 'auto', // el escenario deja pasar los toques; este botón sí los recibe
  position: 'fixed',
  top: 'calc(var(--safe-top) + 16px)',
  left: 16,
  zIndex: 5,
  padding: '9px 16px',
  borderRadius: 999,
  border: '1px solid var(--panel-border)',
  background: 'rgba(18,12,51,0.6)',
  color: 'var(--gold)',
  fontSize: 14,
  letterSpacing: '0.04em',
};
