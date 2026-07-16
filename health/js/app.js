(function () {
  var state = {
    schedule: null, gym: [], principles: [],
    dayType: dayTypeForWeekday(new Date().getDay()),
    me: null, person: "ayush", tab: "home", log: {}, rename: {} // me = this device's owner; log: { itemId: true }
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
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]; }); }

  function renderPersonColumn(person) {
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

  function bothColumns(render) {
    var row = el("div", "row");
    ["ayush", "simran"].forEach(function (p) {
      var col = el("div", "col");
      col.appendChild(el("div", "col-head", CONFIG.PERSON_LABELS[p]));
      col.appendChild(render(p));
      row.appendChild(col);
    });
    return row;
  }

  function renderBoth() { return bothColumns(renderPersonColumn); }

  function renderHome() {
    var panel = document.getElementById("tab-home");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
    if (state.person === "both") panel.appendChild(renderBoth());
    else panel.appendChild(renderPersonColumn(state.person));
  }

  var foodMode = "today";

  function renderFoodTodayColumn(person) {
    var wrap = el("div");
    var meals = eventsFor(person).filter(function (e) { return e.kind === "meal"; });
    var pt = proteinTotal(meals), ct = calorieTotal(meals), target = PROTEIN_TARGET[person] || 150;
    var tot = el("div", "card");
    tot.innerHTML = '<div class="lbl">' + esc(CONFIG.PERSON_LABELS[person]) + ' · protein ' + pt + ' / ' + target + ' g</div>' +
      '<div class="prog"><div style="width:' + Math.min(100, Math.round(pt / target * 100)) + '%"></div></div>' +
      '<div class="count">~' + ct + ' kcal today</div>';
    wrap.appendChild(tot);
    var list = el("div", "card");
    meals.forEach(function (m) {
      list.appendChild(el("div", "item",
        '<div class="t">' + esc(m.timeLabel) + '</div><div class="col"><div class="a">' + esc(m.activity) + '</div>' +
        '<div class="det">' + esc(m.details) + '</div>' +
        (m.calories ? '<div class="count" style="color:var(--ok)">' + m.calories + ' kcal' + (m.protein ? ' · ' + m.protein + 'g protein' : '') + '</div>' : '') +
        '</div>'));
    });
    wrap.appendChild(list);
    return wrap;
  }

  function renderCookColumn(person) {
    var rollup = mealPrepRollup(officeEvents(person), OFFICE_DAY_COUNT); // office template, regardless of today
    var cook = el("div", "card");
    cook.innerHTML = '<h2>🍳 Batch cook (office week ×' + OFFICE_DAY_COUNT + ')</h2>';
    rollup.forEach(function (r) {
      cook.appendChild(el("div", "item", '<div class="col"><div class="a">' + esc(r.activity) + '</div><div class="det">' + esc(r.details) + '</div></div><div class="t">×' + r.count + '</div>'));
    });
    return cook;
  }

  function renderFood() {
    var panel = document.getElementById("tab-food");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
    var seg = el("div", "seg");
    seg.innerHTML = '<button data-mode="today" class="' + (foodMode === "today" ? "on" : "") + '">Today</button>' +
      '<button data-mode="prep" class="' + (foodMode === "prep" ? "on" : "") + '">Meal prep</button>';
    seg.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) { foodMode = b.dataset.mode; renderFood(); } });
    panel.appendChild(seg);

    if (foodMode === "today") {
      if (state.person === "both") panel.appendChild(bothColumns(renderFoodTodayColumn));
      else panel.appendChild(renderFoodTodayColumn(state.person));
    } else {
      if (state.person === "both") panel.appendChild(bothColumns(renderCookColumn));
      else panel.appendChild(renderCookColumn(state.person));
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

  function renderGym() {
    var panel = document.getElementById("tab-gym");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
    var today = ({ 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 0: "Sunday" })[new Date().getDay()];
    var todays = state.gym.filter(function (g) { return g.day === today; });
    if (todays.length) {
      var t = el("div", "card now you");
      t.innerHTML = '<div class="lbl">Today · ' + esc(today) + '</div><div class="act" style="font-size:15px">' +
        esc(todays[0].focusAyush) + '</div><div class="det">' + esc((CONFIG.PERSON_LABELS && CONFIG.PERSON_LABELS.simran) || "") + ': ' + esc(todays[0].focusSimran) + ' · ' + esc(todays[0].type) + '</div>';
      panel.appendChild(t);
    }
    var wk = el("div", "card");
    wk.innerHTML = '<h2>Weekly split</h2>';
    state.gym.forEach(function (g) {
      wk.appendChild(el("div", "item", '<div class="t">' + esc(g.day) + '</div><div class="col"><div class="a">' +
        esc(g.focusAyush) + '</div><div class="det">' + esc((CONFIG.PERSON_LABELS && CONFIG.PERSON_LABELS.simran) || "") + ': ' + esc(g.focusSimran) + '</div></div>'));
    });
    panel.appendChild(wk);
  }

  function renderRules() {
    var panel = document.getElementById("tab-rules");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
    var sub = el("div", "card");
    sub.innerHTML = '<h2>🔔 Reminders</h2><div class="det">Add once per phone: Settings → Calendar → Add Subscribed Calendar.</div>';
    ["ayush", "simran"].forEach(function (p) {
      var link = CONFIG.EXEC_URL + "?token=" + encodeURIComponent((getSession() && getSession().token) || "") + "&format=ics&person=" + p;
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
    var who = el("div", "card");
    who.innerHTML = '<div class="det">Signed in as <b>' + esc(state.name || "—") + '</b>. ' +
      '<a href="#" id="logout" style="color:var(--accent)">Log out</a></div>';
    who.querySelector("#logout").addEventListener("click", function (e) { e.preventDefault(); logout(); });
    panel.appendChild(who);
  }

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
    document.getElementById("tab-home").addEventListener("click", function (e) {
      var btn = e.target.closest(".check"); if (!btn) return;
      var id = btn.dataset.id, label = btn.dataset.label, person = btn.dataset.person;
      var nowOn = !state.log[id];
      if (nowOn) state.log[id] = true; else delete state.log[id];
      renderHome();
      postCheckoff({ date: todayISO(), person: person, itemId: id, itemLabel: label, done: nowOn })
        .then(function (r) { if (!r || r.ok !== true) showBanner("Check-off didn't sync — try again when online"); });
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
    var session = getSession();
    if (session && session.token) { applySession(session); loadData(); }
    else renderLogin();
  }

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

  // expose for Task 7 & 8 to extend
  window.HealthApp = { state: state, renderActiveTab: renderActiveTab, todayISO: todayISO, esc: esc, el: el, eventsFor: eventsFor, showBanner: showBanner };

  document.addEventListener("DOMContentLoaded", boot);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js"); });
  }
})();
