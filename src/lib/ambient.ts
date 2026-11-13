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
import { setAudioSession } from './audioSession';

/**
 * `gain` nivela las pistas entre sí: medidas, el piano sale a −17 dB, la etérea a
 * −23 dB y la de naturaleza a −31 dB. Con estos valores las tres quedan cerca de −24 dB.
 */
const TRACKS: Record<MusicChoice, { url: string; gain: number } | null> = {
  nature: { url: '/audio/nature.m4a', gain: 2.2 },
  ethereal: { url: '/audio/ethereal.m4a', gain: 1 },
  piano: { url: '/audio/piano.m4a', gain: 0.45 },
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
  // iPhone: sin esto, WebAudio se queda mudo cuando el teléfono está en silencio.
  setAudioSession('playback');
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
  ramp(master, volume, FADE_IN);
  startWatch();
}

export function pauseAmbient() {
  if (!ctx || !master) return;
  clearPending();
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
  ramp(master, volume, PAUSE_FADE * 2);
}

export function stopAmbient(fadeSeconds = 4) {
  if (!ctx || !master) return;
  clearPending();
  ramp(master, 0, fadeSeconds);
  pending = window.setTimeout(() => {
    stopWatch();
    decks.forEach((d) => d.el.pause());
    resumeList = [];
    pending = null;
  }, fadeSeconds * 1000 + 100);
}
