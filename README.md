# GDG Quest

A gamified, mobile-first recruitment app for **GDG on Campus Air University (GDGOC AU)**.
Candidates play 7 short levels (about 5 minutes, no sign-in) and their application lands in Firestore.
Core team and domain leads review, rate and shortlist from `/admin`.

| Route | Who | What |
|---|---|---|
| `/` | Candidates | The quest: 7 levels hosted by Sumaiya, Ahmed and Abdul Rafay |
| `/admin` | Core + leads (Google sign-in) | Table, filters, ratings, status, CSV export, stats |
| `POST /api/apply` | The quest | Validates, checks Turnstile, writes with the Admin SDK |

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · Framer Motion · Zod 4 ·
Firebase (Firestore, Auth for admins only, Admin SDK on the server) · Cloudflare Turnstile · html-to-image · optional Resend.

---

## 1. Edit the content first

Everything a candidate reads lives in **`src/content.ts`**: NPC lines, intro cards, council bios and fun facts,
Ahmed's stats, video captions, hints, house descriptions, department suggestions, roll number regex,
WhatsApp contact, IG handle, the shortlist note and the Boss Check questions. Search the file for `PLACEHOLDER`.

Then replace the assets (keep the filenames, or update the paths in `content.ts`):

| File | What |
|---|---|
| `public/team/sumaiya.svg`, `ahmed.svg`, `rafay.svg` | Square photos (512x512 .webp/.jpg recommended) |
| `public/team/ahmed-intro.mp4` | Ahmed's ~15 sec vertical intro (see `public/team/README.md` for the ffmpeg command) |
| `public/team/ahmed-intro-poster.svg` | First frame of the video |
| `public/brand/gdgoc-au-logo.svg` | Official GDG on Campus chapter lockup (see `public/brand/README.md`) |

Until the video exists, Level 4 shows the poster and the captions as text, so nothing breaks.

## 2. Run it locally

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

With an empty `.env.local` the quest is fully playable. Turnstile is skipped in dev when no keys are set,
but submitting needs Firestore (real project or the emulator below).

### Local backend with the emulators (no Firebase project needed)

Requires Java 11+.

```bash
npm run emulators      # terminal 1: Firestore :8080 + Auth :9099
npm run seed           # terminal 2: 36 fake applications
```

`.env.local` for emulator mode:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
FIREBASE_PROJECT_ID=demo-gdg-quest
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_API_KEY=fake-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-gdg-quest
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_APP_ID=1:1:web:1
```

Sign in at `/admin` (the emulator shows a fake Google account picker), then give yourself access:

```bash
npm run seed -- --claims you@example.com core
```

and reload `/admin`.

## 3. Production setup

### 3.1 Firebase project

1. Go to <https://console.firebase.google.com> → **Add project** (Analytics not needed).
2. **Build → Firestore Database → Create database**. Production mode. Pick a nearby region
   (e.g. `asia-south1` Mumbai). The region can't be changed later.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable**.
4. **Authentication → Settings → Authorized domains**: add your Vercel domain(s), e.g. `gdg-quest.vercel.app`.
5. **Project settings → General → Your apps → Web (`</>`)**: register an app. Copy the config values into the
   `NEXT_PUBLIC_FIREBASE_*` variables.

### 3.2 Service account (server writes)

1. **Project settings → Service accounts → Generate new private key**. A JSON file downloads.
2. Copy into env:
   - `FIREBASE_PROJECT_ID` ← `project_id`
   - `FIREBASE_CLIENT_EMAIL` ← `client_email`
   - `FIREBASE_PRIVATE_KEY` ← `private_key` (paste in double quotes, keep the `\n` sequences)
3. Never commit the JSON file. `.env*` files are already git-ignored (except `.env.example`).

### 3.3 Deploy the security rules

```bash
npx firebase login
npx firebase use --add          # pick your project
npm run deploy:rules            # firestore.rules + firestore.indexes.json
```

The index file enables collection-group queries on `reviews.domain`, which the admin table uses for average ratings.
Rules summary:

- Candidates never touch Firestore. Only `/api/apply` writes, via the Admin SDK.
- `applications`: no public access. Clients can't create or delete. Core reads everything; a lead reads only
  their domain. Updates may change **only** `status` and `updatedAt`.
- `reviews/{reviewerUid}`: readable by core or that domain's lead. Writable only by the reviewer themselves.

### 3.4 Cloudflare Turnstile

1. Cloudflare dashboard → **Turnstile → Add widget**. Mode: **Managed**.
2. Hostnames: your Vercel domain(s) and `localhost`.
3. Copy the **site key** to `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the **secret** to `TURNSTILE_SECRET_KEY`.

In production a missing secret rejects every submission (fails closed). For testing you can use Cloudflare's
always-pass keys, listed in `.env.example`.

### 3.5 Optional: confirmation email (Resend)

1. Create an account at <https://resend.com>, verify a domain you own, create an API key.
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (e.g. `GDGOC AU <quest@yourdomain.com>`).

Leave `RESEND_API_KEY` empty to turn emails off. The email is sent after the response, so it never slows down
or fails a submission. Edit the text in `content.ts` → `email`.

### 3.6 Give admins access

**Easiest: allowlist in Vercel.** Set these environment variables, redeploy, and the
people listed get access automatically the first time they sign in to `/admin`:

```bash
ADMIN_CORE_EMAILS=ahmed.usman7615@gmail.com,daniyalhero07@gmail.com
ADMIN_LEAD_EMAILS=lead@gmail.com:technical,other@gmail.com:ops
```

Only Google accounts with a verified email on the list are granted; everyone else sees
"Access denied". Removing someone from the list doesn't revoke access they already have;
use `--remove` below for that.

**Or with the script** (needs the service account in `.env.local`):

Each person signs in to `/admin` once (they'll see "Access denied"), then you run:

```bash
# core team: sees everything
npm run claims -- --email sumaiya@gmail.com --role core
npm run claims -- --email ahmed@gmail.com --role core

# domain leads: see only their house
npm run claims -- --email lead@gmail.com --role lead --domain technical
#   domains: technical | marketing_partnerships | visual_media | ops

npm run claims -- --list                         # who has access
npm run claims -- --email x@gmail.com --remove   # revoke
```

The script reads the Admin SDK credentials from `.env.local`. The person just reloads `/admin`.

### 3.7 Deploy to Vercel

1. Push this repo to GitHub.
2. <https://vercel.com/new> → import the repo. Framework is detected as Next.js. No build settings to change.
3. **Settings → Environment Variables**: add every variable from `.env.example` (Production + Preview).
   For `FIREBASE_PRIVATE_KEY`, paste the key with its `\n` sequences but without the surrounding quotes.
4. Deploy. Then add the Vercel domain to Firebase **Authorized domains** and to the Turnstile widget hostnames.

`NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after changing the deadline** or any
`NEXT_PUBLIC_` variable.

## 4. How it works

### Candidate flow

| Level | Host | |
|---|---|---|
| 0 Press Start | Sumaiya | Title screen. Returning players get "Continue from Level N" |
| 1 Welcome to GDG | Sumaiya | 3 swipeable cards, then the handover to Ahmed |
| 2 Meet the Council | Ahmed | 3 flip cards; Ahmed's is larger with a "Your Guide" badge and stats |
| 3 Build your Character | Abdul Rafay | Personal info. Each valid field unlocks an avatar part |
| 4 Choose your House | Ahmed | Intro video, 4 doors, optional skills |
| 5 Your Story | Ahmed | Two long answers with power meters and hint bubbles, quick taps |
| 6 Boss Check | Abdul Rafay | 2 MCQs, just for fun (score stored, not used for selection) |
| 7 Review + Loot | All 3 | Character sheet, consent, Turnstile, submit, confetti, shareable 1080x1920 card |

- **Progress** is saved to `localStorage` (every access is wrapped in try/catch) and cleared after a successful submit.
- **Speed mode** (top right) skips typing animations, transitions and video autoplay. `prefers-reduced-motion` does the same.
- **Avatar layers:** name → face, email → lanyard, roll no → jersey number, phone → sneakers, semester → Lvl badge,
  department → jersey color, house → emblem, team role → accessory.
- **Duplicate roll numbers:** the API uses Firestore `create()` on `applications/{rollNo}`, so a second attempt
  gets "Is roll no se already apply ho chuka hai…" plus a WhatsApp button.
- **Department** is free text (candidates write it themselves); `departmentSuggestions` in `content.ts` only
  powers autocomplete. The admin Department filter matches by "contains".
- **Deadline is optional.** Leave `NEXT_PUBLIC_APPLICATIONS_DEADLINE` empty and applications stay open.
  Once set and passed, the quest shows "Quest closed" and the API returns 403.

### Submission API checks, in order

body size → honeypot → deadline → Zod (`src/lib/schema.ts`, shared with the UI) → Turnstile → `create()` → email (after response)

### Data model

```
applications/{rollNo}
  fullName, email, rollNo, phone, semester, department, domain, skillTags[],
  experience, whyJoin, portfolioUrl, teamRole, hoursPerWeek, excitedAbout[], funFact,
  quizScore, timeTakenSec, status, createdAt, updatedAt
applications/{rollNo}/reviews/{reviewerUid}
  rating (1-5), notes, createdAt, updatedAt,
  domain, rollNo, reviewerName, reviewerEmail   ← copies so collection-group reads can be checked cheaply
```

`status`: `submitted` | `shortlisted` | `rejected` | `selected`

### Performance notes

- The candidate route ships about 210 KB of gzipped JS (around half is the React/Next runtime).
  Firebase is only loaded on `/admin`; html-to-image and confetti load only on the success screen;
  Turnstile loads only on Level 7.
- The video uses `preload="none"`, mounts only when scrolled into view, and doesn't autoplay on Save-Data or 2G.
- Outfit is self-hosted via `next/font`. Team photos go through `next/image` once you swap in .jpg/.webp files.

## 5. Project layout

```
src/
  content.ts                 all candidate copy + editable data
  lib/schema.ts              shared Zod schema (client + API)
  lib/storage.ts             localStorage that never throws
  lib/firebaseClient.ts      web SDK (admin only)
  lib/server/                Admin SDK, Turnstile verify, Resend email
  app/page.tsx               the quest
  app/admin/page.tsx         admin panel
  app/api/apply/route.ts     submission endpoint
  components/quest/          levels, avatar, NPC chat, HUD, card, video, Turnstile
  components/admin/          dashboard, drawer, stats, CSV
  components/ui/             buttons, fields, chips
scripts/set-claims.ts        grant core/lead access
scripts/seed-emulator.ts     fake data for the local emulator
firestore.rules              security rules
firestore.indexes.json       collection-group index for reviews
```

## 6. Scripts

| Command | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run emulators` | Firestore + Auth emulators |
| `npm run seed` | Fake applications in the emulator |
| `npm run claims -- …` | Grant or revoke admin access |
| `npm run deploy:rules` | Deploy Firestore rules + indexes |
