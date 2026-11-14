"""Prepara la música propia (El Mapa de Tu Bienestar) para la app.

Uso: python3 -I scripts/preparar-musica.py

Toma los originales de store-assets/audio-originales/v3/<clave>.(mp3|wav), los nivela a
unos −24 dB (medido igual que las pistas anteriores: mono, ventanas de 50 ms) para que no
tapen la voz de Gurú, y los guarda en public/audio/<clave>.m4a como HE-AAC 48 kbps.
Sin numpy ni ffmpeg: decodifica con afconvert (macOS) y escala las muestras con array.
"""
import array
import math
import os
import subprocess
import sys
import tempfile
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'store-assets', 'audio-originales', 'v3')
OUT = os.path.join(ROOT, 'public', 'audio')
TARGET_DB = -24.0


def rms_db(samples, channels):
    # Promedio por ventanas de 50 ms sobre la mezcla mono, como en el análisis.
    frame = 2205 * channels
    acc, count = 0.0, 0
    for i in range(0, len(samples) - frame, frame * 4):  # 1 de cada 4 ventanas basta para medir
        seg = samples[i:i + frame]
        acc += sum(v * v for v in seg) / len(seg)
        count += 1
    return 20 * math.log10(math.sqrt(acc / count) / 32768)


def main():
    keys = sys.argv[1:] or sorted(os.path.splitext(f)[0] for f in os.listdir(SRC) if f.endswith(('.mp3', '.wav')))
    for key in keys:
        src = next(os.path.join(SRC, key + ext) for ext in ('.wav', '.mp3') if os.path.exists(os.path.join(SRC, key + ext)))
        tmp = tempfile.mkdtemp()
        pcm = os.path.join(tmp, 'pcm.wav')
        subprocess.run(['afconvert', '-f', 'WAVE', '-d', 'LEI16@44100', '-c', '2', src, pcm], check=True)
        with wave.open(pcm) as w:
            params = w.getparams()
            data = array.array('h', w.readframes(w.getnframes()))
        before = rms_db(data, 2)
        factor = 10 ** ((TARGET_DB - before) / 20)
        peak = max(abs(min(data)), max(data))
        if peak * factor > 32000:  # nunca saturar
            factor = 32000 / peak
        data = array.array('h', (int(v * factor) for v in data))
        leveled = os.path.join(tmp, 'leveled.wav')
        with wave.open(leveled, 'wb') as w:
            w.setparams(params)
            w.writeframes(data.tobytes())
        out = os.path.join(OUT, key + '.m4a')
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aach', '-b', '48000', leveled, out], check=True)
        after = rms_db(data, 2)
        print(f'{key:12s} {before:6.1f} dB -> {after:6.1f} dB  {os.path.getsize(out) / 1e6:.1f} MB', flush=True)
        for f in (pcm, leveled):
            os.remove(f)
        os.rmdir(tmp)


if __name__ == '__main__':
    main()
