/**
 * One-off script to assign a role to a Firebase Auth user.
 *
 * Usage:
 *   npx tsx scripts/set-role.ts <uid> <admin|faculty|student>
 *
 * Example:
 *   npx tsx scripts/set-role.ts abc123def456 admin
 *
 * Note: requires `npm install -D tsx dotenv` if not already installed.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { Role } from '../src/services/auth.service';

const VALID_ROLES: Role[] = ['admin', 'faculty', 'student'];

function initAdminAuth() {
  if (getApps().length) {
    return getAuth();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Check .env.local for FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
    );
  }

  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

  return getAuth();
}

async function main() {
  const [, , uid, role] = process.argv;

  if (!uid || !role) {
    console.error('Usage: npx tsx scripts/set-role.ts <uid> <admin|faculty|student>');
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role as Role)) {
    console.error(`Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  try {
    const adminAuth = initAdminAuth();
    await adminAuth.setCustomUserClaims(uid, { role });
    console.log(`✓ Set role "${role}" for user ${uid}`);
    console.log(`  The user must sign out and back in for the change to take effect.`);
  } catch (error) {
    console.error('✗ Failed to set role:', error);
    process.exit(1);
  }
}

main();
