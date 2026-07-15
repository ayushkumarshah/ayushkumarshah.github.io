var ACCOUNTS = {
  ayush: { person: "ayush", name: "Ayush" },
  saanu: { person: "simran", name: "Saanu" }
};
var PEOPLE = { ayush: "Ayush", simran: "Saanu" };
var RENAME = { "Simran": "Saanu" };

function accountFor(username) {
  var key = String(username == null ? "" : username).toLowerCase();
  return Object.prototype.hasOwnProperty.call(ACCOUNTS, key) ? ACCOUNTS[key] : null;
}

function buildLoginResponse(account, token) {
  return {
    ok: true, token: token, person: account.person, name: account.name,
    people: PEOPLE, rename: RENAME
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ACCOUNTS, PEOPLE, RENAME, accountFor, buildLoginResponse };
}
