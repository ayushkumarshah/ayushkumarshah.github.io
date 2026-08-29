const {
  birthdayAccountFor,
  birthdayLoginResponse,
  birthdayChoiceIsValid
} = require("../src/auth");

describe("birthday authentication helpers", () => {
  it("accepts only the Saanu account, case-insensitively", () => {
    expect(birthdayAccountFor("saanu")).toEqual({ name: "Saanu" });
    expect(birthdayAccountFor("SAANU")).toEqual({ name: "Saanu" });
    expect(birthdayAccountFor("ayush")).toBeNull();
  });

  it("returns the health-style login response", () => {
    expect(birthdayLoginResponse({ name: "Saanu" }, "TOKEN")).toEqual({
      ok: true,
      token: "TOKEN",
      name: "Saanu"
    });
  });

  it("accepts only the two displayed destination choices", () => {
    expect(birthdayChoiceIsValid("del-mar")).toBe(true);
    expect(birthdayChoiceIsValid("hyatt")).toBe(true);
    expect(birthdayChoiceIsValid("other")).toBe(false);
  });
});
