export type Level = {
  id: number;
  es: string;
  en: string;
  /** short intention shown on the card */
  intentionEs: string;
  intentionEn: string;
  color: string;
};

/**
 * Los 7 niveles de conciencia, con los mismos nombres, números y colores que los
 * planetas de la escena de Spline (fila 1–7). El 7 es el portal: está sellado hasta
 * completar los 6 o con invitación.
 */
export const LEVELS: Level[] = [
  { id: 1, es: 'El Despertar', en: 'Awakening', intentionEs: 'Respiración y llegada', intentionEn: 'Breath and arrival', color: '#3f78e0' },
  { id: 2, es: 'La Calma', en: 'Inner Calm', intentionEs: 'Quietud y silencio', intentionEn: 'Stillness and silence', color: '#2cc3c3' },
  { id: 3, es: 'La Presencia', en: 'Presence', intentionEs: 'Atención plena', intentionEn: 'Mindful presence', color: '#bfeaf4' },
  { id: 4, es: 'El Corazón', en: 'The Heart', intentionEs: 'Compasión y gratitud', intentionEn: 'Compassion and gratitude', color: '#f0a07a' },
  { id: 5, es: 'La Mente Profunda', en: 'The Deep Mind', intentionEs: 'Observar la mente', intentionEn: 'Witnessing the mind', color: '#9a6ae0' },
  { id: 6, es: 'La Conciencia Expandida', en: 'Expanded Awareness', intentionEs: 'Apertura y expansión', intentionEn: 'Openness and expansion', color: '#aab4e0' },
  { id: 7, es: 'Súper Conciencia', en: 'Super Consciousness', intentionEs: 'Integración y conexión', intentionEn: 'Integration and connection', color: '#f6e3a8' },
];
