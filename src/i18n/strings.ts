export type Lang = 'es' | 'en';

export const STRINGS = {
  es: {
    tagline: 'Un viaje cósmico a través de la conciencia',
    chooseLanguage: 'Elige tu idioma',
    begin: 'Comenzar el viaje',
    universeTitle: 'SÚPER CONCIENCIA',
    universeSubtitle: 'Aether · Superconciencia',
    start: 'Meditar',
    back: 'Volver',
    sealed: 'Sellado',
    open: 'Abierto',
    portalLockedMsg: 'Este santuario se abre al completar los seis niveles previos, o con una invitación.',
    profile: 'Perfil',
    progress: 'Progreso',
    invitation: 'Invitación',
    language: 'Idioma',
  },
  en: {
    tagline: 'A cosmic journey through consciousness',
    chooseLanguage: 'Choose your language',
    begin: 'Begin the journey',
    universeTitle: 'SUPER CONSCIOUSNESS',
    universeSubtitle: 'Aether · Superconsciousness',
    start: 'Meditate',
    back: 'Back',
    sealed: 'Sealed',
    open: 'Open',
    portalLockedMsg: 'This sanctuary opens when the six previous levels are complete, or with an invitation.',
    profile: 'Profile',
    progress: 'Progress',
    invitation: 'Invitation',
    language: 'Language',
  },
} as const;

export type StringKey = keyof typeof STRINGS['es'];
