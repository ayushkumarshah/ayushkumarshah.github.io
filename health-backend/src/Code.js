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
