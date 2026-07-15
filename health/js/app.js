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
