import { useEffect, useState } from 'react';
import SplineStage from './components/SplineStage';
import Onboarding from './screens/Onboarding';
import Auth from './screens/Auth';
import Universe from './screens/Universe';
import Meditation from './screens/Meditation';
import Portal from './screens/Portal';
import Profile from './screens/Profile';
import { isPortalUnlocked, setPortalState } from './lib/portal';
import { getCurrentUser, onAuthChange, signOut, hasBackend, type AppUser } from './lib/auth';
import { loadProgress, saveLevel } from './lib/progress';
import { unlockAmbient } from './lib/ambient';
import { listenForAuthLinks } from './lib/authLinks';

export type Screen = 'onboarding' | 'auth' | 'universe' | 'meditation' | 'portal' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [user, setUser] = useState<AppUser | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [hasInvite] = useState(false);
  const [authNotice, setAuthNotice] = useState(false);

  const unlocked = isPortalUnlocked(completed, hasInvite);
  const inAether = screen === 'portal' && unlocked;
  const dimScene = screen === 'meditation' || screen === 'profile' || (screen === 'portal' && !unlocked);

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
      setScreen('universe');
    } else {
      setAuthNotice(true);
      setScreen('auth');
    }
  }), []);

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
    setSelectedLevel(id);
    setScreen('meditation');
  };

  const begin = () => setScreen(hasBackend && !user ? 'auth' : 'universe');

  const doSignOut = async () => {
    await signOut();
    setUser(null);
    setScreen('onboarding');
  };

  return (
    <>
      <SplineStage aether={inAether} />
      <main
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          width: '100%',
          // En pantallas de enfoque (meditación, perfil, portal) se oscurece la escena
          // para que el texto no compita con los planetas.
          background: dimScene ? 'rgba(7, 10, 30, 0.86)' : 'transparent',
          transition: 'background 0.6s ease',
        }}
      >
        {screen === 'onboarding' && <Onboarding onBegin={begin} />}
        {screen === 'auth' && (
          <Auth
            linkExpired={authNotice}
            onAuthed={() => { setAuthNotice(false); setScreen('universe'); }}
            onGuest={() => { setAuthNotice(false); setScreen('universe'); }}
          />
        )}
        {screen === 'universe' && (
          <Universe
            completed={completed}
            unlocked={unlocked}
            onOpenLevel={openLevel}
            onOpenPortal={() => setScreen('portal')}
            onOpenProfile={() => setScreen('profile')}
          />
        )}
        {screen === 'meditation' && (
          <Meditation level={selectedLevel} onClose={() => setScreen('universe')} onComplete={completeLevel} />
        )}
        {screen === 'portal' && (
          <Portal unlocked={unlocked} onBack={() => setScreen('universe')} onComplete={() => completeLevel(7)} />
        )}
        {screen === 'profile' && (
          <Profile
            completed={completed}
            unlocked={unlocked}
            user={user}
            onSignOut={doSignOut}
            onDeleted={() => { setUser(null); setCompleted([]); setScreen('onboarding'); }}
            onBack={() => setScreen('universe')}
          />
        )}
      </main>
    </>
  );
}
