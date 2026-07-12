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
    expect(ics).not.toContain("Z\r\n"); // no UTC 'Z' suffix on DTSTART/DTEND
  });

  it("only includes the requested person's events", () => {
    expect(ics).toContain("SUMMARY:Lunch at Office");   // ayush
    expect(ics).not.toContain("SUMMARY:Lunch (Self)");  // simran
  });
});
