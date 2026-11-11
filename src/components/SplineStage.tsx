import { Suspense, lazy } from 'react';

// @splinetool/react-spline se carga de forma diferida (es pesado).
const Spline = lazy(() => import('@splinetool/react-spline'));

const SCENE_URL = import.meta.env.VITE_SPLINE_SCENE_URL as string | undefined;

/**
 * Fondo 3D persistente: la escena de SÚPER CONCIENCIA publicada en Spline.
 * Mientras no haya URL configurada, muestra un degradado cósmico de respaldo.
 */
export default function SplineStage() {
  if (!SCENE_URL) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(60% 50% at 50% 35%, #2a1a5e 0%, #140a2e 45%, #070a1e 100%)',
          zIndex: 0,
        }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 12,
            letterSpacing: '0.1em',
            opacity: 0.5,
          }}
        >
          Esperando la escena de Spline · set VITE_SPLINE_SCENE_URL
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} aria-hidden>
      <Suspense fallback={null}>
        <Spline scene={SCENE_URL} />
      </Suspense>
    </div>
  );
}
