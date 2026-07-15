const { parseSchedule } = require("../src/parser");
const { SHEET_VALUES } = require("./fixtures/sheet");

describe("parseSchedule — schedule blocks", () => {
  const result = parseSchedule(SHEET_VALUES);

  it("produces all four day-type keys", () => {
    expect(Object.keys(result.schedule).sort())
      .toEqual(["office", "saturday", "sunday", "wfh"]);
  });

  it("parses Ayush office events in order", () => {
    const ev = result.schedule.office.ayush;
    expect(ev.map(e => e.activity)).toEqual(["Wake Up", "Gym Strength (Together)", "Lunch at Office"]);
    expect(ev[1].time).toBe("07:00");
    expect(ev[1].minutes).toBe(420);
    expect(ev[1].kind).toBe("workout");
    expect(ev[1].together).toBe(true);
  });

  it("parses Simran office events independently", () => {
    const ev = result.schedule.office.simran;
    expect(ev[2].activity).toBe("Lunch (Self)");
    expect(ev[2].calories).toBe(440);
  });

  it("extracts macros and assigns stable ids", () => {
    const lunch = result.schedule.office.ayush[2];
    expect(lunch.calories).toBe(740);
    expect(lunch.protein).toBe(34);
    expect(lunch.id).toBe("office:ayush:13:00:lunch-at-office");
  });

  it("leaves day-types absent from the sheet as empty", () => {
    expect(result.schedule.wfh.ayush).toEqual([]);
    expect(result.schedule.saturday.simran).toEqual([]);
  });

  it("parses the Sunday block", () => {
    expect(result.schedule.sunday.ayush[1].activity).toBe("Breakfast (Together)");
    expect(result.schedule.sunday.ayush[1].protein).toBe(49);
  });
});

describe("parseSchedule — gym & principles", () => {
  const result = parseSchedule(SHEET_VALUES);

  it("parses the gym split", () => {
    expect(result.gym).toEqual([
      { day: "Monday", focusAyush: "Lower A: RDL, Leg Press", focusSimran: "Lower body equivalent", type: "Strength" },
      { day: "Tuesday", focusAyush: "Upper Push: Bench", focusSimran: "Upper push equivalent", type: "Strength" }
    ]);
  });

  it("parses the principles", () => {
    expect(result.principles).toEqual([
      { topic: "Protein Target", guideline: "Ayush 150g+; Simran 100-130g" },
      { topic: "Hydration", guideline: "3L water daily" }
    ]);
  });
});
