'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

import { firebaseClientConfig, isFirebaseClientConfigured } from '@/lib/env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/** Firebase is only used for admin authentication on the dashboard. */
export function firebaseApp(): FirebaseApp | null {
  if (!isFirebaseClientConfigured()) return null;
  app ??= getApps().length > 0 ? getApp() : initializeApp(firebaseClientConfig);
  return app;
}

export function firebaseAuth(): Auth | null {
  const instance = firebaseApp();
  if (!instance) return null;
  auth ??= getAuth(instance);
  return auth;
}