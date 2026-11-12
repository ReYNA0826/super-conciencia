/**
 * Fondo pintado de cada mundo (enfoque híbrido): la ilustración da la riqueza visual
 * y la escena 3D de Spline queda para lo que se mueve. Movimiento muy lento (respira y
 * se acerca apenas); con "reducir movimiento" queda quieto.
 */
type Props = { src: string; breathe?: boolean; focusY?: string };

export default function WorldBackdrop({ src, breathe = true, focusY = '42%' }: Props) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <div
        className="sc-world"
        style={{ position: 'absolute', inset: '-3%', backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      {breathe && (
        <div
          className="sc-world-glow"
          style={{ position: 'absolute', left: '50%', top: focusY, width: '70vw', height: '70vw', maxWidth: 420, maxHeight: 420,
            transform: 'translate(-50%,-50%)', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 65%)' }}
        />
      )}
      {/* velo inferior para que el texto se lea sobre cualquier ilustración */}
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(7,10,30,0.25) 0%, rgba(7,10,30,0.05) 30%, rgba(7,10,30,0.55) 62%, rgba(7,10,30,0.92) 100%)' }} />
    </div>
  );
}

/** Imagen de cada mundo (public/worlds). */
export const WORLD_IMAGE: Record<number, string> = {
  1: '/worlds/world-1.webp',
  2: '/worlds/world-2.webp',
  3: '/worlds/world-3.webp',
  4: '/worlds/world-4.webp',
  5: '/worlds/world-5.webp',
  6: '/worlds/world-6.webp',
  7: '/worlds/world-7.webp',
};
export const PORTAL_IMAGE = '/worlds/portal.webp';
