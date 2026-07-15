# Health Companion — 2-Person Login + "Saanu" Rename Design Spec

**Date:** 2026-07-15
**Status:** Approved design, pending implementation plan
**Builds on:** the live `/health` app (Apps Script backend `health-backend/` + PWA `health/`)

## Problem

The `/health` app is currently public: the API token ships in `config.js`, so
anyone who finds the URL can read the schedule. Ayush + Saanu want the app
**private to just the two of them** — a simple username/password login, no
signups — and want **no personal information (names, data, token) served to an
unauthenticated visitor**. Separately, "Simran" should display as **"Saanu"**
throughout the app.

## Goals / non-goals

- **Goal:** nothing personal is served until a valid login. A visitor to
  `/health` sees only a generic login form; the page source reveals no names, no
  token, no data.
- **Goal:** login *is* identity — logging in as `ayush` or `saanu` sets who
  "You" is and defaults to that person's schedule. It replaces the current
  per-device "who am I?" picker.
- **Goal:** "Simran" shows as "Saanu" everywhere, without editing the sheet.
- **Non-goal:** signups, password reset UI, >2 users, per-session/expiring
  tokens, account lockout. (Password change = re-run the setup helper.)
- **Path stays `/health`** (login is the protection; an obscure path adds
  nothing).

## Auth model (real backend auth)

The site is static (GitHub Pages), so the **Apps Script backend** is the auth
authority. Credentials live server-side; the client gets a token *only after*
a valid login.

```
Visitor → /health → generic login form (no names, no token in the page)
  │  username + password
  ▼
Apps Script doPost {action:"login"} → verify hashed password (Script Properties)
  │  on success
  ▼
{ token, person, name, people, rename }  → stored as a localStorage session
  │
  ▼
App loads; data/ics calls use the session token (unchanged endpoints)
```

## Backend (Apps Script) changes

1. **Accounts map** (in `Code.js`, not secret — usernames→person only, no
   passwords): `ACCOUNTS = { ayush: {person:"ayush", name:"Ayush"}, saanu:
   {person:"simran", name:"Saanu"} }`. Note `saanu`→data person key `simran`
   (the sheet's Simran columns are unchanged).
2. **Password storage:** one Script Property per user, `USER_ayush` /
   `USER_saanu`, value = hex **SHA-256** of `SALT + password`, where `SALT` is a
   fixed constant in `Code.js` (server-side only — `Code.gs` is never served to
   the browser). Passwords are never stored plaintext and never sent to the
   client.
3. **Setup helper** `setUser(username, password)` (run once per person in the
   editor): computes the hash via
   `Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, SALT + password)`
   and writes `USER_<username>`.
4. **Login endpoint** — `doPost` handles `action:"login"` with body
   `{username, password}` (Content-Type `text/plain`, per CORS): look up
   `ACCOUNTS[username]`; hash the password and compare to `USER_<username>`. On
   match return
   `{ ok:true, token:<API_TOKEN>, person, name, people:{ayush:"Ayush",
   simran:"Saanu"}, rename:{"Simran":"Saanu"} }`; otherwise
   `{ ok:false, error:"invalid" }`. Always return the same `invalid` for
   unknown-user and bad-password (no user enumeration).
5. **Data/ics/log endpoints unchanged** — they still require the `token`; the
   token is simply no longer public (only issued by login).
6. **Rotate the API token** during rollout: the current token is already public
   in git history, so set a fresh `API_TOKEN` Script Property as part of this
   change.

## Front-end changes

1. **`config.js`** holds only `EXEC_URL` — **no token, no names, no
   PERSON_LABELS.**
2. **Login screen** (in `app.js`): a generic overlay with username + password +
   submit + an error line. No names, no autofill of usernames. On submit →
   `api.login(username, password)`; on `ok` store the session and load; on
   failure show "Invalid username or password."
3. **Session** (`api.js`): `login()`, plus `getSession()/setSession()/
   clearSession()` over `localStorage["health.session"]` =
   `{token, person, name, people, rename}`. `fetchSchedule/fetchLog/postCheckoff`
   use `getSession().token` (not `CONFIG.API_TOKEN`). Any `{error:"unauthorized"}`
   → `clearSession()` → show login.
4. **Login = identity:** remove the per-device "who am I?" picker and the
   hardcoded `NAMES` map. `state.person` and the display names come from the
   session. Switcher labels: "You" for `session.person`, `session.people[other]`
   for the other; the app still lets a logged-in user view the other person /
   Both (it's a shared plan).
5. **Saanu rename:** a pure `applyRename(data, renameMap)` pass runs once after
   `fetchSchedule` and rewrites `renameMap` keys ("Simran"→"Saanu") in every
   event's `activity/details/notes`, the gym `focusAyush/focusSimran`, and the
   principles text. Rendering is otherwise unchanged. The map comes from the
   authed login response, so no names live in the static files.
6. **Logout:** a button in the Rules tab → `clearSession()` → reload → login
   screen.
7. **Service worker:** bump the cache version (so clients pick up the new
   shell); it must still cache only the shell and never the authed backend calls
   (already the case). The login screen renders from the cached shell offline,
   but data requires network + a valid token (fine).

## Data flow

1. Boot → `getSession()`? If absent/invalid → render login screen. Else apply
   session (person, names, rename) → `loadData`.
2. Login submit → `POST action:login` → on ok, store session → `loadData`.
3. `loadData` → `fetchSchedule` (session token) → `applyRename` → render;
   `fetchLog(today)` → reconcile check-offs.
4. Check-off → `postCheckoff` (session token). Any `unauthorized` →
   `clearSession` → login.

## Error handling

- **Bad credentials:** login returns `{ok:false, error:"invalid"}`; UI shows a
  generic message; no session stored.
- **Unauthorized data call** (e.g., token rotated while a stale session
  exists): endpoints return `{error:"unauthorized"}`; the client clears the
  session and shows login.
- **Offline:** the login shell loads from cache; a login attempt while offline
  fails the fetch → show "Can't reach server — check connection." An
  already-authenticated session still shows the last cached schedule (existing
  offline behavior).
- **Backend login parse error:** malformed body → `{ok:false, error:"invalid"}`.

## Security notes / tradeoffs

- Passwords: SHA-256 + salt, server-side only. (Not bcrypt — Apps Script lacks
  it; acceptable for 2 users with strong passwords over HTTPS.)
- The issued token is the existing **shared static token**, stored in a
  logged-in device's `localStorage`. Non-users never receive it. If a device is
  lost, rotate the token + re-issue on next login. (Per-session tokens are
  out of scope.)
- No user enumeration (uniform `invalid`), all traffic over HTTPS.
- Brute-force: negligible for 2 accounts with decent passwords; no lockout
  (YAGNI). Could add later if wanted.
- The `.ics` calendar-subscription URL still carries the token (shown only
  post-login); once added to a phone's Calendar it lives in that subscription —
  same accepted tradeoff as today.

## Testing

- **Backend (pure, vitest):** `accountFor(username)` mapping and
  `buildLoginResponse(account, token)` shape. The SHA-256 hash compare uses
  Apps-Script-only `Utilities`, so it's verified via a manual login (a
  `verifyBackend`-style check), not unit-tested.
- **Front-end (pure, vitest):** `applyRename(data, map)` (Simran→Saanu across
  events/gym/principles); session get/set/clear over a `localStorage` stub;
  `login()` and the token-from-session wiring in `api.js` with a `fetch` stub;
  `fetchSchedule` sending the session token and handling `unauthorized`.
- **Manual/browser:** visitor sees generic login (view-source shows no names/
  token); wrong password rejected; correct login loads the right person; "Saanu"
  shown everywhere; logout returns to login; token rotation forces re-login.

## Rollout

1. Backend: add accounts + login + `setUser` to `Code.js`; `clasp push` + new
   deployment version; run `setUser("ayush", …)` and `setUser("saanu", …)`;
   **rotate `API_TOKEN`**.
2. Front-end: strip token/names from `config.js`; add login + session + rename;
   bump SW cache; deploy via git push.
3. Verify end-to-end on both phones; re-add to Home Screen if needed.

## Out of scope (YAGNI)

Signups, password-reset UI, >2 users, expiring/per-session tokens, account
lockout/rate-limiting, and the deferred **weight + exercise-history logging**
feature (separate spec later).
