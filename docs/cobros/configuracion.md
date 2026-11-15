# Cobros dentro de la app — configuración (15-nov-2026)

## Qué hay construido en la app
- `src/lib/billing.ts`: compras con RevenueCat (versión fija 14.0.0) sobre Apple In-App Purchase y Google Play Billing.
- `src/components/Plans.tsx`: pantalla «Elige tu camino». Muestra los precios reales de la tienda, mensual o anual, y tiene «Restaurar compras», el texto legal de renovación y los enlaces a Términos y Privacidad (Apple los exige).
- Candados:
  - **Niveles 5 y 6:** piden Premium.
  - **Conversar con Gurú:** pide la Premium con Gurú.
  - **Elegir voz y música** (Perfil, reproductor y Santuario): pide Premium. Sin ella suena la voz Katie con la música «Santuario del Éter».
- **Encuentros astrales:** en el calendario del Santuario, cada encuentro tiene «Regístrate». Se entra pagando el evento o con un código de invitación. Para unirse a un encuentro en curso hay que estar registrado.
- **Supabase** (migración `registro_encuentros_astrales`):
  - Tabla `gathering_registrations`: quién se registró y cómo.
  - Tabla `gathering_codes`: el código de cada encuentro. La app no puede leerla.
  - Funciones `register_gathering_with_code` y `register_gathering_paid`.
  - Para poner el código de un encuentro: `insert into gathering_codes (gathering_id, code) values ('<id>', 'ETER-NOV-22');`

## Precios elegidos por Reyna (15-nov-2026)
| Plan | Mensual | Anual |
|---|---|---|
| Gratis | niveles 1–4, voz y música fijas | — |
| **Premium** (`sc_plus_*`) | **US$7.99** | **US$49.99** |
| **Premium con Gurú** (`sc_guru_*`) | **US$14.99**, con 20 min de Gurú al mes | **US$119.99**, con 20 min al mes |
| **Encuentro astral** (`sc_encuentro`) | **US$4.99** por evento, o gratis con código de invitación | |

Condición de Reyna: este precio de lanzamiento vale siempre que haya suficiente contenido de pago y nuevas publicaciones con regularidad.
El límite de Gurú se activa en ElevenLabs el mismo día que salga la versión nueva, no antes, para no romper las versiones de prueba instaladas.

## Productos (los mismos identificadores en Apple, Google y RevenueCat)
| Identificador | Tipo | Da acceso a |
|---|---|---|
| `sc_plus_mensual` | Suscripción auto-renovable, 1 mes | Premium |
| `sc_plus_anual` | Suscripción auto-renovable, 1 año | Premium |
| `sc_guru_mensual` | Suscripción auto-renovable, 1 mes | Premium con Gurú |
| `sc_guru_anual` | Suscripción auto-renovable, 1 año | Premium con Gurú |
| `sc_encuentro` | Consumible | Un encuentro astral |

- **Apple:** un solo grupo de suscripción, «Súper Conciencia». Los planes de Gurú van en el nivel más alto del grupo, para que subir o bajar de plan funcione solo.
- **RevenueCat:** dos *entitlements*. `suscripcion` lo dan los 4 productos; `guru` solo lo dan `sc_guru_*`.

## Pasos para activarlo (en orden)
1. **Apple:** esperar la conversión de la cuenta a Dream Education. Luego, en App Store Connect, ir a Business → **Paid Applications Agreement** y firmarlo con el banco y la información fiscal de Dream Education. Inscribirse también en el **Small Business Program**, para que Apple cobre 15 % y no 30 %.
2. **App Store Connect:** crear el grupo de suscripción y los 5 productos de la tabla, con los precios elegidos, una descripción y una captura de la pantalla de planes.
3. **Play Console:** crear los mismos productos. En Google, las suscripciones van en «Suscripciones» y el encuentro en «Productos integrados».
4. **RevenueCat:** Reyna crea la cuenta en revenuecat.com (gratis hasta US$2,500 al mes de ingresos). Después:
   - Crear el proyecto con la app iOS y la app Android.
   - Conectar la clave de App Store Connect y la cuenta de servicio de Google.
   - Crear los dos entitlements.
   - Copiar las dos claves públicas a `.env.local`:
     - `VITE_REVENUECAT_IOS_KEY=appl_...`
     - `VITE_REVENUECAT_ANDROID_KEY=goog_...`
5. Compilar (`npx cap sync`) y probar con una cuenta *sandbox* de Apple y un verificador de licencias de Google.

## Protecciones del servidor (construidas el 15-nov-2026)
Todo vive en Supabase. La app nunca puede darse acceso a sí misma.

| Pieza | Qué hace |
|---|---|
| Función `revenuecat-webhook` | Recibe de RevenueCat cada compra, renovación y vencimiento. Escribe `subscriptions` (plan y fecha de vencimiento) y `purchase_credits` (encuentros pagados). |
| Función `guru-session` | Comprueba el plan «Premium con Gurú», cuenta los minutos del mes (20) y entrega un pase de un solo uso de ElevenLabs. Mide el tiempo en el servidor; una sesión que la app no cierra se cobra completa. |
| RPC `register_gathering_paid(gathering)` | Registra a la persona en un encuentro consumiendo un pago confirmado. Sin pago confirmado, no registra. |
| Bucket privado `premium` | Audios de los niveles 5 y 6. Solo los lee quien tiene una suscripción vigente (URLs firmadas de 2 h). |

Probado en la base el 15-nov: sin suscripción 0 audios, con suscripción 128, vencida 0; encuentro sin pago no registra, con pago sí, y un pago no sirve para dos encuentros; minutos de Gurú suman bien.

### Secretos que faltan (los pega Reyna en Supabase → Edge Functions → Secrets)
- `REVENUECAT_WEBHOOK_SECRET`: una frase larga inventada; la misma se pone en RevenueCat → Integrations → Webhooks → Authorization header. URL del webhook: `https://qtofeecosgawmqhwagyv.supabase.co/functions/v1/revenuecat-webhook`
- `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID`: para los pases de Gurú.

Mientras falten, las funciones responden `not_configured` y la app sigue como antes (Gurú conecta directo y los audios salen del bucket público).

### El día del lanzamiento (en este orden)
1. Pegar los tres secretos y crear el webhook en RevenueCat. Hacer una compra de prueba y ver la fila en `subscriptions`.
2. En ElevenLabs → agente Gurú → Seguridad: activar «Requerir autenticación». Desde ese momento Gurú solo responde con pase del servidor (las betas viejas dejan de conectar).
3. Borrar del bucket público `meditaciones` las carpetas `nivel-5/` y `nivel-6/`.
4. Compilar la versión de tienda SIN `VITE_BETA_TIER`.

## Precios de referencia (consultados el 15-nov-2026, en USD)
| App | Mensual | Anual |
|---|---|---|
| Headspace | $12.99 | $69.99 |
| Calm | $14.99–16.99 | $69.99–79.99 |
| Insight Timer (MemberPlus) | $9.99 | $59.99 |
| Waking Up | ~$14.99 | $99.99–149.99 |
| Balance | — | $69.99 |

Fuentes: mindkindly.com/articles/wellness-app-costs-2026, muzencosmos.com (comparativa 2026), declutterthemind.com/blog/best-meditation-apps.

## Costo de Gurú
ElevenLabs estimó cerca de **US$0.46 por minuto** con Claude Sonnet 4.6, el modelo actual de Gurú, y unos **US$0.23 por minuto** con Gemini 3.5 Flash. Por eso la Premium con Gurú debe incluir un número limitado de minutos al mes.
