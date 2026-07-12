const LOG_HEADER = ["timestamp", "date", "person", "itemId", "itemLabel", "done"];

function parseLogRows(values) {
  const rows = values || [];
  const out = [];
  for (let i = 1; i < rows.length; i++) { // skip header row
    const r = rows[i];
    if (!r || String(r[3] == null ? "" : r[3]).trim() === "") continue;
    out.push({
      timestamp: r[0], date: String(r[1]), person: String(r[2]),
      itemId: String(r[3]), itemLabel: String(r[4] == null ? "" : r[4]),
      done: r[5] === true || String(r[5]).toLowerCase() === "true"
    });
  }
  return out;
}

function filterLogByDate(rows, date) {
  return (rows || []).filter(r => r.date === date);
}

function isAuthorized(provided, expected) {
  return typeof provided === "string" && typeof expected === "string" &&
    expected.length > 0 && provided === expected;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { LOG_HEADER, parseLogRows, filterLogByDate, isAuthorized };
}
