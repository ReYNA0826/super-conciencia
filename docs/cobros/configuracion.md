# Cobros dentro de la app — configuración (15-nov-2026)

## Qué hay construido en la app
- `src/lib/billing.ts`: compras con RevenueCat (versión fija 14.0.0) sobre Apple In-App Purchase y Google Play Billing.
- `src/components/Plans.tsx`: pantalla «Elige tu camino». Muestra los precios reales de la tienda, mensual o anual, y tiene «Restaurar compras», el texto legal de renovación y los enlaces a Términos y Privacidad (Apple los exige).
- Candados:
  - **Niveles 5 y 6:** piden la Suscripción.
  - **Conversar con Gurú:** pide la Suscripción superior.
  - **Elegir voz y música** (Perfil, reproductor y Santuario): pide la Suscripción. Sin ella suena la voz Katie con la música «Santuario del Éter».
- **Encuentros astrales:** en el calendario del Santuario, cada encuentro tiene «Regístrate». Se entra pagando el evento o con un código de invitación. Para unirse a un encuentro en curso hay que estar registrado.
- **Supabase** (migración `registro_encuentros_astrales`):
  - Tabla `gathering_registrations`: quién se registró y cómo.
  - Tabla `gathering_codes`: el código de cada encuentro. La app no puede leerla.
  - Funciones `register_gathering_with_code` y `register_gathering_paid`.
  - Para poner el código de un encuentro: `insert into gathering_codes (gathering_id, code) values ('<id>', 'ETER-NOV-22');`

## Productos (los mismos identificadores en Apple, Google y RevenueCat)
| Identificador | Tipo | Da acceso a |
|---|---|---|
| `sc_plus_mensual` | Suscripción auto-renovable, 1 mes | Suscripción |
| `sc_plus_anual` | Suscripción auto-renovable, 1 año | Suscripción |
| `sc_guru_mensual` | Suscripción auto-renovable, 1 mes | Suscripción superior |
| `sc_guru_anual` | Suscripción auto-renovable, 1 año | Suscripción superior |
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

## Pendiente antes de abrir el cobro al público
- **Límite de minutos con Gurú:** hoy la app conecta directo con el agente de ElevenLabs. Hay que pasar por una función de Supabase que:
  - compruebe que la persona tiene la Suscripción superior,
  - cuente sus minutos del mes,
  - entregue un enlace firmado, y en ElevenLabs activar que el agente exija autenticación.
  Sin esto, el costo de Gurú no tiene techo.
- **Comprobar el pago de los encuentros** contra RevenueCat (webhook) en lugar de confiar en el id de transacción que manda la app.
- **Bucket de meditaciones:** pasarlo a privado con URLs firmadas, para que los niveles 5 y 6 no se puedan descargar sin suscripción.

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
ElevenLabs estimó cerca de **US$0.46 por minuto** con Claude Sonnet 4.6, el modelo actual de Gurú, y unos **US$0.23 por minuto** con Gemini 3.5 Flash. Por eso la Suscripción superior debe incluir un número limitado de minutos al mes.
