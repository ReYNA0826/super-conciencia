export type Level = {
  id: number;
  es: string;
  en: string;
  /** short intention shown on the card */
  intentionEs: string;
  intentionEn: string;
  color: string;
};

/** Los 7 niveles de conciencia. El 7 está sellado hasta completar los 6 o con invitación. */
export const LEVELS: Level[] = [
  { id: 1, es: 'Portal de la Respiración', en: 'Breath Portal', intentionEs: 'Calma y respiración', intentionEn: 'Calm and breath', color: '#3f78e0' },
  { id: 2, es: 'Órbita de la Presencia', en: 'Orbit of Presence', intentionEs: 'Atención plena', intentionEn: 'Mindful presence', color: '#2cc3c3' },
  { id: 3, es: 'Luna del Corazón', en: 'Moon of the Heart', intentionEs: 'Compasión y gratitud', intentionEn: 'Compassion and gratitude', color: '#f0a07a' },
  { id: 4, es: 'Constelación del Ser', en: 'Constellation of Being', intentionEs: 'Autoconocimiento', intentionEn: 'Self-knowledge', color: '#bfeaf4' },
  { id: 5, es: 'Nebulosa de la Expansión', en: 'Nebula of Expansion', intentionEs: 'Apertura y energía', intentionEn: 'Openness and energy', color: '#9a6ae0' },
  { id: 6, es: 'Umbral del Silencio', en: 'Threshold of Silence', intentionEs: 'Quietud y vacío', intentionEn: 'Stillness and void', color: '#aab4e0' },
  { id: 7, es: 'Súper Conciencia', en: 'Super Consciousness', intentionEs: 'Integración y conexión', intentionEn: 'Integration and connection', color: '#f6e3a8' },
];
