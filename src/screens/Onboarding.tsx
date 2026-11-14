import { useLang } from '../i18n/LanguageContext';

/**
 * Pantalla de bienvenida. El título "SÚPER CONCIENCIA", el portal y los planetas
 * los dibuja la escena de Spline; aquí solo va el idioma y el botón para empezar.
 */
export default function Onboarding({ onBegin }: { onBegin: () => void }) {
  const { lang, setLang, t } = useLang();

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div className="sc-lang" role="group" aria-label="Idioma / Language">
        {(['es', 'en'] as const).map((l) => (
          <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* El botón va primero y la frase debajo, pequeña: así no tapan el rótulo del primer planeta. */}
      <div className="sc-sheet sc-sheet--clear">
        <button className="sc-btn" onClick={onBegin}>
          {t('begin')}
        </button>
        <p style={{ margin: '12px 0 0', maxWidth: 320, fontSize: 12, lineHeight: 1.5, letterSpacing: '0.04em', opacity: 0.85, textShadow: '0 1px 10px rgba(7,10,30,0.95)' }}>
          {t('tagline')}
        </p>
      </div>
    </div>
  );
}
