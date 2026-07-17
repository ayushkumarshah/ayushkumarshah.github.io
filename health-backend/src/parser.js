function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTime(str) {
  // Google Sheets returns time-typed cells as Date objects (epoch 1899-12-30).
  // Read them in local time (Apps Script uses the script timezone).
  if (str instanceof Date) {
    const h = str.getHours();
    const mi = str.getMinutes();
    const pad = n => String(n).padStart(2, "0");
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return {
      time: pad(h) + ":" + pad(mi),
      label: h12 + ":" + pad(mi) + " " + (h < 12 ? "AM" : "PM"),
      minutes: h * 60 + mi
    };
  }
  const m = String(str).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const mer = m[3].toUpperCase();
  if (mer === "AM") { if (hour === 12) hour = 0; }
  else { if (hour !== 12) hour += 12; }
  const time = String(hour).padStart(2, "0") + ":" + String(min).padStart(2, "0");
  return { time: time, label: str.trim().replace(/\s+/g, " "), minutes: hour * 60 + min };
}

function extractMacros(str) {
  const s = String(str);
  const cal = s.match(/(\d+)\s*cal/i);
  const pro = s.match(/(\d+)\s*g\s*protein/i);
  return {
    calories: cal ? parseInt(cal[1], 10) : null,
    protein: pro ? parseInt(pro[1], 10) : null
  };
}

function classifyKind(activity) {
  const a = String(activity);
  if (/gym|strength|soccer|toning|yoga|workout|circuit|stretch/i.test(a)) return "workout";
  if (/walk/i.test(a)) return "walk";
  if (/breakfast|lunch|dinner|snack|meal|pre-sleep|eat|coffee/i.test(a)) return "meal";
  if (/wake/i.test(a)) return "wake";
  if (/sleep/i.test(a)) return "sleep";
  if (/drive|leave|arrive|commute/i.test(a)) return "drive";
  if (/rest|nap|relax|wind\s*down|freshen|recovery/i.test(a)) return "rest";
  return "other";
}

const DAY_TYPE_FROM_HEADER = [
  { re: /office/i, key: "office" },
  { re: /wfh/i, key: "wfh" },
  { re: /saturday/i, key: "saturday" },
  { re: /sunday/i, key: "sunday" }
];

function emptySchedule() {
  const blank = () => ({ ayush: [], simran: [] });
  return { office: blank(), wfh: blank(), saturday: blank(), sunday: blank() };
}

function dayTypeFromHeader(text) {
  const m = String(text).match(/^AYUSH\s*[—-]\s*(.+)$/i);
  if (!m) return null;
  const rest = m[1];
  for (const d of DAY_TYPE_FROM_HEADER) if (d.re.test(rest)) return d.key;
  return null;
}

function buildEvent(person, dayType, timeCell, activity, details, notes) {
  const t = parseTime(timeCell);
  if (!t) return null;
  const macros = extractMacros(details);
  return {
    id: `${dayType}:${person}:${t.time}:${slugify(activity)}`,
    person: person,
    dayType: dayType,
    time: t.time,
    timeLabel: t.label,
    minutes: t.minutes,
    activity: String(activity).trim(),
    details: String(details).trim(),
    notes: String(notes).trim(),
    kind: classifyKind(activity),
    together: /together/i.test(String(activity)),
    calories: macros.calories,
    protein: macros.protein
  };
}

function isBlankRow(row) {
  return row.every(c => String(c == null ? "" : c).trim() === "");
}

function parseSchedule(values) {
  const schedule = emptySchedule();
  const rows = values || [];
  for (let i = 0; i < rows.length; i++) {
    const dayType = dayTypeFromHeader(rows[i][0]);
    if (!dayType) continue;
    // rows[i] = section header, rows[i+1] = column header, data starts at i+2
    let r = i + 2;
    for (; r < rows.length; r++) {
      const row = rows[r];
      if (isBlankRow(row)) break;
      if (dayTypeFromHeader(row[0])) break; // next section with no blank between
      const a = buildEvent("ayush", dayType, row[0], row[1], row[2], row[3]);
      if (a) schedule[dayType].ayush.push(a);
      const s = buildEvent("simran", dayType, row[5], row[6], row[7], row[8]);
      if (s) schedule[dayType].simran.push(s);
    }
    i = r - 1;
  }
  return { schedule: schedule, gym: parseGym(rows), principles: parsePrinciples(rows) };
}

function parseGym(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    if (!/^WEEKLY GYM/i.test(String(rows[i][0]))) continue;
    for (let r = i + 2; r < rows.length; r++) {
      const day = String(rows[r][0] == null ? "" : rows[r][0]).trim();
      if (day === "") break;
      out.push({
        day: day,
        focusAyush: String(rows[r][1] || "").trim(),
        focusSimran: String(rows[r][2] || "").trim(),
        type: String(rows[r][3] || "").trim()
      });
    }
    break;
  }
  return out;
}

function parsePrinciples(rows) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    if (!/^KEY NOTES/i.test(String(rows[i][5]))) continue;
    for (let r = i + 2; r < rows.length; r++) {
      const topic = String(rows[r][5] == null ? "" : rows[r][5]).trim();
      if (topic === "") break;
      out.push({ topic: topic, guideline: String(rows[r][6] || "").trim() });
    }
    break;
  }
  return out;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { slugify, parseTime, extractMacros, classifyKind, parseSchedule };
}
