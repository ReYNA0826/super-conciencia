import { useEffect, useState } from 'react';
import SplineStage from './components/SplineStage';
import Onboarding from './screens/Onboarding';
import Universe from './screens/Universe';
import Portal from './screens/Portal';
import Profile from './screens/Profile';
import { isPortalUnlocked, setPortalState } from './lib/portal';

export type Screen = 'onboarding' | 'universe' | 'portal' | 'profile';

export default function App() {
  const [screen, setScreen] = useState<Screen>('onboarding');

  // Demo local: niveles completados (luego vendrá de Supabase).
  const [completed, setCompleted] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('sc-completed') || '[]'); } catch { return []; }
  });
  const [hasInvite] = useState(false);

  const unlocked = isPortalUnlocked(completed, hasInvite);

  // Refleja el estado del portal en la escena 3D cuando cambie.
  useEffect(() => {
    setPortalState(unlocked ? 'unlocked' : 'locked');
  }, [unlocked]);

  const completeLevel = (id: number) => {
    setCompleted((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try { localStorage.setItem('sc-completed', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <>
      <SplineStage />
      <main style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
        {screen === 'onboarding' && <Onboarding onBegin={() => setScreen('universe')} />}
        {screen === 'universe' && (
          <Universe
            completed={completed}
            unlocked={unlocked}
            onOpenPortal={() => setScreen('portal')}
            onOpenProfile={() => setScreen('profile')}
            onComplete={completeLevel}
          />
        )}
        {screen === 'portal' && (
          <Portal unlocked={unlocked} onBack={() => setScreen('universe')} />
        )}
        {screen === 'profile' && (
          <Profile completed={completed} unlocked={unlocked} onBack={() => setScreen('universe')} />
        )}
      </main>
    </>
  );
}
