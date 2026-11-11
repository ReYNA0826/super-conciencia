// Contenido guiado de los 7 niveles. Bilingüe (ES/EN).
// Cada fase se mostrará en pantalla y, más adelante, la narrará la voz de ElevenLabs.
// El tono es calmado, ceremonial y en segunda persona (lenguaje neutro de género).

export type MeditationPhase = { es: string; en: string; seconds: number };

export const MEDITATIONS: Record<number, MeditationPhase[]> = {
  // 1 · Portal de la Respiración — calma, respiración, entrada al viaje
  1: [
    { es: 'Cierra los ojos y deja que tu cuerpo se asiente.', en: 'Close your eyes and let your body settle.', seconds: 18 },
    { es: 'Inhala lento por la nariz… siente el aire llenarte.', en: 'Breathe in slowly through your nose… feel the air fill you.', seconds: 22 },
    { es: 'Exhala despacio… suelta todo lo que pesa.', en: 'Breathe out slowly… release all that weighs on you.', seconds: 22 },
    { es: 'Sigue tu respiración como una ola que va y viene.', en: 'Follow your breath like a wave that comes and goes.', seconds: 24 },
    { es: 'Estás aquí. Estás a salvo. Respira.', en: 'You are here. You are safe. Breathe.', seconds: 18 },
  ],
  // 2 · Órbita de la Presencia — atención plena, aquí y ahora
  2: [
    { es: 'Trae tu atención a este instante, el único que existe.', en: 'Bring your attention to this moment, the only one there is.', seconds: 20 },
    { es: 'Escucha los sonidos a tu alrededor sin nombrarlos.', en: 'Listen to the sounds around you without naming them.', seconds: 24 },
    { es: 'Siente el peso de tu cuerpo sostenido por la tierra.', en: 'Feel the weight of your body held by the earth.', seconds: 22 },
    { es: 'Cuando tu mente se vaya, vuelve con suavidad al ahora.', en: 'When your mind wanders, return gently to now.', seconds: 24 },
    { es: 'Aquí y ahora, no falta nada.', en: 'Here and now, nothing is missing.', seconds: 18 },
  ],
  // 3 · Luna del Corazón — compasión, gratitud, amor interior
  3: [
    { es: 'Lleva una mano a tu pecho y siente tu corazón latir.', en: 'Bring a hand to your chest and feel your heart beating.', seconds: 20 },
    { es: 'Recuerda algo que agradeces hoy.', en: 'Remember something you are grateful for today.', seconds: 22 },
    { es: 'Deja que una sensación cálida se expanda desde tu corazón.', en: 'Let a warm feeling spread out from your heart.', seconds: 24 },
    { es: 'Envía esa calidez a alguien que amas… y a ti.', en: 'Send that warmth to someone you love… and to yourself.', seconds: 24 },
    { es: 'Tu corazón es un hogar. Descansa en él.', en: 'Your heart is a home. Rest in it.', seconds: 18 },
  ],
  // 4 · Constelación del Ser — autoconocimiento, observación interior
  4: [
    { es: 'Obsérvate como si miraras las estrellas: sin juzgar.', en: 'Observe yourself as you would the stars: without judging.', seconds: 22 },
    { es: 'Nota tus pensamientos pasar, como luces distantes.', en: 'Notice your thoughts pass, like distant lights.', seconds: 24 },
    { es: 'Tú no eres tus pensamientos; eres quien los observa.', en: 'You are not your thoughts; you are the one who watches them.', seconds: 24 },
    { es: 'Debajo del ruido hay un centro quieto. Ese eres tú.', en: 'Beneath the noise there is a still center. That is you.', seconds: 24 },
    { es: 'Reconócete: eres suficiente.', en: 'Recognize yourself: you are enough.', seconds: 18 },
  ],
  // 5 · Nebulosa de la Expansión — visualización, energía, apertura
  5: [
    { es: 'Imagina una luz violeta en tu centro.', en: 'Imagine a violet light at your center.', seconds: 20 },
    { es: 'Con cada inhalación, esa luz se expande.', en: 'With each breath in, that light expands.', seconds: 22 },
    { es: 'Déjala llenar tu pecho, tus brazos, todo tu ser.', en: 'Let it fill your chest, your arms, your whole being.', seconds: 24 },
    { es: 'Eres más vasto de lo que crees. Ocupa ese espacio.', en: 'You are vaster than you think. Take up that space.', seconds: 24 },
    { es: 'Brillas. Respira y expándete.', en: 'You shine. Breathe and expand.', seconds: 18 },
  ],
  // 6 · Umbral del Silencio — quietud, contemplación, vacío interior
  6: [
    { es: 'No hay nada que hacer aquí. Solo estar.', en: 'There is nothing to do here. Only to be.', seconds: 20 },
    { es: 'Deja que los pensamientos se disuelvan en el silencio.', en: 'Let your thoughts dissolve into the silence.', seconds: 24 },
    { es: 'Escucha el espacio entre tus respiraciones.', en: 'Listen to the space between your breaths.', seconds: 24 },
    { es: 'En la quietud, todo descansa.', en: 'In stillness, everything rests.', seconds: 22 },
    { es: 'Habita el silencio. Es tu hogar más profundo.', en: 'Inhabit the silence. It is your deepest home.', seconds: 20 },
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
