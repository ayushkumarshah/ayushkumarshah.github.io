# Diet & Fitness Companion — Design Spec

**Date:** 2026-07-10
**Status:** Approved design, pending implementation plan
**Owners:** Ayush + Simran (two users)

## Problem

Ayush and Simran keep a detailed diet, fitness, and daily-schedule plan in a
Google Sheet. They want a fast, phone-friendly way to:

- See **what's happening now and what's next** during the day.
- Get **reliable timed reminders** ("gym now", "eat breakfast", "leave for office").
- Look at the **diet schedule to prepare food** and do **weekly meal prep**.
- **Check off** what they actually did each day, and see each other's progress.

The Sheet stays their source of truth; they will keep editing it directly.

## Verdict: PWA + calendar subscription (not a native app)

A native iOS app was considered because reminders are a must-have and both users
are on iPhone. It was rejected:

- **Cost/maintenance:** free-signed local builds expire every 7 days (requiring a
  Mac + both phones to re-sign), and the only way off that treadmill is a $99/yr
  Apple Developer account. Expo Go doesn't rescue this — recent Expo versions
  removed notification support from Expo Go.
- **Reminders don't need an app.** The schedule is fixed and repeats weekly, so
  reminders are delivered as a **calendar subscription (`.ics`)**. iOS Calendar
  then fires native, offline, reliable alerts with no push server — more reliable
  than a hand-rolled native notification setup, and zero maintenance.

Chosen approach: an installable **PWA** for the rich experience + an
auto-generated **`.ics` feed** for reminders. Plays to the owner's web skills,
costs nothing, updates instantly for both phones from one URL.

## Architecture

```
SOURCE   Google Sheet — schedule tabs + a hidden "Log" tab   (edited normally)
            |
BACKEND  Google Apps Script  (bound to the sheet, deployed as a web app,
            |                  runs as the owner so the sheet stays PRIVATE)
            |   -> JSON API      : parsed schedule for the app
            |   -> .ics feed      : weekly recurring events + alerts
            |   -> Log read/write : daily check-off sync
            |
APP      PWA (static site, free hosting)  +  iPhone Calendar subscribes to .ics
```

### Components

1. **Google Sheet (source of truth)**
   - Existing human-readable schedule tabs (Ayush + Simran side-by-side, four
     day-types: Office Mon/Tue/Wed, WFH Thu/Fri, Saturday, Sunday), the weekly
     gym split, the "Key Notes & Principles" block, and the referenced
     *Simran – Diet* and *Simran – Exercise & Yoga* tabs.
   - A new **hidden "Log" tab**: append-only rows of check-off events
     (`timestamp, date, person, itemId, itemLabel, done`).

2. **Google Apps Script (only backend, free)**
   - Deployed as a web app, "execute as me", so the private sheet is readable
     without making it public or building OAuth.
   - `doGet()` → **JSON API**: the parsed, normalized schedule (see Data Model).
   - `doGet(format=ics)` → **`.ics` feed**: one calendar per person (or a
     combined feed), weekly-recurring `VEVENT`s per timeline item, each with a
     `VALARM` at start time. Details/food go in the event description.
   - `doGet(action=log&date=…)` → returns the day's check-off rows.
   - `doPost()` → appends a check-off event to the Log tab.
   - **Parser** (the core engineering): walks the sheet by its section headers
     (e.g. `AYUSH — OFFICE DAY (Mon/Tue/Wed)`), splits the Ayush/Simran columns,
     and emits normalized events. Assigns each event a **stable ID**
     (`daytype:person:time:activitySlug`) so check-offs attach reliably even as
     rows shift.

3. **PWA (static site, hosted as a subfolder of the existing site)**
   - Lives at **`shahayush.com/health/`** — a static subfolder of the current
     Jekyll / GitHub Pages site (same pattern as the `gradtrip` / `seattle` /
     `cali` micro-sites). Inherits the site's HTTPS (via CloudFlare).
   - Fetches the JSON, renders the four tabs, caches for offline use, and is
     installable to the home screen (manifest + service worker).
   - Determines "today's day-type" from the current weekday and shows the right
     schedule; highlights the current/next item by wall-clock time (local TZ).
   - See **Hosting & deployment** for the subfolder constraints.

4. **iPhone Calendar subscription**
   - Each user adds the `.ics` URL once (Settings → Calendar → Add Subscribed
     Calendar). Native alerts thereafter; updates propagate when the feed changes.

## Screens (four-tab bottom nav)

- **🏠 Home** — person-focused **Now + Next**. A `You / Simran / Both` switcher;
  "Both" renders the two-column side-by-side view. Current item shows a countdown;
  up-next items follow. Today's items are **checkable**; ticks sync via the Log
  tab, so the "Both" view reflects each other's progress. Check-offs reset daily
  (keyed by date).
- **🍽️ Food** — two modes:
  - *Today:* each meal with its detail from the Sheet + a running **protein /
    calorie tally** vs target (Ayush 150g, Simran 100–130g).
  - *Meal prep:* the app scans the upcoming office days and **aggregates**
    repeated meals into a batch-cook list + a **checkable grocery list**.
- **🏋️ Gym** — the weekly split and today's workout, **per person** (pulls in
  Simran's toning circuit and back-safe yoga from her tabs).
- **📋 Rules** — the principles block (protein targets, 3L hydration, cheat day,
  meal-prep rule, knee care) + a one-time **"Subscribe to reminders"** button
  exposing each person's `.ics` link.

## Data flow

1. User opens the PWA → it `GET`s the JSON API (served from cache first, then
   revalidated) and the day's check-off log.
2. App computes day-type + current/next items and renders the active tab.
3. Ticking an item → `POST` to the Apps Script → appended to the Log tab → local
   state updates optimistically.
4. Reminders are independent: iPhone Calendar polls the subscribed `.ics` feed
   and fires alarms with no app involvement.

## Error handling

- **Backend unreachable / offline:** PWA serves last-cached schedule and shows a
  "showing saved copy" banner. Check-offs queue locally and retry on reconnect.
- **Parse failure (sheet layout drifted):** the Apps Script validates expected
  section headers; on mismatch it returns a structured error the app surfaces as
  "couldn't read the sheet — check the layout", rather than rendering garbage.
- **Check-off write fails:** optimistic tick is kept locally and retried; a small
  indicator shows unsynced items.
- **Reminders:** entirely on the calendar layer; failure there is a normal iOS
  Calendar subscription issue, independent of the app.

## Hosting & deployment

The app is hosted as a **single `/health/` subfolder** of the existing Jekyll /
GitHub Pages site (`shahayush.com/health/`). Everything discussed lives under
that one path. Implications baked into the build:

- **Base path = `/health/`.** All asset URLs, the service-worker registration
  scope, and the manifest `start_url` / `scope` are prefixed with `/health/`.
- **No server-side routing.** GitHub Pages has no SPA fallback, so the four tabs
  are **in-page state** (no distinct URLs to deep-link/refresh into). Optional:
  hash routes (`#food`) if shareable tab links are ever wanted. This avoids 404s
  on refresh entirely.
- **`noindex`.** A `robots`/`noindex` meta tag keeps the app off search engines,
  and it is not linked from the portfolio. (The access token ships in client JS
  regardless of host, so this reduces discoverability, not a real access barrier
  — acceptable for low-sensitivity personal data.)
- **Jekyll pass-through.** The built app files are committed into the repo and
  must be served untouched by Jekyll (same as the existing micro-site folders).
  Deploying the app therefore means rebuilding/pushing the site.
- **Backend is unaffected.** The Apps Script API, `.ics` feed, and calendar
  subscription are cross-origin to Google's servers regardless of where the
  front-end lives; subfolder hosting changes nothing about them (including CORS,
  which must be handled the same way in either hosting model).

## Security / privacy

- Data is personal but low-sensitivity. The Apps Script endpoints are reachable by
  anyone with the URL, so requests carry a **shared secret token**; requests
  without it are rejected. The token lives in the PWA config and the calendar URL.
- The Google Sheet itself remains **private** (never shared publicly); only the
  Apps Script (running as the owner) reads it.

## Testing

- **Parser unit tests:** feed representative sheet snapshots (each day-type, both
  people, the Simran tabs, edge cases like blank cells / cheat day) and assert the
  normalized events, including stable IDs.
- **`.ics` validation:** assert one recurring VEVENT per timeline item with a
  correct start time, weekday recurrence, and VALARM; validate against an iCal
  parser.
- **Day-type / now-next logic:** given a mock clock, assert the correct day-type
  and the correct current/next item at various times.
- **Meal-prep aggregation:** assert repeated meals across office days roll up into
  the expected batch-cook and grocery lists.
- **App smoke test:** load with a fixture JSON, confirm each tab renders and
  check-off POSTs the right payload.

## Out of scope (YAGNI)

- Full history, charts, weight-trend tracking (a possible future project).
- In-app editing of the schedule (the Sheet is the editor).
- Native iOS/Android app.
- Multi-user beyond Ayush + Simran; accounts/login (the shared token suffices).

## Open implementation decisions (for the planning phase)

- **Front-end stack:** plain HTML/CSS/JS + a light framework vs. a small build
  (e.g. Vite). To be chosen in the plan; keep it minimal, and note it must emit a
  `/health/`-based build with the service worker and manifest scoped accordingly.
- **Check-off granularity:** every timeline row checkable vs. a curated daily-goal
  set (walk, gym, water, protein, sleep). Lean toward checkable timeline rows with
  a small daily-goals summary; finalize during implementation.
