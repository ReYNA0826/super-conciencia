# SÚPER CONCIENCIA

App de meditación espiritual **3D bilingüe (ES/EN)** para **iOS y Android**.
Un universo cósmico navegable con 7 niveles de conciencia, un portal restringido
y una sala colectiva ("Portal de la Unidad").

## Stack

- **Experiencia 3D:** [Spline](https://spline.design) (escena publicada, embebida)
- **Frontend:** React + Vite + TypeScript
- **Backend:** Supabase (auth, progreso de niveles, invitaciones)
- **Móvil:** Capacitor → genera los proyectos nativos iOS + Android (una sola base de código)
- **Deploy web:** Vercel

## Los 7 niveles

| # | Nombre (ES) | Nombre (EN) |
|---|-------------|-------------|
| 1 | Portal de la Respiración | Breath Portal |
| 2 | Órbita de la Presencia | Orbit of Presence |
| 3 | Luna del Corazón | Moon of the Heart |
| 4 | Constelación del Ser | Constellation of Being |
| 5 | Nebulosa de la Expansión | Nebula of Expansion |
| 6 | Umbral del Silencio | Threshold of Silence |
| 7 | Súper Conciencia | Super Consciousness |

El nivel 7 está **sellado**: se desbloquea al completar los 6 niveles previos
o con una invitación válida. La escena de Spline ya expone
`window.AetherPortal.setState('unlocked' | 'locked')` para reflejarlo visualmente.

## Cómo correrlo (cuando haya `npm`)

```bash
npm install
cp .env.example .env.local   # pega aquí las keys de Supabase y la URL de la escena Spline
npm run dev
```

## Empaquetar para las tiendas (más adelante)

```bash
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios       # abre Xcode
npx cap open android   # abre Android Studio
```

## Lo que falta por conectar

- [ ] Publicar la escena en Spline y pegar su URL en `VITE_SPLINE_SCENE_URL`
- [ ] Proyecto de Supabase (URL + anon key) y correr el schema (`supabase/schema.sql`)
- [ ] Optimizar la escena 3D para rendimiento móvil
- [ ] Fichas de App Store / Google Play
