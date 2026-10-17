# GDG Quest

A gamified, mobile-first recruitment app for **GDG on Campus Air University (GDGOC AU)**.
Candidates play 7 short levels (about 5 minutes, no sign-in) and their application lands in Firestore.
Core team and domain leads review, rate and shortlist from `/admin`.

| Route | Who | What |
|---|---|---|
| `/` | Candidates | The quest: 7 levels hosted by Sumaiya, Ahmed and Abdul Rafay |
| `/admin` | Core + leads (Google sign-in) | Table, filters, ratings, status, CSV export, stats |
| `POST /api/apply` | The quest | Validates, checks Turnstile, writes with the Admin SDK |

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4 · Framer Motion · Three.js · Zod 4 ·
Firebase (Firestore, Auth for admins only, Admin SDK on the server) · Cloudflare Turnstile · html-to-image · optional Resend.

**Live:** <https://recruitments.wyibe.com> (also <https://recruitments-gdsc.vercel.app>). Vercel project
`recruitments-gdsc`, Firebase project `recruitments-f525d` (Firestore in `asia-south1`). Every push to `main`
deploys automatically.

---

## 1. Edit the content first

Everything a candidate reads lives in **`src/content.ts`**: NPC lines, intro cards, council cards (stats, bios,
fun facts, badges, LinkedIn), the Level 4 intro story slides, hints, teams and positions, portfolio link types,
department suggestions, roll number regex, WhatsApp help number and recruitment group link, Instagram/LinkedIn,
the shortlist note, the Boss Check questions and the bonus game link on the success screen.

Assets (keep the filenames, or update the paths in `content.ts`):

| File | What |
|---|---|
| `public/team/sumaiya.jpg`, `ahmed.jpg`, `rafay.jpg` | Square photos used everywhere |
| `public/team/ahmed-card.jpg` | Bigger portrait on Ahmed's council card |
| `public/team/ahmed-intro-poster.jpg` | Backdrop of one intro story slide |
| `public/brand/gdgoc-au-logo.png` | Chapter wordmark (title screen, share card) |
| `public/brand/gdgoc-au-full.png`, `gdgoc-au-art.png` | AU building artwork (desktop sidebar) |
| `src/app/icon.png`, `apple-icon.png` | Favicon and home-screen icon (GDG chevrons) |

There is no recorded video: Level 4 opens with an Instagram-style story starring the council (5 slides,
tap to skip, hold to pause), so nothing has to be filmed.

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

### 3.2 Service account (server access)

1. **Project settings → Service accounts → Generate new private key**. A JSON file downloads.
2. In Vercel add **one** variable, `FIREBASE_SERVICE_ACCOUNT`, and paste the **whole JSON file** as its value.
   (Alternative: the three variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
   Quotes, `\n` or real line breaks are all accepted.)
3. Never commit the JSON file. `.env*` files are already git-ignored (except `.env.example`).
4. Open `https://<your-domain>/api/health` after deploying: `"firebaseAdmin": "ok"` means the key works.
   It shows only yes/no and counts, never secret values.

### 3.3 Security rules (lock the database)

Browsers never talk to Firestore. Candidates go through `/api/apply`; admins through `/api/admin/*`, which
checks the Google sign-in and role on every request and then uses the Admin SDK. So the rules simply deny
everything from browsers. Publish `firestore.rules` once: Firebase console → Firestore → Rules → paste → Publish,
or:

```bash
npx firebase login
npx firebase use --add          # pick your project
npm run deploy:rules
```

No indexes are needed.

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
#   domains: technical | marketing_partnerships | creatives | media | ops

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
| 0 Press Start | Sumaiya + Ahmed | Title screen with the 3D AU building. Returning players get "Continue from Level N" |
| 1 Welcome to GDG | Sumaiya → Ahmed | 3 swipeable cards (mentions baithaqs), then the handover to Ahmed |
| 2 Meet the Council | Ahmed | 3 equal flip cards: Sumaiya (👑 President), Ahmed (⭐ Your Guide), Rafay (📜 Gen Sec) |
| 3 Build your Character | Abdul Rafay | Personal info, department with tap-to-fill suggestions. Each valid field unlocks an avatar part |
| 4 Choose your House | Ahmed | Council intro story, 5 doors (teams), the position they're applying for, optional skills |
| 5 Your Story | Ahmed + Sumaiya | Experience, achievements, why GDGOC AU, up to 4 portfolio links, quick taps |
| 6 Boss Check | Abdul Rafay | 2 MCQs, just for fun (score stored, not used for selection) |
| 7 Review + Loot | All 3 | Character sheet, consent, Turnstile, submit, confetti, shareable 1080x1920 card |

- **Progress** is saved to `localStorage` (every access is wrapped in try/catch) and cleared after a successful submit.
- **Speed mode** (top right) skips typing animations, transitions and story autoplay. `prefers-reduced-motion` does the same.
- **The character is always visible** while filling the form: in the top bar on phones, in the sidebar on desktop.
  Tap it and it jumps.
- **Portfolio links:** up to 4, any of GitHub, LinkedIn, Behance, Dribbble, Instagram, YouTube, Drive/Docs or any
  other link. Handles work (`@name` on Instagram becomes `https://www.instagram.com/name`), bare domains get
  `https://`, and a pasted link switches to the right type by itself. Each team shows its most useful types first.
- **Avatar layers:** name → face, email → lanyard, roll no → jersey number, phone → sneakers, semester → Lvl badge,
  department → jersey color, house → emblem, team role → accessory.
- **Duplicate roll numbers:** the API uses Firestore `create()` on `applications/{rollNo}`, so a second attempt
  gets "Is roll no se already apply ho chuka hai…" plus a WhatsApp button.
- **Department** is free text (candidates write it themselves); `departmentSuggestions` in `content.ts` only
  powers autocomplete. The admin Department filter matches by "contains".
- **Deadline is optional.** Leave `NEXT_PUBLIC_APPLICATIONS_DEADLINE` empty and applications stay open.
  Once set and passed, the quest shows "Quest closed" and the API returns 403.

### Admin

`/admin` signs in with Google, then calls the server:

| Endpoint | What |
|---|---|
| `GET /api/admin/me` | Who am I? Grants the role from `ADMIN_CORE_EMAILS` / `ADMIN_LEAD_EMAILS` on first sign-in |
| `GET /api/admin/applications` | Applications with their ratings (leads: their team only). After the first load the page asks only for what changed (`?since=`) every 45s, so it costs a handful of reads instead of the whole collection |
| `POST /api/admin/status` | Shortlist / reject / select (with the position given), records who did it |
| `POST /api/admin/review` | Your own rating + notes |
| `GET /api/admin/backup` | Full JSON backup download (button in the admin header) |

If access fails, the page shows the exact reason and a live setup check.

### Data safety

- Nobody can read, change or delete applications from a browser; the rules deny all direct access.
- Applications are create-only. Even admins can only change status, the assigned position and their own review.
  Every status change stores `statusBy`.
- **Take a backup** now and then with "⬇ Full backup (JSON)" in `/admin`, plus "Export CSV" for spreadsheets.
- **Turn on delete protection** once: Firebase console → Firestore → Settings → Delete protection. Then the
  database itself can't be deleted by accident.
- Firestore's scheduled backups and point-in-time recovery need the paid Blaze plan. Worth turning on if you upgrade.
- The website and the data are separate. If Vercel has an outage or a bad deploy, the data in Firestore is untouched,
  and candidates' half-filled answers stay saved in their browser until a submit succeeds.

### Reliability under load

Tested against the emulator with 350 submissions fired at the same instant: 0 errors, exactly one saved
application per roll number.

- The quest page is static and served from Vercel's CDN, so traffic spikes don't hit a server.
- Each submission is one serverless call and one Firestore `create()`. Vercel runs as many copies as needed,
  and different roll numbers never touch the same document, so there is no contention.
- Two different people racing for the same roll number: exactly one wins, the other gets the duplicate message.
- The same person submitting twice (double tap, weak signal, lost response): both attempts show success and
  only one application is stored.
- Brief Firestore hiccups are retried on the server (3 tries with backoff). If the daily free quota is ever hit,
  candidates see "too many people right now, try again in a few minutes" instead of an error, and nothing they
  typed is lost. The browser gives up after 30 seconds so nobody is stuck on a spinner.
- **Free (Spark) plan limits:** 20,000 writes and 50,000 reads per day. A submission is 1 write; admin use is
  a few reads per refresh. That's thousands of applications a day of headroom.

### Submission API checks, in order

body size → honeypot → deadline → Zod (`src/lib/schema.ts`, shared with the UI) → Turnstile → `create()` (with retries) → email (after response)

### Data model

```
applications/{rollNo}
  fullName, email, rollNo, phone, semester, department, domain, position, skillTags[],
  experience, achievements, whyJoin, links[{kind, url}], teamRole, hoursPerWeek, excitedAbout[], funFact,
  quizScore, timeTakenSec, status, assignedPosition, statusBy, createdAt, updatedAt,
  ratings{reviewerUid: {rating, notes, reviewerName, reviewerEmail, updatedAt}}   ← copy of reviews for cheap reads
applications/{rollNo}/reviews/{reviewerUid}
  rating (1-5), notes, createdAt, updatedAt, domain, rollNo, reviewerName, reviewerEmail
```

`status`: `submitted` | `shortlisted` | `rejected` | `selected`

Applications from before multiple links have a single `portfolioUrl` instead of `links`; the admin panel and CSV
show both.

**Teams and positions** (edit in `src/content.ts` → `domains`):

| Team (`domain`) | Positions |
|---|---|
| Technical (`technical`) | Lead, Co-lead, Member |
| Marketing & Partnerships (`marketing_partnerships`) | Lead, Co-lead, Member |
| Creatives (`creatives`) | Photographer, Videographer, Graphics |
| Media (`media`) | Lead, Member |
| Operations (`ops`) | Lead, Co-lead, Member |

Candidates pick the position they're applying for. When you Select someone in `/admin`, you choose the
position they get (`assignedPosition`), so a Lead applicant can be selected as Co-lead or Member.

### Performance notes

- The title screen ships about 197 KB of gzipped JS on phones (around 60% is the React/Next runtime). Each level's code
  loads on demand, and the next level is pre-fetched in the background. Zod loads with Level 3.
- The Three.js scene on the title screen loads only after the page is idle, only on capable devices
  (≥4 cores, ≥3 GB RAM, WebGL), never with Save-Data / 2G or reduced motion; everyone else sees an SVG.
  It pauses when off-screen or the tab is hidden.
- Firebase (auth only) loads only on `/admin`; html-to-image and confetti load on demand;
  Turnstile loads only on Level 7.
- The Level 4 intro story is plain HTML and CSS (no video download).
- Outfit is self-hosted via `next/font`. Team photos go through `next/image`.

## 5. Project layout

```
src/
  content.ts                 all candidate copy + editable data
  lib/schema.ts              shared Zod schema (client + API)
  lib/quick.ts, lib/links.ts Zod-free checks and link helpers (keep the first load small)
  lib/storage.ts             localStorage that never throws
  lib/firebaseClient.ts      web SDK (admin sign-in only)
  lib/server/                Admin SDK, admin auth + allowlist, Turnstile verify, Resend email
  app/page.tsx               the quest
  app/admin/page.tsx         admin panel
  app/api/apply/route.ts     submission endpoint
  app/api/admin/*            admin endpoints (me, applications, status, review, backup)
  app/api/health/route.ts    setup check (yes/no and counts only)
  components/quest/          levels, avatar, NPC chat, HUD, intro story, 3D hero, share card, Turnstile
  components/admin/          dashboard, drawer, stats, CSV
  components/ui/             buttons, fields, chips
scripts/set-claims.ts        grant core/lead access
scripts/seed-emulator.ts     fake data for the local emulator
firestore.rules              security rules
firestore.indexes.json       reviews collection-group field setting
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
