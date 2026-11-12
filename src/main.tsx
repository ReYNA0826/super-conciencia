import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Marca la página como "dentro de la app": la sala del Éter oculta su propio título y panel de prueba.
document.documentElement.classList.add('sc-app');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
