import { useLang } from '../i18n/LanguageContext';
import { LEVELS } from '../data/levels';
import { useState } from 'react';
import { deleteMyAccount, type AppUser } from '../lib/auth';
import type { StringKey } from '../i18n/strings';
import { MAX_INVITATIONS, createInvitation, type MyInvitation } from '../lib/invitations';
import {
  MUSICS, VOICES, loadSanctuaryPrefs, saveSanctuaryPrefs,
  type MusicChoice, type SanctuaryPrefs, type VoiceChoice,
} from '../lib/prefs';

const PRIVACY_URL = 'https://dreameducationus.com/super-conciencia-privacidad/';

const VOICE_LABEL: Record<VoiceChoice, StringKey> = { female: 'voiceFemale', male: 'voiceMale' };
const MUSIC_LABEL: Record<MusicChoice, StringKey> = {
  nature: 'musicNature', ethereal: 'musicEthereal', piano: 'musicPiano', silence: 'musicSilence',
};

type Props = {
  completed: number[];
  unlocked: boolean;
  user: AppUser | null;
  /** Invitaciones al nivel 7 creadas por esta persona. */
  invites: MyInvitation[];
  /** Completó los seis niveles con una cuenta: puede invitar. */
  canInvite: boolean;
  onInvitesChanged: () => void;
  onSignOut: () => void;
  onDeleted: () => void;
  onBack: () => void;
};

export default function Profile({
  completed, unlocked, user, invites, canInvite, onInvitesChanged, onSignOut, onDeleted, onBack,
}: Props) {
  const { lang, setLang, t } = useLang();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<SanctuaryPrefs>(loadSanctuaryPrefs);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const updatePrefs = (patch: Partial<SanctuaryPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    saveSanctuaryPrefs(next);
  };

  const doCreateInvite = async () => {
    if (inviteBusy) return;
    setInviteBusy(true); setInviteMsg(null);
    const result = await createInvitation();
    setInviteBusy(false);
    if ('error' in result) {
      setInviteMsg(t(
        result.error === 'limit_reached' ? 'inviteLimit'
          : result.error === 'levels_incomplete' ? 'invitationsLocked'
            : 'inviteError',
      ));
      return;
    }
    onInvitesChanged();
  };

  const doShareInvite = async (code: string) => {
    const text = t('inviteShareText').replace('{code}', code);
    try {
      if (typeof navigator.share === 'function') { await navigator.share({ text }); return; }
    } catch { /* canceló o no disponible: se copia */ }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(code);
    } catch { setInviteMsg(t('inviteError')); }
  };

  const doDelete = async () => {
    setBusy(true); setErr(null);
    const { error } = await deleteMyAccount();
    setBusy(false);
    if (error) { setErr(t('deleteError')); return; }
    onDeleted();
  };

  return (
    <div style={wrap}>
      <h2 style={{ color: 'var(--gold)', letterSpacing: '0.12em' }}>{t('profile')}</h2>

      {user?.email && (
        <p style={{ fontSize: 12.5, opacity: 0.8, marginTop: -6 }}>{user.email}</p>
      )}

      <section className="sc-panel" style={{ padding: 18, width: '100%', maxWidth: 420 }}>
        <h3 style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 0 }}>{t('progress')}</h3>
        {LEVELS.map((lvl) => {
          const isFinal = lvl.id === 7;
          const done = isFinal ? unlocked : completed.includes(lvl.id);
          return (
            <div key={lvl.id} style={row}>
              <span style={{ ...dot, background: done ? lvl.color : 'rgba(255,255,255,0.15)' }} />
              <span style={{ fontSize: 12, opacity: done ? 1 : 0.6 }}>
                {lang === 'es' ? lvl.es : lvl.en}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>
                {isFinal && !unlocked ? t('sealed') : done ? '✓' : ''}
              </span>
            </div>
          );
        })}
      </section>

      <section className="sc-panel" style={{ padding: 18, width: '100%', maxWidth: 420, marginTop: 14 }}>
        <h3 style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 0 }}>{t('language')}</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          {(['es', 'en'] as const).map((l) => (
            <button key={l} className="sc-btn" style={{ padding: '8px 16px', opacity: lang === l ? 1 : 0.55 }} onClick={() => setLang(l)}>
              {l === 'es' ? 'Español' : 'English'}
            </button>
          ))}
        </div>
      </section>

      <section className="sc-panel" style={{ padding: 18, width: '100%', maxWidth: 420, marginTop: 14 }}>
        <h3 style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 0 }}>{t('musicPref')}</h3>
        <div style={chips}>
          {MUSICS.map((m) => (
            <button key={m} type="button" className="sc-chip" aria-pressed={prefs.music === m} onClick={() => updatePrefs({ music: m })}>
              {t(MUSIC_LABEL[m])}
            </button>
          ))}
        </div>
        <h3 style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 18 }}>{t('voiceGuru')}</h3>
        <div style={chips}>
          {VOICES.map((v) => (
            <button key={v} type="button" className="sc-chip" aria-pressed={prefs.voice === v} onClick={() => updatePrefs({ voice: v })}>
              {t(VOICE_LABEL[v])}
            </button>
          ))}
        </div>
      </section>

      <section className="sc-panel" style={{ padding: 18, width: '100%', maxWidth: 420, marginTop: 14 }}>
        <h3 style={{ fontSize: 13, letterSpacing: '0.1em', marginTop: 0 }}>{t('invitationsTitle')}</h3>
        {!user ? (
          <p style={{ ...hint, marginTop: 0 }}>{t('invitationsNeedAccount')}</p>
        ) : !canInvite ? (
          <p style={{ ...hint, marginTop: 0 }}>{t('invitationsLocked')}</p>
        ) : (
          <>
            <p style={{ ...hint, marginTop: 0 }}>{t('invitationsIntro')}</p>
            {invites.map((inv) => (
              <div key={inv.code} style={row}>
                <code style={{ fontSize: 13, letterSpacing: '0.08em', color: inv.redeemed ? 'var(--ink)' : 'var(--gold)', opacity: inv.redeemed ? 0.5 : 1 }}>
                  {inv.code}
                </code>
                <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>
                  {inv.redeemed ? t('inviteUsed') : copiedCode === inv.code ? t('copied') : t('inviteAvailable')}
                </span>
                {!inv.redeemed && (
                  <button type="button" className="sc-chip" onClick={() => doShareInvite(inv.code)}>{t('share')}</button>
                )}
              </div>
            ))}
            {invites.length < MAX_INVITATIONS ? (
              <button className="sc-btn" style={{ padding: '9px 18px', fontSize: 13, marginTop: 12 }} disabled={inviteBusy} onClick={doCreateInvite}>
                {inviteBusy ? '…' : t('createInvitation')}
              </button>
            ) : (
              <p style={hint}>{t('inviteLimit')}</p>
            )}
            {inviteMsg && <p style={{ ...hint, color: '#ffd9a0', opacity: 1 }}>{inviteMsg}</p>}
          </>
        )}
      </section>

      <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
        <button className="sc-btn" onClick={onBack}>{t('back')}</button>
        {user && (
          <button className="sc-btn" onClick={onSignOut} style={{ background: 'rgba(60,30,80,0.5)' }}>
            {t('signOut')}
          </button>
        )}
      </div>

      {user && (
        <section style={{ marginTop: 26, width: '100%', maxWidth: 420, textAlign: 'center' }}>
          {!confirming ? (
            <button onClick={() => setConfirming(true)} style={dangerLink}>{t('deleteAccount')}</button>
          ) : (
            <div className="sc-panel" style={{ padding: 16 }}>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 0 }}>{t('deleteConfirm')}</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="sc-btn" style={{ padding: '8px 16px' }} disabled={busy} onClick={() => setConfirming(false)}>{t('deleteCancel')}</button>
                <button className="sc-btn" style={{ padding: '8px 16px', background: 'rgba(140,30,60,0.55)' }} disabled={busy} onClick={doDelete}>{busy ? '…' : t('deleteYes')}</button>
              </div>
              {err && <p style={{ fontSize: 12, color: '#ffb3c1' }}>{err}</p>}
            </div>
          )}
        </section>
      )}

      <a href={PRIVACY_URL} target="_blank" rel="noreferrer" style={{ marginTop: 18, fontSize: 11.5, color: 'var(--ink)', opacity: 0.6 }}>{t('privacy')}</a>
    </div>
  );
}

const dangerLink: React.CSSProperties = {
  background: 'none', border: 'none', color: '#ffb3c1', fontSize: 12.5, textDecoration: 'underline', opacity: 0.85,
};

const wrap: React.CSSProperties = {
  height: '100%',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 'calc(var(--safe-top) + 28px) 20px calc(var(--safe-bottom) + 28px)',
};
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' };
const chips: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7 };
const hint: React.CSSProperties = { fontSize: 11.5, lineHeight: 1.5, opacity: 0.7, margin: '10px 0 0' };
const dot: React.CSSProperties = { width: 10, height: 10, borderRadius: '50%', flex: '0 0 auto' };
