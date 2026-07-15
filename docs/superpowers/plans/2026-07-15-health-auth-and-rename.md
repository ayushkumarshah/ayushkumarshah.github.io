# Health Companion — 2-Person Login + "Saanu" Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live `/health` app private to two users via real backend auth (Apps Script validates hashed credentials and issues the token), replace the per-device "who am I?" picker with login-derived identity, remove all names/token from the public files, and display "Simran" as "Saanu".

**Architecture:** A new pure `auth.js` module (dual-runtime, unit-tested) holds the username→person/name mapping and the login-response builder; thin Apps Script wrappers in `Code.js` do the SHA-256 hash check and expose a `doPost action:"login"`. The front-end `config.js` loses the token and names; `api.js` gains a login call + a localStorage session that supplies the token; `app.js` shows a generic login screen, applies the session as identity, and runs a pure `applyRename` pass over fetched data.

**Tech Stack:** Google Apps Script (V8), vanilla JS PWA, vitest (dev-only) in `health-backend/` and `health-frontend/`.

## Global Constraints

Apply to **every** task. Copy values verbatim.

- **Two accounts (usernames lowercase):** `ayush` → `{ person:"ayush", name:"Ayush" }`; `saanu` → `{ person:"simran", name:"Saanu" }`. The **data person keys stay `ayush`/`simran`** (the sheet is untouched); `saanu` maps to person `simran`.
- **Display maps:** `PEOPLE = { ayush:"Ayush", simran:"Saanu" }`; `RENAME = { "Simran":"Saanu" }`.
- **Login response shape (exact):** `{ ok:true, token, person, name, people:PEOPLE, rename:RENAME }`. Failure: `{ ok:false, error:"invalid" }` — the **same** for unknown user and bad password (no enumeration).
- **Password hashing:** hex **SHA-256** of `SALT + password`, `SALT` a fixed constant in `Code.js` (server-side only). Stored as Script Property `USER_<username>`. Never plaintext, never sent to the client.
- **No secrets/names in public files:** `config.js` holds only `EXEC_URL`. No token, no `PERSON_LABELS`, no hardcoded person names anywhere under `health/` static files — names arrive via the authed login response.
- **Session:** localStorage key `"health.session"` = the login response JSON. Data/ics/log endpoints are unchanged and still require the `token` (now sourced from the session).
- **CORS:** POST (login and check-off) uses `Content-Type: text/plain`. GET stays token-in-query.
- **Dual-runtime pure modules:** end with `if (typeof module !== "undefined" && module.exports) { module.exports = { … }; }`; no ESM. Tests use vitest globals (never `require("vitest")`).
- **Path stays `/health`.** Bump the service-worker cache to `health-v3`.
- **Rollout:** rotate `API_TOKEN` (the old one is public in git history) and run `setUser` for both accounts.

### File map
- `health-backend/src/auth.js` — **new** pure: `ACCOUNTS`, `PEOPLE`, `RENAME`, `accountFor`, `buildLoginResponse`.
- `health-backend/src/Code.js` — **modify**: `SALT`, `hashPassword_`, `setUser`, `doPost` login branch.
- `health-backend/test/auth.test.js` — **new**.
- `health/js/schedule.js` — **modify**: add pure `applyRename`.
- `health/js/api.js` — **modify**: session helpers + `login` + token-from-session.
- `health/js/app.js` — **modify**: login screen, session-as-identity, remove picker, logout, rename wiring.
- `health/config.js` — **modify**: `EXEC_URL` only.
- `health/app.css` — **modify**: login form styles.
- `health/sw.js` — **modify**: cache `health-v3`.
- `health-frontend/test/rename.test.js` — **new**; `health-frontend/test/api.test.js` — **modify**.
- `health-backend/AUTH.md` — **new**: setup/rotate runbook.

---

### Task 1: Backend auth module (pure)

**Files:**
- Create: `health-backend/src/auth.js`
- Create: `health-backend/test/auth.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces (exported): `ACCOUNTS`, `PEOPLE`, `RENAME`, `accountFor(username) -> {person,name}|null`, `buildLoginResponse(account, token) -> {ok,token,person,name,people,rename}`.

- [ ] **Step 1: Write the failing test**

`health-backend/test/auth.test.js`:
```js
const { accountFor, buildLoginResponse, PEOPLE, RENAME } = require("../src/auth");

describe("accountFor", () => {
  it("maps usernames to person + name (case-insensitive)", () => {
    expect(accountFor("ayush")).toEqual({ person: "ayush", name: "Ayush" });
    expect(accountFor("saanu")).toEqual({ person: "simran", name: "Saanu" });
    expect(accountFor("SAANU")).toEqual({ person: "simran", name: "Saanu" });
  });
  it("returns null for unknown users", () => {
    expect(accountFor("bob")).toBeNull();
    expect(accountFor("")).toBeNull();
  });
});

describe("buildLoginResponse", () => {
  it("returns the exact success shape", () => {
    const acct = accountFor("saanu");
    expect(buildLoginResponse(acct, "TOK")).toEqual({
      ok: true, token: "TOK", person: "simran", name: "Saanu",
      people: { ayush: "Ayush", simran: "Saanu" },
      rename: { "Simran": "Saanu" }
    });
  });
  it("exposes the shared maps", () => {
    expect(PEOPLE).toEqual({ ayush: "Ayush", simran: "Saanu" });
    expect(RENAME).toEqual({ "Simran": "Saanu" });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-backend && npx vitest run test/auth.test.js`
Expected: FAIL — `Cannot find module '../src/auth'`.

- [ ] **Step 3: Implement `health-backend/src/auth.js`**

```js
var ACCOUNTS = {
  ayush: { person: "ayush", name: "Ayush" },
  saanu: { person: "simran", name: "Saanu" }
};
var PEOPLE = { ayush: "Ayush", simran: "Saanu" };
var RENAME = { "Simran": "Saanu" };

function accountFor(username) {
  var key = String(username == null ? "" : username).toLowerCase();
  return Object.prototype.hasOwnProperty.call(ACCOUNTS, key) ? ACCOUNTS[key] : null;
}

function buildLoginResponse(account, token) {
  return {
    ok: true, token: token, person: account.person, name: account.name,
    people: PEOPLE, rename: RENAME
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ACCOUNTS, PEOPLE, RENAME, accountFor, buildLoginResponse };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-backend && npx vitest run test/auth.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add health-backend/src/auth.js health-backend/test/auth.test.js
git commit -m "feat(health): add backend auth mapping module"
```

---

### Task 2: Backend login wiring (`Code.js`)

**Files:**
- Modify: `health-backend/src/Code.js`

**Interfaces:**
- Consumes: `accountFor`, `buildLoginResponse` (Apps Script globals from `auth.gs` after push); existing `scriptToken_`, `isAuthorized`, `jsonOut_`, `logSheet_`.
- Produces: `doPost action:"login"` returning the login response; a `setUser(username,password)` editor helper; `hashPassword_`. Not unit-tested (Apps Script `Utilities`/`PropertiesService`); verified by curl + editor.

- [ ] **Step 1: Add the salt + hashing + setUser near the top of `Code.js`**

Insert after the `scriptToken_` function:
```js
// Server-side only (Code.gs is never served to the browser).
var SALT = "health-app-auth-v1::";

function hashPassword_(pw) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, SALT + String(pw), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ("0" + (b & 0xff).toString(16)).slice(-2); }).join("");
}

// Run once per person in the editor: setUser("ayush", "their-password")
function setUser(username, password) {
  PropertiesService.getScriptProperties()
    .setProperty("USER_" + String(username).toLowerCase(), hashPassword_(password));
  Logger.log("Password set for " + username);
}
```

- [ ] **Step 2: Replace `doPost` to handle login before the token-gated check-off**

Replace the entire existing `doPost` function with:
```js
function doPost(e) {
  var payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return jsonOut_({ ok: false, error: "bad_json" });
  }

  if (payload.action === "login") {
    var uname = String(payload.username || "").toLowerCase();
    var acct = accountFor(uname);
    if (acct) {
      var stored = PropertiesService.getScriptProperties().getProperty("USER_" + uname);
      if (stored && stored === hashPassword_(String(payload.password || ""))) {
        return jsonOut_(buildLoginResponse(acct, scriptToken_()));
      }
    }
    return jsonOut_({ ok: false, error: "invalid" });
  }

  // Check-off (token required)
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

- [ ] **Step 3: Confirm the pure suite is unaffected**

Run: `cd health-backend && npm test`
Expected: all existing tests still pass (this task added no new pure tests; `auth.test.js` from Task 1 passes).

- [ ] **Step 4: Deploy + manual verify (requires the user's Google login)**

Follow `health-backend/AUTH.md` (created in Task 6) — in short: `clasp push`, set fresh `API_TOKEN`, run `setUser("ayush",…)` + `setUser("saanu",…)`, create a **new deployment version**, then:
```bash
# valid login → returns token + names
curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
  --data '{"action":"login","username":"saanu","password":"<pw>"}'
# expect: {"ok":true,"token":"...","person":"simran","name":"Saanu","people":{...},"rename":{"Simran":"Saanu"}}
curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
  --data '{"action":"login","username":"saanu","password":"wrong"}'
# expect: {"ok":false,"error":"invalid"}
```

- [ ] **Step 5: Commit**

```bash
git add health-backend/src/Code.js
git commit -m "feat(health): add login endpoint issuing token after hashed-credential check"
```

---

### Task 3: Front-end rename pass (pure, in `schedule.js`)

**Files:**
- Modify: `health/js/schedule.js` (add `applyRename`; extend exports)
- Create: `health-frontend/test/rename.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `applyRename(data, map) -> data` — mutates and returns the ParseResult, replacing each `map` key with its value (exact, case-sensitive) in every event's `activity/details/notes`, each gym row's `focusAyush/focusSimran`, and each principle's `topic/guideline`.

- [ ] **Step 1: Write the failing test**

`health-frontend/test/rename.test.js`:
```js
const { applyRename } = require("../../health/js/schedule.js");

describe("applyRename", () => {
  it("rewrites map keys across events, gym, and principles", () => {
    const data = {
      schedule: {
        office: { ayush: [{ activity: "Walk with Simran", details: "", notes: "see Simran - Diet tab" }],
                  simran: [{ activity: "Yoga", details: "Simran routine", notes: "" }] },
        wfh: { ayush: [], simran: [] }, saturday: { ayush: [], simran: [] }, sunday: { ayush: [], simran: [] }
      },
      gym: [{ day: "Monday", focusAyush: "Lower", focusSimran: "Simran lower", type: "Strength" }],
      principles: [{ topic: "Together Time", guideline: "Dinner with Simran" }]
    };
    const out = applyRename(data, { "Simran": "Saanu" });
    expect(out.schedule.office.ayush[0].activity).toBe("Walk with Saanu");
    expect(out.schedule.office.ayush[0].notes).toBe("see Saanu - Diet tab");
    expect(out.schedule.office.simran[0].details).toBe("Saanu routine");
    expect(out.gym[0].focusSimran).toBe("Saanu lower");
    expect(out.principles[0].guideline).toBe("Dinner with Saanu");
  });
  it("is a no-op for an empty map", () => {
    const data = { schedule: { office:{ayush:[{activity:"X",details:"",notes:""}],simran:[]}, wfh:{ayush:[],simran:[]}, saturday:{ayush:[],simran:[]}, sunday:{ayush:[],simran:[]} }, gym: [], principles: [] };
    expect(applyRename(data, {}).schedule.office.ayush[0].activity).toBe("X");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-frontend && npx vitest run test/rename.test.js`
Expected: FAIL — `applyRename is not a function`.

- [ ] **Step 3: Implement in `health/js/schedule.js`**

Add above the `module.exports` block:
```js
function renameStr_(s, map) {
  var out = String(s == null ? "" : s);
  for (var k in map) { if (Object.prototype.hasOwnProperty.call(map, k)) out = out.split(k).join(map[k]); }
  return out;
}

function applyRename(data, map) {
  if (!data || !map) return data;
  var DAYS = ["office", "wfh", "saturday", "sunday"];
  for (var d = 0; d < DAYS.length; d++) {
    var block = data.schedule[DAYS[d]];
    ["ayush", "simran"].forEach(function (p) {
      (block[p] || []).forEach(function (e) {
        e.activity = renameStr_(e.activity, map);
        e.details = renameStr_(e.details, map);
        e.notes = renameStr_(e.notes, map);
      });
    });
  }
  (data.gym || []).forEach(function (g) {
    g.focusAyush = renameStr_(g.focusAyush, map);
    g.focusSimran = renameStr_(g.focusSimran, map);
  });
  (data.principles || []).forEach(function (x) {
    x.topic = renameStr_(x.topic, map);
    x.guideline = renameStr_(x.guideline, map);
  });
  return data;
}
```

Update the export line to append `applyRename`:
```js
  module.exports = { WEEKDAY_DAYTYPE, dayTypeForWeekday, nowNext, PROTEIN_TARGET, proteinTotal, calorieTotal, applyRename };
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-frontend && npx vitest run test/rename.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add health/js/schedule.js health-frontend/test/rename.test.js
git commit -m "feat(health-fe): add applyRename data pass (Simran->Saanu)"
```

---

### Task 4: Front-end session + login in `api.js`

**Files:**
- Modify: `health/js/api.js`
- Modify: `health-frontend/test/api.test.js`

**Interfaces:**
- Consumes: `CONFIG.EXEC_URL`; `localStorage`.
- Produces (exported, added to existing): `getSession()`, `setSession(s)`, `clearSession()`, `login(username,password) -> Promise<{ok,...}>`. `fetchSchedule/fetchLog/postCheckoff` now read the token from `getSession()` (no `CONFIG.API_TOKEN`).

- [ ] **Step 1: Add failing tests to `health-frontend/test/api.test.js`**

Append:
```js
const { getSession, setSession, clearSession, login } = require("../../health/js/api.js");

describe("session", () => {
  beforeEach(() => { for (const k in store) delete store[k]; });
  it("round-trips and clears", () => {
    expect(getSession()).toBeNull();
    setSession({ token: "T", person: "ayush" });
    expect(getSession()).toEqual({ token: "T", person: "ayush" });
    clearSession();
    expect(getSession()).toBeNull();
  });
  it("returns null on corrupt session", () => {
    store["health.session"] = "{bad";
    expect(getSession()).toBeNull();
  });
});

describe("login", () => {
  it("posts text/plain with action:login and returns the parsed result", async () => {
    let captured = null;
    global.fetch = async (url, opts) => { captured = { url, opts }; return { ok: true, json: async () => ({ ok: true, token: "T", person: "simran" }) }; };
    const r = await login("saanu", "pw");
    expect(captured.url).toBe("https://exec.test/x");
    expect(captured.opts.headers["Content-Type"]).toBe("text/plain");
    expect(JSON.parse(captured.opts.body)).toEqual({ action: "login", username: "saanu", password: "pw" });
    expect(r.token).toBe("T");
  });
  it("returns {ok:false} when the network fails", async () => {
    global.fetch = async () => { throw new Error("offline"); };
    expect(await login("x", "y")).toEqual({ ok: false, error: "network" });
  });
});

describe("fetchSchedule uses the session token", () => {
  beforeEach(() => { for (const k in store) delete store[k]; });
  it("sends the session token, not CONFIG", async () => {
    setSession({ token: "SESS" });
    let url = null;
    global.fetch = async (u) => { url = u; return { ok: true, json: async () => ({ schedule: {} }) }; };
    await fetchSchedule();
    expect(url).toContain("token=SESS");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `cd health-frontend && npx vitest run test/api.test.js`
Expected: FAIL — `getSession is not a function` (and the token assertion fails).

- [ ] **Step 3: Implement in `health/js/api.js`**

Add session + login helpers (above the existing fetch functions):
```js
var SESSION_KEY = "health.session";

function getSession() {
  try { var raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function setSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {} }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

function sessionToken_() { var s = getSession(); return s && s.token ? s.token : ""; }

function login(username, password) {
  return fetch(CONFIG.EXEC_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "login", username: username, password: password })
  })
    .then(function (r) { return r.json(); })
    .catch(function () { return { ok: false, error: "network" }; });
}
```

Then change the three fetch functions to use `sessionToken_()` in place of `CONFIG.API_TOKEN`:
- In `fetchSchedule`: `var url = CONFIG.EXEC_URL + "?token=" + encodeURIComponent(sessionToken_());`
- In `fetchLog`: `var url = CONFIG.EXEC_URL + "?token=" + encodeURIComponent(sessionToken_()) + "&action=log&date=" + encodeURIComponent(date);`
- In `postCheckoff`: change the body merge from `Object.assign({ token: CONFIG.API_TOKEN }, payload)` to `Object.assign({ token: sessionToken_() }, payload)`.

Update the export line to include the new functions:
```js
  module.exports = { cacheGet, cacheSet, fetchSchedule, fetchLog, postCheckoff, getSession, setSession, clearSession, login };
```

- [ ] **Step 4: Run to verify pass**

Run: `cd health-frontend && npx vitest run test/api.test.js`
Expected: PASS (existing api tests + the new session/login/token cases).

- [ ] **Step 5: Full front-end suite**

Run: `cd health-frontend && npm test`
Expected: all files pass (`smoke`, `schedule`, `mealprep`, `rename`, `api`).

- [ ] **Step 6: Commit**

```bash
git add health/js/api.js health-frontend/test/api.test.js
git commit -m "feat(health-fe): session storage + login call; token from session"
```

---

### Task 5: Wire auth into the app (`config.js`, `app.js`, `app.css`, `sw.js`)

**Files:**
- Modify: `health/config.js`, `health/js/app.js`, `health/app.css`, `health/sw.js`

**Interfaces:**
- Consumes: `login`, `getSession`, `setSession`, `clearSession` (api.js); `applyRename` (schedule.js).
- Produces: a login-gated app. Browser-only — verify with `node --check` + manual. Removes the per-device identity picker entirely.

- [ ] **Step 1: Strip the token + names from `health/config.js`**

Replace the whole file with:
```js
// Only the backend URL is public. The token + names are issued by login.
window.CONFIG = {
  EXEC_URL: "https://script.google.com/macros/s/AKfycbxfTeey06yZCJ3I2xbj1YxkdOAqq6g49ZxCTvBAilNc349qWcpsNz6PQW3XnpoAJl2N/exec"
};
```

- [ ] **Step 2: Add login-form styles to `health/app.css`**

Append:
```css
.picker input { display:block; width:100%; margin:8px 0; padding:12px; border:1px solid var(--line); border-radius:10px; background:var(--bg); color:var(--fg); font-size:15px; }
.picker .err { color:#f87171; font-size:12px; min-height:16px; margin-top:4px; }
```

- [ ] **Step 3: In `health/js/app.js`, remove the old identity picker and add session identity**

Replace the identity block — the `NAMES` constant and the `applyIdentity` / `forgetIdentity` / `ensureIdentity` functions — with this session-based version. (Delete `var NAMES = {…};` and those three functions; keep `setPerson`.)

```js
  // Identity comes from the login session. "You" = the logged-in person.
  function applySession(session) {
    state.me = session.person;
    state.person = session.person;
    state.name = session.name || "";
    state.rename = session.rename || {};
    var people = session.people || {};
    var other = session.person === "ayush" ? "simran" : "ayush";
    CONFIG.PERSON_LABELS = {};
    CONFIG.PERSON_LABELS[session.person] = "You";
    CONFIG.PERSON_LABELS[other] = people[other] || other;
    document.getElementById("personSwitch").innerHTML =
      '<button data-person="' + session.person + '" class="on">You</button>' +
      '<button data-person="' + other + '">' + esc(people[other] || other) + '</button>' +
      '<button data-person="both">Both</button>';
  }

  function logout() { clearSession(); location.reload(); }

  function renderLogin() {
    var ov = el("div", "overlay");
    ov.innerHTML = '<div class="picker"><h2>Sign in</h2>' +
      '<input id="lgUser" placeholder="Username" autocapitalize="none" autocomplete="username">' +
      '<input id="lgPass" type="password" placeholder="Password" autocomplete="current-password">' +
      '<div class="err" id="lgErr"></div>' +
      '<button id="lgGo">Log in</button></div>';
    document.body.appendChild(ov);
    function submit() {
      var u = ov.querySelector("#lgUser").value.trim();
      var p = ov.querySelector("#lgPass").value;
      ov.querySelector("#lgErr").textContent = "";
      login(u, p).then(function (r) {
        if (r && r.ok) {
          setSession(r);
          if (ov.parentNode) ov.parentNode.removeChild(ov);
          applySession(r); loadData();
        } else if (r && r.error === "network") {
          ov.querySelector("#lgErr").textContent = "Can’t reach server — check connection";
        } else {
          ov.querySelector("#lgErr").textContent = "Invalid username or password";
        }
      });
    }
    ov.querySelector("#lgGo").addEventListener("click", submit);
    ov.querySelector("#lgPass").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  }
```

- [ ] **Step 4: Update `boot`/`loadData` to gate on the session and apply the rename**

Replace the `boot` function with:
```js
  function boot() {
    wire();
    var session = getSession();
    if (session && session.token) { applySession(session); loadData(); }
    else renderLogin();
  }
```

In `loadData`, (a) apply the rename after fetch and (b) drop the session on unauthorized. Replace the `fetchSchedule().then(...)` body's success branch:
```js
  function loadData() {
    fetchSchedule().then(function (res) {
      if (res.data && res.data.error === "unauthorized") { clearSession(); location.reload(); return; }
      if (!res.data || !res.data.schedule) { showBanner("No data — check connection"); return; }
      applyRename(res.data, state.rename || {});
      state.schedule = res.data.schedule; state.gym = res.data.gym || []; state.principles = res.data.principles || [];
      if (res.stale) showBanner("Showing saved copy (offline)");
      return fetchLog(todayISO()).then(function (rows) {
        rows.forEach(function (r) { if (r.done) state.log[r.itemId] = true; else delete state.log[r.itemId]; });
        renderActiveTab();
      });
    });
  }
```

Also add `rename: {}` to the initial `state` object (alongside `log: {}`).

- [ ] **Step 5: Replace the "switch user" line in `renderRules` with a Log out button**

In `renderRules`, replace the `who`/`switchUser` block with:
```js
    var who = el("div", "card");
    who.innerHTML = '<div class="det">Signed in as <b>' + esc(state.name || "—") + '</b>. ' +
      '<a href="#" id="logout" style="color:var(--accent)">Log out</a></div>';
    who.querySelector("#logout").addEventListener("click", function (e) { e.preventDefault(); logout(); });
    panel.appendChild(who);
```

- [ ] **Step 6: Bump the service-worker cache in `health/sw.js`**

Change `var CACHE = "health-v2";` to `var CACHE = "health-v3";`.

- [ ] **Step 7: Syntax check + suite**

Run:
```bash
cd health && node --check js/app.js && node --check js/api.js && node --check js/schedule.js && node --check sw.js && echo ok
cd ../health-frontend && npm test
```
Expected: `ok` and all front-end tests pass.

- [ ] **Step 8: Manual browser verification (deferred to user / reviewer with a browser)**

After the backend (Task 2) is deployed with users set: serve locally (`cd health && python3 -m http.server 8080`), open `http://localhost:8080/`. Verify: a **generic login form** appears (view-source shows no names/token); wrong password → "Invalid…"; correct login → the right person's app, "Saanu" shown throughout; **Log out** (Rules) → back to login.

- [ ] **Step 9: Commit**

```bash
git add health/config.js health/js/app.js health/app.css health/sw.js
git commit -m "feat(health-fe): login screen + session identity; remove device picker; wire rename"
```

---

### Task 6: Rollout runbook

**Files:**
- Create: `health-backend/AUTH.md`

**Interfaces:**
- Consumes: the deployed backend.
- Produces: the documented setup/rotate steps. No code; documentation.

- [ ] **Step 1: Write `health-backend/AUTH.md`**

```markdown
# Health auth — setup & rotation

## One-time setup (Apps Script editor)
1. `cd health-backend && npx clasp push --force`  (pushes auth.gs + Code.gs)
2. Reload the editor tab. Set the passwords — run each once in the editor:
   - `setUser("ayush", "<ayush-password>")`
   - `setUser("saanu", "<saanu-password>")`
   (View → Execution log shows "Password set for …".)
3. **Rotate the API token** (the old one is public in git history):
   Project Settings → Script Properties → set `API_TOKEN` to a fresh value
   (`openssl rand -hex 16`). No client change needed — login now issues it.
4. Deploy → Manage deployments → Edit → **New version** → Deploy.

## Verify (curl)
```bash
curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
  --data '{"action":"login","username":"ayush","password":"<pw>"}'   # {"ok":true,"token":...}
curl -sL -X POST "<EXEC_URL>" -H "Content-Type: text/plain" \
  --data '{"action":"login","username":"ayush","password":"nope"}'   # {"ok":false,"error":"invalid"}
curl -sL "<EXEC_URL>?token=<OLD_TOKEN>"    # {"error":"unauthorized"} after rotation
```

## Change a password
Re-run `setUser("<username>", "<new-password>")` in the editor. No redeploy needed.

## Rotate the token (e.g., lost device)
Set a new `API_TOKEN` Script Property. Everyone re-logs in (their stored session
token becomes unauthorized → app returns them to the login screen).
```

- [ ] **Step 2: Commit**

```bash
git add health-backend/AUTH.md
git commit -m "docs(health): auth setup and rotation runbook"
```

---

## Notes
- **Token rotation is mandatory** in rollout — the old token sits in public git history.
- The data person keys (`ayush`/`simran`) and the sheet are unchanged; only the *display* becomes "Saanu".
- The weight + exercise-history feature remains a separate, later spec.
