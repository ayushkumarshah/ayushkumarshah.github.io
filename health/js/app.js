(function () {
  var state = {
    schedule: null, gym: [], principles: [],
    dayType: dayTypeForWeekday(new Date().getDay()),
    me: null, person: "ayush", tab: "home", log: {} // me = this device's owner; log: { itemId: true }
  };
  var NAMES = { ayush: "Ayush", simran: "Simran" };

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

  var foodMode = "today";
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

  function renderGym() {
    var panel = document.getElementById("tab-gym");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
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

  function renderRules() {
    var panel = document.getElementById("tab-rules");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
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
    var who = el("div", "card");
    who.innerHTML = '<div class="det">This phone is <b>' + esc(NAMES[state.me] || "—") + '</b>. ' +
      '<a href="#" id="switchUser" style="color:var(--accent)">Not you? Switch</a></div>';
    who.querySelector("#switchUser").addEventListener("click", function (e) { e.preventDefault(); forgetIdentity(); });
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

  // Per-device identity: "You" = the person who owns this phone.
  function applyIdentity(me) {
    var other = me === "ayush" ? "simran" : "ayush";
    state.me = me;
    state.person = me;
    CONFIG.PERSON_LABELS = {};
    CONFIG.PERSON_LABELS[me] = "You";
    CONFIG.PERSON_LABELS[other] = NAMES[other];
    document.getElementById("personSwitch").innerHTML =
      '<button data-person="' + me + '" class="on">You</button>' +
      '<button data-person="' + other + '">' + NAMES[other] + '</button>' +
      '<button data-person="both">Both</button>';
  }

  function forgetIdentity() {
    try { localStorage.removeItem("health.me"); } catch (e) {}
    location.reload();
  }

  function ensureIdentity(cb) {
    var stored = null;
    try { stored = localStorage.getItem("health.me"); } catch (e) {}
    if (stored === "ayush" || stored === "simran") { applyIdentity(stored); cb(); return; }
    var ov = el("div", "overlay");
    ov.innerHTML = '<div class="picker"><h2>Who’s using this phone?</h2>' +
      '<button data-me="ayush">I’m Ayush</button>' +
      '<button data-me="simran">I’m Simran</button></div>';
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-me]"); if (!b) return;
      try { localStorage.setItem("health.me", b.dataset.me); } catch (e2) {}
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      applyIdentity(b.dataset.me); cb();
    });
    document.body.appendChild(ov);
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
    ensureIdentity(loadData);
  }

  function loadData() {
    fetchSchedule().then(function (res) {
      if (!res.data) { showBanner("No data — check config / connection"); return; }
      state.schedule = res.data.schedule; state.gym = res.data.gym || []; state.principles = res.data.principles || [];
      if (res.stale) showBanner("Showing saved copy (offline)");
      return fetchLog(todayISO()).then(function (rows) {
        // Log is append-only; rows arrive in chronological order → last write wins.
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
