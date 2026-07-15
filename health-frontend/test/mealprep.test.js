const { OFFICE_DAY_COUNT, mealPrepRollup, extractIngredients, groceryList } = require("../../health/js/mealprep.js");

describe("mealPrepRollup", () => {
  const events = [
    { kind: "wake", activity: "Wake Up", details: "water" },
    { kind: "meal", activity: "Lunch at Office", details: "Basmati rice 200g + Chickpeas curry (~740 cal)" },
    { kind: "workout", activity: "Gym", details: "Lower A" },
    { kind: "meal", activity: "Dinner", details: "Tofu + Sweet Potato" }
  ];
  it("keeps only meals and stamps the weekly count", () => {
    expect(mealPrepRollup(events, 3)).toEqual([
      { activity: "Lunch at Office", details: "Basmati rice 200g + Chickpeas curry (~740 cal)", count: 3 },
      { activity: "Dinner", details: "Tofu + Sweet Potato", count: 3 }
    ]);
  });
  it("exposes the office day count", () => { expect(OFFICE_DAY_COUNT).toBe(3); });
});

describe("extractIngredients", () => {
  it("splits on + and , drops parentheticals and quantities", () => {
    expect(extractIngredients("Basmati rice 200g + Chickpeas/Tofu curry + salad (~740 cal, 34g protein)"))
      .toEqual(["Basmati rice", "Chickpeas/Tofu curry", "salad"]);
  });
  it("returns [] for blank", () => { expect(extractIngredients("")).toEqual([]); });
});

describe("groceryList", () => {
  it("dedupes ingredients across both people's office meals", () => {
    const schedule = {
      office: {
        ayush: [{ kind: "meal", details: "Basmati rice 200g + Chickpeas curry" }],
        simran: [{ kind: "meal", details: "Dal + brown rice" }, { kind: "walk", details: "x" }]
      },
      wfh: { ayush: [], simran: [] }, saturday: { ayush: [], simran: [] }, sunday: { ayush: [], simran: [] }
    };
    expect(groceryList(schedule)).toEqual(["Basmati rice", "Chickpeas curry", "Dal", "brown rice"]);
  });
});
