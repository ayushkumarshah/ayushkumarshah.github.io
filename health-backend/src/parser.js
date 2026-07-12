function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTime(str) {
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = { slugify, parseTime, extractMacros, classifyKind };
}
