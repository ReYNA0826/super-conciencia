import { useLang } from '../i18n/LanguageContext';
import { LEVELS } from '../data/levels';
import { MEDITATIONS } from '../data/meditations';
import { FREE_PRESET, getSession, isFreeSession, recordedSessionsAvailable, sessionForLevel, sessionMinutes, versionOf, type RecordedSession } from '../data/sessions';
import { loadSanctuaryPrefs } from '../lib/prefs';
import { loadFavorites, loadLatestResume, loadPlayerPrefs, loadResume } from '../lib/sessionStore';

type Props = {
  completed: number[];
  unlocked: boolean;
  onOpenLevel: (id: number) => void;
  onOpenSession: (id: string) => void;
  onOpenSanctuary: () => void;
  onExplore: () => void;
};

/**
 * Inicio: «Tu espacio de hoy». Responde a "¿por dónde empiezo?" y "¿cómo sigo?" con una
 * sola tarjeta: el siguiente nivel sin completar, o el Santuario cuando ya se hicieron los seis.
 * El mapa completo queda en Explorar.
 */
export default function Home({ completed, unlocked, onOpenLevel, onOpenSession, onOpenSanctuary, onExplore }: Props) {
  const { lang, t } = useLang();
  const next = LEVELS.find((l) => l.id <= 6 && !completed.includes(l.id));
  const started = completed.some((n) => n <= 6);

  // Si el nivel ya tiene su meditación grabada, la tarjeta describe esa (con su duración real).
  const recorded = next && recordedSessionsAvailable ? sessionForLevel(next.id) : undefined;
  const phases = next ? MEDITATIONS[next.id] ?? [] : [];
  const minutes = recorded
    ? (isFreeSession(recorded)
      ? sessionMinutes(recorded, versionOf(lang, FREE_PRESET.voice), FREE_PRESET.guide)
      : sessionMinutes(recorded, versionOf(lang, loadSanctuaryPrefs().voice), loadPlayerPrefs().guide))
    : Math.max(1, Math.round(phases.reduce((sum, p) => sum + p.seconds, 0) / 60));
  const voiced = Boolean(recorded);
  const halfway = recorded ? loadResume(recorded.id) : null;

  // Una sesión que quedó a medias y no es la de la tarjeta (un nivel repetido, una de Gurú).
  const latest = recordedSessionsAvailable ? loadLatestResume() : null;
  const pending = latest && latest.sessionId !== recorded?.id ? getSession(latest.sessionId) : undefined;
  const favorites = recordedSessionsAvailable
    ? loadFavorites().map(getSession).filter((s): s is RecordedSession => Boolean(s))
    : [];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="sc-sheet">
        <span style={eyebrow}>{t('todayTitle')}</span>

        {next ? (
          <div className="sc-panel" style={{ ...card, borderColor: next.color }}>
            <span style={{ ...kicker, color: next.color }}>{t(started ? 'continuePath' : 'startHere')}</span>
            <h2 style={title}>{next.id}. {lang === 'es' ? next.es : next.en}</h2>
            <p style={line}>{lang === 'es' ? next.intentionEs : next.intentionEn}</p>
            <p style={meta}>
              {t(voiced ? 'sessionVoiced' : 'sessionText')} · {minutes} min
            </p>
            <button className="sc-btn" style={{ marginTop: 12, padding: '11px 30px' }} onClick={() => onOpenLevel(next.id)}>
              {t(halfway ? 'resumeShort' : 'beginSession')}
            </button>
          </div>
        ) : (
          <div className="sc-panel" style={{ ...card, borderColor: 'var(--gold)' }}>
            <span style={{ ...kicker, color: 'var(--gold)' }}>{t('pathDone')}</span>
            <h2 style={title}>{t('sanctuaryName')}</h2>
            <p style={line}>{t('sanctuaryIntro')}</p>
            <button className="sc-btn" style={{ marginTop: 12, padding: '11px 30px' }} onClick={onOpenSanctuary}>
              {t(unlocked ? 'enterSanctuary' : 'navSanctuary')}
            </button>
          </div>
        )}

        {pending && (
          <button className="sc-chip" style={row} onClick={() => onOpenSession(pending.id)}>
            <span style={rowText}>
              <span style={rowKicker}>{t('halfwayTitle')}</span>
              <span style={rowTitle}>{pending.title[lang]}</span>
            </span>
            <span style={rowAction}>{t('resumeShort')} →</span>
          </button>
        )}

        {favorites.length > 0 && (
          <div style={shelf}>
            <span style={{ ...kicker, color: 'var(--gold)' }}>{t('favoritesTitle')}</span>
            <div style={chips}>
              {favorites.map((s) => (
                <button key={s.id} className="sc-chip" onClick={() => onOpenSession(s.id)}>♥ {s.title[lang]}</button>
              ))}
            </div>
          </div>
        )}

        <button style={link} onClick={onExplore}>{t('seeAllLevels')}</button>
      </div>
    </div>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12,
};
const card: React.CSSProperties = {
  width: '100%', maxWidth: 420, padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center',
};
const kicker: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase' };
const title: React.CSSProperties = { fontSize: 19, letterSpacing: '0.04em', margin: '8px 0 0', color: 'var(--ink)' };
const line: React.CSSProperties = { fontSize: 13, lineHeight: 1.5, opacity: 0.85, margin: '6px 0 0' };
const meta: React.CSSProperties = { fontSize: 11.5, letterSpacing: '0.06em', opacity: 0.65, margin: '8px 0 0' };
const row: React.CSSProperties = {
  width: '100%', maxWidth: 420, marginTop: 10, padding: '10px 16px', borderRadius: 16,
  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
};
const rowText: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 };
const rowKicker: React.CSSProperties = { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7 };
const rowTitle: React.CSSProperties = { fontSize: 13 };
const rowAction: React.CSSProperties = { fontSize: 12, color: 'var(--gold)', flex: 'none' };
const shelf: React.CSSProperties = { width: '100%', maxWidth: 420, marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 };
const chips: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' };
const link: React.CSSProperties = {
  background: 'none', border: 'none', color: 'var(--ink)', opacity: 0.75, fontSize: 12.5,
  letterSpacing: '0.06em', marginTop: 14, padding: '6px 10px', textDecoration: 'underline',
};
