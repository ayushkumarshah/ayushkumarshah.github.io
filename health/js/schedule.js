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
    ["ayushExercises", "simranExercises"].forEach(function (key) {
      (g[key] || []).forEach(function (e) {
        ["focus", "exercise", "targetMuscleGroup", "targetMuscle", "progressionRule", "importantNotes", "notes"].forEach(function (field) {
          e[field] = renameStr_(e[field], map);
        });
      });
    });
  });
  if (data.exercises) {
    (((data.exercises.ayush || {}).kneeRehab) || []).forEach(function (e) {
      ["exercise", "equipment", "purpose"].forEach(function (field) { e[field] = renameStr_(e[field], map); });
    });
    (((data.exercises.simran || {}).yoga) || []).forEach(function (e) {
      ["pose", "purpose", "caution"].forEach(function (field) { e[field] = renameStr_(e[field], map); });
    });
  }
  (data.principles || []).forEach(function (x) {
    x.topic = renameStr_(x.topic, map);
    x.guideline = renameStr_(x.guideline, map);
  });
  return data;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { WEEKDAY_DAYTYPE, dayTypeForWeekday, nowNext, PROTEIN_TARGET, proteinTotal, calorieTotal, applyRename };
}
