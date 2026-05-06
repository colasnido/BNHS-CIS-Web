/**
 * One-time migration: backfill mustChangePassword=false on existing users.
 *
 * Run this ONCE before deploying the auth redesign. Existing accounts
 * (admin, faculty, students who already have email-based logins) are
 * grandfathered — they continue to work with their existing passwords
 * and don't get prompted to change.
 *
 * Going forward, NEW users created via createUser() will have the flag
 * set automatically per role:
 *   - student/faculty: true (admin assigned password, must change)
 *   - admin: false (self-set their password)
 *
 * Usage:
 *   npx tsx scripts/migrate-must-change-password.ts
 *
 * Safe to re-run: only writes to docs that don't already have the field.
 */

import 'dotenv/config';
import { adminDb } from '../src/services/firebase.admin';

async function main() {
  console.log('Backfilling mustChangePassword on existing users...');

  const snapshot = await adminDb.collection('users').get();
  let updated = 0;
  let skipped = 0;

  const batch = adminDb.batch();
  let pendingInBatch = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.mustChangePassword === undefined) {
      batch.update(doc.ref, { mustChangePassword: false });
      updated++;
      pendingInBatch++;

      // Firestore batches are limited to 500 operations
      if (pendingInBatch === 500) {
        await batch.commit();
        pendingInBatch = 0;
      }
    } else {
      skipped++;
    }
  }

  if (pendingInBatch > 0) {
    await batch.commit();
  }

  console.log(`Done. Updated ${updated} users. Skipped ${skipped} (already had the field).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
