import { TablePageSkeleton } from '@/components/ui/Skeleton';

/**
 * Loading state for /dashboard/admin/users.
 *
 * Same pattern as the other table-page loading.tsx files in this folder
 * tree. Each one points at the same TablePageSkeleton — the only reason
 * they exist as separate files is that Next.js scopes loading boundaries
 * by route segment.
 */
export default function Loading() {
  return <TablePageSkeleton rows={10} />;
}
