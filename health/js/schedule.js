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

var PROTEIN_TARGET = { ayush: 150, simran: 120 };

function proteinTotal(events) {
  return (events || []).reduce(function (s, e) { return s + (e.protein || 0); }, 0);
}

function calorieTotal(events) {
  return (events || []).reduce(function (s, e) { return s + (e.calories || 0); }, 0);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WEEKDAY_DAYTYPE, dayTypeForWeekday, nowNext, PROTEIN_TARGET, proteinTotal, calorieTotal };
}
