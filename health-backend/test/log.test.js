const { parseLogRows, filterLogByDate, isAuthorized, LOG_HEADER } = require("../src/log");

const VALUES = [
  ["timestamp", "date", "person", "itemId", "itemLabel", "done"],
  ["2026-07-11T14:00:00Z", "2026-07-11", "ayush", "office:ayush:07:00:gym-strength-together", "Gym Strength", true],
  ["2026-07-11T15:00:00Z", "2026-07-11", "simran", "office:simran:06:00:morning-walk-together", "Morning Walk", true],
  ["2026-07-10T15:00:00Z", "2026-07-10", "ayush", "office:ayush:06:00:morning-walk-together", "Morning Walk", true]
];

describe("parseLogRows", () => {
  it("maps rows to objects and skips the header", () => {
    const rows = parseLogRows(VALUES);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      timestamp: "2026-07-11T14:00:00Z", date: "2026-07-11", person: "ayush",
      itemId: "office:ayush:07:00:gym-strength-together", itemLabel: "Gym Strength", done: true
    });
  });
  it("returns [] for empty input", () => {
    expect(parseLogRows([])).toEqual([]);
    expect(parseLogRows([LOG_HEADER])).toEqual([]);
  });
});

describe("filterLogByDate", () => {
  it("keeps only the given date", () => {
    const rows = parseLogRows(VALUES);
    expect(filterLogByDate(rows, "2026-07-11")).toHaveLength(2);
    expect(filterLogByDate(rows, "2026-07-10")).toHaveLength(1);
  });
});

describe("isAuthorized", () => {
  it("is true only on exact match with a non-empty expected", () => {
    expect(isAuthorized("abc", "abc")).toBe(true);
    expect(isAuthorized("abc", "xyz")).toBe(false);
    expect(isAuthorized("", "")).toBe(false);
    expect(isAuthorized(undefined, "abc")).toBe(false);
    expect(isAuthorized("abc", null)).toBe(false);
  });
});
