# Health Companion — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Google Apps Script backend that turns the private diet/fitness Google Sheet into a JSON API, an `.ics` reminder feed, and a check-off log — the data source the `/health/` PWA consumes.

**Architecture:** Pure, unit-tested JavaScript modules (parser, ics generator, log/auth helpers) live in a local Node project under `health-backend/` and are tested with vitest. Thin Apps Script wrappers (`Code.js`, pushed to Google via `clasp`) read the live Sheet with `SpreadsheetApp`, call the pure functions, and expose `doGet`/`doPost`. Every pure file uses the dual-runtime pattern (`if (typeof module !== "undefined") module.exports = …`) so the exact same source runs under Node (for tests) and inside Apps Script's global scope.

**Tech Stack:** Node.js (CommonJS), vitest, `@google/clasp`, Google Apps Script (V8 runtime), Google Sheets.

## Global Constraints

These apply to **every** task. Copy names/values verbatim.

- **Runtime style:** CommonJS (no `"type": "module"`). Pure modules end with
  `if (typeof module !== "undefined" && module.exports) { module.exports = { … }; }`
  so they load in both Node and Apps Script. Never use `import`/`export` keywords.
- **Timezone:** `America/Los_Angeles`. Calendar times are **floating local**
  (no `Z`, no `TZID`) so iOS renders them in device-local time.
- **Person keys:** exactly `"ayush"` and `"simran"` (lowercase) everywhere.
- **Day-type keys:** exactly `"office"`, `"wfh"`, `"saturday"`, `"sunday"`.
- **Day-type → weekdays (for `.ics` `BYDAY`):** office→`MO,TU,WE`, wfh→`TH,FR`,
  saturday→`SA`, sunday→`SU`.
- **Day-type → reference DTSTART date (Mon 2024-01-01 = a Monday):**
  office→`20240101`, wfh→`20240104`, saturday→`20240106`, sunday→`20240107`.
- **Stable event ID format:** `` `${dayType}:${person}:${time24}:${slug}` `` —
  e.g. `office:ayush:07:00:gym-strength-together`. IDs must be stable across sheet
  edits so check-offs stay attached.
- **Auth:** all endpoints require a `token` that equals the `API_TOKEN` Script
  Property. Requests without a matching token get `{ "error": "unauthorized" }`.
- **CORS:** GET is consumed by the browser via normal `fetch` (googleusercontent
  serves `Access-Control-Allow-Origin: *`); POST is sent as `Content-Type:
  text/plain` to avoid a preflight. `doGet` also supports a `callback` param
  (JSONP) as a fallback. (Browser-side CORS is verified in the front-end plan;
  here we verify with `curl`.)

### Data model contract (the front-end plan depends on these exact shapes)

```js
// One timeline item
Event = {
  id: string,        // "office:ayush:07:00:gym-strength-together"
  person: "ayush" | "simran",
  dayType: "office" | "wfh" | "saturday" | "sunday",
  time: string,      // 24h "HH:MM", e.g. "07:00"
  timeLabel: string, // original "7:00 AM"
  minutes: number,   // minutes since midnight, e.g. 420
  activity: string,  // "Gym Strength (Together)"
  details: string,   // "Lower A: RDL, Split Squat"
  notes: string,
  kind: "workout"|"walk"|"meal"|"wake"|"sleep"|"drive"|"rest"|"other",
  together: boolean, // true if activity mentions "together"
  calories: number | null,
  protein: number | null
}

// parseSchedule(values) returns:
ParseResult = {
  schedule: {
    office:   { ayush: Event[], simran: Event[] },
    wfh:      { ayush: Event[], simran: Event[] },
    saturday: { ayush: Event[], simran: Event[] },
    sunday:   { ayush: Event[], simran: Event[] }
  },
  gym: { day: string, focusAyush: string, focusSimran: string, type: string }[],
  principles: { topic: string, guideline: string }[]
}
```

Sheet layout the parser assumes (0-indexed columns of `getDataRange().getValues()`):
`0`=Time, `1`=Activity, `2`=Details/Food, `3`=Notes, `4`=blank spacer,
`5`=Time, `6`=Activity, `7`=Details/Food, `8`=Notes. Columns 0–3 are Ayush,
5–8 are Simran. Section headers occupy a row with text like
`AYUSH — OFFICE DAY (Mon/Tue/Wed)` in col 0 (and the Simran equivalent in col 5),
followed by a `Time | Activity | Details / Food | Notes` header row, then data
rows until a fully-blank row. The gym block starts at a row whose col 0 begins
with `WEEKLY GYM SCHEDULE`; the principles block starts where col 5 begins with
`KEY NOTES & PRINCIPLES`.

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `health-backend/package.json`
- Create: `health-backend/vitest.config.mjs`
- Create: `health-backend/test/smoke.test.js`
- Create: `health-backend/.gitignore`
- Modify: `_config.yml` (add `health-backend` to the top-level `exclude:` list)
- Modify: `.gitignore` (repo root — ignore `health-backend/node_modules`)

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm test` (vitest) in `health-backend/`, with
  `globals: true` so tests use `describe`/`it`/`expect` without importing them;
  the folder is excluded from the Jekyll build so it is never served.

**Test convention (applies to every test file in this plan):** the package is
CommonJS, so test files `require(...)` the local `src/*.js` modules and rely on
vitest globals for `describe`/`it`/`expect` — they never `require("vitest")`
(vitest is ESM-only and would throw `ERR_REQUIRE_ESM`).

- [ ] **Step 1: Create `health-backend/package.json`**

```json
{
  "name": "health-backend",
  "version": "0.1.0",
  "private": true,
  "description": "Apps Script backend for the /health diet & fitness companion",
  "engines": { "node": ">=18" },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@google/clasp": "^2.4.2"
  }
}
```

- [ ] **Step 2: Create `health-backend/.gitignore`**

```
node_modules/
.clasp.json
```

- [ ] **Step 3: Add the ignore for node_modules at the repo root**

In the repo-root `.gitignore`, add this line (append at the end):

```
health-backend/node_modules/
```

- [ ] **Step 4: Exclude the backend folder from the Jekyll build**

Open `_config.yml`, find the top-level `exclude:` list, and add `health-backend`
as a new list item so Jekyll never copies it into `_site`. The result should
include:

```yaml
exclude:
  - health-backend
```

(Keep every existing entry already under `exclude:`; just add this one line.)

- [ ] **Step 5: Create the vitest config**

Create `health-backend/vitest.config.mjs` (`.mjs` so Vite loads it as ESM
regardless of the CommonJS package):

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { globals: true }
});
```

- [ ] **Step 6: Write a smoke test**

Create `health-backend/test/smoke.test.js` (no `require("vitest")` — globals):

```js
describe("toolchain", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 7: Install deps and run the smoke test**

Run:
```bash
cd health-backend && npm install && npm test
```
Expected: vitest reports `1 passed` for `test/smoke.test.js`.

- [ ] **Step 8: Commit**

```bash
git add health-backend/package.json health-backend/vitest.config.mjs health-backend/.gitignore health-backend/test/smoke.test.js _config.yml .gitignore
git commit -m "chore(health): scaffold apps script backend project"
```

---

### Task 2: Field-parsing helpers (time, macros, slug, kind)

**Files:**
- Create: `health-backend/src/parser.js`
- Create: `health-backend/test/parser-helpers.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (all exported from `parser.js`):
  - `slugify(str) -> string`
  - `parseTime(str) -> { time: "HH:MM", label: string, minutes: number } | null`
  - `extractMacros(str) -> { calories: number|null, protein: number|null }`
  - `classifyKind(activity) -> string` (one of the `kind` enum values)

- [ ] **Step 1: Write the failing test**

Create `health-backend/test/parser-helpers.test.js`:

```js
const { slugify, parseTime, extractMacros, classifyKind } = require("../src/parser");

describe("slugify", () => {
  it("lowercases and dashes non-alphanumerics", () => {
    expect(slugify("Gym Strength (Together)")).toBe("gym-strength-together");
  });
  it("collapses and trims dashes", () => {
    expect(slugify("  Lunch / Self  ")).toBe("lunch-self");
  });
});

describe("parseTime", () => {
  it("parses AM", () => {
    expect(parseTime("5:45 AM")).toEqual({ time: "05:45", label: "5:45 AM", minutes: 345 });
  });
  it("parses PM", () => {
    expect(parseTime("1:00 PM")).toEqual({ time: "13:00", label: "1:00 PM", minutes: 780 });
  });
  it("parses 12 AM/PM correctly", () => {
    expect(parseTime("12:00 AM").time).toBe("00:00");
    expect(parseTime("12:30 PM").time).toBe("12:30");
  });
  it("returns null for non-times", () => {
    expect(parseTime("Wake Up")).toBeNull();
    expect(parseTime("")).toBeNull();
  });
});

describe("extractMacros", () => {
  it("pulls calories and protein", () => {
    expect(extractMacros("Rice + curry (~740 cal, 34g protein)")).toEqual({ calories: 740, protein: 34 });
  });
  it("handles calories only", () => {
    expect(extractMacros("Dal + rice (~440 cal)")).toEqual({ calories: 440, protein: null });
  });
  it("returns nulls when absent", () => {
    expect(extractMacros("Drink 500ml water")).toEqual({ calories: null, protein: null });
  });
});

describe("classifyKind", () => {
  it("classifies known activities", () => {
    expect(classifyKind("Gym Strength (Together)")).toBe("workout");
    expect(classifyKind("Morning Walk (Together)")).toBe("walk");
    expect(classifyKind("Light Breakfast")).toBe("meal");
    expect(classifyKind("Wake Up")).toBe("wake");
    expect(classifyKind("Sleep")).toBe("sleep");
    expect(classifyKind("Drive to Office")).toBe("drive");
    expect(classifyKind("Nap / Rest")).toBe("rest");
    expect(classifyKind("Personal Time")).toBe("other");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd health-backend && npx vitest run test/parser-helpers.test.js`
Expected: FAIL — `Cannot find module '../src/parser'`.

- [ ] **Step 3: Write minimal implementation**

Create `health-backend/src/parser.js`:

```js
function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTime(str) {
  const m = String(str).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3].toUpperCase();
  if (mer === "AM") { if (hour === 12) hour = 0; }
  else { if (hour !== 12) hour += 12; }
  const time = String(hour).padStart(2, "0") + ":" + String(min).padStart(2, "0");
  return { time: time, label: str.trim().replace(/\s+/g, " "), minutes: hour * 60 + min };
}

function extractMacros(str) {
  const s = String(str);
  const cal = s.match(/(\d+)\s*cal/i);
  const pro = s.match(/(\d+)\s*g\s*protein/i);
  return {
    calories: cal ? parseInt(cal[1], 10) : null,
    protein: pro ? parseInt(pro[1], 10) : null
  };
}

function classifyKind(activity) {
  const a = String(activity);
  if (/gym|strength|soccer|toning|yoga|workout|circuit|stretch/i.test(a)) return "workout";
  if (/walk/i.test(a)) return "walk";
  if (/breakfast|lunch|dinner|snack|meal|pre-sleep|eat|coffee/i.test(a)) return "meal";
  if (/wake/i.test(a)) return "wake";
  if (/sleep/i.test(a)) return "sleep";
  if (/drive|leave|arrive|commute/i.test(a)) return "drive";
  if (/rest|nap|relax|wind\s*down|freshen|recovery/i.test(a)) return "rest";
  return "other";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { slugify, parseTime, extractMacros, classifyKind };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd health-backend && npx vitest run test/parser-helpers.test.js`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add health-backend/src/parser.js health-backend/test/parser-helpers.test.js
git commit -m "feat(health): add time/macro/kind parsing helpers"
```

---

### Task 3: Parse day-type blocks into events

**Files:**
- Modify: `health-backend/src/parser.js` (add `parseSchedule`)
- Create: `health-backend/test/fixtures/sheet.js`
- Create: `health-backend/test/parse-schedule.test.js`

**Interfaces:**
- Consumes: `slugify`, `parseTime`, `extractMacros`, `classifyKind` (Task 2).
- Produces: `parseSchedule(values) -> ParseResult` (see Global Constraints).
  This task implements the `schedule` portion (per day-type, per person events);
  `gym` and `principles` are filled in Task 4.

- [ ] **Step 1: Create the fixture**

Create `health-backend/test/fixtures/sheet.js` (a representative slice — two
day-types, both people, plus the gym+principles block used in Task 4):

```js
// 9-column rows: 0-3 Ayush, 4 spacer, 5-8 Simran
const SHEET_VALUES = [
  ["AYUSH — OFFICE DAY (Mon/Tue/Wed)","","","","","SIMRAN — OFFICE DAY (Mon/Tue/Wed)","","",""],
  ["Time","Activity","Details / Food","Notes","","Time","Activity","Details / Food","Notes"],
  ["5:45 AM","Wake Up","Drink 500ml water","Hydration","","5:45 AM","Wake Up","Drink 500ml water","500ml water"],
  ["7:00 AM","Gym Strength (Together)","Lower A: RDL, Split Squat","Before breakfast","","7:00 AM","Gym Strength (Together)","Toning circuit","Weight-loss focus"],
  ["1:00 PM","Lunch at Office","Rice + Chickpeas curry (~740 cal, 34g protein)","From home","","1:00 PM","Lunch (Self)","Dal + brown rice (~440 cal)","Iron + fiber"],
  ["","","","","","","","",""],
  ["AYUSH — SUNDAY (Rest / Recovery Day)","","","","","SIMRAN — SUNDAY (Rest / Recovery Day)","","",""],
  ["Time","Activity","Details / Food","Notes","","Time","Activity","Details / Food","Notes"],
  ["7:00 AM","Wake Up (Relaxed)","Drink 500ml water","Lie-in","","7:00 AM","Wake Up (Relaxed)","Drink 500ml water",""],
  ["8:00 AM","Breakfast (Together)","Oats + Whey (~520 cal, 49g protein)","","","8:00 AM","Breakfast (Together)","2 Eggs + spinach (~290 cal)","Iron-rich"],
  ["","","","","","","","","",""],
  ["WEEKLY GYM SCHEDULE (3 days/week — Together)","","","","","KEY NOTES & PRINCIPLES","","",""],
  ["Day","Focus (Ayush)","Focus (Simran)","Type","","Topic","Guideline","",""],
  ["Monday","Lower A: RDL, Leg Press","Lower body equivalent","Strength","","Protein Target","Ayush 150g+; Simran 100-130g","",""],
  ["Tuesday","Upper Push: Bench","Upper push equivalent","Strength","","Hydration","3L water daily","",""]
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SHEET_VALUES };
}
```

- [ ] **Step 2: Write the failing test**

Create `health-backend/test/parse-schedule.test.js`:

```js
const { parseSchedule } = require("../src/parser");
const { SHEET_VALUES } = require("./fixtures/sheet");

describe("parseSchedule — schedule blocks", () => {
  const result = parseSchedule(SHEET_VALUES);

  it("produces all four day-type keys", () => {
    expect(Object.keys(result.schedule).sort())
      .toEqual(["office", "saturday", "sunday", "wfh"]);
  });

  it("parses Ayush office events in order", () => {
    const ev = result.schedule.office.ayush;
    expect(ev.map(e => e.activity)).toEqual(["Wake Up", "Gym Strength (Together)", "Lunch at Office"]);
    expect(ev[1].time).toBe("07:00");
    expect(ev[1].minutes).toBe(420);
    expect(ev[1].kind).toBe("workout");
    expect(ev[1].together).toBe(true);
  });

  it("parses Simran office events independently", () => {
    const ev = result.schedule.office.simran;
    expect(ev[2].activity).toBe("Lunch (Self)");
    expect(ev[2].calories).toBe(440);
  });

  it("extracts macros and assigns stable ids", () => {
    const lunch = result.schedule.office.ayush[2];
    expect(lunch.calories).toBe(740);
    expect(lunch.protein).toBe(34);
    expect(lunch.id).toBe("office:ayush:13:00:lunch-at-office");
  });

  it("leaves day-types absent from the sheet as empty", () => {
    expect(result.schedule.wfh.ayush).toEqual([]);
    expect(result.schedule.saturday.simran).toEqual([]);
  });

  it("parses the Sunday block", () => {
    expect(result.schedule.sunday.ayush[1].activity).toBe("Breakfast (Together)");
    expect(result.schedule.sunday.ayush[1].protein).toBe(49);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd health-backend && npx vitest run test/parse-schedule.test.js`
Expected: FAIL — `parseSchedule is not a function`.

- [ ] **Step 4: Implement `parseSchedule` (schedule portion)**

Add to `health-backend/src/parser.js`, **above** the `module.exports` block:

```js
const DAY_TYPE_FROM_HEADER = [
  { re: /office/i, key: "office" },
  { re: /wfh/i, key: "wfh" },
  { re: /saturday/i, key: "saturday" },
  { re: /sunday/i, key: "sunday" }
];

function emptySchedule() {
  const blank = () => ({ ayush: [], simran: [] });
  return { office: blank(), wfh: blank(), saturday: blank(), sunday: blank() };
}

function dayTypeFromHeader(text) {
  const m = String(text).match(/^AYUSH\s*[—-]\s*(.+)$/i);
  if (!m) return null;
  const rest = m[1];
  for (const d of DAY_TYPE_FROM_HEADER) if (d.re.test(rest)) return d.key;
  return null;
}

function buildEvent(person, dayType, timeCell, activity, details, notes) {
  const t = parseTime(timeCell);
  if (!t) return null;
  const macros = extractMacros(details);
  return {
    id: `${dayType}:${person}:${t.time}:${slugify(activity)}`,
    person: person,
    dayType: dayType,
    time: t.time,
    timeLabel: t.label,
    minutes: t.minutes,
    activity: String(activity).trim(),
    details: String(details).trim(),
    notes: String(notes).trim(),
    kind: classifyKind(activity),
    together: /together/i.test(String(activity)),
    calories: macros.calories,
    protein: macros.protein
  };
}

function isBlankRow(row) {
  return row.every(c => String(c == null ? "" : c).trim() === "");
}

function parseSchedule(values) {
  const schedule = emptySchedule();
  const rows = values || [];
  for (let i = 0; i < rows.length; i++) {
    const dayType = dayTypeFromHeader(rows[i][0]);
    if (!dayType) continue;
    // rows[i] = section header, rows[i+1] = column header, data starts at i+2
    let r = i + 2;
    for (; r < rows.length; r++) {
      const row = rows[r];
      if (isBlankRow(row)) break;
      if (dayTypeFromHeader(row[0])) break; // next section with no blank between
      const a = buildEvent("ayush", dayType, row[0], row[1], row[2], row[3]);
      if (a) schedule[dayType].ayush.push(a);
      const s = buildEvent("simran", dayType, row[5], row[6], row[7], row[8]);
      if (s) schedule[dayType].simran.push(s);
    }
    i = r - 1;
  }
  return { schedule: schedule, gym: [], principles: [] };
}
```

Update the export line at the bottom of `parser.js` to include `parseSchedule`:

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = { slugify, parseTime, extractMacros, classifyKind, parseSchedule };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd health-backend && npx vitest run test/parse-schedule.test.js`
Expected: PASS — all cases green.

- [ ] **Step 6: Commit**

```bash
git add health-backend/src/parser.js health-backend/test/fixtures/sheet.js health-backend/test/parse-schedule.test.js
git commit -m "feat(health): parse day-type blocks into events"
```

---

### Task 4: Parse gym split + principles

**Files:**
- Modify: `health-backend/src/parser.js` (fill `gym` and `principles`)
- Modify: `health-backend/test/parse-schedule.test.js` (add cases)

**Interfaces:**
- Consumes: `parseSchedule` scaffold (Task 3).
- Produces: `parseSchedule(...).gym` and `.principles` populated per the contract.

- [ ] **Step 1: Add failing tests**

Append to `health-backend/test/parse-schedule.test.js`:

```js
describe("parseSchedule — gym & principles", () => {
  const result = parseSchedule(SHEET_VALUES);

  it("parses the gym split", () => {
    expect(result.gym).toEqual([
      { day: "Monday", focusAyush: "Lower A: RDL, Leg Press", focusSimran: "Lower body equivalent", type: "Strength" },
      { day: "Tuesday", focusAyush: "Upper Push: Bench", focusSimran: "Upper push equivalent", type: "Strength" }
    ]);
  });

  it("parses the principles", () => {
    expect(result.principles).toEqual([
      { topic: "Protein Target", guideline: "Ayush 150g+; Simran 100-130g" },
      { topic: "Hydration", guideline: "3L water daily" }
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-backend && npx vitest run test/parse-schedule.test.js`
Expected: FAIL — `gym` and `principles` are empty arrays.

- [ ] **Step 3: Implement gym + principles parsing**

In `parser.js`, add these two functions above the `module.exports` block:

```js
function parseGym(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    if (!/^WEEKLY GYM SCHEDULE/i.test(String(rows[i][0]))) continue;
    for (let r = i + 2; r < rows.length; r++) {
      const day = String(rows[r][0] == null ? "" : rows[r][0]).trim();
      if (day === "") break;
      out.push({
        day: day,
        focusAyush: String(rows[r][1] || "").trim(),
        focusSimran: String(rows[r][2] || "").trim(),
        type: String(rows[r][3] || "").trim()
      });
    }
    break;
  }
  return out;
}

function parsePrinciples(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    if (!/^KEY NOTES/i.test(String(rows[i][5]))) continue;
    for (let r = i + 2; r < rows.length; r++) {
      const topic = String(rows[r][5] == null ? "" : rows[r][5]).trim();
      if (topic === "") break;
      out.push({ topic: topic, guideline: String(rows[r][6] || "").trim() });
    }
    break;
  }
  return out;
}
```

Then, inside `parseSchedule`, replace the `return` line with:

```js
  return { schedule: schedule, gym: parseGym(rows), principles: parsePrinciples(rows) };
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-backend && npx vitest run test/parse-schedule.test.js`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add health-backend/src/parser.js health-backend/test/parse-schedule.test.js
git commit -m "feat(health): parse gym split and principles"
```

---

### Task 5: `.ics` calendar feed generator

**Files:**
- Create: `health-backend/src/ics.js`
- Create: `health-backend/test/ics.test.js`

**Interfaces:**
- Consumes: `ParseResult` from `parseSchedule` (Tasks 3–4).
- Produces (exported from `ics.js`):
  - `escapeIcs(str) -> string`
  - `buildIcs(parseResult, person, options) -> string`
    where `options = { calname: string }`. Emits one weekly-recurring `VEVENT`
    with a `VALARM` per event for `person`, across all four day-types.

- [ ] **Step 1: Write the failing test**

Create `health-backend/test/ics.test.js`:

```js
const { escapeIcs, buildIcs } = require("../src/ics");
const { parseSchedule } = require("../src/parser");
const { SHEET_VALUES } = require("./fixtures/sheet");

describe("escapeIcs", () => {
  it("escapes commas, semicolons, backslashes, newlines", () => {
    expect(escapeIcs("a, b; c\\d\ne")).toBe("a\\, b\\; c\\\\d\\ne");
  });
});

describe("buildIcs", () => {
  const parsed = parseSchedule(SHEET_VALUES);
  const ics = buildIcs(parsed, "ayush", { calname: "Health · Ayush" });

  it("wraps in a VCALENDAR with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("X-WR-CALNAME:Health · Ayush");
  });

  it("emits a VEVENT per Ayush event with recurrence and alarm", () => {
    // 3 office + 2 sunday = 5 events for ayush in the fixture
    const count = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(count).toBe(5);
    expect(ics).toContain("BEGIN:VALARM");
  });

  it("uses floating local time and correct BYDAY per day-type", () => {
    expect(ics).toContain("DTSTART:20240101T070000");          // office gym, Mon ref date
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE"); // office
    expect(ics).toContain("DTSTART:20240107T080000");          // sunday breakfast, Sun ref date
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=SU");       // sunday
    expect(ics).not.toContain("Z\r\n"); // no UTC 'Z' suffix on DTSTART/DTEND
  });

  it("only includes the requested person's events", () => {
    expect(ics).toContain("SUMMARY:Lunch at Office");   // ayush
    expect(ics).not.toContain("SUMMARY:Lunch (Self)");  // simran
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd health-backend && npx vitest run test/ics.test.js`
Expected: FAIL — `Cannot find module '../src/ics'`.

- [ ] **Step 3: Write minimal implementation**

Create `health-backend/src/ics.js`:

```js
const DAY_BYDAY = { office: "MO,TU,WE", wfh: "TH,FR", saturday: "SA", sunday: "SU" };
const DAY_REFDATE = { office: "20240101", wfh: "20240104", saturday: "20240106", sunday: "20240107" };
const DAY_ORDER = ["office", "wfh", "saturday", "sunday"];

function escapeIcs(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function addMinutes(hhmm, add) {
  const [h, m] = hhmm.split(":").map(n => parseInt(n, 10));
  let total = h * 60 + m + add;
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return hh + mm + "00";
}

function eventBlock(ev) {
  const refDate = DAY_REFDATE[ev.dayType];
  const start = ev.time.replace(":", "") + "00";
  const end = addMinutes(ev.time, 15);
  const descParts = [];
  if (ev.details) descParts.push(ev.details);
  if (ev.notes) descParts.push(ev.notes);
  const desc = escapeIcs(descParts.join(" — "));
  const lines = [
    "BEGIN:VEVENT",
    "UID:" + ev.id + "@health.shahayush.com",
    "DTSTART:" + refDate + "T" + start,
    "DTEND:" + refDate + "T" + end,
    "RRULE:FREQ=WEEKLY;BYDAY=" + DAY_BYDAY[ev.dayType],
    "SUMMARY:" + escapeIcs(ev.activity)
  ];
  if (desc) lines.push("DESCRIPTION:" + desc);
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:" + escapeIcs(ev.activity),
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT"
  );
  return lines;
}

function buildIcs(parseResult, person, options) {
  const opts = options || {};
  const calname = opts.calname || "Health";
  const out = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//shahayush//health//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + calname
  ];
  for (const dayType of DAY_ORDER) {
    const events = parseResult.schedule[dayType][person] || [];
    for (const ev of events) out.push.apply(out, eventBlock(ev));
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { escapeIcs, buildIcs };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd health-backend && npx vitest run test/ics.test.js`
Expected: PASS — all cases green.

- [ ] **Step 5: Commit**

```bash
git add health-backend/src/ics.js health-backend/test/ics.test.js
git commit -m "feat(health): generate .ics reminder feed"
```

---

### Task 6: Log parsing + token auth (pure)

**Files:**
- Create: `health-backend/src/log.js`
- Create: `health-backend/test/log.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (exported from `log.js`):
  - `parseLogRows(values) -> Row[]` where
    `Row = { timestamp, date, person, itemId, itemLabel, done }` (skips header row)
  - `filterLogByDate(rows, date) -> Row[]`
  - `isAuthorized(provided, expected) -> boolean`
  - `LOG_HEADER -> string[]` (the canonical Log-tab header, reused by `Code.js`)

- [ ] **Step 1: Write the failing test**

Create `health-backend/test/log.test.js`:

```js
const { parseLogRows, filterLogByDate, isAuthorized, LOG_HEADER } = require("../src/log");

const VALUES = [
  ["timestamp", "date", "person", "itemId", "itemLabel", "done"],
  ["2026-07-11T14:00:00Z", "2026-07-11", "ayush", "office:ayush:07:00:gym-strength-together", "Gym Strength", true],
  ["2026-07-11T15:00:00Z", "2026-07-11", "simran", "office:simran:06:00:morning-walk-together", "Morning Walk", true],
  ["2026-07-10T15:00:00Z", "2026-07-10", "ayush", "office:ayush:06:00:morning-walk-together", "Morning Walk", true]
];

describe("parseLogRows", () => {
  it("maps rows to objects and skips the header", () => {
    const rows = parseLogRows(VALUES);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      timestamp: "2026-07-11T14:00:00Z", date: "2026-07-11", person: "ayush",
      itemId: "office:ayush:07:00:gym-strength-together", itemLabel: "Gym Strength", done: true
    });
  });
  it("returns [] for empty input", () => {
    expect(parseLogRows([])).toEqual([]);
    expect(parseLogRows([LOG_HEADER])).toEqual([]);
  });
});

describe("filterLogByDate", () => {
  it("keeps only the given date", () => {
    const rows = parseLogRows(VALUES);
    expect(filterLogByDate(rows, "2026-07-11")).toHaveLength(2);
    expect(filterLogByDate(rows, "2026-07-10")).toHaveLength(1);
  });
});

describe("isAuthorized", () => {
  it("is true only on exact match with a non-empty expected", () => {
    expect(isAuthorized("abc", "abc")).toBe(true);
    expect(isAuthorized("abc", "xyz")).toBe(false);
    expect(isAuthorized("", "")).toBe(false);
    expect(isAuthorized(undefined, "abc")).toBe(false);
    expect(isAuthorized("abc", null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd health-backend && npx vitest run test/log.test.js`
Expected: FAIL — `Cannot find module '../src/log'`.

- [ ] **Step 3: Write minimal implementation**

Create `health-backend/src/log.js`:

```js
const LOG_HEADER = ["timestamp", "date", "person", "itemId", "itemLabel", "done"];

function parseLogRows(values) {
  const rows = values || [];
  const out = [];
  for (let i = 1; i < rows.length; i++) { // skip header row
    const r = rows[i];
    if (!r || String(r[3] == null ? "" : r[3]).trim() === "") continue;
    out.push({
      timestamp: r[0], date: String(r[1]), person: String(r[2]),
      itemId: String(r[3]), itemLabel: String(r[4] == null ? "" : r[4]),
      done: r[5] === true || String(r[5]).toLowerCase() === "true"
    });
  }
  return out;
}

function filterLogByDate(rows, date) {
  return (rows || []).filter(r => r.date === date);
}

function isAuthorized(provided, expected) {
  return typeof provided === "string" && typeof expected === "string" &&
    expected.length > 0 && provided === expected;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LOG_HEADER, parseLogRows, filterLogByDate, isAuthorized };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd health-backend && npx vitest run test/log.test.js`
Expected: PASS — all cases green.

- [ ] **Step 5: Run the full suite**

Run: `cd health-backend && npm test`
Expected: all five test files pass (`smoke`, `parser-helpers`, `parse-schedule`, `ics`, `log`).

- [ ] **Step 6: Commit**

```bash
git add health-backend/src/log.js health-backend/test/log.test.js
git commit -m "feat(health): add log parsing and token auth helpers"
```

---

### Task 7: Apps Script wrappers + deploy

**Files:**
- Create: `health-backend/src/Code.js` (pushed to Apps Script as `Code.gs`)
- Create: `health-backend/src/appsscript.json`
- Create: `health-backend/.clasp.json` (git-ignored; created during deploy)
- Create: `health-backend/DEPLOY.md` (setup + verification runbook)

**Interfaces:**
- Consumes globals available in Apps Script scope after `clasp push`:
  `parseSchedule` (parser.gs), `buildIcs` (ics.gs), `parseLogRows`,
  `filterLogByDate`, `isAuthorized`, `LOG_HEADER` (log.gs).
- Produces the deployed web-app endpoints:
  - `GET ?token=…` → full `ParseResult` JSON
  - `GET ?token=…&format=ics&person=ayush` → `.ics` feed
  - `GET ?token=…&action=log&date=YYYY-MM-DD` → `{ rows: Row[] }`
  - `GET` with `&callback=fn` → JSONP wrapper of the above
  - `POST` (text/plain body) `{ token, date, person, itemId, itemLabel, done }`
    → appends to the Log tab, returns `{ ok: true }`

- [ ] **Step 1: Write `appsscript.json`**

Create `health-backend/src/appsscript.json`:

```json
{
  "timeZone": "America/Los_Angeles",
  "dependencies": {},
  "webapp": { "access": "ANYONE_ANONYMOUS", "executeAs": "USER_DEPLOYING" },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

- [ ] **Step 2: Write `Code.js`**

Create `health-backend/src/Code.js`:

```js
// Thin Apps Script wrappers. Runs ONLY inside Apps Script (uses SpreadsheetApp,
// PropertiesService). The pure functions come from parser.gs, ics.gs, log.gs.

var SCHEDULE_TAB = "Schedule"; // rename to the actual schedule tab name if different
var LOG_TAB = "Log";

function scriptToken_() {
  return PropertiesService.getScriptProperties().getProperty("API_TOKEN");
}

function scheduleValues_() {
  var sh = SpreadsheetApp.getActive().getSheetByName(SCHEDULE_TAB);
  return sh.getDataRange().getValues();
}

function logSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(LOG_TAB);
  if (!sh) {
    sh = ss.insertSheet(LOG_TAB);
    sh.appendRow(LOG_HEADER);
    sh.hideSheet();
  }
  return sh;
}

function readLog_() {
  return parseLogRows(logSheet_().getDataRange().getValues());
}

function jsonOut_(obj, callback) {
  var body = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + body + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(body)
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var cb = p.callback;
  if (!isAuthorized(p.token, scriptToken_())) {
    return jsonOut_({ error: "unauthorized" }, cb);
  }
  if (p.format === "ics") {
    var person = p.person === "simran" ? "simran" : "ayush";
    var ics = buildIcs(parseSchedule(scheduleValues_()), person,
      { calname: "Health · " + (person === "simran" ? "Simran" : "Ayush") });
    return ContentService.createTextOutput(ics)
      .setMimeType(ContentService.MimeType.ICAL);
  }
  if (p.action === "log") {
    return jsonOut_({ rows: filterLogByDate(readLog_(), p.date) }, cb);
  }
  return jsonOut_(parseSchedule(scheduleValues_()), cb);
}

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return jsonOut_({ error: "bad_json" });
  }
  if (!isAuthorized(payload.token, scriptToken_())) {
    return jsonOut_({ error: "unauthorized" });
  }
  logSheet_().appendRow([
    new Date().toISOString(),
    String(payload.date || ""),
    String(payload.person || ""),
    String(payload.itemId || ""),
    String(payload.itemLabel || ""),
    payload.done === true
  ]);
  return jsonOut_({ ok: true });
}
```

Note: Apps Script has no `MimeType.ICAL` in older runtimes — if `clasp push`
or execution reports it as undefined, replace that line with
`.setMimeType(ContentService.MimeType.TEXT)`; iOS still accepts the subscription.

- [ ] **Step 3: Write the deploy runbook**

Create `health-backend/DEPLOY.md`:

```markdown
# Deploying the Health backend (Apps Script via clasp)

## One-time setup
1. `cd health-backend && npm install`
2. `npx clasp login` (opens a browser; authorize the Google account that OWNS
   the diet/fitness Sheet).
3. Enable the Apps Script API once at https://script.google.com/home/usersettings
4. Create a container-bound script tied to the Sheet:
   `npx clasp create --type sheets --title "Health Backend" --rootDir src`
   (or `npx clasp clone <scriptId>` if the Sheet already has a bound script).
   This writes `.clasp.json` (git-ignored).
5. In `src/Code.js`, set `SCHEDULE_TAB` to the exact name of the schedule tab.

## Push + configure
6. `npx clasp push` — uploads `src/*.js` (as `.gs`) and `appsscript.json`.
7. Set the API token: open the script (`npx clasp open`), then
   Project Settings → Script Properties → add `API_TOKEN` = a long random string.
   Keep this value; the front-end and calendar URLs need it.

## Deploy the web app
8. `npx clasp deploy --description "v1"` → note the deployment's web-app URL
   (`https://script.google.com/macros/s/<id>/exec`).
   (Or Deploy → New deployment → Web app: execute as **me**, access **Anyone**.)

## Verify (curl — CORS is a browser concern, verified in the front-end plan)
9. Schedule JSON:
   `curl -sL "<EXEC_URL>?token=<API_TOKEN>" | head -c 400`
   Expect JSON starting with `{"schedule":{"office":{"ayush":[`.
10. Unauthorized is rejected:
    `curl -sL "<EXEC_URL>?token=wrong"` → `{"error":"unauthorized"}`.
11. Calendar feed:
    `curl -sL "<EXEC_URL>?token=<API_TOKEN>&format=ics&person=ayush" | head`
    Expect `BEGIN:VCALENDAR` … with `BEGIN:VEVENT` / `RRULE` / `BEGIN:VALARM`.
12. Check-off write:
    `curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
      --data '{"token":"<API_TOKEN>","date":"2026-07-11","person":"ayush","itemId":"office:ayush:07:00:gym-strength-together","itemLabel":"Gym","done":true}'`
    Expect `{"ok":true}`; confirm a new row in the hidden **Log** tab.
13. Log read:
    `curl -sL "<EXEC_URL>?token=<API_TOKEN>&action=log&date=2026-07-11"`
    Expect `{"rows":[{...itemId...}]}`.

## Reminders (one-time, each phone)
14. On each iPhone: Settings → Calendar → Accounts → Add Account → Other →
    Add Subscribed Calendar → URL:
    `<EXEC_URL>?token=<API_TOKEN>&format=ics&person=ayush` (or `simran`).
```

- [ ] **Step 4: Deploy and run the verification runbook**

Follow `health-backend/DEPLOY.md` steps 1–13. All curl checks must return the
expected output before considering the backend done. (Step 14 is per-phone setup.)

- [ ] **Step 5: Commit**

```bash
git add health-backend/src/Code.js health-backend/src/appsscript.json health-backend/DEPLOY.md
git commit -m "feat(health): add apps script web-app wrappers and deploy runbook"
```

---

## Notes for the front-end plan (next)

- The front-end consumes the **Data model contract** above verbatim.
- **Meal-prep aggregation** (batch-cook + grocery rollup) and the
  **day-of-week → day-type** mapping are computed **client-side** from the JSON;
  they are intentionally *not* in the backend.
- The front-end will need the deployed **exec URL** + **API_TOKEN** as config
  (shipped in client JS — acceptable per the spec's security section).
- CORS: front-end GET uses normal `fetch`; check-off POST uses
  `Content-Type: text/plain` (no preflight). JSONP `callback` is the fallback.
```
