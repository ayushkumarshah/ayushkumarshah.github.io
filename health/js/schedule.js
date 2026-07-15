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
