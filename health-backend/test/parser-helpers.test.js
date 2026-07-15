const { slugify, parseTime, extractMacros, classifyKind } = require("../src/parser");

describe("slugify", () => {
  it("lowercases and dashes non-alphanumerics", () => {
    expect(slugify("Gym Strength (Together)")).toBe("gym-strength-together");
  });
  it("collapses and trims dashes", () => {
    expect(slugify("  Lunch / Self  ")).toBe("lunch-self");
  });
});

describe("parseTime", () => {
  it("parses AM", () => {
    expect(parseTime("5:45 AM")).toEqual({ time: "05:45", label: "5:45 AM", minutes: 345 });
  });
  it("parses PM", () => {
    expect(parseTime("1:00 PM")).toEqual({ time: "13:00", label: "1:00 PM", minutes: 780 });
  });
  it("parses a Date-typed cell (Sheets time value) in local time", () => {
    // Local constructor => getHours()/getMinutes() are deterministic regardless of test TZ.
    expect(parseTime(new Date(1899, 11, 30, 6, 30, 0))).toEqual({ time: "06:30", label: "6:30 AM", minutes: 390 });
    expect(parseTime(new Date(1899, 11, 30, 13, 0, 0))).toEqual({ time: "13:00", label: "1:00 PM", minutes: 780 });
    expect(parseTime(new Date(1899, 11, 30, 0, 5, 0))).toEqual({ time: "00:05", label: "12:05 AM", minutes: 5 });
  });
  it("parses 12 AM/PM correctly", () => {
    expect(parseTime("12:00 AM").time).toBe("00:00");
    expect(parseTime("12:30 PM").time).toBe("12:30");
  });
  it("returns null for non-times", () => {
    expect(parseTime("Wake Up")).toBeNull();
    expect(parseTime("")).toBeNull();
  });
});

describe("extractMacros", () => {
  it("pulls calories and protein", () => {
    expect(extractMacros("Rice + curry (~740 cal, 34g protein)")).toEqual({ calories: 740, protein: 34 });
  });
  it("handles calories only", () => {
    expect(extractMacros("Dal + rice (~440 cal)")).toEqual({ calories: 440, protein: null });
  });
  it("returns nulls when absent", () => {
    expect(extractMacros("Drink 500ml water")).toEqual({ calories: null, protein: null });
  });
});

describe("classifyKind", () => {
  it("classifies known activities", () => {
    expect(classifyKind("Gym Strength (Together)")).toBe("workout");
    expect(classifyKind("Morning Walk (Together)")).toBe("walk");
    expect(classifyKind("Light Breakfast")).toBe("meal");
    expect(classifyKind("Wake Up")).toBe("wake");
    expect(classifyKind("Sleep")).toBe("sleep");
    expect(classifyKind("Drive to Office")).toBe("drive");
    expect(classifyKind("Nap / Rest")).toBe("rest");
    expect(classifyKind("Personal Time")).toBe("other");
  });
});
