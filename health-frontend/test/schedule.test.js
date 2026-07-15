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
