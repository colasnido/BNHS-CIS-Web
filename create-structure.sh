#!/bin/bash

# High School Website — Next.js 14 + Firebase + TypeScript
# Run: bash create-structure.sh

ROOT="src"

# ─── App Router ───────────────────────────────────────────

# Public route group
mkdir -p $ROOT/app/\(public\)/events/\[id\]
mkdir -p $ROOT/app/\(public\)/announcements/\[id\]
mkdir -p $ROOT/app/\(public\)/media
mkdir -p $ROOT/app/\(public\)/about

touch $ROOT/app/\(public\)/page.tsx
touch $ROOT/app/\(public\)/events/page.tsx
touch $ROOT/app/\(public\)/events/\[id\]/page.tsx
touch $ROOT/app/\(public\)/announcements/page.tsx
touch $ROOT/app/\(public\)/announcements/\[id\]/page.tsx
touch $ROOT/app/\(public\)/media/page.tsx
touch $ROOT/app/\(public\)/about/page.tsx

# Admin route group (protected)
mkdir -p $ROOT/app/\(admin\)/admin/events
mkdir -p $ROOT/app/\(admin\)/admin/events/new
mkdir -p $ROOT/app/\(admin\)/admin/events/\[id\]/edit
mkdir -p $ROOT/app/\(admin\)/admin/announcements
mkdir -p $ROOT/app/\(admin\)/admin/announcements/new
mkdir -p $ROOT/app/\(admin\)/admin/announcements/\[id\]/edit
mkdir -p $ROOT/app/\(admin\)/admin/media

touch $ROOT/app/\(admin\)/layout.tsx
touch $ROOT/app/\(admin\)/admin/page.tsx
touch $ROOT/app/\(admin\)/admin/events/page.tsx
touch $ROOT/app/\(admin\)/admin/events/new/page.tsx
touch $ROOT/app/\(admin\)/admin/events/\[id\]/edit/page.tsx
touch $ROOT/app/\(admin\)/admin/announcements/page.tsx
touch $ROOT/app/\(admin\)/admin/announcements/new/page.tsx
touch $ROOT/app/\(admin\)/admin/announcements/\[id\]/edit/page.tsx
touch $ROOT/app/\(admin\)/admin/media/page.tsx

# API routes
mkdir -p $ROOT/app/api/events/\[id\]
mkdir -p $ROOT/app/api/announcements/\[id\]
mkdir -p $ROOT/app/api/media/upload
mkdir -p $ROOT/app/api/media/\[id\]
mkdir -p $ROOT/app/api/auth/session

touch $ROOT/app/api/events/route.ts
touch $ROOT/app/api/events/\[id\]/route.ts
touch $ROOT/app/api/announcements/route.ts
touch $ROOT/app/api/announcements/\[id\]/route.ts
touch $ROOT/app/api/media/upload/route.ts
touch $ROOT/app/api/media/\[id\]/route.ts
touch $ROOT/app/api/auth/session/route.ts

# Root app files
touch $ROOT/app/layout.tsx
touch $ROOT/app/not-found.tsx
touch $ROOT/app/error.tsx
touch $ROOT/app/loading.tsx

# ─── Features ─────────────────────────────────────────────

# Events feature
mkdir -p $ROOT/features/events/components
touch $ROOT/features/events/actions.ts
touch $ROOT/features/events/queries.ts
touch $ROOT/features/events/schema.ts
touch $ROOT/features/events/types.ts
touch $ROOT/features/events/components/EventCard.tsx
touch $ROOT/features/events/components/EventForm.tsx
touch $ROOT/features/events/components/EventCalendar.tsx
touch $ROOT/features/events/components/EventList.tsx

# Announcements feature
mkdir -p $ROOT/features/announcements/components
touch $ROOT/features/announcements/actions.ts
touch $ROOT/features/announcements/queries.ts
touch $ROOT/features/announcements/schema.ts
touch $ROOT/features/announcements/types.ts
touch $ROOT/features/announcements/components/AnnouncementCard.tsx
touch $ROOT/features/announcements/components/AnnouncementForm.tsx
touch $ROOT/features/announcements/components/AnnouncementBanner.tsx

# Media feature
mkdir -p $ROOT/features/media/components
touch $ROOT/features/media/actions.ts
touch $ROOT/features/media/queries.ts
touch $ROOT/features/media/schema.ts
touch $ROOT/features/media/types.ts
touch $ROOT/features/media/components/MediaGrid.tsx
touch $ROOT/features/media/components/MediaUploader.tsx
touch $ROOT/features/media/components/MediaLightbox.tsx

# Auth feature
mkdir -p $ROOT/features/auth/components
touch $ROOT/features/auth/actions.ts
touch $ROOT/features/auth/guards.ts
touch $ROOT/features/auth/session.ts
touch $ROOT/features/auth/types.ts
touch $ROOT/features/auth/components/LoginForm.tsx
touch $ROOT/features/auth/components/AdminNav.tsx

# Homepage feature
mkdir -p $ROOT/features/homepage/components
touch $ROOT/features/homepage/components/HeroSection.tsx
touch $ROOT/features/homepage/components/QuickLinks.tsx
touch $ROOT/features/homepage/components/NewsPreview.tsx
touch $ROOT/features/homepage/components/EventsPreview.tsx
touch $ROOT/features/homepage/components/Testimonials.tsx
touch $ROOT/features/homepage/components/CTABanner.tsx

# ─── Shared UI Components ─────────────────────────────────

mkdir -p $ROOT/components/ui
touch $ROOT/components/ui/Button.tsx
touch $ROOT/components/ui/Input.tsx
touch $ROOT/components/ui/Modal.tsx
touch $ROOT/components/ui/Badge.tsx
touch $ROOT/components/ui/Skeleton.tsx
touch $ROOT/components/ui/ErrorBoundary.tsx

# ─── Lib (Firebase + utilities) ───────────────────────────

mkdir -p $ROOT/lib
touch $ROOT/lib/firebase-admin.ts
touch $ROOT/lib/firebase-client.ts
touch $ROOT/lib/firestore.ts
touch $ROOT/lib/storage.ts
touch $ROOT/lib/auth.ts
touch $ROOT/lib/rate-limit.ts

# ─── Hooks ────────────────────────────────────────────────

mkdir -p $ROOT/hooks
touch $ROOT/hooks/useAuth.ts
touch $ROOT/hooks/usePagination.ts

# ─── Constants ────────────────────────────────────────────

mkdir -p $ROOT/constants
touch $ROOT/constants/roles.ts
touch $ROOT/constants/routes.ts

# ─── Types ────────────────────────────────────────────────

mkdir -p $ROOT/types
touch $ROOT/types/index.ts

# ─── Middleware (root) ────────────────────────────────────

touch $ROOT/middleware.ts

# ─── Done ─────────────────────────────────────────────────

echo ""
echo "✅ Folder structure created under ./$ROOT/"
echo ""
echo "Next steps:"
echo "  1. Run: npm install"
echo "  2. Add your Firebase config to .env.local"
echo "  3. Start filling in the placeholder .ts / .tsx files"
echo ""
