const DAY_BYDAY = { office: "MO,TU,WE", wfh: "TH,FR", saturday: "SA", sunday: "SU" };
const DAY_REFDATE = { office: "20240101", wfh: "20240104", saturday: "20240106", sunday: "20240107" };
const DAY_ORDER = ["office", "wfh", "saturday", "sunday"];

function escapeIcs(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function addMinutes(hhmm, add) {
  const [h, m] = hhmm.split(":").map(n => parseInt(n, 10));
  let total = h * 60 + m + add;
  total = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return hh + mm + "00";
}

function eventBlock(ev) {
  const refDate = DAY_REFDATE[ev.dayType];
  const start = ev.time.replace(":", "") + "00";
  const end = addMinutes(ev.time, 15);
  const descParts = [];
  if (ev.details) descParts.push(ev.details);
  if (ev.notes) descParts.push(ev.notes);
  const desc = escapeIcs(descParts.join(" — "));
  const lines = [
    "BEGIN:VEVENT",
    "UID:" + ev.id + "@health.shahayush.com",
    "DTSTART:" + refDate + "T" + start,
    "DTEND:" + refDate + "T" + end,
    "RRULE:FREQ=WEEKLY;BYDAY=" + DAY_BYDAY[ev.dayType],
    "SUMMARY:" + escapeIcs(ev.activity)
  ];
  if (desc) lines.push("DESCRIPTION:" + desc);
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:" + escapeIcs(ev.activity),
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT"
  );
  return lines;
}

function buildIcs(parseResult, person, options) {
  const opts = options || {};
  const calname = opts.calname || "Health";
  const out = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//shahayush//health//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + calname
  ];
  for (const dayType of DAY_ORDER) {
    const events = parseResult.schedule[dayType][person] || [];
    for (const ev of events) out.push.apply(out, eventBlock(ev));
  }
  out.push("END:VCALENDAR");
  return out.join("\r\n") + "\r\n";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { escapeIcs, buildIcs };
}
