/**
 * Motor de una meditación grabada.
 *
 * Una sesión es una fila de bloques; cada bloque es un audio de voz seguido de un silencio
 * de práctica. El motor reproduce la voz, espera el silencio y pasa al siguiente bloque.
 * Sabe pausar, continuar, retroceder unos segundos, empezar en cualquier punto (para
 * reanudar una sesión interrumpida) y saltar al bloque de cierre.
 *
 * El avance usa el reloj real, no la cuenta de temporizadores: si el teléfono los frena
 * (pantalla bloqueada, app en segundo plano), al volver se pone al día solo.
 *
 * La voz pasa por WebAudio cuando se puede, porque en iPhone el volumen de un <audio> no
 * se puede cambiar desde código.
 */

export type PlayerPhase = 'voice' | 'silence' | 'done';

export type PlayerSnapshot = {
  index: number;
  phase: PlayerPhase;
  playing: boolean;
  /** Segundos transcurridos de toda la sesión. */
  position: number;
  total: number;
  /** Segundos dentro del bloque actual (voz + silencio): sirve para reanudar. */
  offset: number;
  /** La voz de este bloque no se pudo cargar (sin internet): la sesión sigue en silencio. */
  voiceMissing: boolean;
};

export type PlayerOptions = {
  urls: string[];
  /** Duración de cada audio de voz, en segundos. */
  durations: number[];
  /** Silencio que sigue a cada bloque, en segundos. */
  silences: number[];
  voiceVolume: number;
  start?: { index: number; offset: number };
  onChange: (snapshot: PlayerSnapshot) => void;
  onDone: () => void;
};

export type SessionPlayer = {
  play: () => void;
  pause: () => void;
  /** Retrocede unos segundos de guía. */
  back: (seconds: number) => void;
  setVoiceVolume: (value: number) => void;
  /** Sale con suavidad de lo que suena y pasa al bloque de cierre. */
  goToClosing: () => void;
  snapshot: () => PlayerSnapshot;
  destroy: () => void;
};

type AudioCtor = typeof AudioContext;

export function createSessionPlayer(opts: PlayerOptions): SessionPlayer {
  const { urls, durations, silences } = opts;
  const count = urls.length;
  const starts: number[] = [];
  let acc = 0;
  for (let i = 0; i < count; i++) { starts.push(acc); acc += durations[i] + silences[i]; }
  const total = acc;

  const el = new Audio();
  el.preload = 'auto';
  el.crossOrigin = 'anonymous'; // los audios vienen de otro dominio: WebAudio lo exige

  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let volume = opts.voiceVolume;
  try {
    const Ctor: AudioCtor | undefined = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (Ctor) {
      ctx = new Ctor();
      gain = ctx.createGain();
      gain.gain.value = volume;
      ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
    }
  } catch { ctx = null; gain = null; }
  if (!gain) el.volume = volume;
  // iPhone: sin esto, la voz enmudece con el teléfono en silencio y se corta al bloquear la pantalla.
  try {
    const audioSession = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
    if (audioSession) audioSession.type = 'playback';
  } catch { /* no disponible en este sistema */ }

  let index = Math.min(Math.max(opts.start?.index ?? 0, 0), count - 1);
  let phase: PlayerPhase = 'voice';
  let playing = false;
  let destroyed = false;
  let voiceMissing = false;
  // Mientras no suena un audio (silencio, o voz que no cargó) el avance se mide con el reloj.
  let clockBase = 0;      // segundos ya contados dentro del tramo actual
  let clockFrom = 0;      // Date.now() en que se reanudó el reloj
  let timed = false;      // el tramo actual avanza por reloj
  let ticker: number | null = null;

  const clock = () => clockBase + (playing && timed ? (Date.now() - clockFrom) / 1000 : 0);
  const startClock = (from: number) => { clockBase = from; clockFrom = Date.now(); timed = true; };

  const offsetInBlock = (): number => {
    if (phase === 'done') return durations[index] + silences[index];
    if (phase === 'silence') return durations[index] + Math.min(clock(), silences[index]);
    return voiceMissing ? Math.min(clock(), durations[index]) : Math.min(el.currentTime || 0, durations[index]);
  };

  const snapshot = (): PlayerSnapshot => ({
    index,
    phase,
    playing,
    position: phase === 'done' ? total : starts[index] + offsetInBlock(),
    total,
    offset: offsetInBlock(),
    voiceMissing,
  });
  const emit = () => { if (!destroyed) opts.onChange(snapshot()); };

  const finish = () => {
    phase = 'done';
    playing = false;
    timed = false;
    stopTicker();
    el.pause();
    emit();
    opts.onDone();
  };

  const beginSilence = (from = 0) => {
    phase = 'silence';
    voiceMissing = false;
    startClock(from);
    emit();
  };

  const nextBlock = () => {
    if (index >= count - 1) { finish(); return; }
    enterBlock(index + 1, 0);
  };

  /** Coloca el motor en un bloque, a `offset` segundos de su inicio (voz + silencio). */
  function enterBlock(i: number, offset: number) {
    index = i;
    voiceMissing = false;
    timed = false;
    if (offset >= durations[i]) {
      el.pause();
      beginSilence(Math.min(offset - durations[i], silences[i]));
      return;
    }
    phase = 'voice';
    const begin = () => {
      try { el.currentTime = offset; } catch { /* aún sin datos: empieza desde el inicio */ }
      if (playing) void el.play().catch(() => undefined);
    };
    el.src = urls[i];
    if (offset > 0) el.addEventListener('loadedmetadata', begin, { once: true });
    else if (playing) void el.play().catch(() => undefined);
    emit();
  }

  el.addEventListener('ended', () => { if (!destroyed && phase === 'voice') beginSilence(0); });
  el.addEventListener('error', () => {
    // Sin conexión o audio ausente: el bloque transcurre en silencio, con su texto en pantalla.
    if (destroyed || phase !== 'voice' || voiceMissing) return;
    voiceMissing = true;
    startClock(0);
    emit();
  });

  const tick = () => {
    if (destroyed || !playing) return;
    if (phase === 'silence' && clock() >= silences[index]) { nextBlock(); return; }
    if (phase === 'voice' && voiceMissing && clock() >= durations[index]) { beginSilence(0); return; }
    emit();
  };
  function startTicker() {
    if (ticker === null) ticker = window.setInterval(tick, 500);
  }
  function stopTicker() {
    if (ticker !== null) { window.clearInterval(ticker); ticker = null; }
  }
  // Al volver a la app, ponerse al día de inmediato en vez de esperar al siguiente pulso.
  const onVisible = () => { if (document.visibilityState === 'visible') tick(); };
  document.addEventListener('visibilitychange', onVisible);

  const play = () => {
    if (destroyed || phase === 'done' || playing) return;
    playing = true;
    void ctx?.resume().catch(() => undefined);
    if (timed) clockFrom = Date.now();
    if (phase === 'voice' && !voiceMissing) void el.play().catch(() => undefined);
    startTicker();
    emit();
  };

  const pause = () => {
    if (destroyed || !playing) return;
    if (timed) clockBase = clock();
    playing = false;
    el.pause();
    stopTicker();
    emit();
  };

  const back = (seconds: number) => {
    if (destroyed || phase === 'done') return;
    if (phase === 'voice' && !voiceMissing) {
      try { el.currentTime = Math.max(0, el.currentTime - seconds); } catch { /* sin datos */ }
      emit();
      return;
    }
    // En un silencio, "retroceder" vuelve a los últimos segundos de la voz de ese bloque.
    enterBlock(index, Math.max(0, durations[index] - seconds));
  };

  const setVoiceVolume = (value: number) => {
    volume = Math.min(1, Math.max(0, value));
    if (gain && ctx) gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    else el.volume = volume;
  };

  const goToClosing = () => {
    if (destroyed || phase === 'done') return;
    if (index >= count - 1) return; // ya está en el cierre
    const jump = () => {
      if (destroyed) return;
      if (gain && ctx) gain.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
      else el.volume = volume;
      playing = true;
      startTicker();
      enterBlock(count - 1, 0);
    };
    if (phase === 'voice' && !voiceMissing && playing) {
      // Baja la voz en un segundo en vez de cortarla, y entonces entra el cierre.
      if (gain && ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      window.setTimeout(jump, 1200);
    } else {
      void ctx?.resume().catch(() => undefined);
      jump();
    }
  };

  const destroy = () => {
    destroyed = true;
    stopTicker();
    document.removeEventListener('visibilitychange', onVisible);
    el.pause();
    el.removeAttribute('src');
    el.load();
    void ctx?.close().catch(() => undefined);
  };

  enterBlock(index, Math.max(0, opts.start?.offset ?? 0));

  return { play, pause, back, setVoiceVolume, goToClosing, snapshot, destroy };
}
