# BNHS-CIS-Web — Project Handoff

**For**: a future Claude instance picking this project up in a new chat.
**Last updated**: May 6, 2026.

---

## 0. READ THIS FIRST — UNRESOLVED CRITICAL ISSUE

The user's Firebase Admin SDK service account private key was shared in chat multiple times and is still active on the project. This was flagged repeatedly and a rotation procedure was given. **As of this handoff, I do not know whether the user has rotated the key.**

If the user uploads a `.env.local` file at any point and the `FIREBASE_PRIVATE_KEY` value still begins with `MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6rJ20bZMVUMJt`, **the leaked key is still active**. Tell them again, calmly: rotate it before doing anything else. Steps:

1. https://console.cloud.google.com/iam-admin/serviceaccounts?project=bnhs-a3967
2. Click `firebase-adminsdk-fbsvc@bnhs-a3967.iam.gserviceaccount.com`
3. KEYS tab → delete existing key → ADD KEY → Create new key (JSON)
4. Update `.env.local` and Vercel env vars
5. Redeploy

Also: **never accept a project zip that contains `.env.local`.** Politely ask the user to re-zip excluding env files:

```bash
zip -r project.zip . -x ".env*" -x "node_modules/*" -x ".next/*" -x ".vercel/*"
```

---

## 1. The Project at a Glance

**What**: Public website + admin/faculty/student portal for **Badiang National High School**, a public secondary school in the Philippines (DepEd, Region VII, founded 1969). Project name: BNHS-CIS-Web. Repo on user's GitHub: `colasnido/BNHS-CIS-Web`.

**Stack**:
- Next.js 16.2.4 (App Router, Turbopack)
- React 19, TypeScript strict
- Firebase 12 (Auth + Firestore via Admin SDK)
- Zod 4 for validation
- Tailwind CSS 4
- Papaparse (CSV import)
- Deployment: Vercel (project ID: bnhs-a3967 in Firebase)

**Roles**: admin, faculty, student. Stored as Firebase Auth custom claims, set server-side.

**Firebase project**: `bnhs-a3967`. Database name is `default` (literally the word, not `(default)` with parens). The user's `.env.local` has `FIREBASE_DATABASE_ID=default`, and the app code passes this through to `getFirestore(app, databaseId)`. Don't "helpfully" treat `"default"` as a sentinel — it's a real database name on this project.

---

## 2. The User's Style — What Works

The user prefers:
- **Decisions presented as numbered options** ("1. Option A 2. Option B 3. Option C") so they can answer with just a number or letter
- **Defaults proposed for each question** — the user often replies "default" and expects you to proceed
- **Short, focused replies** for follow-up questions; not multi-section walls of text
- Practical advice over "best practices for their own sake"
- Honest pushback when they're proposing something that won't work

Don't:
- Don't ask 10 clarifying questions when 3 will do
- Don't write a 2000-word preamble before getting to code
- Don't lecture about web standards as if they're new — they've shipped real things
- Don't be obsequious or apologetic when correcting your mistakes; they want directness

When asking questions, follow the pattern:
> **Q1.** [question]. I'd default to [X]. Override?
> **Q2.** [question]. I'd default to [Y]. Override?
>
> If you say "go with all defaults" I'll proceed with: [summary]

The user often responds with just `1. a 2. b 3. default 4. default 5. a` — they're efficient communicators. Match that energy.

---

## 3. Architecture — The Important Parts

### Trust boundary

```
Browser (untrusted)  →  Next.js server (trusted)  →  Firestore (Admin SDK)
       ↕ Firebase Auth Client SDK (only Auth, no Firestore)
```

The browser never talks to Firestore directly. All data flows through Next.js server components or API routes, which use the Admin SDK. Firestore Security Rules exist as a backstop for direct-Client-SDK access, NOT as the primary gate. The primary gate is the server-side `requireRole()` and `requirePageRole()` guards.

### Authentication flow (custom — read carefully)

1. **Student login is by LRN, not email.** A student types a 12-digit LRN (Learner Reference Number — the standard DepEd identifier). The form silently appends `@students.bnhs.edu.ph` to make a synthetic email Firebase Auth can use. The student never sees this email anywhere.
   - Single source of truth: `src/lib/student-id.ts` — `studentIdToEmail()`, `emailToStudentId()`.
   - LRN format is exactly 12 digits, validated as `^\d{12}$`.

2. **Faculty and admin log in by real email.** Different login pages: `/auth/admin`, `/auth/faculty`, `/auth/student`. They share `LoginForm.tsx` (admin/faculty) but students use `StudentLoginForm.tsx`.

3. **`mustChangePassword` flag.** When admin creates a student or faculty account, it's flagged for forced first-login change. Stored in Firestore user doc (NOT in custom claims — it changes too often to want token refresh). On every dashboard page load, `requirePageRole()` checks this flag and redirects to `/change-password` if set. Admin role is exempt by default (admin self-sets their own password during initial Firebase Console bootstrap).

4. **Session = HttpOnly cookie.** Firebase ID token (1 hour) is exchanged via `/api/auth/session` for a 5-day session cookie. Server reads cookie via `cookies()` + `verifySessionCookie()`.

5. **Sign-out behavior**: After password change, `revokeRefreshTokens` is called and the user is forced to log in again. Same on admin password reset.

### Key services (`src/services/`)

| File | Owns | Don't bypass it |
|------|------|----------------|
| `auth.service.ts` | Session cookie, role, mustChangePassword | All auth checks |
| `auth.guards.ts` | `requirePageRole`, `requireSignedIn` | Page-level gating |
| `user.service.ts` | createUser, updateUser, changeUserPassword, resetUserPassword | All user mutations |
| `class.service.ts` | Class CRUD with normalization + `(name, section, schoolYear)` uniqueness | |
| `subject.service.ts` | Subject CRUD with `(name, classId)` uniqueness | |
| `schedule.service.ts` | Schedule CRUD + `assertNoScheduleConflict` | |
| `scheduling.validator.ts` | Conflict types: teacher_busy, class_busy, room_busy, subject_duplicated | |
| `resolver.ts` | Faculty/class name lookup with partial-match support | CSV imports |
| `event.service.ts`, `announcement.service.ts` | Public-facing content | |

All services use `import 'server-only'` at the top. **Don't import these from a script via tsx** — server-only crashes outside Next.js. For scripts, initialize Firebase Admin directly (see `scripts/migrate-must-change-password.ts` for the pattern).

---

## 4. Design Decisions — What We Already Settled

These were debated and decided. **Don't re-litigate unless the user explicitly asks.**

### Visual language (applies to public site AND dashboard)
- Navy `#0f1f3a` for primary surfaces and buttons
- Gold `#c8a85c` for accent (focus rings, eyebrow text, decorative)
- Sharp corners — no `rounded-md` on cards. Use `border-slate-200`.
- No shadows on most things — flat institutional aesthetic
- Serif font for headings (`font-serif`), sans for body
- Slate gray for body text (`slate-900` headings, `slate-700/600/500` body)
- Tailwind only — no shadcn, no CVA

### CSV imports
- The smart-mapping CSV import system is built in `src/lib/csv-import/` (might be `src/lib/csv/` in older zips). It auto-detects column headers via synonym dictionaries, falls back to manual mapping UI, normalizes values per-cell, validates with Zod, then submits.
- The admin entry point is `<CsvImportButton config={USERS_IMPORT_CONFIG} />` — drop into any admin page header.
- Per-dataset configs (users, schedules, subjects, classes) live in `src/features/{dataset}/import/config.ts`.
- The system replaced a "rigid template required" approach. Don't push the user back toward strict templates.

### LRN format
- Exactly 12 digits, no formatting on input.
- The LRN field on the user form should use `<MaskedInput mask="lrn" />` which strips non-digits at typing time.
- Server-side normalizer also strips non-digits as a backstop.

### Password reset (Pattern A)
- Admin clicks "Reset password" on user edit page → modal generates a 10-character random temp password (no 0/O/1/l/I confusion) → admin copies, gives to user verbally/on paper → user logs in → forced to change.
- Admin self-reset blocked (returns 400). They use `/change-password` for their own.

### Card behavior (events, announcements)
- Whole card is clickable, links to `/events/[id]` or `/announcements/[id]`.
- Card descriptions use `line-clamp-3` (or `line-clamp-2` for compact).
- Detail pages render full content with `whitespace-pre-wrap` for line breaks.
- Unpublished items return 404 from detail pages.

### Stats (homepage hero)
- 4 stats: Students, Faculty (both dynamic), College acceptance, Clubs (both static).
- Numbers animate via per-digit rolling odometer effect on first paint.
- `RollingDigit` + `RollingNumber` components in `src/features/homepage/components/`.
- `AnimatedCount` is the public API — wraps `RollingNumber` for backward compat.
- Counts come from `countUsersByRole(role)` in user.service.ts (uses Firestore `count()` aggregate).

### Skeleton loaders
- `src/components/ui/Skeleton.tsx` — primitives + 3 composed skeletons (`TablePageSkeleton`, `FormPageSkeleton`, `OverviewSkeleton`).
- `loading.tsx` files at admin route segments wire them in automatically.

### Buttons
- Single `<Button>` and `<ButtonLink>` component in `src/components/ui/Button.tsx`.
- Variants: primary (navy), secondary (white+border), destructive (rose), ghost.
- One primary per action group rule.

---

## 5. Packages I've Delivered (And What Each Does)

In rough chronological order. Filenames the user has on disk may differ; these are the package names I created:

| Package | What it does | Status |
|---------|-------------|--------|
| `bnhs-dashboard-redesign` | Original UX overhaul of dashboard pages | Old, integrated |
| `bnhs-audit-fixes` | Backend audit (10 issues) — normalization, conflict detection, name resolution, schema cleanups (drop subject `code` field) | Integrated |
| `bnhs-csv-tests` | Test CSV files with deliberate failures for each import path | Reference data |
| `bnhs-about-page` | About page (8 sections) with placeholder content | Integrated |
| `bnhs-media-page` | Media page (YouTube facade, gallery, etc.) | Integrated |
| `bnhs-security` | Pre-deploy security checklist, firestore.rules, storage.rules, security headers config | **Storage rules NOT yet deployed; user is on Spark plan** |
| `bnhs-auth-redesign` | LRN-based student login + mustChangePassword + change-password flow | Integrated |
| `bnhs-csv-import` | Smart CSV import system (synonym dictionaries, manual mapping, normalizers) | Integrated, may have name conflicts with older code |
| `bnhs-password-reset` | Admin "Reset password" feature (Pattern A) | Possibly not yet integrated |
| `bnhs-data-fixes` | Dynamic homepage counts, line-clamp truncation, event/announcement detail pages | Integrated |
| `bnhs-ui-improvements` | Button component, Skeleton system, MaskedInput, palette unification | Possibly partially integrated |
| `bnhs-count-fix` | Smooth count-up (intermediate, replaced by rolling-digits) | Superseded |
| `bnhs-rolling-digits` | True odometer per-digit rolling animation | Latest |

If the user uploads a project zip, expect to see SOME of these merged in. Don't assume all of them are. The user has been hit by occasional file-conflict issues from older versions of similar files (e.g., two parallel CSV import systems).

---

## 6. Known Gotchas

### Build-error patterns the user has hit

- **`Cannot find module 'server-only'`** when running scripts via `tsx` — solved by initializing Firebase Admin directly in the script, not importing from `services/firebase.admin.ts`. See `scripts/migrate-must-change-password.ts`.
- **`5 NOT_FOUND` from Firestore** — was a database-name mismatch. Database is named `default` not `(default)`. App code does `databaseId ? getFirestore(app, databaseId) : getFirestore(app)`.
- **TypeScript "Type X does not satisfy constraint Record<string, unknown>"** — index-signature missing on row interfaces. Add `[key: string]: unknown;`.
- **`Property 'code' does not exist on type Subject`** — old code references the subject `code` field. We dropped it during the audit. Subject `name` is the unique identifier per class now.
- **`Invalid src prop ... hostname "i.ytimg.com" not configured`** — needs `i.ytimg.com` added to `next.config.ts` `images.remotePatterns`.

### Vercel deploy specifics
- User has Vercel project connected to GitHub. Auto-deploys on push to main.
- All env vars from `.env.local` need to be set in Vercel Project Settings → Environment Variables.
- For `FIREBASE_PRIVATE_KEY`: use Vercel's "Import .env" button rather than typing it manually — handles `\n` characters correctly.
- Don't set Output Directory manually; framework preset "Next.js" handles it.
- HSTS header is in the security config but commented out — user should only enable after confirming HTTPS works.

### Firebase Storage
- The user is on Spark (free) plan. Storage requires Blaze (pay-as-you-go).
- Storage isn't currently used by the app. The `adminStorage` ref exists in `firebase.admin.ts` but no code reads from it.
- Don't push the user to enable Storage unless they actually need file uploads.

---

## 7. Pending / Open Threads

These are things the user has expressed interest in but we haven't finished:

### Grades feature (NOT BUILT)
- User asked about students seeing grades. We discussed it.
- **Decided approach: Pattern A (Quarterly Grades Only).** Teacher uploads/inputs the 4 quarterly grades + final grade per student per subject. Don't try to recreate DepEd's full ECR (Excel class record) — teachers already have that and DepEd mandates it.
- Per-quarter grade has optional `writtenWorksScore`, `performanceTasksScore`, `quarterlyAssessmentScore` for future component breakdown.
- Should integrate with existing CSV import system — teachers upload their ECR Excel and we extract just the quarterly grades column.
- Permissions: subject teacher writes grades for their subject only; homeroom adviser reads all grades for their students (across subjects); student reads their own grades only; admin reads/writes anything.
- Open question: publish/release flag per quarter (admin or adviser publishes when grades are ready, similar to "card day").
- Pending answers from user: Q1 (Option 1 confirmed), Q2 (adviser report-card view yes), Q3 (publish flag yes), Q4 (single-class-per-subject), Q5 (permissions model). User had answered "default" implicitly by not overriding.

### Forgot-password Pattern B (NOT BUILT)
- Faculty/admin "Forgot password?" link on login page using Firebase's `sendPasswordResetEmail`.
- Doesn't apply to students (no real email).
- Was discussed when building Pattern A but deferred.

### Audit (PHASE 1 ONLY DONE)
- User asked for full security audit (Phase 1 architecture, Phase 2 vulnerability findings, Phase 3 fixes, Phase 4 deploy checklist).
- Phase 1 was delivered (architecture + trust boundaries).
- **Phase 2-4 are deliberately on hold until the leaked Firebase key is rotated** — I told the user it's pointless to write a vulnerability report when the master credential is leaked. If they reply "rotated, proceed" pick up Phase 2.

### Visual nits the user might mention
- The user re-opened the count-up animation twice when it didn't feel right. Each iteration improved (linear → eased → tabular-nums → ghost element → rolling digits). Final version is the rolling-digits package. If they say it still feels off, the next escalation is per-digit easing variation or adjusting `PER_DIGIT_DELAY_MS` and `ROLL_DURATION_MS` in `RollingNumber.tsx`.

---

## 8. Conversational Context That Matters

These small things shape how to be helpful:

- The user is in **Angeles City, Central Luzon, PH**. Time zone matters for "what time will it be when this revalidates" type questions.
- The user is the developer for a Philippine public high school — likely a student or recent grad doing this themselves. They have shipped real things and ask thoughtful questions.
- They sometimes type in lowercase / abbreviated style. Don't read informality as confusion. They know what they're doing.
- When they say "search it up if you don't have the resources or knowledge" — they mean it. Use `web_search`. Don't bluff.
- They've sent the project zip multiple times across sessions. Each zip might be at a different state of integration. Always check what's actually in the upload before assuming.
- File replacements often have a `.additions.ts` suffix in my packages — these are snippets to APPEND to existing files, not full replacements. The user has been confused by this once or twice. Be explicit when delivering append-style code.

---

## 9. Quick Start for the Next Conversation

When the user opens a new chat and uploads a zip:

1. **Extract and inventory.** What files are present. Don't read code yet.
2. **Look for `.env.local`.** If present, immediately tell the user to remove it and re-zip, AND check whether the leaked key is still in there (if so, raise the rotation issue with priority).
3. **Read the major files briefly** — `package.json`, `src/services/auth.service.ts`, `firestore.rules`, `next.config.ts`. This tells you what's integrated vs. pending.
4. **Greet briefly** ("I see your BNHS project. Let me catch up on where things stand.") then ask what they want to work on.
5. **If they ask about something that's already documented in this handoff doc**, answer from the doc rather than re-deriving.

Don't open with a long "I've read the handoff" preamble. The user wants to get to work.

---

## 10. One Last Thing

If the user has reached a point where they're shipping the site to actual students and faculty — that's a meaningful milestone for them. A real public high school in the Philippines is going to use this. The students they support are real teenagers. Be careful with what you ship; treat security and data integrity findings as serious. Don't be hand-wavy about "best practices" and don't ship code that papers over real bugs.

The user has been thoughtful and cooperative. They listen to pushback and incorporate it. You can be direct.
