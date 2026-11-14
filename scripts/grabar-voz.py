"""Graba los bloques de un guion con las voces de Gurú (Katie y Felix) en ElevenLabs.

Uso: python3 -I scripts/grabar-voz.py <guiones.json> <clave-del-guion> <carpeta-de-salida> [idioma] [velocidad]

  guiones.json   {"<clave>": [{"n": 1, "text": "..."}, ...]}
  idioma         es (por defecto) o en: solo cambia el nombre de la carpeta (es-f, es-m, en-f, en-m)
  velocidad      0.7 a 1.2; por defecto 0.93 (apenas más pausada que el habla normal)

Lee ELEVENLABS_API_KEY de .env.local y nunca la imprime. Salta los bloques que ya existen,
así se puede repetir sin gastar créditos de más. Usa curl porque el Python de esta Mac no
trae certificados.
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

ENV = "/Users/reynavazquez/Projects/super-conciencia/.env.local"
VOICES = {"f": "m4hBEimiy2ffkQ0hHMVD", "m": "Sq93GQT4X1lKDXsQcixO"}  # Katie, Felix
SETTINGS = {"stability": 0.64, "similarity_boost": 0.71, "speed": 0.93}


def api_key():
    for line in open(ENV, encoding="utf-8"):
        if line.startswith("ELEVENLABS_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("falta ELEVENLABS_API_KEY")


def seconds(path):
    out = subprocess.run(["afinfo", path], capture_output=True, text=True).stdout
    for line in out.splitlines():
        if "estimated duration" in line:
            return float(line.split()[2])
    return 0.0


def main():
    guiones, clave, salida = sys.argv[1:4]
    lang = sys.argv[4] if len(sys.argv) > 4 else "es"
    if len(sys.argv) > 5:
        SETTINGS["speed"] = float(sys.argv[5])
    blocks = json.load(open(guiones, encoding="utf-8"))[clave]
    key = api_key()
    total_chars = 0
    for voice, voice_id in VOICES.items():
        folder = os.path.join(salida, f"{lang}-{voice}")
        os.makedirs(folder, exist_ok=True)
        for b in blocks:
            text = b["text"]
            if voice == "m" and lang == "es":
                text = text.replace("una guía de meditación", "un guía de meditación")
            path = os.path.join(folder, f"{b['n']:02d}.mp3")
            if os.path.exists(path) and os.path.getsize(path) > 10_000:
                print(f"{lang}-{voice} {b['n']:02d} ya existe {seconds(path):.1f}s", flush=True)
                continue
            body_path = path + ".json"
            with open(body_path, "w", encoding="utf-8") as f:
                json.dump({"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": SETTINGS}, f, ensure_ascii=False)
            tmp = path + ".part"
            # curl usa los certificados del sistema; la llave va por la entrada estándar, no por la línea de comandos.
            config = (
                f'url = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"\n'
                'request = "POST"\n'
                f'header = "xi-api-key: {key}"\n'
                'header = "Content-Type: application/json"\n'
                f'data-binary = "@{body_path}"\n'
                f'output = "{tmp}"\n'
                'write-out = "%{http_code}"\n'
                'silent\nmax-time = 180\n'
            )
            r = subprocess.run(["curl", "--config", "-"], input=config, capture_output=True, text=True)
            os.remove(body_path)
            if r.stdout.strip() != "200":
                detail = open(tmp, "rb").read()[:200] if os.path.exists(tmp) else b""
                print(f"{lang}-{voice} {b['n']:02d} ERROR http={r.stdout.strip()} {detail!r}", flush=True)
                if os.path.exists(tmp):
                    os.remove(tmp)
                raise SystemExit(1)
            os.replace(tmp, path)
            total_chars += len(text)
            words = len(text.split())
            dur = seconds(path)
            print(f"{lang}-{voice} {b['n']:02d} ok {dur:.1f}s {words} palabras {words / dur * 60:.0f} ppm", flush=True)
    print("caracteres grabados en esta corrida:", total_chars, flush=True)


if __name__ == "__main__":
    main()
