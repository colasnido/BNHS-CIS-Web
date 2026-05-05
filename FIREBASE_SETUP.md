# Firebase Setup — Badiang National High School Website

This document covers everything you need to set up Firebase for this project, from creating the project to configuring roles for staff.

**Audience:** This is written for school IT staff who may not be developers. If something isn't clear, follow the steps exactly as written.

---

## 1. Project Setup

### 1.1 Create the Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Enter a name (e.g., `bnhs-website`)
4. Disable Google Analytics (you can enable it later if needed)
5. Click **Create project**
6. Wait ~30 seconds for setup

### 1.2 Register a web app

1. On the project overview page, click the **Web** icon (`</>`)
2. App nickname: `BNHS Web`
3. **Skip** "Also set up Firebase Hosting" — we deploy to Vercel/Netlify
4. Click **Register app**
5. Copy the `firebaseConfig` object — you'll paste these values into `.env.local`

### 1.3 Generate Admin SDK credentials

These are different from the client config. They give your server full access.

1. Click the gear icon → **Project Settings**
2. Click the **Service Accounts** tab
3. Click **Generate new private key** → confirm
4. A JSON file downloads — open it in a text editor
5. Copy `project_id`, `client_email`, and `private_key` into `.env.local` (see section 2)
6. **Delete the JSON file** from your computer when done. Never commit it.

---

## 2. Environment Variables (`.env.local`)

Create a file named `.env.local` in the project root:

```bash
# ─── Public client config (safe to expose in browser) ───
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bnhs-website.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bnhs-website
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bnhs-website.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abc123

# ─── Server-only Admin SDK (NEVER commit, NEVER prefix with NEXT_PUBLIC_) ───
FIREBASE_PROJECT_ID=bnhs-website
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@bnhs-website.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**Critical:** The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes, with `\n` characters as literal text (backslash-n, not real line breaks).

Verify `.env.local` is in `.gitignore`:
```bash
git check-ignore .env.local   # should print: .env.local
```

---

## 3. Enable Firebase Services

### 3.1 Authentication

1. Firebase Console → **Build** → **Authentication** → **Get started**
2. Sign-in method tab → enable **Email/Password**
3. Save

### 3.2 Firestore Database

1. Firebase Console → **Build** → **Firestore Database** → **Create database**
2. Choose **Production mode** (we configure rules below)
3. Region: **asia-southeast1 (Singapore)** — closest to the Philippines
4. Click **Enable**
5. Wait ~1 minute

### 3.3 Storage

1. Firebase Console → **Build** → **Storage** → **Get started**
2. Choose **Production mode**
3. Same region as Firestore (asia-southeast1)
4. Click **Done**

---

## 4. Security Rules

These are the rules that protect your data. They are **strict** by default — only your server (with Admin SDK credentials) can read/write. Copy them exactly.

### 4.1 Firestore rules

Firebase Console → Firestore → **Rules** tab → paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny ALL direct client access by default.
    // The Admin SDK on our server bypasses these rules — that's how
    // events, announcements, etc. get read and written.
    //
    // Why this is safe: the Admin SDK only runs in our Server Components
    // and API routes, never in the browser. Even if someone tries to
    // write to Firestore from the browser, this rule blocks them.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

### 4.2 Storage rules

Firebase Console → Storage → **Rules** tab → paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read for /public/** — this is where event images go.
    // Anyone can view them, but only the server can upload (Admin SDK bypasses).
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if false;
    }

    // Everything else: server-only
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

---

## 5. Folder Structure

```
src/
├── services/                      ← The data layer. Pages never import Firebase directly.
│   ├── firebase.ts                ← Admin SDK init (server-only)
│   ├── firebase.client.ts         ← Client SDK init (browser auth only)
│   ├── auth.service.ts            ← Auth: getCurrentUser, requireRole, setRole
│   └── event.service.ts           ← Events: listEvents, createEvent, updateEvent, deleteEvent
│
├── features/                      ← Feature modules (vertical slices)
│   ├── events/
│   │   ├── schema.ts              ← Zod validation
│   │   ├── types.ts               ← TS types from Zod
│   │   └── components/            ← EventCard, EventList
│   └── auth/
│       └── components/            ← LoginForm
│
├── app/
│   ├── (public)/                  ← Public pages
│   │   ├── events/                ← Calls event.service directly (Server Component)
│   │   └── auth/{faculty,admin,student}/   ← Login pages
│   └── api/
│       ├── events/route.ts        ← REST endpoint (GET public, POST faculty/admin)
│       └── auth/session/route.ts  ← Cookie-based session management
│
└── components/ui/                 ← Shared primitives (Logo, Navbar, Container, Footer)
```

### Why this structure?

- **`/services`** is the only place that talks to Firebase. If we ever migrate to a different backend (Postgres, Supabase), only this folder changes.
- **`/features`** keeps related code together. The `events` feature has its schema, types, and components in one place — easy to find, easy to delete.
- **`/app`** is just Next.js routing — pages compose features. Pages stay thin.

---

## 6. How Roles Work

Three roles: `admin`, `faculty`, `student`.

### Architecture: Firebase custom claims

Roles are stored as **custom claims** on the user's Firebase Auth account, NOT as a Firestore document. Why:

- **Free in every request.** The role travels inside the JWT. No extra DB lookup.
- **Tamper-proof.** The token is signed by Firebase. Clients can't forge it.
- **Atomic.** A single write changes the role; no partial state.

### Role permissions

| Role | Can read | Can write | Can access |
|------|----------|-----------|------------|
| `student` | Public site, student portal | Nothing | `/portal` |
| `faculty` | Everything students see + admin dashboard | Events, announcements, media | `/admin` |
| `admin` | Everything | Everything | `/admin` |

### How to assign a role to a user

There's no UI yet — you assign roles via a one-off script. Here's the simplest version:

1. Create the user in Firebase Console → Authentication → Add user
2. Copy their UID
3. Run a Node script (or temporarily add an admin Server Action):

```ts
// scripts/set-role.ts
import { setRole } from '@/services/auth.service';
await setRole('THE_USER_UID', 'faculty'); // or 'admin' or 'student'
```

The next time that user signs in, their token will carry the new role.

**Tip for non-developer admins:** You can build a simple admin-only page later that lists users and lets you click a button to promote/demote them. The `setRole()` function is already wired up — it just needs a UI.

### How role gates work

Three layers, each independent:

1. **Login page** — The login form refuses to issue a session cookie if the user's role doesn't match the page (e.g., a student account trying to log in via `/auth/admin` is rejected).
2. **API routes** — Every protected endpoint calls `requireRole(request, ['faculty', 'admin'])`. The role is read from the verified token. No DB lookup.
3. **Firestore rules** — Even if both above were bypassed, the Firestore rules still block direct client writes. Belt and suspenders.

---

## 7. How Events Flow

```
┌─────────────────────────────────────────────────────────────┐
│  CREATE event flow                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Admin form submits to                                      │
│   POST /api/events                                           │
│         │                                                    │
│         ▼                                                    │
│   API route: requireRole(['faculty', 'admin'])              │
│         │  (verify session cookie → get role from claim)     │
│         ▼                                                    │
│   API route: createEvent(body)                              │
│         │                                                    │
│         ▼                                                    │
│   event.service: CreateEventSchema.parse(input)             │
│         │  (Zod validation; throws on bad data)             │
│         ▼                                                    │
│   event.service: adminDb.collection('events').add(...)      │
│         │  (Admin SDK; bypasses Firestore rules)            │
│         ▼                                                    │
│   Firestore writes the document                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  READ events flow (public events page)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   User visits /events                                        │
│         │                                                    │
│         ▼                                                    │
│   EventsPage (Server Component)                             │
│         │                                                    │
│         ▼                                                    │
│   event.service: listEvents()                               │
│         │  (no auth needed; events are public)              │
│         ▼                                                    │
│   Firestore returns documents                                │
│         │                                                    │
│         ▼                                                    │
│   Server renders <EventList /> with HTML                    │
│         │                                                    │
│         ▼                                                    │
│   Browser receives static HTML — no client JS for the data  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

The page is **static-with-revalidation** (`export const revalidate = 60`). Once an event is added, the page updates within 60 seconds — no full rebuild required, no manual refresh.

---

## 8. Logo Setup

The navbar shows a logo image with a text fallback. To use a custom logo:

1. Save your logo as `logo.png` (or `.svg`) at **64×64 pixels** minimum
2. Place it in the `/public` folder of the project: `public/logo.png`
3. The navbar picks it up automatically — no code changes needed

If `logo.png` is missing or fails to load, the navbar falls back to a styled "B" letter mark. This means the site never looks broken even before you add a real logo.

---

## 9. First-time Setup Checklist

After cloning the repo:

- [ ] `npm install`
- [ ] Create `.env.local` with all Firebase values (section 2)
- [ ] Verify `.env.local` is gitignored
- [ ] Enable Authentication (Email/Password) in Firebase Console
- [ ] Enable Firestore in Firebase Console (Production mode)
- [ ] Enable Storage in Firebase Console (Production mode)
- [ ] Paste Firestore rules (section 4.1)
- [ ] Paste Storage rules (section 4.2)
- [ ] Create at least one admin user in Firebase Auth → set role with `setRole(uid, 'admin')`
- [ ] Add a logo at `public/logo.png` (optional)
- [ ] `npm run dev` → visit http://localhost:3000

---

## 10. Common Issues

### "5 NOT_FOUND" when fetching events
Your `events` collection doesn't exist yet. Either:
- Create it manually in Firebase Console with one document, or
- POST an event to `/api/events` (you need to be authenticated as faculty/admin)

### "Failed to parse private key"
Your `FIREBASE_PRIVATE_KEY` in `.env.local` is malformed. It should:
- Be wrapped in double quotes
- Start with `"-----BEGIN PRIVATE KEY-----`
- Have `\n` as literal text (not real line breaks)
- End with `-----END PRIVATE KEY-----\n"`

### "PERMISSION_DENIED" when writing events
Your Admin SDK credentials are wrong or your service account was revoked. Generate a new one (section 1.3) and update `.env.local`.

### Login succeeds but redirect fails
The user's role custom claim doesn't match the login page they used. Run `setRole(uid, 'admin')` (or `faculty`/`student`) for that user.
