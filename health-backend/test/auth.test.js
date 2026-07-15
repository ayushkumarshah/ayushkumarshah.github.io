const { accountFor, buildLoginResponse, PEOPLE, RENAME } = require("../src/auth");

describe("accountFor", () => {
  it("maps usernames to person + name (case-insensitive)", () => {
    expect(accountFor("ayush")).toEqual({ person: "ayush", name: "Ayush" });
    expect(accountFor("saanu")).toEqual({ person: "simran", name: "Saanu" });
    expect(accountFor("SAANU")).toEqual({ person: "simran", name: "Saanu" });
  });
  it("returns null for unknown users", () => {
    expect(accountFor("bob")).toBeNull();
    expect(accountFor("")).toBeNull();
  });
});

describe("buildLoginResponse", () => {
  it("returns the exact success shape", () => {
    const acct = accountFor("saanu");
    expect(buildLoginResponse(acct, "TOK")).toEqual({
      ok: true, token: "TOK", person: "simran", name: "Saanu",
      people: { ayush: "Ayush", simran: "Saanu" },
      rename: { "Simran": "Saanu" }
    });
  });
  it("exposes the shared maps", () => {
    expect(PEOPLE).toEqual({ ayush: "Ayush", simran: "Saanu" });
    expect(RENAME).toEqual({ "Simran": "Saanu" });
  });
});
