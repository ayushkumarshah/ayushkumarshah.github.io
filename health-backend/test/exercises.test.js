const { parseKneeRehab, parseYoga } = require("../src/exercises");

describe("parseKneeRehab", () => {
  const values = [
    ["AYUSH — EXERCISE", "", "", "", ""],
    ["WEEKLY OVERVIEW", "", "", "", ""],
    ["Monday", "Lower A", "", "", ""],
    ["", "", "", "", ""],
    ["DAILY KNEE REHAB ROUTINE (5-6 days/week)", "", "", "", ""],
    ["#", "Exercise", "Sets x Reps", "Equipment", "Purpose / Notes"],
    ["1", "Squats (band above knees)", "2 x 15", "Mini band", "Quads + glute activation"],
    ["3", "Wall Sits (single leg)", "3 x 30 sec each leg", "Wall", "Isometric quad/VMO strength"],
    ["", "", "", "", ""],
    ["STRENGTH SPLIT", "", "", "", ""]
  ];
  it("extracts the knee-rehab rows and stops at the blank row", () => {
    expect(parseKneeRehab(values)).toEqual([
      { n: "1", exercise: "Squats (band above knees)", setsReps: "2 x 15", equipment: "Mini band", purpose: "Quads + glute activation" },
      { n: "3", exercise: "Wall Sits (single leg)", setsReps: "3 x 30 sec each leg", equipment: "Wall", purpose: "Isometric quad/VMO strength" }
    ]);
  });
  it("returns [] when the section is absent", () => {
    expect(parseKneeRehab([["nothing here"]])).toEqual([]);
  });
  it("does not mistake schedule notes for the real section header", () => {
    const values = [
      ["8:05 AM", "Knee Exercises", "20-25 min routine", "DAILY knee rehab (do every day)"],
      ["8:30 AM", "Shower", "~15 min", ""],
      ["", "", "", ""],
      ["DAILY KNEE REHAB ROUTINE (5-6 days/week)", "", "", "", ""],
      ["#", "Exercise", "Sets x Reps", "Equipment", "Purpose / Notes"],
      ["1", "Squats (band above knees)", "2 x 15", "Mini band", "Quads + glute activation"],
      ["", "", "", "", ""]
    ];
    expect(parseKneeRehab(values)).toEqual([
      { n: "1", exercise: "Squats (band above knees)", setsReps: "2 x 15", equipment: "Mini band", purpose: "Quads + glute activation" }
    ]);
  });
});

describe("parseYoga", () => {
  const values = [
    ["Saanu — EXERCISE & YOGA", "", "", ""],
    ["DAILY YOGA — BACK-SAFE SEQUENCE (start gentle)", "", "", ""],
    ["Pose", "Purpose", "Duration / Reps", "Back-Pain Caution"],
    ["Cat-Cow", "Warms spine, gentle mobility", "8-10 slow rounds", "Move slowly, no forcing"],
    ["Child's Pose", "Lengthens lower back", "30-60 sec", "Great for relief"],
    ["", "", "", ""]
  ];
  it("extracts the yoga poses", () => {
    expect(parseYoga(values)).toEqual([
      { pose: "Cat-Cow", purpose: "Warms spine, gentle mobility", duration: "8-10 slow rounds", caution: "Move slowly, no forcing" },
      { pose: "Child's Pose", purpose: "Lengthens lower back", duration: "30-60 sec", caution: "Great for relief" }
    ]);
  });
});
