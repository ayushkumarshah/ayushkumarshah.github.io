const {
  birthdayAccountFor,
  birthdayLoginResponse
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
});
