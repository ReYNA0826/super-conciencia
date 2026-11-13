import { Suspense, lazy, useEffect, useState } from 'react';
import { markSceneReady } from '../lib/sceneBridge';
import WorldBackdrop, { PORTAL_IMAGE } from './WorldBackdrop';

// @splinetool/react-spline se carga de forma diferida (es pesado).
const Spline = lazy(() => import('@splinetool/react-spline'));

// Escena pública "Celestial Portal Meditation" (los planetas de la pantalla de inicio).
// Va escrita aquí para que cualquier computadora que compile la app la incluya, aunque
// su .env.local no la tenga. .env.local puede reemplazarla si hace falta.
const DEFAULT_UNIVERSE_URL = 'https://prod.spline.design/NVlY2U0QYcSIYFEF/scene.splinecode';
const UNIVERSE_URL =
  (import.meta.env.VITE_SPLINE_SCENE_URL as string | undefined) || DEFAULT_UNIVERSE_URL;
const AETHER_URL = import.meta.env.VITE_SPLINE_AETHER_URL as string | undefined;

/**
 * Las escenas de Spline necesitan WebGPU. Donde no lo hay (iPhone con iOS anterior al 26,
 * simulador, algunos Android), Spline no falla: pinta en inglés "This scene requires a
 * WebGPU-capable browser" sobre el lienzo. Se comprueba antes y, si falta, se usa el portal pintado.
 */
type GpuSupport = 'checking' | 'yes' | 'no';
let gpuSupport: Promise<boolean> | null = null;

function checkWebGpu(): Promise<boolean> {
  if (!gpuSupport) {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter: () => Promise<unknown> } }).gpu;
    gpuSupport = gpu
      ? gpu.requestAdapter().then((adapter) => Boolean(adapter), () => false)
      : Promise.resolve(false);
  }
  return gpuSupport;
}

function PaintedPortal() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} aria-hidden>
      <WorldBackdrop src={PORTAL_IMAGE} breathe={false} />
    </div>
  );
}

/**
 * Fondo 3D persistente: la escena de SÚPER CONCIENCIA publicada en Spline.
 * Mientras no haya URL configurada, muestra un degradado cósmico de respaldo.
 */
export default function SplineStage({ aether = false }: { aether?: boolean }) {
  // Universo (planetas) en casi toda la app; la sala del Éter solo al entrar al nivel 7.
  const SCENE_URL = aether ? AETHER_URL ?? UNIVERSE_URL : UNIVERSE_URL;
  const [gpu, setGpu] = useState<GpuSupport>('checking');
  useEffect(() => {
    let alive = true;
    void checkWebGpu().then((ok) => { if (alive) setGpu(ok ? 'yes' : 'no'); });
    return () => { alive = false; };
  }, []);

  // Sin escena 3D publicada o sin WebGPU: el portal pintado como fondo.
  if (!SCENE_URL || gpu === 'no') return <PaintedPortal />;
  if (gpu === 'checking') return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} aria-hidden>
      <Suspense fallback={null}>
        <Spline key={SCENE_URL} scene={SCENE_URL} onLoad={() => markSceneReady()} />
      </Suspense>
    </div>
  );
}
