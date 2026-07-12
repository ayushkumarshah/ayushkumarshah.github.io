// 9-column rows: 0-3 Ayush, 4 spacer, 5-8 Simran
const SHEET_VALUES = [
  ["AYUSH — OFFICE DAY (Mon/Tue/Wed)","","","","","SIMRAN — OFFICE DAY (Mon/Tue/Wed)","","",""],
  ["Time","Activity","Details / Food","Notes","","Time","Activity","Details / Food","Notes"],
  ["5:45 AM","Wake Up","Drink 500ml water","Hydration","","5:45 AM","Wake Up","Drink 500ml water","500ml water"],
  ["7:00 AM","Gym Strength (Together)","Lower A: RDL, Split Squat","Before breakfast","","7:00 AM","Gym Strength (Together)","Toning circuit","Weight-loss focus"],
  ["1:00 PM","Lunch at Office","Rice + Chickpeas curry (~740 cal, 34g protein)","From home","","1:00 PM","Lunch (Self)","Dal + brown rice (~440 cal)","Iron + fiber"],
  ["","","","","","","","",""],
  ["AYUSH — SUNDAY (Rest / Recovery Day)","","","","","SIMRAN — SUNDAY (Rest / Recovery Day)","","",""],
  ["Time","Activity","Details / Food","Notes","","Time","Activity","Details / Food","Notes"],
  ["7:00 AM","Wake Up (Relaxed)","Drink 500ml water","Lie-in","","7:00 AM","Wake Up (Relaxed)","Drink 500ml water",""],
  ["8:00 AM","Breakfast (Together)","Oats + Whey (~520 cal, 49g protein)","","","8:00 AM","Breakfast (Together)","2 Eggs + spinach (~290 cal)","Iron-rich"],
  ["","","","","","","","",""],
  ["WEEKLY GYM SCHEDULE (3 days/week — Together)","","","","","KEY NOTES & PRINCIPLES","","",""],
  ["Day","Focus (Ayush)","Focus (Simran)","Type","","Topic","Guideline","",""],
  ["Monday","Lower A: RDL, Leg Press","Lower body equivalent","Strength","","Protein Target","Ayush 150g+; Simran 100-130g","",""],
  ["Tuesday","Upper Push: Bench","Upper push equivalent","Strength","","Hydration","3L water daily","",""]
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SHEET_VALUES };
}
