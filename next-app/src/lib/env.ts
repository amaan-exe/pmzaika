/**
 * Centralised, validated access to server-side configuration.
 *
 * Importing this module never throws. Missing Firebase credentials simply put the
 * app into `local` persistence mode so the whole backend can still be run and
 * tested without provisioning a Firebase project first.
 */

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

/** Admin e-mails allowed to sign in to the kitchen dashboard. */
export const ADMIN_EMAILS = toList(
  process.env.ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS
);

export const RESTAURANT = {
  name: process.env.RESTAURANT_NAME ?? 'PM Zaika Restaurant',
  /** WhatsApp number in international format, digits only (no `+`). */
  whatsapp: (process.env.RESTAURANT_WHATSAPP ?? '917488260572').replace(/\D/g, ''),
  supportEmail: process.env.RESTAURANT_SUPPORT_EMAIL ?? undefined,
} as const;

export const UPI = {
  payeeName: process.env.UPI_PAYEE_NAME ?? RESTAURANT.name,
  /** Virtual Payment Address, e.g. `pmzaika@ybl`. */
  vpa: process.env.UPI_VPA ?? 'pmzaika@ybl',
} as const;

/**
 * Fees are stored in paise internally to avoid floating point drift on money.
 * The UI divides by 100 when rendering.
 */
export const PRICING = {
  deliveryFeePaise: toInt(process.env.DELIVERY_FEE_PAISE, 2900),
  freeDeliveryAbovePaise: toInt(process.env.FREE_DELIVERY_ABOVE_PAISE, 49900),
  /** Hours during which the kitchen accepts new orders. */
  maxQuantityPerItem: toInt(process.env.MAX_QTY_PER_ITEM, 20),
} as const;

export const SESSION_COOKIE = 'pm_cart_sid';
export const ADMIN_COOKIE = 'pm_admin_session';

export const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

/** True when enough credentials exist to talk to Firestore via the Admin SDK. */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseAdminConfig.projectId &&
      firebaseAdminConfig.clientEmail &&
      firebaseAdminConfig.privateKey
  );
}

export type PersistenceMode = 'firestore' | 'local';

export function persistenceMode(): PersistenceMode {
  if (process.env.FIREBASE_MODE) {
    return process.env.FIREBASE_MODE === 'firestore' ? 'firestore' : 'local';
  }
  return isFirebaseConfigured() ? 'firestore' : 'local';
}

export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

export function isFirebaseClientConfigured(): boolean {
  return Boolean(firebaseClientConfig.apiKey && firebaseClientConfig.projectId);
}

/** Password used only when running in `local` persistence mode (no Firebase Auth). */
export const LOCAL_ADMIN_PASSWORD = process.env.LOCAL_ADMIN_PASSWORD ?? 'zaika-admin';

export const ORDER_WEBHOOK_URL = process.env.ORDER_WEBHOOK_URL;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';