#!/bin/bash
# Compila el AAB de producción de Android (Súper Conciencia).
# Uso: bash scripts/android-release.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
OUT="Claude outputs"
mkdir -p "$OUT"
VC=$(grep -E '^\s*versionCode' android/app/build.gradle | awk '{print $2}')
LOG="$OUT/build-android-v$VC.log"
{
  echo "== versionCode $VC · $(date)"
  npm run build
  npx cap sync android
  (cd android && ./gradlew bundleRelease)
  cp android/app/build/outputs/bundle/release/app-release.aab "$OUT/SuperConciencia-v$VC.aab"
  echo "== LISTO: $OUT/SuperConciencia-v$VC.aab"
} 2>&1 | tee "$LOG"
