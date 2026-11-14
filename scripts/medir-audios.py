"""Mide los audios de voz grabados y escribe src/data/sessionDurations.ts.

Uso: python3 -I scripts/medir-audios.py

Recorre store-assets/voz/<carpeta>/<version>/NN.mp3 (version = es-f, es-m, en-f, en-m)
y anota cuántos segundos dura cada bloque. El reproductor usa esas duraciones para
calcular el tiempo total, la barra de avance y dónde reanudar.
"""
import json
import os
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOZ = os.path.join(ROOT, "store-assets", "voz")
# carpeta de los originales -> id de la sesión en la app (y en el bucket)
SESSIONS = {"nivel-1": "nivel-1", "nivel-2": "nivel-2", "nivel-3": "nivel-3", "nivel-4": "nivel-4",
            "un-espacio-para-cuidarme": "cuidarme"}
VERSIONS = ["es-f", "es-m", "en-f", "en-m"]


def seconds(path):
    out = subprocess.run(["afinfo", path], capture_output=True, text=True).stdout
    for line in out.splitlines():
        if "estimated duration" in line:
            return round(float(line.split()[2]), 1)
    raise SystemExit(f"no se pudo medir {path}")


def main():
    data = {}
    for folder, session_id in SESSIONS.items():
        versions = {}
        for version in VERSIONS:
            d = os.path.join(VOZ, folder, version)
            if not os.path.isdir(d):
                continue
            files = sorted(f for f in os.listdir(d) if f.endswith(".mp3"))
            versions[version] = [seconds(os.path.join(d, f)) for f in files]
        if versions:
            data[session_id] = versions
    out = os.path.join(ROOT, "src", "data", "sessionDurations.ts")
    body = json.dumps(data, indent=2)
    with open(out, "w", encoding="utf-8") as f:
        f.write("// GENERADO por scripts/medir-audios.py — no editar a mano.\n")
        f.write("// Segundos que dura cada audio de voz, por sesión y versión (idioma-voz).\n")
        f.write(f"export const SESSION_DURATIONS: Record<string, Record<string, number[]>> = {body};\n")
    for sid, versions in data.items():
        for v, ds in versions.items():
            print(f"{sid:10s} {v}: {len(ds)} bloques, {sum(ds) / 60:.1f} min de voz")


if __name__ == "__main__":
    main()
