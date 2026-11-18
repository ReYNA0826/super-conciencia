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

### Secretos (ya están en Supabase desde el 16-nov-2026)
- `REVENUECAT_WEBHOOK_SECRET`: una frase larga inventada; la misma se pone en RevenueCat → Integrations → Webhooks → Authorization header. URL del webhook: `https://qtofeecosgawmqhwagyv.supabase.co/functions/v1/revenuecat-webhook`
- `ELEVENLABS_API_KEY` y `ELEVENLABS_AGENT_ID`: para los pases de Gurú.

Si faltaran, las funciones responden `not_configured` y la app sigue como antes (Gurú conecta directo y los audios salen del bucket público). El id del agente es público: si ese secreto está mal escrito, `guru-session` usa el de Gurú (arreglo del 17-nov, versión 6 de la función).

### El día del lanzamiento (hecho el 17-nov-2026; se deja como referencia)
1. Pegar los tres secretos y crear el webhook en RevenueCat. Hacer una compra de prueba y ver la fila en `subscriptions`.
2. En ElevenLabs → agente Gurú → Seguridad: activar «Requerir autenticación». Desde ese momento Gurú solo responde con pase del servidor (las betas viejas dejan de conectar).
3. Borrar del bucket público `meditaciones` las carpetas `nivel-5/` y `nivel-6/`.
4. Compilar la versión de tienda SIN `VITE_BETA_TIER`.

## Estado al 17-nov-2026 (prueba real en Android)
- **Google Play:** las 4 suscripciones y `sc_encuentro` están activas. Versión 11 en prueba interna desde el 17-nov (lista «Pruebas Android»; esa lista también es la de verificadores de licencias, así que sus compras no cobran).
- **Compra de prueba verificada con una verificadora (Premium con Gurú anual):** el webhook escribió `subscriptions`, la renovación de prueba (cada 30 min) actualizó la fecha, y Gurú entregó pase del servidor y descontó 153 s de los 20 minutos.
- **Falla encontrada y arreglada:** el secreto `ELEVENLABS_AGENT_ID` no era un id válido; ElevenLabs respondía 400 y la app caía a la conexión directa sin avisar. Con «requerir autenticación» activado, Gurú habría dejado de funcionar.
- **Falla encontrada y arreglada en el código (va en la versión 12):** como invitado se podía pagar sin recibir acceso, porque el servidor liga la compra a la cuenta. Ahora la pantalla de planes y el pago de encuentros piden cuenta antes de cobrar.
- **Cuenta para el revisor de Google:** `playreview@dreameducationus.com`. Tiene `guru` por un año en RevenueCat (Customers → Grant entitlement) y su fila en `subscriptions` se puso a mano, porque un permiso regalado en RevenueCat no llega por el webhook como suscripción. Hay que renovar las dos cosas antes del 18-nov-2027. La contraseña está en `.revisor-play.local` (no se sube al repo) y en Play Console → Contenido de la app → Detalles de acceso.
- **Encuentro astral verificado:** pago de prueba → `purchase_credits` → registro «paid» en el encuentro. El encuentro y el pago de prueba se borraron después.
- **Día de lanzamiento hecho (17-nov, con el sí de Reyna):** borrados los 128 audios de `nivel-5/` y `nivel-6/` del bucket público `meditaciones` (siguen en `premium` y en `store-assets/`); activado «requerir autenticación» en el agente Gurú (sin pase del servidor no conecta); el reproductor espera las direcciones firmadas antes de dejar comenzar un nivel 5 o 6.
- **Versión 12 (versionCode 12):** en prueba interna y **enviada a revisión de producción en Google Play** el 17-nov. La publicación administrada está activa: cuando Google apruebe, hay que pulsar «Publicar cambios» en Play Console → Descripción general de la publicación para que salga al público.
- **Efecto en iPhone:** la beta de TestFlight 1.0 (4) ya no reproduce los niveles 5 y 6 ni conecta con Gurú, hasta que exista la versión de iOS con cobros.
- **Pendiente:** aviso en tiempo real de Play (rol Publicador de Pub/Sub para `google-play-developer-notifications@system.gserviceaccount.com` en el tema `Play-Store-Notifications`; no bloquea compras) y todo lo de Apple (sin respuesta al caso 30000015506606): Paid Applications Agreement, app iOS en RevenueCat, productos en App Store Connect, `VITE_REVENUECAT_IOS_KEY` y build con bundle `com.dreameducation.superconciencia`.

## iPhone — estado al 18-nov-2026 (madrugada)
Se adelantó todo en la cuenta actual de Apple (Elio Vazquez, equipo 9MC8QKKWK9), que Apple convertirá a Dream Education, Corp.

- **App definitiva:** «Súper Conciencia», Apple ID `6836169691`, bundle `com.dreameducation.superconciencia`. La de pruebas («Super Conciencia», `6834600713`, bundle `.beta`) no se publica.
- **Compras creadas en App Store Connect:** grupo «Súper Conciencia» con `sc_guru_mensual`, `sc_guru_anual` (nivel 1) y `sc_plus_mensual`, `sc_plus_anual` (nivel 2); `sc_encuentro` como consumible. Precios de EE. UU. iguales a los de Google y equivalentes en los otros 174 países.
- **Ficha:** textos en `docs/tienda/app-store.md` (español e inglés), categorías, 5 capturas de `store-assets/screenshots-ios/`, notas para el revisor y cuestionario de edad.
- **Versión 1.0 (1)** subida a App Store Connect con la clave `VITE_REVENUECAT_IOS_KEY`.
- **RevenueCat:** app de App Store creada con su llave de compras.
- **Herramientas:** `scripts/app-store-connect/` (cliente de la API con la llave «Claude Super Conciencia», que vive fuera del repo en `~/.appstoreconnect/private_keys/`). Para subir builds se usa la sesión de Xcode, no la llave.

**Bloqueo:** el contrato «Paid Apps Agreement» está aceptado pero sin banco ni impuestos. El formulario fija «Elio Vazquez» como titular y no cuadra con el EIN de Dream Education, así que se espera la conversión de la cuenta (mensaje de seguimiento enviado a Apple el 17-nov). Sin ese contrato activo no cargan las compras en iPhone.

**Falta en iPhone:**
1. En RevenueCat, importar los 5 productos de App Store y ligarlos: los 4 planes a `suscripcion`, los 2 de Gurú también a `guru`.
2. Tras la conversión: banco e impuestos a nombre de Dream Education.
3. Probar una compra en iPhone (cuenta sandbox) y revisar `subscriptions`.
4. En App Store Connect: contraseña de la cuenta del revisor y datos de contacto, etiquetas de privacidad (App Privacy), elegir el build en la versión, adjuntar las compras a la versión y enviar a revisión.
5. Poner en App Store Connect la URL de avisos del servidor que da RevenueCat.

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
