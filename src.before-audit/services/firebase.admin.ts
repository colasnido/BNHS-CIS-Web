import 'server-only';

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getServerEnv } from '@/lib/env';

/**
 * Server-side Firebase Admin SDK. Privileged access — bypasses Security Rules.
 *
 * The `'server-only'` import above causes a build error if this module is
 * ever imported by client code, even transitively. That's our backstop.
 *
 * Singleton pattern: Next.js may evaluate this module multiple times during
 * dev (HMR) or in different runtimes (edge vs node). Reusing the existing
 * app prevents "app already initialized" errors.
 */

const env = getServerEnv();

function initAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Private key is stored with literal "\n" — convert back to real newlines
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const adminApp = initAdminApp();

export const adminDb: Firestore = env.FIREBASE_DATABASE_ID
  ? getFirestore(adminApp, env.FIREBASE_DATABASE_ID)
  : getFirestore(adminApp);
export const adminAuth: Auth = getAuth(adminApp);
export const adminStorage: Storage = getStorage(adminApp);
