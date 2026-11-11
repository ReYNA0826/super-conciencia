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

      <div className="sc-sheet">
        <p style={{ margin: 0, maxWidth: 320, fontSize: 15, lineHeight: 1.5, opacity: 0.9 }}>
          {t('tagline')}
        </p>
        <button className="sc-btn" style={{ marginTop: 18 }} onClick={onBegin}>
          {t('begin')}
        </button>
      </div>
    </div>
  );
}
