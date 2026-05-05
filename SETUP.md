# Firebase Firestore Integration

## Install dependencies

```bash
npm install firebase firebase-admin zod
```

## File placement

Drop these into your project at the matching paths:

```
.env.local.example                          → project root (rename to .env.local)
src/lib/env.ts                              → new
src/services/firebase.client.ts             → new
src/services/firebase.admin.ts              → new
src/services/firestore.ts                   → new
src/features/events/queries.ts              → REPLACES old mock-backed version
src/app/api/events/route.ts                 → REPLACES old mock-backed version
src/app/(public)/events/page.tsx            → unchanged (already calls queries.ts)
```

You can **delete** `src/features/events/mock-data.ts` — it's not needed anymore.

## Get your Firebase credentials

### Public client config (1 minute)
1. Firebase Console → Project Settings → General
2. Scroll to "Your apps" → Web app → SDK setup and configuration
3. Copy the values into `.env.local`

### Server admin credentials (1 minute)
1. Firebase Console → Project Settings → Service Accounts
2. Click **Generate new private key** (downloads a JSON file)
3. Open the JSON file and copy three fields into `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (paste the full string in quotes)
4. **Delete the downloaded JSON file** — never commit it

## Enable Firestore

1. Firebase Console → Firestore Database → Create database
2. Choose **Production mode** (we'll add rules below)
3. Pick a region close to your users (asia-southeast1 for the Philippines)

## Set Security Rules (critical)

Firebase Console → Firestore Database → Rules tab → paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Lock everything down by default.
    // Admin SDK bypasses these rules — server writes still work.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

This denies all direct client access. Only your server (using the Admin SDK)
can read/write. This is the architectural backstop from the design phase.

## Test it

```bash
# Restart dev server to pick up new env vars
rm -rf .next
npm run dev
```

```bash
# Create an event
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Founders Day Celebration",
    "description": "Annual school founders day with cultural performances and awards.",
    "location": "School Quadrangle",
    "startDate": "2026-08-15T08:00:00Z",
    "endDate": "2026-08-15T17:00:00Z",
    "isAllDay": false,
    "category": "assembly"
  }'

# Fetch all events
curl http://localhost:3000/api/events
```

Then visit `http://localhost:3000/events` — your event should render.

## Security checklist

- [x] `.env.local` in `.gitignore` (verify with `git check-ignore .env.local`)
- [x] Service account JSON deleted from disk after copying values
- [x] Server-only modules use `import 'server-only'`
- [x] Firestore rules deny all client access
- [x] Admin SDK only ever called from Server Components / Route Handlers
- [x] Env vars validated with Zod at module load (fail-fast)
