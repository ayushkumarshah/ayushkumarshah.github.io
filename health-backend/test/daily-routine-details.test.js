const {
  parseSchedule,
  parseDetailedAyushGym,
  parseDetailedSimranGym,
  detectRoutineSections
} = require("../src/parser");
const { parseKneeRehab, parseYoga } = require("../src/exercises");

const dailyRoutineRows = [
  ["WEEKLY GYM / TRAINING SCHEDULE - by day of week", "", "", "", "", "KEY NOTES & PRINCIPLES"],
  ["Day", "Focus (Ayush)", "Focus (Saanu)", "Type", "", "Topic", "Guideline"],
  [
    "Monday",
    "Lower A: RDL, Bulgarian Split Squat, Leg Press",
    "Lower toning: Bodyweight Squat, Glute Bridge/Hip Thrust",
    "Strength"
  ],
  ["Tuesday", "Upper Push: Bench Press", "Upper+core toning", "Strength"],
  ["", "", "", "", "", "", ""],
  ["AYUSH - DETAILED GYM / TRAINING PLAN  (per exercise; source of truth: Strength training exercises tab)", "", "", "", "", "", "", "", ""],
  ["Day", "Focus", "Exercise", "Sets", "Reps", "Target RPE", "Target Muscle Group", "Progression Rule", "Important Notes"],
  ["Monday", "Lower A", "Dumbbell Romanian Deadlift", "4", "8", "8", "Glutes; Hamstrings; Lower Back", "Increase weight when all sets hit 8", "Heavy day - main strength focus"],
  ["Monday", "Lower A", "Bulgarian Split Squat", "3", "8 each leg", "8", "Glutes; Quads; Stabilizers", "Increase weight when stable", "Slow 3 sec descent"],
  ["Tuesday", "Upper Push", "Dumbbell Bench Press", "4", "8", "8", "Chest; Triceps", "Increase weight at 8 reps", "Primary chest builder"],
  ["", "", "", "", "", "", "", "", ""],
  ["SAANU - DETAILED TONING CIRCUIT PLAN  (per exercise; source: Saanu - Exercise & Yoga tab). Plus daily back-safe yoga - see that tab.", "", "", "", "", "", "", "", ""],
  ["Circuit (Day)", "Exercise", "Sets", "Reps", "Target Muscle", "Notes", "", "", ""],
  ["Lower (Mon)", "Bodyweight Squat", "3", "15", "Glutes/Quads", "Controlled tempo", "", "", ""],
  ["Lower (Mon)", "Glute Bridge / Hip Thrust", "3", "15", "Glutes", "Back-friendly", "", "", ""],
  ["Upper (Tue)", "Dumbbell Shoulder Press (light)", "3", "12-15", "Shoulders", "Light weight", "", "", ""],
  ["", "", "", "", "", "", "", "", ""],
  ["DAILY KNEE REHAB ROUTINE (5-6 days/week - before or after main session)", "", "", "", "", "", "", "", ""],
  ["#", "Exercise", "Sets x Reps", "Equipment", "Purpose / Notes", "", "", "", ""],
  ["1", "Squats (band above knees)", "2 x 15", "Mini band", "Quads + glute activation; band drives knees out", "", "", "", ""],
  ["2", "Lateral Band Side Steps", "3 laps (min 2)", "Mini band", "Glute medius; keep tension, controlled", "", "", "", ""],
  ["", "", "", "", "", "", "", "", ""],
  ["DAILY YOGA - BACK-SAFE SEQUENCE (start gentle, progress slowly)", "", "", "", "", "", "", "", ""],
  ["Pose", "Purpose", "Duration / Reps", "Back-Pain Caution", "", "", "", "", ""],
  ["Cat-Cow", "Warms spine, gentle mobility", "8-10 slow rounds", "Move slowly, no forcing", "", "", "", "", ""],
  ["Child's Pose", "Lengthens lower back, relaxes", "30-60 sec", "Great for relief", "", "", "", "", ""]
];

describe("Daily Routine detail sections", () => {
  it("parses Ayush detailed gym rows by day using the current Daily Routine header", () => {
    expect(parseDetailedAyushGym(dailyRoutineRows).Monday).toEqual([
      {
        day: "Monday",
        focus: "Lower A",
        exercise: "Dumbbell Romanian Deadlift",
        sets: "4",
        reps: "8",
        targetRpe: "8",
        targetMuscleGroup: "Glutes; Hamstrings; Lower Back",
        progressionRule: "Increase weight when all sets hit 8",
        importantNotes: "Heavy day - main strength focus"
      },
      expect.objectContaining({ exercise: "Bulgarian Split Squat", reps: "8 each leg" })
    ]);
  });

  it("parses Saanu detailed circuit rows by weekday from Circuit (Day)", () => {
    expect(parseDetailedSimranGym(dailyRoutineRows).Monday).toEqual([
      expect.objectContaining({ day: "Monday", focus: "Lower", exercise: "Bodyweight Squat" }),
      expect.objectContaining({ day: "Monday", focus: "Lower", exercise: "Glute Bridge / Hip Thrust" })
    ]);
  });

  it("attaches full per-exercise detail to the weekly Gym rows", () => {
    const monday = parseSchedule(dailyRoutineRows).gym[0];
    expect(monday).toMatchObject({
      day: "Monday",
      focusAyush: "Lower A: RDL, Bulgarian Split Squat, Leg Press",
      focusSimran: "Lower toning: Bodyweight Squat, Glute Bridge/Hip Thrust",
      type: "Strength"
    });
    expect(monday.ayushExercises.map(e => e.exercise)).toEqual([
      "Dumbbell Romanian Deadlift",
      "Bulgarian Split Squat"
    ]);
    expect(monday.simranExercises.map(e => e.exercise)).toEqual([
      "Bodyweight Squat",
      "Glute Bridge / Hip Thrust"
    ]);
  });

  it("parses knee rehab and yoga from Daily Routine instead of separate tabs", () => {
    expect(parseKneeRehab(dailyRoutineRows).map(e => e.exercise)).toEqual([
      "Squats (band above knees)",
      "Lateral Band Side Steps"
    ]);
    expect(parseYoga(dailyRoutineRows).map(e => e.pose)).toEqual(["Cat-Cow", "Child's Pose"]);
  });

  it("reports the Daily Routine headers and column names used by the parser", () => {
    expect(detectRoutineSections(dailyRoutineRows)).toMatchObject({
      weeklyGym: { row: 1, columns: ["Day", "Focus (Ayush)", "Focus (Saanu)", "Type", "Topic", "Guideline"] },
      ayushDetailedGym: {
        row: 6,
        columns: ["Day", "Focus", "Exercise", "Sets", "Reps", "Target RPE", "Target Muscle Group", "Progression Rule", "Important Notes"]
      },
      simranDetailedGym: { row: 12, columns: ["Circuit (Day)", "Exercise", "Sets", "Reps", "Target Muscle", "Notes"] },
      kneeRehab: { row: 18, columns: ["#", "Exercise", "Sets x Reps", "Equipment", "Purpose / Notes"] },
      yoga: { row: 23, columns: ["Pose", "Purpose", "Duration / Reps", "Back-Pain Caution"] }
    });
  });
});
