const { parseSchedule } = require("../src/parser");

describe("parseGym — tolerant header match", () => {
  it("parses the renamed 'WEEKLY GYM / TRAINING SCHEDULE' header", () => {
    const rows = [
      ["WEEKLY GYM / TRAINING SCHEDULE — by day of week (source of truth)", "", "", ""],
      ["Day", "Focus (Ayush)", "Focus (Saanu)", "Type"],
      ["Monday", "Lower A: RDL, Split Squat", "Lower toning: Squat, Glute Bridge", "Strength"],
      ["Wednesday", "ACTIVE RECOVERY - no gym", "Back-focused yoga + walk", "Recovery"]
    ];
    expect(parseSchedule(rows).gym).toEqual([
      { day: "Monday", focusAyush: "Lower A: RDL, Split Squat", focusSimran: "Lower toning: Squat, Glute Bridge", type: "Strength" },
      { day: "Wednesday", focusAyush: "ACTIVE RECOVERY - no gym", focusSimran: "Back-focused yoga + walk", type: "Recovery" }
    ]);
  });

  it("still parses the old 'WEEKLY GYM SCHEDULE' wording", () => {
    const rows = [
      ["WEEKLY GYM SCHEDULE (3 days/week — Together)", "", "", ""],
      ["Day", "Focus (Ayush)", "Focus (Saanu)", "Type"],
      ["Monday", "Lower A", "Lower", "Strength"]
    ];
    expect(parseSchedule(rows).gym).toEqual([
      { day: "Monday", focusAyush: "Lower A", focusSimran: "Lower", type: "Strength" }
    ]);
  });
});
