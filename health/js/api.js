var SCHEDULE_CACHE_KEY = "health.schedule";
var SESSION_KEY = "health.session";

function cacheGet(key) {
  try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function cacheSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* quota/full — ignore */ }
}

function getSession() {
  try { var raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; }
  catch (e) { return null; }
}
function setSession(s) { try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (e) {} }
function clearSession() { try { localStorage.removeItem(SESSION_KEY); } catch (e) {} }

function sessionToken_() { var s = getSession(); if (s && s.token) return s.token; return CONFIG.API_TOKEN || ""; }

function login(username, password) {
  return fetch(CONFIG.EXEC_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "login", username: username, password: password })
  })
    .then(function (r) { return r.json(); })
    .catch(function () { return { ok: false, error: "network" }; });
}

function fetchSchedule() {
  var url = CONFIG.EXEC_URL + "?token=" + encodeURIComponent(sessionToken_());
  return fetch(url)
    .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(function (data) { cacheSet(SCHEDULE_CACHE_KEY, data); return { data: data, stale: false }; })
    .catch(function () { return { data: cacheGet(SCHEDULE_CACHE_KEY), stale: true }; });
}

function fetchLog(date) {
  var url = CONFIG.EXEC_URL + "?token=" + encodeURIComponent(sessionToken_()) +
    "&action=log&date=" + encodeURIComponent(date);
  return fetch(url)
    .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then(function (j) { return (j && j.rows) || []; })
    .catch(function () { return []; });
}

function postCheckoff(payload) {
  var body = Object.assign({ token: sessionToken_() }, payload);
  return fetch(CONFIG.EXEC_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(body)
  })
    .then(function (r) { return r.json(); })
    .catch(function () { return { ok: false }; });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { cacheGet, cacheSet, fetchSchedule, fetchLog, postCheckoff, getSession, setSession, clearSession, login };
}
