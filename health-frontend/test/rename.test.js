const { applyRename } = require("../../health/js/schedule.js");

describe("applyRename", () => {
  it("rewrites map keys across events, gym, and principles", () => {
    const data = {
      schedule: {
        office: { ayush: [{ activity: "Walk with Simran", details: "", notes: "see Simran - Diet tab" }],
                  simran: [{ activity: "Yoga", details: "Simran routine", notes: "" }] },
        wfh: { ayush: [], simran: [] }, saturday: { ayush: [], simran: [] }, sunday: { ayush: [], simran: [] }
      },
      gym: [{ day: "Monday", focusAyush: "Lower", focusSimran: "Simran lower", type: "Strength" }],
      principles: [{ topic: "Together Time", guideline: "Dinner with Simran" }]
    };
    const out = applyRename(data, { "Simran": "Saanu" });
    expect(out.schedule.office.ayush[0].activity).toBe("Walk with Saanu");
    expect(out.schedule.office.ayush[0].notes).toBe("see Saanu - Diet tab");
    expect(out.schedule.office.simran[0].details).toBe("Saanu routine");
    expect(out.gym[0].focusSimran).toBe("Saanu lower");
    expect(out.principles[0].guideline).toBe("Dinner with Saanu");
  });
  it("is a no-op for an empty map", () => {
    const data = { schedule: { office:{ayush:[{activity:"X",details:"",notes:""}],simran:[]}, wfh:{ayush:[],simran:[]}, saturday:{ayush:[],simran:[]}, sunday:{ayush:[],simran:[]} }, gym: [], principles: [] };
    expect(applyRename(data, {}).schedule.office.ayush[0].activity).toBe("X");
  });
});
