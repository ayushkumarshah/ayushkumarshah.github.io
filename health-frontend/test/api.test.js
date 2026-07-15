// jsdom-free: provide minimal globals the module uses.
const store = {};
global.localStorage = {
  getItem: k => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: k => { delete store[k]; }
};
global.CONFIG = { EXEC_URL: "https://exec.test/x", API_TOKEN: "tok" };

const { cacheGet, cacheSet, fetchSchedule, postCheckoff } = require("../../health/js/api.js");

beforeEach(() => { for (const k in store) delete store[k]; });

describe("cache", () => {
  it("round-trips JSON", () => {
    cacheSet("k", { a: 1 });
    expect(cacheGet("k")).toEqual({ a: 1 });
  });
  it("returns null for missing/corrupt", () => {
    expect(cacheGet("nope")).toBeNull();
    store["bad"] = "{not json";
    expect(cacheGet("bad")).toBeNull();
  });
});

describe("fetchSchedule", () => {
  it("returns live data and caches it", async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ schedule: {}, gym: [], principles: [] }) });
    const r = await fetchSchedule();
    expect(r.stale).toBe(false);
    expect(r.data.gym).toEqual([]);
    expect(cacheGet("health.schedule")).toEqual({ schedule: {}, gym: [], principles: [] });
  });
  it("falls back to cache when the network fails", async () => {
    cacheSet("health.schedule", { schedule: {}, gym: [{ day: "Mon" }], principles: [] });
    global.fetch = async () => { throw new Error("offline"); };
    const r = await fetchSchedule();
    expect(r.stale).toBe(true);
    expect(r.data.gym[0].day).toBe("Mon");
  });
});

describe("postCheckoff", () => {
  it("posts text/plain with the token merged in", async () => {
    let captured = null;
    global.fetch = async (url, opts) => { captured = { url, opts }; return { ok: true, json: async () => ({ ok: true }) }; };
    await postCheckoff({ date: "2026-07-12", person: "ayush", itemId: "x", itemLabel: "L", done: true });
    expect(captured.url).toBe("https://exec.test/x");
    expect(captured.opts.headers["Content-Type"]).toBe("text/plain");
    const body = JSON.parse(captured.opts.body);
    expect(body).toEqual({ token: "tok", date: "2026-07-12", person: "ayush", itemId: "x", itemLabel: "L", done: true });
  });
});
