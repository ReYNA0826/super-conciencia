/**
 * Enlaces de correo de Supabase (confirmar cuenta, y más adelante recuperar contraseña).
 *
 * En el teléfono, el enlace del correo debe ABRIR LA APP, no una página web: Supabase
 * redirige a `superconciencia://auth#access_token=…` y aquí convertimos eso en una sesión,
 * de modo que la persona queda dentro sin tener que escribir su contraseña otra vez.
 *
 * Requiere que `superconciencia://auth` esté en la lista de Redirect URLs del proyecto
 * de Supabase (Authentication → URL Configuration). Si no está, Supabase ignora el
 * destino y usa su Site URL.
 */
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { supabase } from './supabase';

/** Esquema registrado en AndroidManifest.xml e Info.plist. */
export const AUTH_LINK = 'superconciencia://auth';

/** A dónde debe regresar Supabase después de un enlace de correo. */
export function authRedirectUrl(): string | undefined {
  if (Capacitor.isNativePlatform()) return AUTH_LINK;
  return typeof window !== 'undefined' ? window.location.origin : undefined;
}

/** 'recovery' = llegó por "restablecer contraseña": ya tiene sesión y falta que escriba la nueva. */
export type AuthLinkResult = 'signed-in' | 'recovery' | 'error';

const handled = new Set<string>();

async function consume(url: string): Promise<AuthLinkResult | null> {
  if (!supabase || !url.startsWith(AUTH_LINK) || handled.has(url)) return null;
  handled.add(url);

  // Supabase puede mandar los datos tras '#' (flujo implícito) o tras '?' (PKCE / errores).
  const params = new URLSearchParams();
  for (const part of [url.split('#')[1], url.split('?')[1]?.split('#')[0]]) {
    if (part) new URLSearchParams(part).forEach((v, k) => params.set(k, v));
  }

  if (params.get('error') || params.get('error_code') || params.get('error_description')) return 'error';

  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error ? 'error' : 'signed-in';
  }

  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) return 'error';
    return params.get('type') === 'recovery' ? 'recovery' : 'signed-in';
  }

  return 'error';
}

/**
 * Escucha los enlaces que abren la app. Devuelve una función para dejar de escuchar.
 * Cubre tanto la app ya abierta como la app que arranca desde el enlace.
 */
export function listenForAuthLinks(onResult: (result: AuthLinkResult) => void): () => void {
  if (!Capacitor.isNativePlatform() || !supabase) return () => { /* noop */ };

  let stopped = false;
  let handle: PluginListenerHandle | undefined;
  const run = (url: string | undefined) => {
    if (!url) return;
    void consume(url).then((result) => { if (result && !stopped) onResult(result); });
  };

  void NativeApp.addListener('appUrlOpen', ({ url }) => run(url)).then((h) => {
    if (stopped) void h.remove(); else handle = h;
  });
  void NativeApp.getLaunchUrl().then((launch) => run(launch?.url)).catch(() => undefined);

  return () => { stopped = true; void handle?.remove(); };
}
