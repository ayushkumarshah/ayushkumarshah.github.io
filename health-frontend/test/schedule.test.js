const { dayTypeForWeekday, WEEKDAY_DAYTYPE, nowNext } = require("../../health/js/schedule.js");

describe("dayTypeForWeekday", () => {
  it("maps weekdays per the contract", () => {
    expect(WEEKDAY_DAYTYPE).toEqual(["sunday","office","office","office","wfh","wfh","saturday"]);
    expect(dayTypeForWeekday(0)).toBe("sunday");
    expect(dayTypeForWeekday(1)).toBe("office");
    expect(dayTypeForWeekday(4)).toBe("wfh");
    expect(dayTypeForWeekday(6)).toBe("saturday");
  });
});

describe("nowNext", () => {
  const ev = (time, minutes, activity) => ({ time, minutes, activity });
  const events = [ev("06:00",360,"Walk"), ev("07:00",420,"Gym"), ev("08:15",495,"Breakfast")];

  it("finds current and next around a mid time", () => {
    const r = nowNext(events, 430); // after Gym(420), before Breakfast(495)
    expect(r.current.activity).toBe("Gym");
    expect(r.next.activity).toBe("Breakfast");
  });
  it("before the first event has no current", () => {
    const r = nowNext(events, 300);
    expect(r.current).toBeNull();
    expect(r.next.activity).toBe("Walk");
  });
  it("after the last event has no next", () => {
    const r = nowNext(events, 600);
    expect(r.current.activity).toBe("Breakfast");
    expect(r.next).toBeNull();
  });
  it("handles empty list", () => {
    expect(nowNext([], 500)).toEqual({ current: null, next: null });
  });
});

const { proteinTotal, calorieTotal, PROTEIN_TARGET } = require("../../health/js/schedule.js");

describe("macro totals", () => {
  const events = [
    { protein: 34, calories: 740 },
    { protein: null, calories: 225 },
    { protein: 47, calories: null }
  ];
  it("sums protein treating null as 0", () => {
    expect(proteinTotal(events)).toBe(81);
  });
  it("sums calories treating null as 0", () => {
    expect(calorieTotal(events)).toBe(965);
  });
  it("exposes protein targets", () => {
    expect(PROTEIN_TARGET).toEqual({ ayush: 150, simran: 120 });
  });
  it("handles empty", () => {
    expect(proteinTotal([])).toBe(0);
    expect(calorieTotal([])).toBe(0);
  });
});
