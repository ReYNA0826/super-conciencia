/**
 * Cobros dentro de la app (suscripciones y encuentros astrales).
 *
 * Usa RevenueCat sobre el sistema de pago de cada tienda (Apple In-App Purchase y Google
 * Play Billing): Apple y Google exigen su propio cobro para contenido digital.
 * RevenueCat guarda qué compró cada persona y lo liga a su cuenta de la app (id de Supabase),
 * así la suscripción la sigue entre iPhone y Android y se puede restaurar.
 *
 * Niveles de acceso (modelo de Reyna, 14-nov):
 *   free  → niveles 1–4 con voz y música predeterminadas.
 *   plus  → «Suscripción»: niveles 5–6 y elegir voz y música.
 *   guru  → «Suscripción superior»: todo lo anterior + conversar con Gurú.
 * Encuentros astrales del Éter: código de invitación o pago por evento (compra consumible).
 *
 * Sin llaves de RevenueCat (web, desarrollo) no se puede comprar: todo queda en «free».
 * Configuración de tiendas y RevenueCat: docs/cobros/configuracion.md.
 */
import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Purchases, PRODUCT_CATEGORY, PURCHASES_ERROR_CODE,
  type CustomerInfo, type PurchasesStoreProduct,
} from '@revenuecat/purchases-capacitor';

export type Tier = 'free' | 'plus' | 'guru';
export type PlanId = 'plus_monthly' | 'plus_annual' | 'guru_monthly' | 'guru_annual';

/** Identificadores de producto: deben ser IGUALES en App Store Connect, Play Console y RevenueCat. */
export const PRODUCT_IDS: Record<PlanId, string> = {
  plus_monthly: 'sc_plus_mensual',
  plus_annual: 'sc_plus_anual',
  guru_monthly: 'sc_guru_mensual',
  guru_annual: 'sc_guru_anual',
};
export const ENCOUNTER_PRODUCT_ID = 'sc_encuentro';
/** Derechos (entitlements) en RevenueCat. Los planes de Gurú dan los dos. */
const ENTITLEMENT = { plus: 'suscripcion', guru: 'guru' } as const;

const env = import.meta.env;
const API_KEY: string | undefined = Capacitor.getPlatform() === 'ios'
  ? env.VITE_REVENUECAT_IOS_KEY
  : Capacitor.getPlatform() === 'android' ? env.VITE_REVENUECAT_ANDROID_KEY : undefined;

/** ¿Se puede comprar en este dispositivo? (app nativa con llave de RevenueCat) */
export const billingAvailable = Capacitor.isNativePlatform() && Boolean(API_KEY);

// Solo para probar en el navegador durante el desarrollo: VITE_DEV_TIER=plus|guru.
const DEV_TIER = env.DEV && (env.VITE_DEV_TIER === 'plus' || env.VITE_DEV_TIER === 'guru') ? env.VITE_DEV_TIER as Tier : null;

export const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, guru: 2 };
export function hasTier(current: Tier, needed: Tier): boolean {
  return TIER_RANK[current] >= TIER_RANK[needed];
}

// --- Estado compartido (se lee con useTier) ---------------------------------------------
type State = { tier: Tier; expires: string | null; willRenew: boolean; managementUrl: string | null };
let state: State = { tier: DEV_TIER ?? 'free', expires: null, willRenew: false, managementUrl: null };
const listeners = new Set<() => void>();
function setState(next: State) {
  state = next;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
export function useBilling(): State { return useSyncExternalStore(subscribe, () => state); }
export function useTier(): Tier { return useBilling().tier; }
export function currentTier(): Tier { return state.tier; }

function fromCustomerInfo(info: CustomerInfo): State {
  const active = info.entitlements.active;
  const ent = active[ENTITLEMENT.guru] ?? active[ENTITLEMENT.plus];
  const tier: Tier = active[ENTITLEMENT.guru] ? 'guru' : active[ENTITLEMENT.plus] ? 'plus' : 'free';
  return {
    tier: DEV_TIER ?? tier,
    expires: ent?.expirationDate ?? null,
    willRenew: ent?.willRenew ?? false,
    managementUrl: info.managementURL ?? null,
  };
}

// --- Arranque y cuenta ------------------------------------------------------------------
let configured: Promise<void> | null = null;

/** Se llama al abrir la app y cada vez que cambia la cuenta (null = invitado). */
export function initBilling(userId: string | null): Promise<void> {
  if (!billingAvailable) return Promise.resolve();
  if (!configured) {
    configured = (async () => {
      await Purchases.configure({ apiKey: API_KEY!, appUserID: userId ?? undefined });
      await Purchases.addCustomerInfoUpdateListener((info) => setState(fromCustomerInfo(info)));
    })().catch((e) => { configured = null; throw e; });
    return configured.then(refreshBilling).catch(() => undefined);
  }
  return configured.then(async () => {
    const { appUserID } = await Purchases.getAppUserID();
    if (userId && appUserID !== userId) {
      const { customerInfo } = await Purchases.logIn({ appUserID: userId });
      setState(fromCustomerInfo(customerInfo));
    } else if (!userId && !appUserID.startsWith('$RCAnonymousID')) {
      const { customerInfo } = await Purchases.logOut();
      setState(fromCustomerInfo(customerInfo));
    }
  }).catch(() => undefined);
}

export async function refreshBilling(): Promise<void> {
  if (!billingAvailable || !configured) return;
  try {
    await configured;
    const { customerInfo } = await Purchases.getCustomerInfo();
    setState(fromCustomerInfo(customerInfo));
  } catch { /* sin conexión: se queda el último estado */ }
}

// --- Productos y compras ----------------------------------------------------------------
export type PlanOffer = { plan: PlanId; price: string; product: PurchasesStoreProduct };

/** Precios reales de la tienda, en la moneda de la persona. Vacío si no hay tienda. */
export async function loadPlans(): Promise<PlanOffer[]> {
  if (!billingAvailable) return [];
  try {
    await configured;
    const ids = Object.values(PRODUCT_IDS);
    const { products } = await Purchases.getProducts({ productIdentifiers: ids, type: PRODUCT_CATEGORY.SUBSCRIPTION });
    return (Object.keys(PRODUCT_IDS) as PlanId[]).flatMap((plan) => {
      // En Android el id llega como «producto:plan-base»; se compara el inicio.
      const product = products.find((p) => p.identifier === PRODUCT_IDS[plan] || p.identifier.startsWith(`${PRODUCT_IDS[plan]}:`));
      return product ? [{ plan, price: product.priceString, product }] : [];
    });
  } catch {
    return [];
  }
}

export type PurchaseResult = 'ok' | 'cancelled' | 'error';

function isCancel(e: unknown): boolean {
  const err = e as { code?: string; userCancelled?: boolean };
  return err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || err?.userCancelled === true;
}

export async function buyPlan(offer: PlanOffer): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct({ product: offer.product });
    setState(fromCustomerInfo(customerInfo));
    return 'ok';
  } catch (e) {
    return isCancel(e) ? 'cancelled' : 'error';
  }
}

/** Apple exige un botón «Restaurar compras». */
export async function restorePurchases(): Promise<Tier> {
  if (!billingAvailable) return state.tier;
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    setState(fromCustomerInfo(customerInfo));
  } catch { /* se queda igual */ }
  return state.tier;
}

/** Precio de un encuentro (compra de una sola vez por evento). */
export async function loadEncounterProduct(): Promise<PurchasesStoreProduct | null> {
  if (!billingAvailable) return null;
  try {
    await configured;
    const { products } = await Purchases.getProducts({
      productIdentifiers: [ENCOUNTER_PRODUCT_ID], type: PRODUCT_CATEGORY.NON_SUBSCRIPTION,
    });
    return products[0] ?? null;
  } catch {
    return null;
  }
}

/** Paga un encuentro. Devuelve el id de la transacción para registrarlo en el servidor. */
export async function buyEncounter(product: PurchasesStoreProduct): Promise<{ result: PurchaseResult; transactionId?: string }> {
  try {
    const { transaction } = await Purchases.purchaseStoreProduct({ product });
    return { result: 'ok', transactionId: transaction.transactionIdentifier };
  } catch (e) {
    return { result: isCancel(e) ? 'cancelled' : 'error' };
  }
}

// --- Pedir un plan desde cualquier pantalla ---------------------------------------------
// Las pantallas llaman requirePlan('plus', abrirAlgo): si la persona ya tiene el plan, se
// abre de inmediato; si no, App muestra la pantalla de planes y, al comprar, continúa.
type PlansRequest = { need: Exclude<Tier, 'free'>; then?: () => void } | null;
let plansRequest: PlansRequest = null;
const requestListeners = new Set<() => void>();
function setRequest(next: PlansRequest) {
  plansRequest = next;
  requestListeners.forEach((l) => l());
}
export function usePlansRequest(): PlansRequest {
  return useSyncExternalStore((l) => { requestListeners.add(l); return () => requestListeners.delete(l); }, () => plansRequest);
}
export function requirePlan(need: Exclude<Tier, 'free'>, then?: () => void): void {
  if (hasTier(state.tier, need)) then?.();
  else setRequest({ need, then });
}
export function showPlans(need: Exclude<Tier, 'free'> = 'plus'): void { setRequest({ need }); }
export function closePlans(unlocked = false): void {
  const req = plansRequest;
  setRequest(null);
  if (unlocked) req?.then?.();
}
