# BNHS-CIS-Web

A web-based **Campus Information System** for Bagumbayan National High School (BNHS) — built to streamline information dissemination, academic management, and administrative workflows for staff, faculty, and students.

## Overview

BNHS-CIS-Web centralizes the school's day-to-day information flow: announcements, events, class rosters, subjects, and schedules — all behind role-based authentication. It replaces ad-hoc bulletin boards, scattered spreadsheets, and group chats with a single source of truth for the school community.

## Features

- **Public site** — homepage, about, announcements, and events for visitors and the wider community.
- **Admin dashboard** (`/dashboard/admin`) — full CRUD for users, classes, subjects, schedules, announcements, and events.
- **Authentication** — Firebase Auth with role-based access (admin, faculty, student); layout-level guards plus Firestore security rules.
- **CSV import** — bulk-load users, classes, or schedules from spreadsheets via `papaparse` + `zod`-validated schemas.
- **Media management** — upload and serve images and assets through Firebase Storage.
- **Schema validation** — every mutation is validated with `zod` before reaching Firestore.

> Faculty and student dashboards are in progress (planned as Batches C and D).

## Tech Stack

| Layer       | Choice                                            |
| ----------- | ------------------------------------------------- |
| Framework   | Next.js 16 (App Router) with React 19             |
| Language    | TypeScript 5                                      |
| Styling     | Tailwind CSS 4 + PostCSS                          |
| Backend     | Firebase (Auth, Firestore, Storage) + Admin SDK   |
| Validation  | Zod                                               |
| CSV parsing | PapaParse                                         |
| Testing     | Playwright                                        |
| Tooling     | ESLint, TypeScript strict mode                    |


Route groups in parentheses (`(public)`, `(dashboard)`) keep layouts isolated without affecting URLs. Authorization is enforced at three layers: layout-level guards, service-level checks, and Firestore rules.

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm (or pnpm / yarn / bun)
- A **Firebase project** with Authentication, Firestore, and Storage enabled

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/colasnido/BNHS-CIS-Web.git
   cd BNHS-CIS-Web
   npm install
   ```

2. **Configure Firebase** — see [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) for full instructions. You'll need:
   - A web app config (client SDK)
   - A service account JSON (admin SDK)
   - Auth, Firestore, and Storage enabled in the Firebase console

3. **Environment variables** — create `.env.local` with your Firebase config (public `NEXT_PUBLIC_FIREBASE_*` keys and the private admin credentials).

4. **Deploy security rules:**
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

5. **Run the dev server:**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>.

### Available Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the Next.js dev server      |
| `npm run build` | Production build                  |
| `npm run start` | Run the production build          |
| `npm run lint`  | ESLint over the codebase          |

For deeper setup notes, see [`SETUP.md`](SETUP.md) and [`INSTALL.md`](INSTALL.md).

## Architecture Notes

- **Layout-level role checks** run on the Node.js runtime (not the Edge), which is required for Firebase Admin session validation.
- **Single canonical user ID** — Firestore user document IDs match Firebase Auth UIDs, so there's only one identifier per person.
- **Firestore helpers** in `src/lib/firestore.helpers.ts` consolidate CRUD logic that used to be duplicated across services.
- **Defense in depth** — every protected operation is validated at the layout, service, and Firestore-rule levels.

## Contributing

This is a school project. If you're a contributor, see [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) for the coding conventions and AI-assisted workflow used in this repo.

## License

No license specified yet — add one before any external use.
