/**
 * ============================================================================
 * Add to src/services/user.service.ts (append at the end of the file)
 * ============================================================================
 *
 * Why a separate count helper instead of `listUsersByRole(...).length`?
 *
 * `listUsersByRole` fetches every matching document into memory. For 400+
 * students this is ~50 KB of payload + JSON parsing on every homepage load.
 * Firestore's count() aggregate runs server-side and returns just a number.
 *
 * Cost is also lower: Firestore charges 1 read per ~1000 indexed entries
 * for count() vs 1 read per document for a full list. For our scale that's
 * 1 read instead of 400.
 *
 * The query needs no extra index — `role` is already filtered in the
 * existing listUsersByRole, so the simple equality query is supported by
 * the default single-field index.
 */

import "server-only";

import { collections } from "@/services/firestore";
import type { Role } from "@/features/users/types";

// Note: the existing user.service.ts already imports from
// '@/services/firestore', so no new imports are needed.

/**
 * Count users with a given role. Uses Firestore's aggregate count() —
 * server-side, no documents transferred.
 *
 * @example
 *   const total = await countUsersByRole('student'); // → 381
 */
export async function countUsersByRole(role: Role): Promise<number> {
  try {
    const snapshot = await collections
      .users()
      .where("role", "==", role)
      .count()
      .get();
    return snapshot.data().count;
  } catch (error) {
    // If the query fails (e.g., Firestore down, network blip), fall back
    // to 0 rather than crashing the homepage. Hero will render "0 students"
    // for one render cycle until the next revalidate (60s); not great, but
    // doesn't take down the site.
    console.error("[countUsersByRole]", error);
    return 0;
  }
}
