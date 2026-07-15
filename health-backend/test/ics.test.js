const { escapeIcs, buildIcs } = require("../src/ics");
const { parseSchedule } = require("../src/parser");
const { SHEET_VALUES } = require("./fixtures/sheet");

describe("escapeIcs", () => {
  it("escapes commas, semicolons, backslashes, newlines", () => {
    expect(escapeIcs("a, b; c\\d\ne")).toBe("a\\, b\\; c\\\\d\\ne");
  });
});

describe("buildIcs", () => {
  const parsed = parseSchedule(SHEET_VALUES);
  const ics = buildIcs(parsed, "ayush", { calname: "Health · Ayush" });

  it("wraps in a VCALENDAR with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics).toContain("X-WR-CALNAME:Health · Ayush");
  });

  it("emits a VEVENT per Ayush event with recurrence and alarm", () => {
    // 3 office + 2 sunday = 5 events for ayush in the fixture
    const count = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(count).toBe(5);
    expect(ics).toContain("BEGIN:VALARM");
  });

  it("uses floating local time and correct BYDAY per day-type", () => {
    expect(ics).toContain("DTSTART:20240101T070000");          // office gym, Mon ref date
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE"); // office
    expect(ics).toContain("DTSTART:20240107T080000");          // sunday breakfast, Sun ref date
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=SU");       // sunday
    expect(ics).not.toMatch(/DTSTART:[^\r\n]*Z/); // no UTC 'Z' suffix on DTSTART
    expect(ics).not.toMatch(/DTEND:[^\r\n]*Z/); // no UTC 'Z' suffix on DTEND
    expect(ics).toContain("DTSTAMP:"); // DTSTAMP is legitimately UTC
  });

  it("only includes the requested person's events", () => {
    expect(ics).toContain("SUMMARY:Lunch at Office");   // ayush
    expect(ics).not.toContain("SUMMARY:Lunch (Self)");  // simran
  });

  it("rolls DTEND to the next day when +15min crosses midnight", () => {
    const synthetic = {
      schedule: {
        office: { ayush: [] },
        wfh: { ayush: [] },
        saturday: { ayush: [] },
        sunday: {
          ayush: [
            {
              id: "sunday:ayush:23:50:late-snack",
              person: "ayush",
              dayType: "sunday",
              time: "23:50",
              timeLabel: "11:50 PM",
              minutes: 23 * 60 + 50,
              activity: "Late Snack",
              details: "Casein shake",
              notes: "Before bed",
              kind: "meal",
              together: false,
              calories: null,
              protein: null
            }
          ]
        }
      }
    };
    const rolled = buildIcs(synthetic, "ayush", { calname: "X" });
    expect(rolled).toContain("DTSTART:20240107T235000");
    expect(rolled).toContain("DTEND:20240108T000500");
  });
});
