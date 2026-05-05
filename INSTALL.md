# Batch A + B — Install guide

## What's included

**Batch A — Foundation**
- Updated `routes.ts` with dashboard paths and per-role nav lists
- Updated `services/firestore.ts` with new collection refs
- New `services/firestore.helpers.ts` (shared toISO, buildUpdate, isNotFoundError)
- New `services/auth.guards.ts` (page-level role guard)
- New feature modules: `users/`, `classes/`, `subjects/`, `schedules/`
- New services: `user.service.ts`, `class.service.ts`, `subject.service.ts`, `schedule.service.ts`
- New dashboard shell: `DashboardSidebar`, `DashboardPageHeader`, `Field`, `DeleteButton`
- New `(dashboard)` route group with admin layout

**Batch B — Admin dashboard**
- Admin overview at `/dashboard/admin`
- Events CRUD UI + extended API (`PUT`/`DELETE` on `/api/events/[id]`)
- Announcements CRUD UI + extended API
- Users CRUD UI + new API (`/api/users`, `/api/users/[id]`)
- Classes CRUD UI + new API
- Subjects CRUD UI + new API
- Schedules CRUD UI + new API

## How to install

### 1. Drop the files into your project

Extract this zip and copy the contents of `src/` over your existing `src/`. All paths match your current project — no folders need to be renamed.

The zip will:
- **Replace**: `src/constants/routes.ts`, `src/services/firestore.ts`, three login pages
- **Add**: everything else (no conflicts with existing files)

### 2. Delete dead files (cleanup from Phase 1 analysis)

```bash
# Old duplicate of firebase.admin.ts — nothing imports it
rm src/services/firebase.ts

# Dead code, replaced by event.service.ts
rm src/features/events/queries.ts
```

### 3. Move the logo (optional, fixes Next.js Image)

The logo is currently in two wrong places:
- `src/app/(public)/logo.png`
- `src/components/ui/logo.png`

Both need to move to `public/` for Next.js `<Image src="/logo.png">` to work:

```bash
# Windows PowerShell
Move-Item -Force src\app\(public)\logo.png public\logo.png
Remove-Item src\components\ui\logo.png
```

### 4. Update Firestore Security Rules (recommended)

If you've gone strict with `allow read, write: if false`, the rules already block all client access — the Admin SDK handles everything. No change needed.

If you want to allow public reads of events/announcements directly from the client (not used by this app, but good for future flexibility):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{id} {
      allow read: if resource.data.published == true;
    }
    match /announcements/{id} {
      allow read: if resource.data.published == true;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. Restart and test

```bash
rm -rf .next
npm run dev
```

Visit `http://localhost:3000/auth/admin` and sign in with your admin account.
You should land at `/dashboard/admin`.

## First-run flow for non-developer admins

To populate a fresh school:

1. Sign in as admin → `/dashboard/admin`
2. **Users** → create the faculty users first (you need them as advisers/teachers)
3. **Classes** → create class sections, optionally assigning advisers
4. **Users** → create student users, assigning each to a class
5. **Subjects** → create subjects (each picks a class + a teacher)
6. **Schedules** → add weekly meeting times (each picks a subject; class+teacher auto-fill)
7. **Events** / **Announcements** → manage public-facing content

## Architecture notes

### Why `(dashboard)` is a separate route group
Route groups (folders in parentheses) don't appear in the URL. `/(dashboard)/dashboard/admin/page.tsx` renders at `/dashboard/admin`. This lets the dashboard pages have their own layout (sidebar shell) instead of the public site's navbar/footer.

### Why the admin layout uses `requirePageRole`, not middleware
Middleware runs at the edge before the page renders, but it can't easily verify a Firebase session cookie at the edge (firebase-admin needs Node.js runtime, not edge). Layout-level guards run in the same Node.js runtime as the rest of the app, can call `verifySessionCookie`, and redirect cleanly. Three layers of defense:
1. **Layout guard** redirects unauthorized users to login or their own dashboard
2. **Service-level role check** in every API route
3. **Firestore rules** block direct client access entirely

### Why I split `firestore.helpers.ts`
Your existing event.service.ts and announcement.service.ts each had their own copy of `toISO`. I extracted the shared logic so:
- Bug fixes happen once
- New services (user, class, subject, schedule) reuse it
- The pattern is identical across all services

### Why `users` doc IDs match Firebase Auth UIDs
- One canonical key per user
- `users.doc(currentUser.uid).get()` is the only fetch needed for "who am I"
- Custom claims travel in the JWT, so `requireRole` doesn't need a DB read

## What's next

This delivers Batch A + B. Coming next:
- **Batch C** — Student dashboard (4 pages: overview, schedule, subjects, adviser)
- **Batch D** — Faculty dashboard (4 pages: overview, students, subjects, schedule)

Just say "do C" or "do D" when you're ready and I'll deliver each as its own zip.
