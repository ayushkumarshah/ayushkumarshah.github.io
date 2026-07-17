// Pure parsers for the exercise tabs (Ayush knee-rehab, Saanu yoga).
// Dual-runtime: Node/vitest + Apps Script global.

function findSectionStart_(values, re) {
  for (var i = 0; i < (values || []).length; i++) {
    var row = values[i] || [];
    var first = "";
    for (var j = 0; j < row.length; j++) {
      first = String(row[j] == null ? "" : row[j]).trim();
      if (first) break;
    }
    if (re.test(first)) return i;
  }
  return -1;
}

function cell_(row, idx) {
  return String(row[idx] == null ? "" : row[idx]).trim();
}

// "DAILY KNEE REHAB ROUTINE" table: # | Exercise | Sets x Reps | Equipment | Purpose / Notes
function parseKneeRehab(values) {
  var start = findSectionStart_(values, /DAILY KNEE REHAB/i);
  if (start < 0) return [];
  var out = [];
  for (var r = start + 2; r < values.length; r++) {
    var ex = cell_(values[r], 1);
    if (!ex) break;
    out.push({
      n: cell_(values[r], 0),
      exercise: ex,
      setsReps: cell_(values[r], 2),
      equipment: cell_(values[r], 3),
      purpose: cell_(values[r], 4)
    });
  }
  return out;
}

// "DAILY YOGA — BACK-SAFE SEQUENCE" table: Pose | Purpose | Duration / Reps | Back-Pain Caution
function parseYoga(values) {
  var start = findSectionStart_(values, /DAILY YOGA/i);
  if (start < 0) return [];
  var out = [];
  for (var r = start + 2; r < values.length; r++) {
    var pose = cell_(values[r], 0);
    if (!pose) break;
    out.push({
      pose: pose,
      purpose: cell_(values[r], 1),
      duration: cell_(values[r], 2),
      caution: cell_(values[r], 3)
    });
  }
  return out;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { parseKneeRehab, parseYoga };
}
