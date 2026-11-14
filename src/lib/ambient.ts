/**
 * Música / ambiente sonoro de las meditaciones.
 *
 * Los audios viven dentro de la app (public/audio), así suenan sin internet.
 * Cada pista se repite con un fundido cruzado entre dos reproductores, para que el
 * final de la pista no se note; entra, pausa y sale con suavidad.
 *
 * Todo pasa por WebAudio porque en iPhone el volumen de un <audio> no se puede
 * cambiar desde código (los fundidos no funcionarían).
 */
import type { MusicChoice } from './prefs';

/**
 * `gain` nivela las pistas entre sí. Las tres ya vienen niveladas a unos −24 dB dentro
 * del archivo; el piano queda un poco más bajo porque tiene pausas, y se compensa aquí.
 *
 * Pistas de noviembre 2026 (originales en store-assets/audio-originales/v2): naturaleza es
 * agua y viento continuos, la etérea un fondo sostenido y el piano va a ritmo libre.
 * Ninguna tiene campanas ni golpes repetidos: las anteriores sonaban todas a campana.
 */
// 14-nov: reemplazadas por la música propia de El Mapa de Tu Bienestar (creada por Reyna).
// Originales en store-assets/audio-originales/v3; niveladas a −24 dB con scripts/preparar-musica.py.
const track = (key: string) => ({ url: `/audio/${key}.m4a`, gain: 1 });
const TRACKS: Record<MusicChoice, { url: string; gain: number } | null> = {
  santuario: track('santuario'),
  refugio: track('refugio'),
  bosque: track('bosque'),
  ceremonial: track('ceremonial'),
  amanecer: track('amanecer'),
  saturno: track('saturno'),
  mente: track('mente'),
  mar: track('mar'),
  silence: null,
};

const FADE_IN = 4;        // segundos
// Las pistas se apagan solas en sus últimos ~10 s: la repetición entra antes de eso.
const LOOP_LEAD = 12;     // segundos antes del final en que entra la siguiente vuelta
const CROSSFADE = 8;      // segundos que dura la mezcla
const PAUSE_FADE = 0.5;

type Deck = { el: HTMLAudioElement; gain: GainNode };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let decks: Deck[] = [];
let active = 0;
let currentUrl: string | null = null;
let volume = 1;
// Volumen que elige la persona en el reproductor (0–1); multiplica al de la pista.
let userLevel = 1;
let audible = false;
let watch: number | null = null;
let pending: number | null = null;
let resumeList: HTMLAudioElement[] = [];

function ensure(): boolean {
  if (ctx) return true;
  if (typeof window === 'undefined') return false;
  const Ctor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return false;
  const context = new Ctor();
  const out = context.createGain();
  out.gain.value = 0;
  out.connect(context.destination);
  decks = [0, 1].map(() => {
    const el = new Audio();
    el.preload = 'auto';
    const gain = context.createGain();
    gain.gain.value = 0;
    context.createMediaElementSource(el).connect(gain).connect(out);
    return { el, gain };
  });
  // iPhone: sin esto, WebAudio se queda mudo cuando el teléfono está en silencio.
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'playback';
  } catch { /* no disponible en este sistema */ }
  ctx = context;
  master = out;
  return true;
}

function ramp(gain: GainNode, to: number, seconds: number) {
  if (!ctx) return;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(to, now + Math.max(0.01, seconds));
}

function clearPending() {
  if (pending !== null) { window.clearTimeout(pending); pending = null; }
}

function stopWatch() {
  if (watch !== null) { window.clearInterval(watch); watch = null; }
}

function startWatch() {
  stopWatch();
  watch = window.setInterval(() => {
    const cur = decks[active];
    if (!cur || cur.el.paused || !Number.isFinite(cur.el.duration)) return;
    if (cur.el.duration - cur.el.currentTime > LOOP_LEAD) return;
    // Se acerca el final: la otra copia entra desde el inicio mientras esta sale.
    const next = decks[1 - active];
    next.el.currentTime = 0;
    void next.el.play().catch(() => undefined);
    ramp(next.gain, 1, CROSSFADE);
    ramp(cur.gain, 0, CROSSFADE);
    active = 1 - active;
  }, 500);
}

/**
 * Prepara el audio. Llamar dentro del toque del usuario que abre una meditación:
 * los teléfonos solo permiten iniciar sonido a partir de un gesto.
 */
export function unlockAmbient() {
  if (ensure()) void ctx?.resume().catch(() => undefined);
}

export function startAmbient(choice: MusicChoice) {
  const track = TRACKS[choice];
  clearPending();
  if (!track) { stopAmbient(1); return; }
  if (!ensure() || !ctx || !master) return;
  void ctx.resume().catch(() => undefined);
  resumeList = [];
  const { url } = track;
  volume = track.gain;
  if (currentUrl !== url) {
    decks.forEach((d) => { d.el.pause(); d.el.src = url; });
    currentUrl = url;
  }
  decks.forEach((d) => { d.el.pause(); d.gain.gain.cancelScheduledValues(ctx!.currentTime); d.gain.gain.value = 0; });
  active = 0;
  const first = decks[0];
  first.el.currentTime = 0;
  first.gain.gain.value = 1;
  void first.el.play().catch(() => undefined);
  audible = true;
  ramp(master, volume * userLevel, FADE_IN);
  startWatch();
}

/** Volumen de la música elegido por la persona (0–1). Se aplica al instante si está sonando. */
export function setAmbientVolume(value: number) {
  userLevel = Math.min(1, Math.max(0, value));
  if (ctx && master && audible) ramp(master, volume * userLevel, 0.15);
}

export function pauseAmbient() {
  if (!ctx || !master) return;
  clearPending();
  audible = false;
  ramp(master, 0, PAUSE_FADE);
  resumeList = decks.filter((d) => !d.el.paused && !d.el.ended).map((d) => d.el);
  pending = window.setTimeout(() => { resumeList.forEach((el) => el.pause()); pending = null; }, PAUSE_FADE * 1000 + 50);
}

export function resumeAmbient() {
  if (!ctx || !master) return;
  clearPending();
  void ctx.resume().catch(() => undefined);
  resumeList.forEach((el) => void el.play().catch(() => undefined));
  resumeList = [];
  audible = true;
  ramp(master, volume * userLevel, PAUSE_FADE * 2);
}

export function stopAmbient(fadeSeconds = 4) {
  if (!ctx || !master) return;
  clearPending();
  audible = false;
  ramp(master, 0, fadeSeconds);
  pending = window.setTimeout(() => {
    stopWatch();
    decks.forEach((d) => d.el.pause());
    resumeList = [];
    pending = null;
  }, fadeSeconds * 1000 + 100);
}
