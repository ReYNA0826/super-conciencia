/**
 * Voz guía grabada de las meditaciones.
 *
 * Cada fase de una meditación puede tener un audio corto (public/audio/voz/...). Viven
 * dentro de la app, así que suenan sin internet y sin costo por reproducción.
 *
 * Se usa un solo reproductor para toda la app: en el teléfono hay que "despertarlo"
 * dentro de un toque (unlockVoice) y después ya puede cambiar de audio por su cuenta.
 */

/** La locución se grabó a ritmo de lectura; para meditar se reproduce un poco más lenta. */
const RATE = 0.88;

let el: HTMLAudioElement | null = null;

function player(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  if (!el) {
    el = new Audio();
    el.preload = 'auto';
  }
  return el;
}

/** Llamar dentro de un toque del usuario: permite que la voz suene después sola. */
export function unlockVoice() {
  const a = player();
  if (!a || a.src) return;
  // Un audio vacío y mudo basta para que el teléfono autorice este reproductor.
  a.muted = true;
  a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  void a.play().catch(() => undefined).finally(() => { a.muted = false; });
}

/** Reproduce el audio de una fase desde el principio. `rate` 1 = tal como se grabó. */
export function playVoice(url: string, rate: number = RATE) {
  const a = player();
  if (!a) return;
  a.pause();
  a.muted = false;
  a.src = url;
  a.currentTime = 0;
  a.playbackRate = rate;
  a.preservesPitch = true;
  void a.play().catch((err) => console.warn('[voice] no se pudo reproducir', url, err));
}

export function pauseVoice() {
  el?.pause();
}

export function resumeVoice() {
  if (el && el.src && !el.ended) void el.play().catch(() => undefined);
}

export function stopVoice() {
  if (!el) return;
  el.pause();
  el.removeAttribute('src');
  el.load();
}

/** Segundos que tarda en sonar un audio de `seconds` de duración, ya con el ritmo lento. */
export function voicedSeconds(seconds: number) {
  return seconds / RATE;
}
