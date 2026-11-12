/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPLINE_SCENE_URL?: string;
  readonly VITE_SPLINE_AETHER_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_ELEVENLABS_AGENT_ID?: string;
  readonly VITE_GURU_VOICE_FEMALE?: string;
  readonly VITE_GURU_VOICE_MALE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
