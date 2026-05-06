/**
 * One-time migration: backfill mustChangePassword=false on existing users.
 *
 * Standalone — initializes Firebase Admin directly instead of importing
 * from src/services/firebase.admin.ts (which has 'server-only' guard).
 *
 * Mirrors the exact database-selection logic from the app's firebase.admin.ts:
 *   if FIREBASE_DATABASE_ID is set (any non-empty value, including "default"),
 *   pass it to getFirestore(); otherwise call getFirestore() with no args.
 *
 * Usage:
 *   npx tsx scripts/migrate-must-change-password.ts
 *
 * Safe to re-run: only writes to docs that don't already have the field.
 */

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(
      `Missing env var: ${key}. Make sure .env.local is in your project root and contains it.`,
    );
  }
  return v;
}

function initAdmin(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    credential: cert({
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    }),
  });
}

async function main() {
  const app = initAdmin();

  // Match the app's firebase.admin.ts logic exactly: if FIREBASE_DATABASE_ID
  // is set to any non-empty value, pass it through. The string "default"
  // is a real database name on this project, not a sentinel for "use default".
  const databaseId = process.env.FIREBASE_DATABASE_ID;
  const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

  console.log(
    `Connected to Firestore (database: ${databaseId || "(unnamed default)"})`,
  );
  console.log("Backfilling mustChangePassword on existing users...");

  const snapshot = await db.collection("users").get();
  let updated = 0;
  let skipped = 0;

  let batch = db.batch();
  let pendingInBatch = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.mustChangePassword === undefined) {
      batch.update(doc.ref, { mustChangePassword: false });
      updated++;
      pendingInBatch++;

      if (pendingInBatch === 500) {
        await batch.commit();
        batch = db.batch();
        pendingInBatch = 0;
      }
    } else {
      skipped++;
    }
  }

  if (pendingInBatch > 0) {
    await batch.commit();
  }

  console.log(
    `Done. Updated ${updated} user(s). Skipped ${skipped} (already had the field).`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
