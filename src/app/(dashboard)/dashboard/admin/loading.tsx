import { OverviewSkeleton } from '@/components/ui/Skeleton';

/**
 * Loading state for /dashboard/admin (and structural similars).
 *
 * Next.js automatically renders this whenever the page is rendering its
 * server component. Once the actual page is ready, this swaps out. Users
 * see the skeleton instead of a blank screen for the ~200-800ms it takes
 * Firestore queries to complete.
 *
 * No props, no state — just the static skeleton.
 */
export default function Loading() {
  return <OverviewSkeleton />;
}
