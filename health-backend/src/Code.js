// Thin Apps Script wrappers. Runs ONLY inside Apps Script (uses SpreadsheetApp,
// PropertiesService). The pure functions come from parser.gs, ics.gs, log.gs.

// The real diet/fitness spreadsheet (read by ID so this works whether or not the
// script is bound to it). This is the id from the sheet's URL.
var SPREADSHEET_ID = "1QGtGxh2Ly8TcSPC2Mf8eqD58zd7ICxpasEYyvftz22A";
var SCHEDULE_TAB = "Daily Routine"; // the timetable tab in the "Fitness Plan" sheet
var LOG_TAB = "Log";

function dietSS_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function scriptToken_() {
  return PropertiesService.getScriptProperties().getProperty("API_TOKEN");
}

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

function scheduleValues_() {
  var sh = dietSS_().getSheetByName(SCHEDULE_TAB);
  if (!sh) throw new Error("No tab named '" + SCHEDULE_TAB + "' — run verifyBackend to see tab names.");
  return sh.getDataRange().getValues();
}

function logSheet_() {
  var ss = dietSS_();
  var sh = ss.getSheetByName(LOG_TAB);
  if (!sh) {
    sh = ss.insertSheet(LOG_TAB);
    sh.appendRow(LOG_HEADER);
    sh.getRange("A:B").setNumberFormat("@");
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

// Run this in the Apps Script editor (Run → verifyBackend) then View → Execution log.
// It confirms the script reads your diet sheet and parses it, and lists tab names.
function verifyBackend() {
  var ss = dietSS_();
  Logger.log("Spreadsheet: " + ss.getName());
  Logger.log("Tabs: " + ss.getSheets().map(function (s) { return s.getName(); }).join(" | "));
  Logger.log("SCHEDULE_TAB is set to: '" + SCHEDULE_TAB + "'");
  Logger.log("API_TOKEN set: " + (scriptToken_() ? "yes" : "NO — set it in Script Properties"));
  var sh = ss.getSheetByName(SCHEDULE_TAB);
  if (!sh) { Logger.log("!! No tab named '" + SCHEDULE_TAB + "'. Set SCHEDULE_TAB to one of the tabs above."); return; }
  var vals = sh.getDataRange().getValues();
  var parsed = parseSchedule(vals);
  Logger.log("rows read: " + vals.length);
  Logger.log("ayush office events: " + (parsed.schedule.office.ayush || []).length +
    " | simran office events: " + (parsed.schedule.office.simran || []).length);
  Logger.log("gym rows: " + parsed.gym.length + " | principles: " + parsed.principles.length);
  Logger.log("ics sample length: " + buildIcs(parsed, "ayush", { calname: "x" }).length);
}
