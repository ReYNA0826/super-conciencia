# Handoff para Claude Code — SÚPER CONCIENCIA (11 nov 2026)

Reyna trabaja en equipo con dos Claude:
- **Claude Code (Terminal, en esta Mac):** todo lo que corre localmente — dev server, build, Capacitor, Xcode/Android Studio, firma iOS, git.
- **Claude (chat de escritorio):** Spline (vía MCP), Supabase, diseño, portales de Apple/Google en Chrome, pruebas en Chrome contra localhost.

## Estado actual (NADA está commiteado todavía)
- `.env.local` creado (no se sube): Supabase proyecto "Super Conciencia" (qtofeecosgawmqhwagyv) + `VITE_SPLINE_AETHER_URL` (sala del nivel 7). `VITE_SPLINE_SCENE_URL` (universo/planetas) sigue vacío.
- Capacitor: carpetas `ios/` y `android/` generadas (appId com.dreameducation.superconciencia). `.gitignore` raíz ya NO ignora ios/android (se versionan).
- Firma Android: `android/keystore/superconciencia-upload.jks` (alias `upload`) + `android/keystore.properties` con la contraseña. AMBOS están en `android/.gitignore` — nunca subirlos. `android/app/build.gradle` firma release con ellos.
- Código nuevo: `src/lib/sceneBridge.ts` (puente con la escena del Éter: `window.SuperConciencia.setState('resting'|'meditating'|'closing')`, `openPortal()`, `setParticipants(n)`, `setReducedMotion(bool)`), cambios en `portal.ts`, `SplineStage.tsx` (prop `aether`), `App.tsx`, `Meditation.tsx`, `main.tsx` (clase `sc-app` en <html>), `index.css`.
- `docs/spline/el-reino-del-eter.spline`: respaldo del archivo de Spline.

## Tareas para Claude Code, en orden
1. `npm run build && npx cap sync` (sync necesita dist/ primero).
2. Borrar duplicados de Finder si existen, p.ej. `ios/App/App/public/index 2.html`.
3. `npm run dev` y dejarlo corriendo; confirmar la URL (normalmente http://localhost:5173/).
4. Probar en el navegador: guardar `localStorage['sc-completed']='[1,2,3,4,5,6]'`, entrar al portal (nivel 7) y verificar que `window.SuperConciencia` exista y que el panel de prueba de Spline NO se vea.
5. iOS: `npx cap open ios` → Signing & Capabilities → Team de Reyna → "Automatically manage signing".
6. NO hacer `npm audit fix --force` (las 7 alertas son solo de herramientas de desarrollo).
7. Commit/push solo cuando Reyna lo autorice. Verificar antes con `git status --ignored` que no entren `.env.local`, `*.jks`, `keystore.properties`.
