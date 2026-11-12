import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Red de seguridad: si alguna pantalla falla, en vez de dejar la app en blanco
 * se muestra un mensaje sereno con un botón para volver a empezar.
 * Va por fuera del selector de idioma, así que trae su propio texto bilingüe.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Súper Conciencia] pantalla con error:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const lang = (() => { try { return localStorage.getItem('sc-lang'); } catch { return null; } })();
    const en = lang === 'en';
    return (
      <div style={wrap} role="alert">
        <div className="sc-panel" style={{ padding: 28, maxWidth: 340, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--gold)', fontSize: 17, letterSpacing: '0.12em', marginTop: 0 }}>
            {en ? 'A moment of pause' : 'Un momento de pausa'}
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85 }}>
            {en
              ? 'Something did not load as expected. Your progress is safe.'
              : 'Algo no cargó como esperábamos. Tu progreso está a salvo.'}
          </p>
          <button className="sc-btn" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
            {en ? 'Return to the beginning' : 'Volver al inicio'}
          </button>
        </div>
      </div>
    );
  }
}

const wrap: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--bg)',
  color: 'var(--ink)',
};
