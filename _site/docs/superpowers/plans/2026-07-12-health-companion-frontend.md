# Health Companion — Front-End (PWA) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the installable `/health/` PWA that reads the backend JSON, shows each person's live "now / next" schedule, meals + meal-prep, gym, and rules, and lets each person check off today's items (synced via the backend Log tab).

**Architecture:** A build-free, vanilla HTML/CSS/JS app served as a static subfolder of the existing Jekyll/GitHub Pages site at `shahayush.com/health/`. Pure logic (day-type resolution, now/next, macro totals, meal-prep aggregation) lives in dual-runtime modules under `health/js/` — loaded by `<script>` in the browser AND `require`d by vitest in a separate Jekyll-excluded `health-frontend/` test project. A thin browser-only layer (`api.js`, `app.js`) does `fetch` + DOM rendering. A service worker caches the shell and last JSON for offline use.

**Tech Stack:** Vanilla JS (ES2019, no bundler), HTML, CSS, Service Worker + Web App Manifest; vitest (dev-only) for the pure modules.

## Global Constraints

Apply to **every** task. Copy names/values verbatim.

- **No build step.** Files under `health/` are served as-is by GitHub Pages. Use **relative** asset paths in `index.html` (`href="app.css"`, `src="js/app.js"`) so nothing depends on the `/health/` prefix. Never use absolute `/…` paths for app assets.
- **Dual-runtime pure modules.** Every file in `health/js/` that holds testable logic ends with `if (typeof module !== "undefined" && module.exports) { module.exports = { … }; }` and defines plain global functions (no ESM `import`/`export`). Browser-only files (`api.js`, `app.js`) may skip the guard.
- **Test project is CommonJS + vitest globals.** `health-frontend/` mirrors the backend: no `"type":"module"`, `vitest.config.mjs` with `{ test:{ globals:true } }`, tests `require("../../health/js/<mod>.js")` and use `describe/it/expect` without importing vitest.
- **JSON contract consumed (produced by the backend, do not change):**
  ```js
  Schedule = { office:{ayush:Event[],simran:Event[]}, wfh:{…}, saturday:{…}, sunday:{…} }
  ParseResult = { schedule:Schedule, gym:{day,focusAyush,focusSimran,type}[], principles:{topic,guideline}[] }
  Event = { id, person:"ayush"|"simran", dayType:"office"|"wfh"|"saturday"|"sunday",
            time:"HH:MM", timeLabel, minutes:Number, activity, details, notes,
            kind:"workout"|"walk"|"meal"|"wake"|"sleep"|"drive"|"rest"|"other",
            together:Boolean, calories:Number|null, protein:Number|null }
  LogRow = { timestamp, date:"YYYY-MM-DD", person, itemId, itemLabel, done:Boolean }
  ```
- **Backend endpoints (config-driven):** `GET  {EXEC_URL}?token={TOKEN}` → ParseResult; `GET {EXEC_URL}?token={TOKEN}&action=log&date=YYYY-MM-DD` → `{rows:LogRow[]}`; `POST {EXEC_URL}` with `Content-Type: text/plain` body `{token,date,person,itemId,itemLabel,done}` → `{ok:true}`; `GET {EXEC_URL}?token={TOKEN}&format=ics&person=ayush|simran` → iCal.
- **CORS rule:** GET uses normal `fetch`. POST MUST set `Content-Type: text/plain` (a "simple request" — avoids the CORS preflight Apps Script can't answer). Never send `application/json` on the POST.
- **Weekday → day-type:** `0(Sun)→sunday, 1→office, 2→office, 3→office, 4→wfh, 5→wfh, 6(Sat)→saturday`.
- **Protein targets (for progress bars):** `{ ayush: 150, simran: 120 }` (grams).
- **Office weekdays per week (for meal-prep counts):** `3` (Mon/Tue/Wed).
- **Person/day-type keys:** exactly `ayush`/`simran` and `office`/`wfh`/`saturday`/`sunday`.
- **Discoverability:** `index.html` includes `<meta name="robots" content="noindex">`. The app is not linked from the portfolio.

### File structure

Served app (under `health/`, all relative paths):
- `health/index.html` — app shell: header, tab bar, four `<section>` panels, `<script>` tags.
- `health/app.css` — all styles (theme-aware).
- `health/config.js` — `window.CONFIG = { EXEC_URL, API_TOKEN, PERSON_LABELS }`. **Committed** (must be, to be served; token is already public in client JS).
- `health/js/schedule.js` — pure: `dayTypeForWeekday`, `nowNext`, `proteinTotal`, `calorieTotal`, `PROTEIN_TARGET`, `WEEKDAY_DAYTYPE`.
- `health/js/mealprep.js` — pure: `mealPrepRollup`, `extractIngredients`, `groceryList`, `OFFICE_DAY_COUNT`.
- `health/js/api.js` — browser-only: `cacheGet`/`cacheSet` (pure, testable) + `fetchSchedule`, `fetchLog`, `postCheckoff`.
- `health/js/app.js` — browser-only: state, tab switching, rendering, check-off handlers.
- `health/manifest.webmanifest` — PWA manifest (scoped to `./`).
- `health/sw.js` — service worker (cache shell + last JSON).
- `health/icons/icon-192.png`, `health/icons/icon-512.png` — app icons.

Dev/test tooling (Jekyll-excluded, git-ignored node_modules):
- `health-frontend/package.json`, `health-frontend/vitest.config.mjs`
- `health-frontend/test/schedule.test.js`, `health-frontend/test/mealprep.test.js`, `health-frontend/test/api.test.js`

Repo config:
- `_config.yml` — add `health-frontend` to `exclude:` (keep `health` served). `.gitignore` — add `health-frontend/node_modules/`.

---

### Task 1: Front-end scaffold (served shell + test project + Jekyll config)

**Files:**
- Create: `health/index.html`, `health/app.css`, `health/config.js`, `health/js/.gitkeep`
- Create: `health-frontend/package.json`, `health-frontend/vitest.config.mjs`, `health-frontend/test/smoke.test.js`, `health-frontend/.gitignore`
- Modify: `_config.yml` (add `health-frontend` to `exclude:`), repo-root `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: a served shell that opens in a browser, and a working `npm test` in `health-frontend/`. `window.CONFIG` is defined for later tasks.

- [ ] **Step 1: Create the served shell `health/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#0e1116">
  <title>Health</title>
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <header class="topbar">
    <div id="dayLabel" class="day-label">—</div>
    <div class="person-switch" id="personSwitch">
      <button data-person="ayush" class="on">You</button>
      <button data-person="simran">Simran</button>
      <button data-person="both">Both</button>
    </div>
  </header>

  <main>
    <section id="tab-home" class="panel on"></section>
    <section id="tab-food" class="panel"></section>
    <section id="tab-gym" class="panel"></section>
    <section id="tab-rules" class="panel"></section>
  </main>

  <nav class="tabbar" id="tabbar">
    <button data-tab="home" class="on"><span>🏠</span>Home</button>
    <button data-tab="food"><span>🍽️</span>Food</button>
    <button data-tab="gym"><span>🏋️</span>Gym</button>
    <button data-tab="rules"><span>📋</span>Rules</button>
  </nav>

  <div id="banner" class="banner" hidden></div>

  <script src="config.js"></script>
  <script src="js/schedule.js"></script>
  <script src="js/mealprep.js"></script>
  <script src="js/api.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `health/app.css`**

```css
:root { --bg:#f5f6f8; --card:#fff; --fg:#1a1f2b; --muted:#6b7280; --accent:#3b82f6; --accent2:#a855f7; --ok:#22c55e; --line:#e5e7eb; }
@media (prefers-color-scheme: dark) { :root { --bg:#0e1116; --card:#161b24; --fg:#e7eaf0; --muted:#8b93a3; --line:#222836; } }
* { box-sizing:border-box; }
html,body { margin:0; padding:0; background:var(--bg); color:var(--fg);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
body { padding-bottom:70px; }
.topbar { position:sticky; top:0; z-index:5; background:var(--bg); padding:10px 14px calc(10px + env(safe-area-inset-top));
  display:flex; align-items:center; justify-content:space-between; gap:10px; border-bottom:1px solid var(--line); }
.day-label { font-size:13px; color:var(--muted); font-weight:600; }
.person-switch { display:flex; gap:4px; }
.person-switch button { border:none; background:var(--card); color:var(--muted); font-size:12px; padding:6px 10px; border-radius:8px; }
.person-switch button.on { background:var(--accent); color:#fff; font-weight:600; }
main { padding:14px; }
.panel { display:none; }
.panel.on { display:block; }
.card { background:var(--card); border-radius:14px; padding:12px 14px; margin-bottom:10px; border:1px solid var(--line); }
.now { color:#fff; }
.now.you { background:linear-gradient(135deg,#1e3a8a,#3b82f6); border:none; }
.now.her { background:linear-gradient(135deg,#6d28d9,#a855f7); border:none; }
.lbl { font-size:10px; letter-spacing:.06em; text-transform:uppercase; opacity:.85; }
.act { font-size:18px; font-weight:700; margin:2px 0; }
.det { font-size:12px; color:var(--muted); line-height:1.4; }
.now .det { color:rgba(255,255,255,.9); }
.count { font-size:11px; margin-top:6px; opacity:.9; }
.row { display:flex; gap:8px; }
.col { flex:1; min-width:0; }
.item { display:flex; align-items:flex-start; gap:8px; padding:8px 0; border-bottom:1px solid var(--line); }
.item:last-child { border-bottom:none; }
.item .t { font-size:11px; color:var(--muted); width:64px; flex-shrink:0; }
.item .a { font-size:13px; font-weight:600; }
.item.done .a { text-decoration:line-through; opacity:.55; }
.check { width:22px; height:22px; border-radius:6px; border:2px solid var(--line); flex-shrink:0; background:transparent; }
.check.on { background:var(--ok); border-color:var(--ok); }
.prog { height:6px; background:var(--line); border-radius:3px; overflow:hidden; margin-top:4px; }
.prog > div { height:100%; background:var(--ok); }
.seg { display:flex; gap:4px; margin-bottom:10px; }
.seg button { flex:1; border:none; background:var(--card); color:var(--muted); font-size:12px; padding:7px 0; border-radius:8px; }
.seg button.on { background:var(--accent); color:#fff; font-weight:600; }
.tabbar { position:fixed; left:0; right:0; bottom:0; display:flex; background:var(--card); border-top:1px solid var(--line);
  padding-bottom:env(safe-area-inset-bottom); }
.tabbar button { flex:1; border:none; background:none; color:var(--muted); font-size:10px; padding:8px 0 10px; }
.tabbar button span { display:block; font-size:18px; }
.tabbar button.on { color:var(--accent); }
.banner { position:fixed; bottom:74px; left:14px; right:14px; background:#7c2d12; color:#fff; font-size:12px;
  padding:8px 12px; border-radius:10px; text-align:center; }
h2 { font-size:15px; margin:4px 0 10px; }
button { cursor:pointer; font-family:inherit; }
```

- [ ] **Step 3: Create `health/config.js` (placeholder values; the user sets real ones at deploy)**

```js
// Set EXEC_URL and API_TOKEN to your deployed Apps Script web-app values.
// NOTE: this token is served publicly with the app — use a dedicated, rotatable token.
window.CONFIG = {
  EXEC_URL: "REPLACE_WITH_APPS_SCRIPT_EXEC_URL",
  API_TOKEN: "REPLACE_WITH_API_TOKEN",
  PERSON_LABELS: { ayush: "You", simran: "Simran" }
};
```

- [ ] **Step 4: Create `health/js/.gitkeep`** (empty file, so the dir exists before Task 2)

```
```

- [ ] **Step 5: Create the test project files**

`health-frontend/package.json`:
```json
{
  "name": "health-frontend",
  "version": "0.1.0",
  "private": true,
  "engines": { "node": ">=18" },
  "scripts": { "test": "vitest run", "test:watch": "vitest" },
  "devDependencies": { "vitest": "^2.1.0" }
}
```

`health-frontend/vitest.config.mjs`:
```js
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { globals: true } });
```

`health-frontend/.gitignore`:
```
node_modules/
```

`health-frontend/test/smoke.test.js`:
```js
describe("toolchain", () => {
  it("runs vitest", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 6: Jekyll + git config**

In `_config.yml`, add `health-frontend` to the top-level `exclude:` list (keep every existing entry; do NOT exclude `health` — it must be served):
```yaml
exclude:
  - health-frontend
```
In the repo-root `.gitignore`, append:
```
health-frontend/node_modules/
```

- [ ] **Step 7: Install + smoke test + open the shell**

Run:
```bash
cd health-frontend && npm install && npm test
```
Expected: `1 passed`.
Then open `health/index.html` in a browser (double-click or `open health/index.html`). Expected: header with day label + You/Simran/Both, empty panels, bottom tab bar. Console may warn about the manifest/service worker (added in Task 9) — that's fine for now.

- [ ] **Step 8: Commit**

```bash
git add health/ health-frontend/package.json health-frontend/vitest.config.mjs health-frontend/.gitignore health-frontend/test/smoke.test.js _config.yml .gitignore
git commit -m "chore(health-fe): scaffold /health PWA shell and test project"
```

---

### Task 2: Pure — day-type + now/next (`schedule.js`)

**Files:**
- Create: `health/js/schedule.js`
- Create: `health-frontend/test/schedule.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (exported): `WEEKDAY_DAYTYPE` (array), `dayTypeForWeekday(weekday) -> dayType`, `nowNext(events, nowMinutes) -> { current: Event|null, next: Event|null }`. (`proteinTotal`/`calorieTotal`/`PROTEIN_TARGET` added in Task 3.)

- [ ] **Step 1: Write the failing test**

`health-frontend/test/schedule.test.js`:
```js
const { dayTypeForWeekday, WEEKDAY_DAYTYPE, nowNext } = require("../../health/js/schedule.js");

describe("dayTypeForWeekday", () => {
  it("maps weekdays per the contract", () => {
    expect(WEEKDAY_DAYTYPE).toEqual(["sunday","office","office","office","wfh","wfh","saturday"]);
    expect(dayTypeForWeekday(0)).toBe("sunday");
    expect(dayTypeForWeekday(1)).toBe("office");
    expect(dayTypeForWeekday(4)).toBe("wfh");
    expect(dayTypeForWeekday(6)).toBe("saturday");
  });
});

describe("nowNext", () => {
  const ev = (time, minutes, activity) => ({ time, minutes, activity });
  const events = [ev("06:00",360,"Walk"), ev("07:00",420,"Gym"), ev("08:15",495,"Breakfast")];

  it("finds current and next around a mid time", () => {
    const r = nowNext(events, 430); // after Gym(420), before Breakfast(495)
    expect(r.current.activity).toBe("Gym");
    expect(r.next.activity).toBe("Breakfast");
  });
  it("before the first event has no current", () => {
    const r = nowNext(events, 300);
    expect(r.current).toBeNull();
    expect(r.next.activity).toBe("Walk");
  });
  it("after the last event has no next", () => {
    const r = nowNext(events, 600);
    expect(r.current.activity).toBe("Breakfast");
    expect(r.next).toBeNull();
  });
  it("handles empty list", () => {
    expect(nowNext([], 500)).toEqual({ current: null, next: null });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-frontend && npx vitest run test/schedule.test.js`
Expected: FAIL — `Cannot find module '../../health/js/schedule.js'`.

- [ ] **Step 3: Implement `health/js/schedule.js`**

```js
var WEEKDAY_DAYTYPE = ["sunday", "office", "office", "office", "wfh", "wfh", "saturday"];

function dayTypeForWeekday(weekday) {
  return WEEKDAY_DAYTYPE[weekday];
}

function nowNext(events, nowMinutes) {
  var current = null, next = null;
  var sorted = (events || []).slice().sort(function (a, b) { return a.minutes - b.minutes; });
  for (var i = 0; i < sorted.length; i++) {
    if (sorted[i].minutes <= nowMinutes) current = sorted[i];
    else { next = sorted[i]; break; }
  }
  return { current: current, next: next };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WEEKDAY_DAYTYPE, dayTypeForWeekday, nowNext };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-frontend && npx vitest run test/schedule.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add health/js/schedule.js health-frontend/test/schedule.test.js
git commit -m "feat(health-fe): add day-type and now/next logic"
```

---

### Task 3: Pure — macro totals + targets (`schedule.js`)

**Files:**
- Modify: `health/js/schedule.js` (add `proteinTotal`, `calorieTotal`, `PROTEIN_TARGET`; extend exports)
- Modify: `health-frontend/test/schedule.test.js` (add cases)

**Interfaces:**
- Consumes: Task 2 module.
- Produces (added to exports): `PROTEIN_TARGET` (`{ayush:150,simran:120}`), `proteinTotal(events)->Number`, `calorieTotal(events)->Number` (both sum, treating null as 0).

- [ ] **Step 1: Add failing tests**

Append to `health-frontend/test/schedule.test.js`:
```js
const { proteinTotal, calorieTotal, PROTEIN_TARGET } = require("../../health/js/schedule.js");

describe("macro totals", () => {
  const events = [
    { protein: 34, calories: 740 },
    { protein: null, calories: 225 },
    { protein: 47, calories: null }
  ];
  it("sums protein treating null as 0", () => {
    expect(proteinTotal(events)).toBe(81);
  });
  it("sums calories treating null as 0", () => {
    expect(calorieTotal(events)).toBe(965);
  });
  it("exposes protein targets", () => {
    expect(PROTEIN_TARGET).toEqual({ ayush: 150, simran: 120 });
  });
  it("handles empty", () => {
    expect(proteinTotal([])).toBe(0);
    expect(calorieTotal([])).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-frontend && npx vitest run test/schedule.test.js`
Expected: FAIL — `proteinTotal is not a function`.

- [ ] **Step 3: Implement**

In `health/js/schedule.js`, add above the `module.exports` block:
```js
var PROTEIN_TARGET = { ayush: 150, simran: 120 };

function proteinTotal(events) {
  return (events || []).reduce(function (s, e) { return s + (e.protein || 0); }, 0);
}

function calorieTotal(events) {
  return (events || []).reduce(function (s, e) { return s + (e.calories || 0); }, 0);
}
```
Update the export line to:
```js
  module.exports = { WEEKDAY_DAYTYPE, dayTypeForWeekday, nowNext, PROTEIN_TARGET, proteinTotal, calorieTotal };
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-frontend && npx vitest run test/schedule.test.js`
Expected: PASS (all schedule cases).

- [ ] **Step 5: Commit**

```bash
git add health/js/schedule.js health-frontend/test/schedule.test.js
git commit -m "feat(health-fe): add macro totals and protein targets"
```

---

### Task 4: Pure — meal-prep rollup + ingredients (`mealprep.js`)

**Files:**
- Create: `health/js/mealprep.js`
- Create: `health-frontend/test/mealprep.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (exported): `OFFICE_DAY_COUNT` (3), `mealPrepRollup(events, dayCount) -> {activity,details,count}[]` (meals only, one row per office-template meal), `extractIngredients(details) -> string[]`, `groceryList(schedule) -> string[]` (distinct ingredients across both people's office meals).

- [ ] **Step 1: Write the failing test**

`health-frontend/test/mealprep.test.js`:
```js
const { OFFICE_DAY_COUNT, mealPrepRollup, extractIngredients, groceryList } = require("../../health/js/mealprep.js");

describe("mealPrepRollup", () => {
  const events = [
    { kind: "wake", activity: "Wake Up", details: "water" },
    { kind: "meal", activity: "Lunch at Office", details: "Basmati rice 200g + Chickpeas curry (~740 cal)" },
    { kind: "workout", activity: "Gym", details: "Lower A" },
    { kind: "meal", activity: "Dinner", details: "Tofu + Sweet Potato" }
  ];
  it("keeps only meals and stamps the weekly count", () => {
    expect(mealPrepRollup(events, 3)).toEqual([
      { activity: "Lunch at Office", details: "Basmati rice 200g + Chickpeas curry (~740 cal)", count: 3 },
      { activity: "Dinner", details: "Tofu + Sweet Potato", count: 3 }
    ]);
  });
  it("exposes the office day count", () => { expect(OFFICE_DAY_COUNT).toBe(3); });
});

describe("extractIngredients", () => {
  it("splits on + and , drops parentheticals and quantities", () => {
    expect(extractIngredients("Basmati rice 200g + Chickpeas/Tofu curry + salad (~740 cal, 34g protein)"))
      .toEqual(["Basmati rice", "Chickpeas/Tofu curry", "salad"]);
  });
  it("returns [] for blank", () => { expect(extractIngredients("")).toEqual([]); });
});

describe("groceryList", () => {
  it("dedupes ingredients across both people's office meals", () => {
    const schedule = {
      office: {
        ayush: [{ kind: "meal", details: "Basmati rice 200g + Chickpeas curry" }],
        simran: [{ kind: "meal", details: "Dal + brown rice" }, { kind: "walk", details: "x" }]
      },
      wfh: { ayush: [], simran: [] }, saturday: { ayush: [], simran: [] }, sunday: { ayush: [], simran: [] }
    };
    expect(groceryList(schedule)).toEqual(["Basmati rice", "Chickpeas curry", "Dal", "brown rice"]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-frontend && npx vitest run test/mealprep.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `health/js/mealprep.js`**

```js
var OFFICE_DAY_COUNT = 3;

function mealPrepRollup(events, dayCount) {
  return (events || [])
    .filter(function (e) { return e.kind === "meal"; })
    .map(function (e) { return { activity: e.activity, details: e.details, count: dayCount }; });
}

function extractIngredients(details) {
  var s = String(details || "").replace(/\([^)]*\)/g, " "); // drop parentheticals
  return s.split(/[+,]/)
    .map(function (part) {
      return part
        .replace(/\b\d+(\.\d+)?\s*(g|kg|ml|l|tsp|tbsp)\b/gi, " ") // drop "200g", "1 tsp"
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(function (x) { return x.length > 0; });
}

function groceryList(schedule) {
  var out = [];
  var seen = {};
  ["ayush", "simran"].forEach(function (person) {
    var meals = ((schedule.office && schedule.office[person]) || [])
      .filter(function (e) { return e.kind === "meal"; });
    meals.forEach(function (m) {
      extractIngredients(m.details).forEach(function (ing) {
        var key = ing.toLowerCase();
        if (!seen[key]) { seen[key] = true; out.push(ing); }
      });
    });
  });
  return out;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { OFFICE_DAY_COUNT, mealPrepRollup, extractIngredients, groceryList };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-frontend && npx vitest run test/mealprep.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add health/js/mealprep.js health-frontend/test/mealprep.test.js
git commit -m "feat(health-fe): add meal-prep rollup and ingredient extraction"
```

---

### Task 5: API layer (`api.js`) — cache + fetch wrappers

**Files:**
- Create: `health/js/api.js`
- Create: `health-frontend/test/api.test.js`

**Interfaces:**
- Consumes: `window.CONFIG` (browser) — in tests, a `global.CONFIG` stub.
- Produces (exported for tests): `cacheGet(key)`, `cacheSet(key,value)` (pure over a storage object), and async `fetchSchedule()`, `fetchLog(date)`, `postCheckoff(payload)`. `fetchSchedule` returns `{data, stale:Boolean}` — live data with `stale:false`, or the cached copy with `stale:true` on network failure (or `{data:null,stale:true}` if no cache).

- [ ] **Step 1: Write the failing test**

`health-frontend/test/api.test.js`:
```js
// jsdom-free: provide minimal globals the module uses.
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
global.CONFIG = { EXEC_URL: "https://exec.test/x", API_TOKEN: "tok" };

const { cacheGet, cacheSet, fetchSchedule, postCheckoff } = require("../../health/js/api.js");

beforeEach(() => { for (const k in store) delete store[k]; });

describe("cache", () => {
  it("round-trips JSON", () => {
    cacheSet("k", { a: 1 });
    expect(cacheGet("k")).toEqual({ a: 1 });
  });
  it("returns null for missing/corrupt", () => {
    expect(cacheGet("nope")).toBeNull();
    store["bad"] = "{not json";
    expect(cacheGet("bad")).toBeNull();
  });
});

describe("fetchSchedule", () => {
  it("returns live data and caches it", async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ schedule: {}, gym: [], principles: [] }) });
    const r = await fetchSchedule();
    expect(r.stale).toBe(false);
    expect(r.data.gym).toEqual([]);
    expect(cacheGet("health.schedule")).toEqual({ schedule: {}, gym: [], principles: [] });
  });
  it("falls back to cache when the network fails", async () => {
    cacheSet("health.schedule", { schedule: {}, gym: [{ day: "Mon" }], principles: [] });
    global.fetch = async () => { throw new Error("offline"); };
    const r = await fetchSchedule();
    expect(r.stale).toBe(true);
    expect(r.data.gym[0].day).toBe("Mon");
  });
});

describe("postCheckoff", () => {
  it("posts text/plain with the token merged in", async () => {
    let captured = null;
    global.fetch = async (url, opts) => { captured = { url, opts }; return { ok: true, json: async () => ({ ok: true }) }; };
    await postCheckoff({ date: "2026-07-12", person: "ayush", itemId: "x", itemLabel: "L", done: true });
    expect(captured.url).toBe("https://exec.test/x");
    expect(captured.opts.headers["Content-Type"]).toBe("text/plain");
    const body = JSON.parse(captured.opts.body);
    expect(body).toEqual({ token: "tok", date: "2026-07-12", person: "ayush", itemId: "x", itemLabel: "L", done: true });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-frontend && npx vitest run test/api.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `health/js/api.js`**

```js
var SCHEDULE_CACHE_KEY = "health.schedule";

function cacheGet(key) {
  try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function cacheSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* quota/full — ignore */ }
}

function fetchSchedule() {
  var url = CONFIG.EXEC_URL + "?token=" + encodeURIComponent(CONFIG.API_TOKEN);
  return fetch(url)
    .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(function (data) { cacheSet(SCHEDULE_CACHE_KEY, data); return { data: data, stale: false }; })
    .catch(function () { return { data: cacheGet(SCHEDULE_CACHE_KEY), stale: true }; });
}

function fetchLog(date) {
  var url = CONFIG.EXEC_URL + "?token=" + encodeURIComponent(CONFIG.API_TOKEN) +
    "&action=log&date=" + encodeURIComponent(date);
  return fetch(url)
    .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(function (j) { return (j && j.rows) || []; })
    .catch(function () { return []; });
}

function postCheckoff(payload) {
  var body = Object.assign({ token: CONFIG.API_TOKEN }, payload);
  return fetch(CONFIG.EXEC_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body)
  })
    .then(function (r) { return r.json(); })
    .catch(function () { return { ok: false }; });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { cacheGet, cacheSet, fetchSchedule, fetchLog, postCheckoff };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-frontend && npx vitest run test/api.test.js`
Expected: PASS.

- [ ] **Step 5: Run the full front-end suite**

Run: `cd health-frontend && npm test`
Expected: all four test files pass (`smoke`, `schedule`, `mealprep`, `api`).

- [ ] **Step 6: Commit**

```bash
git add health/js/api.js health-frontend/test/api.test.js
git commit -m "feat(health-fe): add cache and backend fetch wrappers"
```

---

### Task 6: App bootstrap + Home tab rendering (`app.js`)

**Files:**
- Create: `health/js/app.js`

**Interfaces:**
- Consumes: `schedule.js`, `mealprep.js`, `api.js` globals; the DOM in `index.html`.
- Produces: a running app. On load: fetch schedule (+ today's log), compute today's day-type, render the Home tab for the selected person, wire tab + person switches. Home renders Now/Next for a single person, or a two-column side-by-side view when person=`both`. This task is browser-only (no unit test); verify manually.

- [ ] **Step 1: Implement `health/js/app.js`**

```js
(function () {
  var state = {
    schedule: null, gym: [], principles: [],
    dayType: dayTypeForWeekday(new Date().getDay()),
    person: "ayush", tab: "home", log: {} // log: { itemId: true }
  };

  function nowMinutes() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function eventsFor(person) {
    if (!state.schedule) return [];
    return (state.schedule[state.dayType] && state.schedule[state.dayType][person]) || [];
  }
  function dayName() {
    return ({ office: "Office day", wfh: "WFH day", saturday: "Saturday", sunday: "Sunday" })[state.dayType];
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]; }); }

  function renderNowCard(person) {
    var events = eventsFor(person);
    var nn = nowNext(events, nowMinutes());
    var cls = person === "simran" ? "her" : "you";
    var wrap = el("div");
    var now = el("div", "card now " + cls);
    if (nn.current) {
      now.innerHTML = '<div class="lbl">Now · ' + esc(dayName()) + '</div>' +
        '<div class="act">' + esc(nn.current.activity) + '</div>' +
        '<div class="det">' + esc(nn.current.details) + '</div>' +
        (nn.next ? '<div class="count">Next ' + esc(nn.next.timeLabel) + ' · ' + esc(nn.next.activity) + '</div>' : '');
    } else {
      now.innerHTML = '<div class="lbl">' + esc(dayName()) + '</div><div class="act">Not started yet</div>' +
        (nn.next ? '<div class="count">First: ' + esc(nn.next.timeLabel) + ' · ' + esc(nn.next.activity) + '</div>' : '');
    }
    wrap.appendChild(now);
    // Today's checkable timeline
    var list = el("div", "card");
    events.forEach(function (e) {
      var done = !!state.log[e.id];
      var item = el("div", "item" + (done ? " done" : ""));
      item.innerHTML = '<button class="check' + (done ? " on" : "") + '" data-id="' + esc(e.id) +
        '" data-label="' + esc(e.activity) + '" data-person="' + esc(person) + '"></button>' +
        '<div class="t">' + esc(e.timeLabel) + '</div>' +
        '<div class="col"><div class="a">' + esc(e.activity) + '</div>' +
        (e.details ? '<div class="det">' + esc(e.details) + '</div>' : '') + '</div>';
      list.appendChild(item);
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderBoth() {
    var row = el("div", "row");
    ["ayush", "simran"].forEach(function (p) {
      var events = eventsFor(p);
      var nn = nowNext(events, nowMinutes());
      var col = el("div", "col");
      col.appendChild(el("div", "lbl", CONFIG.PERSON_LABELS[p]));
      var c = el("div", "card now " + (p === "simran" ? "her" : "you"));
      c.innerHTML = '<div class="lbl">Now</div><div class="act" style="font-size:14px">' +
        esc(nn.current ? nn.current.activity : "—") + '</div>' +
        (nn.next ? '<div class="count">Next: ' + esc(nn.next.activity) + '</div>' : '');
      col.appendChild(c);
      row.appendChild(col);
    });
    return row;
  }

  function renderHome() {
    var panel = document.getElementById("tab-home");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
    if (state.person === "both") panel.appendChild(renderBoth());
    else panel.appendChild(renderNowCard(state.person));
  }

  // Placeholder renderers filled in Task 7.
  function renderFood() { document.getElementById("tab-food").innerHTML = '<div class="card">Food (Task 7)</div>'; }
  function renderGym() { document.getElementById("tab-gym").innerHTML = '<div class="card">Gym (Task 7)</div>'; }
  function renderRules() { document.getElementById("tab-rules").innerHTML = '<div class="card">Rules (Task 7)</div>'; }

  function renderActiveTab() {
    ({ home: renderHome, food: renderFood, gym: renderGym, rules: renderRules })[state.tab]();
  }

  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".tabbar button").forEach(function (b) { b.classList.toggle("on", b.dataset.tab === tab); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("on", p.id === "tab-" + tab); });
    renderActiveTab();
  }
  function setPerson(person) {
    state.person = person;
    document.querySelectorAll("#personSwitch button").forEach(function (b) { b.classList.toggle("on", b.dataset.person === person); });
    renderActiveTab();
  }

  function todayISO() {
    var d = new Date(), p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function wire() {
    document.getElementById("tabbar").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-tab]"); if (b) setTab(b.dataset.tab);
    });
    document.getElementById("personSwitch").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-person]"); if (b) setPerson(b.dataset.person);
    });
    document.getElementById("dayLabel").textContent = dayName();
  }

  function showBanner(msg) {
    var b = document.getElementById("banner");
    if (!msg) { b.hidden = true; return; }
    b.textContent = msg; b.hidden = false;
  }

  function boot() {
    wire();
    fetchSchedule().then(function (res) {
      if (!res.data) { showBanner("No data — check config / connection"); return; }
      state.schedule = res.data.schedule; state.gym = res.data.gym || []; state.principles = res.data.principles || [];
      if (res.stale) showBanner("Showing saved copy (offline)");
      return fetchLog(todayISO()).then(function (rows) {
        rows.forEach(function (r) { if (r.done) state.log[r.itemId] = true; });
        renderActiveTab();
      });
    });
  }

  // expose for Task 7 & 8 to extend
  window.HealthApp = { state: state, renderActiveTab: renderActiveTab, todayISO: todayISO, esc: esc, el: el, eventsFor: eventsFor, showBanner: showBanner };

  document.addEventListener("DOMContentLoaded", boot);
})();
```

- [ ] **Step 2: Manual verification**

Temporarily point `health/config.js` `EXEC_URL`/`API_TOKEN` at your deployed backend (from the backend plan). Serve locally so `fetch` works (file:// blocks it):
```bash
cd health && python3 -m http.server 8080
```
Open `http://localhost:8080/`. Verify: day label shows today's day-type; Home shows a "Now" card + a checkable timeline for You; the person switch toggles You/Simran and "Both" shows two columns; tab bar switches panels (Food/Gym/Rules show placeholders). If offline/misconfigured, the banner appears.
(Revert any real token in `config.js` before committing — keep the placeholder.)

- [ ] **Step 3: Commit**

```bash
git add health/js/app.js
git commit -m "feat(health-fe): app bootstrap and Home tab (now/next + checkable timeline)"
```

---

### Task 7: Food, Gym, Rules tab rendering

**Files:**
- Modify: `health/js/app.js` (replace the three placeholder renderers)

**Interfaces:**
- Consumes: `mealPrepRollup`, `extractIngredients`, `groceryList`, `proteinTotal`, `calorieTotal`, `PROTEIN_TARGET`, `OFFICE_DAY_COUNT`; `state`, helpers.
- Produces: full Food (Today meals + macros; Meal-prep rollup + grocery), Gym (weekly split + today's workout per person), Rules (principles + reminder-subscribe buttons). Browser-only; verify manually.

- [ ] **Step 1: Replace `renderFood`**

In `health/js/app.js`, replace the `renderFood` placeholder with:
```js
  var foodMode = "today";
  function renderFood() {
    var panel = document.getElementById("tab-food");
    panel.innerHTML = "";
    var seg = el("div", "seg");
    seg.innerHTML = '<button data-mode="today" class="' + (foodMode === "today" ? "on" : "") + '">Today</button>' +
      '<button data-mode="prep" class="' + (foodMode === "prep" ? "on" : "") + '">Meal prep</button>';
    seg.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { foodMode = b.dataset.mode; renderFood(); } });
    panel.appendChild(seg);

    if (foodMode === "today") {
      var person = state.person === "both" ? "ayush" : state.person;
      var meals = eventsFor(person).filter(function (e) { return e.kind === "meal"; });
      var pt = proteinTotal(meals), ct = calorieTotal(meals), target = PROTEIN_TARGET[person] || 150;
      var tot = el("div", "card");
      tot.innerHTML = '<div class="lbl">' + esc(CONFIG.PERSON_LABELS[person]) + ' · protein ' + pt + ' / ' + target + ' g</div>' +
        '<div class="prog"><div style="width:' + Math.min(100, Math.round(pt / target * 100)) + '%"></div></div>' +
        '<div class="count">~' + ct + ' kcal today</div>';
      panel.appendChild(tot);
      var list = el("div", "card");
      meals.forEach(function (m) {
        list.appendChild(el("div", "item",
          '<div class="t">' + esc(m.timeLabel) + '</div><div class="col"><div class="a">' + esc(m.activity) + '</div>' +
          '<div class="det">' + esc(m.details) + '</div>' +
          (m.calories ? '<div class="count" style="color:var(--ok)">' + m.calories + ' kcal' + (m.protein ? ' · ' + m.protein + 'g protein' : '') + '</div>' : '') +
          '</div>'));
      });
      panel.appendChild(list);
    } else {
      var person2 = state.person === "both" ? "ayush" : state.person;
      var rollup = mealPrepRollup(officeEvents(person2), OFFICE_DAY_COUNT); // office template, regardless of today
      var cook = el("div", "card");
      cook.innerHTML = '<h2>🍳 Batch cook (office week ×' + OFFICE_DAY_COUNT + ')</h2>';
      rollup.forEach(function (r) {
        cook.appendChild(el("div", "item", '<div class="col"><div class="a">' + esc(r.activity) + '</div><div class="det">' + esc(r.details) + '</div></div><div class="t">×' + r.count + '</div>'));
      });
      panel.appendChild(cook);
      var groc = el("div", "card");
      groc.innerHTML = '<h2>🛒 Grocery list</h2>';
      groceryList(state.schedule).forEach(function (g) {
        groc.appendChild(el("div", "item", '<div class="col"><div class="a">☐ ' + esc(g) + '</div></div>'));
      });
      panel.appendChild(groc);
    }
  }
  function officeEvents(person) {
    return (state.schedule.office && state.schedule.office[person]) || [];
  }
```

- [ ] **Step 2: Replace `renderGym`**

```js
  function renderGym() {
    var panel = document.getElementById("tab-gym");
    panel.innerHTML = "";
    var today = ({ 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 0: "Sunday" })[new Date().getDay()];
    var todays = state.gym.filter(function (g) { return g.day === today; });
    if (todays.length) {
      var t = el("div", "card now you");
      t.innerHTML = '<div class="lbl">Today · ' + esc(today) + '</div><div class="act" style="font-size:15px">' +
        esc(todays[0].focusAyush) + '</div><div class="det">Simran: ' + esc(todays[0].focusSimran) + ' · ' + esc(todays[0].type) + '</div>';
      panel.appendChild(t);
    }
    var wk = el("div", "card");
    wk.innerHTML = '<h2>Weekly split</h2>';
    state.gym.forEach(function (g) {
      wk.appendChild(el("div", "item", '<div class="t">' + esc(g.day) + '</div><div class="col"><div class="a">' +
        esc(g.focusAyush) + '</div><div class="det">Simran: ' + esc(g.focusSimran) + '</div></div>'));
    });
    panel.appendChild(wk);
  }
```

- [ ] **Step 3: Replace `renderRules`**

```js
  function renderRules() {
    var panel = document.getElementById("tab-rules");
    panel.innerHTML = "";
    var sub = el("div", "card");
    sub.innerHTML = '<h2>🔔 Reminders</h2><div class="det">Add once per phone: Settings → Calendar → Add Subscribed Calendar.</div>';
    ["ayush", "simran"].forEach(function (p) {
      var link = CONFIG.EXEC_URL + "?token=" + encodeURIComponent(CONFIG.API_TOKEN) + "&format=ics&person=" + p;
      var a = el("a", "item");
      a.href = link; a.textContent = "📅 Subscribe: " + CONFIG.PERSON_LABELS[p];
      a.style.display = "block"; a.style.color = "var(--accent)"; a.style.textDecoration = "none";
      sub.appendChild(a);
    });
    panel.appendChild(sub);
    var pr = el("div", "card");
    pr.innerHTML = '<h2>Principles</h2>';
    state.principles.forEach(function (x) {
      pr.appendChild(el("div", "item", '<div class="col"><div class="a">' + esc(x.topic) + '</div><div class="det">' + esc(x.guideline) + '</div></div>'));
    });
    panel.appendChild(pr);
  }
```

- [ ] **Step 4: Manual verification**

Serve locally (as in Task 6) against the real backend. Verify: Food→Today shows meals + a protein progress bar; Food→Meal prep shows batch-cook rows (×3) + a grocery list; Gym shows today's workout + the weekly split; Rules shows two calendar-subscribe links + the principles. Switch person and confirm Food/Today reflects the selected person (Both defaults to You for single-person views).

- [ ] **Step 5: Commit**

```bash
git add health/js/app.js
git commit -m "feat(health-fe): Food, Gym, and Rules tabs"
```

---

### Task 8: Check-off interactions + sync

**Files:**
- Modify: `health/js/app.js` (wire the check buttons to optimistic toggle + `postCheckoff`)

**Interfaces:**
- Consumes: `postCheckoff`, `state.log`, `todayISO`.
- Produces: tapping a check button toggles it optimistically, updates `state.log`, re-renders Home, and POSTs the change; on POST failure shows the offline banner but keeps the optimistic state. Browser-only; verify manually.

- [ ] **Step 1: Add the check handler in `wire()`**

In `health/js/app.js`, inside `wire()`, add a delegated listener on the Home panel:
```js
    document.getElementById("tab-home").addEventListener("click", function (e) {
      var btn = e.target.closest(".check"); if (!btn) return;
      var id = btn.dataset.id, label = btn.dataset.label, person = btn.dataset.person;
      var nowOn = !state.log[id];
      if (nowOn) state.log[id] = true; else delete state.log[id];
      renderHome();
      postCheckoff({ date: todayISO(), person: person, itemId: id, itemLabel: label, done: nowOn })
        .then(function (r) { if (!r || r.ok !== true) showBanner("Check-off didn't sync (saved locally)"); });
    });
```

- [ ] **Step 2: Manual verification**

Serve locally against the backend. Tap a check on Home → it fills green and the row strikes through immediately; reload the page → the check persists (it was written to the Log tab and re-read on boot). Confirm a new row appears in the Sheet's hidden **Log** tab (backend `DEPLOY.md` step 12–13). Toggle off → re-tapping writes `done:false`; reload reflects the latest state per that day's log.

- [ ] **Step 3: Commit**

```bash
git add health/js/app.js
git commit -m "feat(health-fe): check-off toggle with backend sync"
```

---

### Task 9: PWA — manifest, icons, service worker (installable + offline)

**Files:**
- Create: `health/manifest.webmanifest`, `health/sw.js`, `health/icons/icon-192.png`, `health/icons/icon-512.png`
- Modify: `health/js/app.js` (register the service worker)

**Interfaces:**
- Consumes: the served shell.
- Produces: an installable, offline-capable PWA. Service-worker scope is `./` (the `/health/` folder). Browser-only; verify manually.

- [ ] **Step 1: Create `health/manifest.webmanifest`**

```json
{
  "name": "Health",
  "short_name": "Health",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#0e1116",
  "theme_color": "#0e1116",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 2: Create the icons**

Generate two solid-color PNG app icons (192×192 and 512×512). Run from repo root (requires ImageMagick `convert`; if unavailable, create any 192/512 PNGs by hand):
```bash
mkdir -p health/icons
convert -size 192x192 xc:'#3b82f6' -gravity center -pointsize 96 -fill white -annotate 0 '♥' health/icons/icon-192.png
convert -size 512x512 xc:'#3b82f6' -gravity center -pointsize 256 -fill white -annotate 0 '♥' health/icons/icon-512.png
```
Verify both files exist and are valid PNGs (`file health/icons/icon-192.png` → "PNG image data, 192 x 192").

- [ ] **Step 3: Create `health/sw.js`**

```js
var CACHE = "health-v1";
var SHELL = [
  "./", "./index.html", "./app.css",
  "./config.js", "./js/schedule.js", "./js/mealprep.js", "./js/api.js", "./js/app.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return; // never cache POST check-offs
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let backend calls hit the network
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
```

- [ ] **Step 4: Register the service worker in `app.js`**

At the very end of the IIFE in `health/js/app.js` (just before the closing `})();`), add:
```js
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js"); });
  }
```

- [ ] **Step 5: Manual verification**

Serve locally over `http://localhost:8080/` (service workers need http/https, not file://). In DevTools → Application: the manifest loads, the service worker activates, and the icons resolve. Reload once, then go offline (DevTools → Network → Offline) and reload — the shell still renders and the last schedule shows with the "saved copy" banner. On iPhone Safari (after deploy): Share → Add to Home Screen installs it; it opens standalone.

- [ ] **Step 6: Commit**

```bash
git add health/manifest.webmanifest health/sw.js health/icons/ health/js/app.js
git commit -m "feat(health-fe): installable PWA with offline shell"
```

---

### Task 10: Config finalize + integration doc

**Files:**
- Create: `health/README.md` (front-end setup + verification runbook)

**Interfaces:**
- Consumes: the deployed backend `EXEC_URL` + `API_TOKEN`.
- Produces: the documented steps to point the app at the backend and verify the full stack, and the deploy note. No code; documentation + final end-to-end check.

- [ ] **Step 1: Write `health/README.md`**

```markdown
# Health companion — front-end (/health)

A build-free PWA served at `shahayush.com/health/`. Reads the Apps Script backend
(see `../health-backend/DEPLOY.md`).

## Configure
Edit `config.js` and set:
- `EXEC_URL` — the Apps Script web-app `…/exec` URL
- `API_TOKEN` — the same value as the backend `API_TOKEN` Script Property

`config.js` is committed so GitHub Pages can serve it. The token is public in the
served JS by design — use a dedicated, rotatable token; the backend only exposes
personal schedule data and an append-only check-off log.

## Run locally
```bash
cd health && python3 -m http.server 8080
# open http://localhost:8080/
```

## Verify end-to-end
1. Home shows today's day-type, a Now/Next card, and a checkable timeline.
2. Person switch (You / Simran / Both) works; Both shows side-by-side.
3. Food → Today shows meals + protein bar; Meal prep shows batch-cook ×3 + grocery list.
4. Gym shows today's workout + the weekly split; Rules shows two calendar links + principles.
5. Tap a check → persists across reload (written to the Sheet Log tab).
6. Offline (after one online load): shell + last schedule render with the "saved copy" banner.
7. Install: iPhone Safari → Share → Add to Home Screen → opens standalone.

## Deploy
Commit under `health/`; it ships with the normal GitHub Pages build. `health-frontend/`
(tests) is excluded from the Jekyll build. After pushing, load
`https://shahayush.com/health/` and re-run the verify steps on both phones.

## Tests (pure logic)
```bash
cd health-frontend && npm test
```
```

- [ ] **Step 2: Full front-end test suite (regression)**

Run: `cd health-frontend && npm test`
Expected: all four test files pass (`smoke`, `schedule`, `mealprep`, `api`).

- [ ] **Step 3: End-to-end verification against the live backend**

With the backend deployed and `config.js` pointed at it, run the `health/README.md`
"Verify end-to-end" steps 1–7 locally. All must pass before deploy.

- [ ] **Step 4: Commit**

```bash
git add health/README.md
git commit -m "docs(health-fe): add front-end setup and verification runbook"
```

---

## Notes

- **Meal-prep scope:** the batch-cook rollup (each office-template meal ×3) and the
  ingredient/grocery extraction are best-effort over free-text `details`. They read
  well on the current sheet; if the sheet's meal phrasing changes a lot, revisit
  `extractIngredients`.
- **Token exposure:** `config.js` ships the token publicly (unavoidable on GitHub
  Pages). Use a dedicated rotatable token; blast radius is personal schedule data +
  append-only log.
- **Time handling:** now/next uses device-local time; both users are in the sheet's
  timezone, so no conversion is needed.
- **Not in scope (YAGNI):** history/charts, weight tracking, editing the schedule in
  the app, hash-based deep links.
```
