(function () {
  var state = {
    schedule: null, gym: [], principles: [], overrides: {},
    date: todayISO(),
    dayType: dayTypeForWeekday(new Date().getDay()),
    me: null, person: "ayush", tab: "home", log: {}, rename: {} // me = this device's owner; log: { itemId: true }
  };

  function weekdayOf(iso) { return new Date(iso + "T00:00").getDay(); }
  function isToday(iso) { return iso === todayISO(); }
  function resolveDayType(iso) {
    return (state.overrides && state.overrides[iso]) || dayTypeForWeekday(weekdayOf(iso));
  }
  function shiftISO(iso, deltaDays) {
    var d = new Date(iso + "T00:00");
    d.setDate(d.getDate() + deltaDays);
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

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
    var cls = person === "simran" ? "her" : "you";
    var wrap = el("div");
    if (isToday(state.date)) {
      var nn = nowNext(events, nowMinutes());
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
    }
    // Checkable timeline for the selected day
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

  var WEEKDAY_NAME = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };
  function gymFocus(day, person) { return person === "simran" ? day.focusSimran : day.focusAyush; }

  function renderGymColumn(person) {
    var wrap = el("div");
    var dayName = WEEKDAY_NAME[weekdayOf(state.date)];
    var todays = state.gym.filter(function (g) { return g.day === dayName; });
    if (todays.length) {
      var g = todays[0];
      var t = el("div", "card now " + (person === "simran" ? "her" : "you"));
      t.innerHTML = '<div class="lbl">' + (isToday(state.date) ? "Today" : esc(dayName)) + ' · ' + esc(g.type) + '</div>' +
        '<div class="act" style="font-size:15px">' + esc(gymFocus(g, person) || "Rest") + '</div>';
      wrap.appendChild(t);
    }
    var wk = el("div", "card");
    wk.innerHTML = '<h2>Weekly plan</h2>';
    state.gym.forEach(function (g2) {
      var cur = g2.day === dayName;
      wk.appendChild(el("div", "item" + (cur ? " cur" : ""),
        '<div class="t">' + esc(g2.day) + '</div><div class="col"><div class="a">' + esc(gymFocus(g2, person) || "—") + '</div>' +
        (g2.type ? '<div class="det">' + esc(g2.type) + '</div>' : '') + '</div>'));
    });
    wrap.appendChild(wk);
    return wrap;
  }

  function renderGym() {
    var panel = document.getElementById("tab-gym");
    panel.innerHTML = "";
    if (!state.schedule) { panel.appendChild(el("div", "card", "Loading…")); return; }
    if (state.person === "both") panel.appendChild(bothColumns(renderGymColumn));
    else panel.appendChild(renderGymColumn(state.person));
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
      postCheckoff({ date: state.date, person: person, itemId: id, itemLabel: label, done: nowOn })
        .then(function (r) { if (!r || r.ok !== true) showBanner("Check-off didn't sync — try again when online"); });
    });
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
      state.overrides = res.data.overrides || {};
      state.dayType = resolveDayType(state.date);
      if (res.stale) showBanner("Showing saved copy (offline)");
      renderDateBar();
      maybeConfirmToday();
      return loadLogForDate();
    });
  }

  function loadLogForDate() {
    state.log = {};
    return fetchLog(state.date).then(function (rows) {
      rows.forEach(function (r) { if (r.done) state.log[r.itemId] = true; else delete state.log[r.itemId]; });
      renderActiveTab();
    });
  }

  function goToDate(iso) {
    state.date = iso;
    state.dayType = resolveDayType(iso);
    renderDateBar();
    loadLogForDate();
  }

  // Inline override / confirm answer for the currently-viewed date.
  function setDayTypeForDate(type) {
    state.overrides[state.date] = type;
    state.dayType = type;
    renderDateBar();
    renderActiveTab();
    setDayType(state.date, type).then(function (r) {
      if (!r || r.ok !== true) showBanner("Day type didn't sync — try again when online");
    });
  }

  function maybeConfirmToday() {
    var iso = todayISO();
    if (state.date !== iso) return;
    var def = dayTypeForWeekday(weekdayOf(iso));
    if (def !== "office" && def !== "wfh") return; // weekend: unambiguous
    if (state.overrides[iso]) return;              // already decided
    showConfirmBar(def);
  }

  function showConfirmBar(def) {
    var old = document.getElementById("confirmBar");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var other = def === "office" ? "wfh" : "office";
    var bar = el("div", "confirmbar"); bar.id = "confirmBar";
    bar.appendChild(el("span", null, "Today looks like " + (def === "office" ? "an Office" : "a WFH") + " day."));
    var yes = el("button", "cbtn", def === "office" ? "Yes, Office" : "Yes, WFH");
    var no = el("button", "cbtn alt", other === "office" ? "It’s Office" : "It’s WFH");
    yes.addEventListener("click", function () { confirmToday(def, bar); });
    no.addEventListener("click", function () { confirmToday(other, bar); });
    bar.appendChild(yes); bar.appendChild(no);
    var anchor = document.getElementById("dateBar");
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(bar, anchor.nextSibling);
    else document.body.appendChild(bar);
  }

  function confirmToday(type, bar) {
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    setDayTypeForDate(type);
  }

  function fmtDate(iso) {
    var d = new Date(iso + "T00:00");
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var mons = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var label = days[d.getDay()] + " " + mons[d.getMonth()] + " " + d.getDate();
    return isToday(iso) ? "Today · " + label : label;
  }

  function renderDateBar() {
    var bar = document.getElementById("dateBar");
    if (!bar) return;
    bar.innerHTML = "";
    var prev = el("button", "nav", "‹");
    var next = el("button", "nav", "›");
    prev.addEventListener("click", function () { goToDate(shiftISO(state.date, -1)); });
    next.addEventListener("click", function () { goToDate(shiftISO(state.date, 1)); });
    var center = el("div", "dcenter");
    center.appendChild(el("div", "ddate", esc(fmtDate(state.date))));
    var typeWrap = el("div", "dtype");
    if (state.dayType === "office" || state.dayType === "wfh") {
      ["office", "wfh"].forEach(function (t) {
        var b = el("button", "pill" + (state.dayType === t ? " on" : ""), t === "office" ? "Office" : "WFH");
        b.addEventListener("click", function () { setDayTypeForDate(t); });
        typeWrap.appendChild(b);
      });
    } else {
      typeWrap.appendChild(el("span", "dtype-static", esc(dayName())));
    }
    center.appendChild(typeWrap);
    bar.appendChild(prev); bar.appendChild(center); bar.appendChild(next);
    if (!isToday(state.date)) {
      var today = el("button", "today-reset", "Today");
      today.addEventListener("click", function () { goToDate(todayISO()); });
      bar.appendChild(today);
    }
  }

  // expose for Task 7 & 8 to extend
  window.HealthApp = { state: state, renderActiveTab: renderActiveTab, todayISO: todayISO, esc: esc, el: el, eventsFor: eventsFor, showBanner: showBanner };

  document.addEventListener("DOMContentLoaded", boot);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js"); });
  }
})();
