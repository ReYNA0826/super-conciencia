// Contenido guiado de los 7 niveles. Bilingüe (ES/EN).
// Cada fase se mostrará en pantalla y, más adelante, la narrará la voz de ElevenLabs.
// El tono es calmado, ceremonial y en segunda persona (lenguaje neutro de género).

/** `audioEs`: voz grabada en español de esa fase (opcional). `seconds` ya incluye el silencio que la sigue. */
export type MeditationPhase = { es: string; en: string; seconds: number; audioEs?: string };

export const MEDITATIONS: Record<number, MeditationPhase[]> = {
  // 1 · El Despertar — 15 minutos con voz guía (guion completo en docs/guiones/nivel-1-el-despertar.md).
  // seconds = duración de la voz (a ritmo lento) + el silencio que la sigue.
  1: [
    { es: 'Bienvenida. Hoy no tienes que resolverlo todo. Solo estar aquí.', en: "Welcome. You don't have to solve everything today. Just be here.", seconds: 43, audioEs: '/audio/voz/es/1/01.mp3' },
    { es: 'Busca una postura cómoda. Ojos cerrados o abiertos, como prefieras.', en: 'Find a comfortable posture. Eyes closed or open, as you prefer.', seconds: 47, audioEs: '/audio/voz/es/1/02.mp3' },
    { es: 'Reconoce el lugar donde estás. Te sostiene en este momento.', en: 'Notice the place where you are. It holds you in this moment.', seconds: 48, audioEs: '/audio/voz/es/1/03.mp3' },
    { es: 'Recorre tu cuerpo con calma y suelta lo que ya no necesita ser sostenido.', en: 'Move calmly through your body and release what no longer needs holding.', seconds: 53, audioEs: '/audio/voz/es/1/04.mp3' },
    { es: 'Observa tu respiración natural, sin cambiarla.', en: 'Observe your natural breath, without changing it.', seconds: 57, audioEs: '/audio/voz/es/1/05.mp3' },
    { es: 'Deja que tu atención descanse donde sientes la respiración.', en: 'Let your attention rest where you feel the breath.', seconds: 62, audioEs: '/audio/voz/es/1/06.mp3' },
    { es: 'Si te ayuda, cuenta tus respiraciones del uno al diez.', en: 'If it helps, count your breaths from one to ten.', seconds: 77, audioEs: '/audio/voz/es/1/07.mp3' },
    { es: 'La mente se va. Darte cuenta y volver: eso es meditar.', en: 'The mind wanders. Noticing and returning: that is meditating.', seconds: 52, audioEs: '/audio/voz/es/1/08.mp3' },
    { es: 'Cuando un pensamiento te lleve lejos, dite con amabilidad: «pensando».', en: 'When a thought carries you away, kindly tell yourself: “thinking.”', seconds: 78, audioEs: '/audio/voz/es/1/09.mp3' },
    { es: 'Abre tu atención a todo el cuerpo.', en: 'Open your attention to the whole body.', seconds: 59, audioEs: '/audio/voz/es/1/10.mp3' },
    { es: 'Imagina una esfera de luz azul que respira contigo.', en: 'Imagine a sphere of blue light breathing with you.', seconds: 61, audioEs: '/audio/voz/es/1/11.mp3' },
    { es: 'Al entrar el aire: «estoy». Al salir: «aquí».', en: 'Breathing in: “I am.” Breathing out: “here.”', seconds: 86, audioEs: '/audio/voz/es/1/12.mp3' },
    { es: 'Silencio. Si la mente se va, vuelve con una respiración.', en: 'Silence. If the mind wanders, return with one breath.', seconds: 106, audioEs: '/audio/voz/es/1/13.mp3' },
    { es: 'Poco a poco, vuelve a sentir tu cuerpo y el lugar.', en: 'Little by little, feel your body and the room again.', seconds: 52, audioEs: '/audio/voz/es/1/14.mp3' },
    { es: 'Abre los ojos cuando te sientas a gusto. Gracias por darte este tiempo.', en: 'Open your eyes when you feel ready. Thank you for giving yourself this time.', seconds: 39, audioEs: '/audio/voz/es/1/15.mp3' },
  ],
  // 2 · La Calma — quietud, silencio interior
  2: [
    { es: 'No hay nada que hacer aquí. Solo estar.', en: 'There is nothing to do here. Only to be.', seconds: 20 },
    { es: 'Deja que los pensamientos se disuelvan en el silencio.', en: 'Let your thoughts dissolve into the silence.', seconds: 24 },
    { es: 'Escucha el espacio entre tus respiraciones.', en: 'Listen to the space between your breaths.', seconds: 24 },
    { es: 'En la quietud, todo descansa.', en: 'In stillness, everything rests.', seconds: 22 },
    { es: 'Habita el silencio. Es tu hogar más profundo.', en: 'Inhabit the silence. It is your deepest home.', seconds: 20 },
  ],
  // 3 · La Presencia — atención plena, aquí y ahora
  3: [
    { es: 'Trae tu atención a este instante, el único que existe.', en: 'Bring your attention to this moment, the only one there is.', seconds: 20 },
    { es: 'Escucha los sonidos a tu alrededor sin nombrarlos.', en: 'Listen to the sounds around you without naming them.', seconds: 24 },
    { es: 'Siente el peso de tu cuerpo sostenido por la tierra.', en: 'Feel the weight of your body held by the earth.', seconds: 22 },
    { es: 'Cuando tu mente se vaya, vuelve con suavidad al ahora.', en: 'When your mind wanders, return gently to now.', seconds: 24 },
    { es: 'Aquí y ahora, no falta nada.', en: 'Here and now, nothing is missing.', seconds: 18 },
  ],
  // 4 · El Corazón — compasión y gratitud
  4: [
    { es: 'Lleva una mano a tu pecho y siente tu corazón latir.', en: 'Bring a hand to your chest and feel your heart beating.', seconds: 20 },
    { es: 'Recuerda algo que agradeces hoy.', en: 'Remember something you are grateful for today.', seconds: 22 },
    { es: 'Deja que una sensación cálida se expanda desde tu corazón.', en: 'Let a warm feeling spread out from your heart.', seconds: 24 },
    { es: 'Envía esa calidez a alguien que amas… y a ti.', en: 'Send that warmth to someone you love… and to yourself.', seconds: 24 },
    { es: 'Tu corazón es un hogar. Descansa en él.', en: 'Your heart is a home. Rest in it.', seconds: 18 },
  ],
  // 5 · La Mente Profunda — observar los pensamientos, el centro quieto
  5: [
    { es: 'Obsérvate como si miraras las estrellas: sin juzgar.', en: 'Observe yourself as you would the stars: without judging.', seconds: 22 },
    { es: 'Nota tus pensamientos pasar, como luces distantes.', en: 'Notice your thoughts pass, like distant lights.', seconds: 24 },
    { es: 'Tú no eres tus pensamientos; eres quien los observa.', en: 'You are not your thoughts; you are the one who watches them.', seconds: 24 },
    { es: 'Debajo del ruido hay un centro quieto. Ese eres tú.', en: 'Beneath the noise there is a still center. That is you.', seconds: 24 },
    { es: 'Reconócete: eres suficiente.', en: 'Recognize yourself: you are enough.', seconds: 18 },
  ],
  // 6 · La Conciencia Expandida — apertura y expansión
  6: [
    { es: 'Imagina una luz violeta en tu centro.', en: 'Imagine a violet light at your center.', seconds: 20 },
    { es: 'Con cada inhalación, esa luz se expande.', en: 'With each breath in, that light expands.', seconds: 22 },
    { es: 'Déjala llenar tu pecho, tus brazos, todo tu ser.', en: 'Let it fill your chest, your arms, your whole being.', seconds: 24 },
    { es: 'Eres más vasto de lo que crees. Ocupa ese espacio.', en: 'You are vaster than you think. Take up that space.', seconds: 24 },
    { es: 'Brillas. Respira y expándete.', en: 'You shine. Breathe and expand.', seconds: 18 },
  ],
  // 7 · Súper Conciencia — integración, conexión, acceso al santuario
  7: [
    { es: 'Siente todo lo que has recorrido: respiración, presencia, corazón.', en: 'Feel all you have traveled: breath, presence, heart.', seconds: 24 },
    { es: 'Eres parte de algo inmenso, y lo inmenso vive en ti.', en: 'You are part of something vast, and the vast lives in you.', seconds: 24 },
    { es: 'Conéctate con la conciencia que todo lo une.', en: 'Connect with the consciousness that unites all.', seconds: 24 },
    { es: 'Aquí no hay separación. Todo es uno.', en: 'Here there is no separation. All is one.', seconds: 22 },
    { es: 'Lleva esta paz contigo. Eres Súper Conciencia.', en: 'Carry this peace with you. You are Super Consciousness.', seconds: 22 },
  ],
};
