var OFFICE_DAY_COUNT = 3;

function mealPrepRollup(events, dayCount) {
  return (events || [])
    .filter(function (e) { return e.kind === "meal"; })
    .map(function (e) { return { activity: e.activity, details: e.details, count: dayCount }; });
}

function extractIngredients(details) {
  var s = String(details || "").replace(/\([^)]*\)/g, " "); // drop parentheticals
  return s.split(/[+,]/)
    .map(function (part) {
      return part
        .replace(/\b\d+(\.\d+)?\s*(g|kg|ml|l|tsp|tbsp)\b/gi, " ") // drop "200g", "1 tsp"
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(function (x) { return x.length > 0; });
}

function groceryList(schedule) {
  var out = [];
  var seen = {};
  ["ayush", "simran"].forEach(function (person) {
    var meals = ((schedule.office && schedule.office[person]) || [])
      .filter(function (e) { return e.kind === "meal"; });
    meals.forEach(function (m) {
      extractIngredients(m.details).forEach(function (ing) {
        var key = ing.toLowerCase();
        if (!seen[key]) { seen[key] = true; out.push(ing); }
      });
    });
  });
  return out;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { OFFICE_DAY_COUNT, mealPrepRollup, extractIngredients, groceryList };
}
