import type { ReactNode } from 'react';
import { useLang } from '../i18n/LanguageContext';
import type { StringKey } from '../i18n/strings';

/**
 * Navegación principal: Inicio, Explorar, Santuario y Perfil.
 * Reemplaza los números 1–7 que traía la escena de Spline, que obligaban a recordar
 * qué era cada uno. Se oculta sola durante una práctica (body[data-focus="1"]).
 */
export type Tab = 'home' | 'explore' | 'sanctuary' | 'profile';

const TABS: { id: Tab; label: StringKey; icon: ReactNode }[] = [
  {
    id: 'home',
    label: 'navHome',
    icon: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  },
  {
    id: 'explore',
    label: 'navExplore',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m15.2 8.8-1.8 4.6-4.6 1.8 1.8-4.6z" />
      </>
    ),
  },
  {
    id: 'sanctuary',
    label: 'navSanctuary',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
      </>
    ),
  },
  {
    id: 'profile',
    label: 'navProfile',
    icon: (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.200 1.900 7 5.500" />
      </>
    ),
  },
];

export default function TabBar({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  const { t } = useLang();
  return (
    <nav className="sc-tabbar" aria-label={t('navLabel')}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {tab.icon}
          </svg>
          <span>{t(tab.label)}</span>
        </button>
      ))}
    </nav>
  );
}
