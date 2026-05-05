import { z } from 'zod';

/**
 * Validates env vars at module load. If anything is missing or malformed,
 * the app fails loudly at startup instead of silently misbehaving later.
 *
 * Two separate schemas because:
 *  - Public (NEXT_PUBLIC_*) is bundled into the client.
 *  - Server-only must NEVER reach the client bundle.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
});

const serverEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_DATABASE_ID: z.string().min(1).optional(),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

/**
 * Server env getter. Wrapped in a function so it's lazily evaluated and
 * never accidentally imported by client components.
 *
 * Will throw on the server if vars are missing — fail-fast is intentional.
 */
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must not be called from client code');
  }
  return serverEnvSchema.parse({
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    FIREBASE_DATABASE_ID: process.env.FIREBASE_DATABASE_ID,
  });
}
