import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import { firebaseAdminConfig, isFirebaseConfigured } from '@/lib/env';

let app: App | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Lazy singleton so that importing this module never crashes when Firebase
 * credentials are absent (local development mode).
 */
function ensureApp(): App | null {
  if (app) return app;
  if (!isFirebaseConfigured()) return null;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  try {
    app = initializeApp({
      credential: cert({
        projectId: firebaseAdminConfig.projectId,
        clientEmail: firebaseAdminConfig.clientEmail,
        privateKey: firebaseAdminConfig.privateKey,
      }),
      ...(firebaseAdminConfig.databaseURL
        ? { databaseURL: firebaseAdminConfig.databaseURL }
        : {}),
    });
    return app;
  } catch (err) {
    console.error('[firebase-admin] Failed to initialize App with credentials:', err);
    return null;
  }
}

export function adminAuth(): Auth {
  const instance = ensureApp();
  if (!instance) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
    );
  }
  auth ??= getAuth(instance);
  return auth;
}

export function adminDb(): Firestore {
  const instance = ensureApp();
  if (!instance) {
    throw new Error(
      'Firestore is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.'
    );
  }
  db ??= getFirestore(instance);
  return db;
}