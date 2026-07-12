const DAY_BYDAY = { office: "MO,TU,WE", wfh: "TH,FR", saturday: "SA", sunday: "SU" };
const DAY_REFDATE = { office: "20240101", wfh: "20240104", saturday: "20240106", sunday: "20240107" };
const DAY_ORDER = ["office", "wfh", "saturday", "sunday"];
const DTSTAMP = "20240101T000000Z";

function escapeIcs(str) {
  return String(str)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDateTime(refDate, hhmm, addMin) {
  const y = +refDate.slice(0, 4), mo = +refDate.slice(4, 6), d = +refDate.slice(6, 8);
  const parts = hhmm.split(":");
  const h = +parts[0], mi = +parts[1];
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi + (addMin || 0)));
  const p = n => String(n).padStart(2, "0");
  return String(dt.getUTCFullYear()) + p(dt.getUTCMonth() + 1) + p(dt.getUTCDate()) +
    "T" + p(dt.getUTCHours()) + p(dt.getUTCMinutes()) + "00";
}

function eventBlock(ev) {
  const refDate = DAY_REFDATE[ev.dayType];
  const descParts = [];
  if (ev.details) descParts.push(ev.details);
  if (ev.notes) descParts.push(ev.notes);
  const desc = escapeIcs(descParts.join(" — "));
  const lines = [
    "BEGIN:VEVENT",
    "UID:" + ev.id + "@health.shahayush.com",
    "DTSTAMP:" + DTSTAMP,
    "DTSTART:" + icsDateTime(refDate, ev.time, 0),
    "DTEND:" + icsDateTime(refDate, ev.time, 15),
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
