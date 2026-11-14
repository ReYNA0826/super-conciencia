import { useCallback, useEffect, useState } from 'react';
import SplineStage from './components/SplineStage';
import SceneGuard from './components/SceneGuard';
import WorldBackdrop, { PORTAL_IMAGE } from './components/WorldBackdrop';
import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import Home from './screens/Home';
import Universe from './screens/Universe';
import TabBar, { type Tab } from './components/TabBar';
import Meditation from './screens/Meditation';
import Session from './screens/Session';
import { recordedSessionsAvailable, sessionForLevel } from './data/sessions';
import Portal from './screens/Portal';
import Profile from './screens/Profile';
import { isPortalUnlocked, setPortalState } from './lib/portal';
import { getCurrentUser, onAuthChange, onPasswordRecovery, signOut, hasBackend, type AppUser } from './lib/auth';
import NewPassword from './screens/NewPassword';
import { loadProgress, saveLevel } from './lib/progress';
import { unlockAmbient } from './lib/ambient';
import { unlockVoice } from './lib/voice';
import { listenForAuthLinks } from './lib/authLinks';
import { NO_INVITES, loadInviteState, type InviteState } from './lib/invitations';

export type Screen = 'onboarding' | 'auth' | 'newPassword' | 'home' | 'universe' | 'meditation' | 'session' | 'portal' | 'profile';

/** Pantallas con la navegación inferior (Inicio, Explorar, Santuario, Perfil). */
const TAB_OF: Partial<Record<Screen, Tab>> = { home: 'home', universe: 'explore', portal: 'sanctuary', profile: 'profile' };
const SCREEN_OF: Record<Tab, Screen> = { home: 'home', explore: 'universe', sanctuary: 'portal', profile: 'profile' };

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  // A dónde vuelve la persona al cerrar una meditación: al lugar desde donde la abrió.
  const [returnTo, setReturnTo] = useState<Screen>('home');
  // Meditación grabada abierta en el reproductor.
  const [sessionId, setSessionId] = useState<string>('nivel-1');
  const [user, setUser] = useState<AppUser | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [invites, setInvites] = useState<InviteState>(NO_INVITES);
  const [authNotice, setAuthNotice] = useState(false);

  const userId = user?.id ?? null;
  const unlocked = isPortalUnlocked(completed, invites.hasInvite);
  // Invitar es para quien completó los seis niveles con una cuenta (el servidor lo vuelve a comprobar).
  const canInvite = Boolean(userId) && [1, 2, 3, 4, 5, 6].every((n) => completed.includes(n));

  // Invitaciones al nivel 7: las que creó esta persona y si canjeó alguna.
  const refreshInvites = useCallback(() => {
    void loadInviteState(userId).then(setInvites);
  }, [userId]);
  useEffect(refreshInvites, [refreshInvites]);
  const inAether = screen === 'portal' && unlocked;
  const dimScene = screen === 'meditation' || screen === 'session' || screen === 'profile' || (screen === 'portal' && !unlocked);

  // Sesión de Supabase (si hay backend configurado).
  useEffect(() => {
    if (!hasBackend) return;
    getCurrentUser().then(setUser);
    return onAuthChange(setUser);
  }, []);

  // Enlaces del correo (confirmar cuenta): abren la app y dejan a la persona dentro.
  useEffect(() => listenForAuthLinks((result) => {
    if (result === 'signed-in') {
      setAuthNotice(false);
      setScreen('home');
    } else if (result === 'recovery') {
      setAuthNotice(false);
      setScreen('newPassword'); // llegó por "restablecer contraseña"
    } else {
      setAuthNotice(true);
      setScreen('auth');
    }
  }), []);

  // En la web, el enlace de restablecer lo detecta Supabase solo y avisa con un evento.
  useEffect(() => onPasswordRecovery(() => setScreen('newPassword')), []);

  // Carga el progreso (nube si hay sesión, si no local).
  useEffect(() => {
    loadProgress(user?.id ?? null).then(setCompleted);
  }, [user]);

  // Refleja el estado del portal en la escena 3D.
  useEffect(() => {
    setPortalState(unlocked ? 'unlocked' : 'locked');
  }, [unlocked]);

  const completeLevel = (id: number) => {
    setCompleted((prev) => (prev.includes(id) ? prev : [...prev, id]));
    void saveLevel(user?.id ?? null, id);
  };

  const openLevel = (id: number) => {
    unlockAmbient(); // dentro del toque: permite que la música arranque en el teléfono
    unlockVoice(); // y también la voz guía
    setReturnTo(screen === 'universe' ? 'universe' : 'home');
    setSelectedLevel(id);
    // Si el nivel ya tiene su meditación grabada, se abre en el reproductor completo.
    const recorded = recordedSessionsAvailable ? sessionForLevel(id) : undefined;
    if (recorded) { setSessionId(recorded.id); setScreen('session'); } else setScreen('meditation');
  };

  /** Abre una meditación grabada de la biblioteca (por ejemplo, las de Gurú en el Santuario). */
  const openSession = (id: string) => {
    unlockAmbient();
    setReturnTo(screen === 'session' ? returnTo : screen);
    setSessionId(id);
    setScreen('session');
  };

  const begin = () => setScreen(hasBackend && !user ? 'auth' : 'home');

  // La escena de Spline trae su propio HTML (rótulos de planetas): estas marcas le dicen
  // al CSS en qué pantalla estamos, para mostrarlos solo donde no estorban.
  const tab = TAB_OF[screen];
  useEffect(() => {
    document.body.dataset.screen = screen;
    document.body.dataset.tabs = tab ? '1' : '0';
  }, [screen, tab]);

  const doSignOut = async () => {
    await signOut();
    setUser(null);
    setScreen('onboarding');
  };

  return (
    <>
      {/* key: al entrar o salir del Éter la protección empieza de cero */}
      <SceneGuard
        key={inAether ? 'aether' : 'universe'}
        fallback={
          <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} aria-hidden>
            <WorldBackdrop src={PORTAL_IMAGE} breathe={false} />
          </div>
        }
      >
        <SplineStage aether={inAether} />
      </SceneGuard>
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          width: '100%',
          // En pantallas de enfoque (meditación, perfil, portal) se oscurece la escena
          // para que el texto no compita con los planetas.
          background: dimScene ? 'rgba(7, 10, 30, 0.93)' : 'transparent',
          transition: 'background 0.6s ease',
        }}
      >
        {screen === 'onboarding' && <Onboarding onBegin={begin} />}
        {screen === 'auth' && (
          <Auth
            linkExpired={authNotice}
            onAuthed={() => { setAuthNotice(false); setScreen('home'); }}
            onGuest={() => { setAuthNotice(false); setScreen('home'); }}
          />
        )}
        {screen === 'newPassword' && <NewPassword onDone={() => setScreen('home')} />}
        {screen === 'home' && (
          <Home
            completed={completed}
            unlocked={unlocked}
            onOpenLevel={openLevel}
            onOpenSession={openSession}
            onOpenSanctuary={() => setScreen('portal')}
            onExplore={() => setScreen('universe')}
          />
        )}
        {screen === 'universe' && (
          <Universe
            completed={completed}
            unlocked={unlocked}
            onOpenLevel={openLevel}
            onOpenPortal={() => setScreen('portal')}
          />
        )}
        {screen === 'meditation' && (
          <Meditation level={selectedLevel} onClose={() => setScreen(returnTo)} onComplete={completeLevel} />
        )}
        {screen === 'session' && (
          <Session
            key={sessionId}
            sessionId={sessionId}
            onClose={() => setScreen(returnTo)}
            onComplete={(level) => { if (level) completeLevel(level); }}
          />
        )}
        {screen === 'portal' && (
          <Portal
            unlocked={unlocked}
            signedIn={Boolean(userId)}
            onRedeemed={refreshInvites}
            onBack={() => setScreen('home')}
            onComplete={() => completeLevel(7)}
            onOpenSession={openSession}
          />
        )}
        {screen === 'profile' && (
          <Profile
            completed={completed}
            unlocked={unlocked}
            user={user}
            invites={invites.mine}
            canInvite={canInvite}
            onInvitesChanged={refreshInvites}
            onSignOut={doSignOut}
            onDeleted={() => { setUser(null); setCompleted([]); setScreen('onboarding'); }}
          />
        )}
      </main>
      {tab && <TabBar active={tab} onSelect={(next) => setScreen(SCREEN_OF[next])} />}
    </>
  );
}
