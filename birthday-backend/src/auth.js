var BIRTHDAY_ACCOUNTS = {
  saanu: { name: "Saanu" }
};

function birthdayAccountFor(username) {
  var key = String(username == null ? "" : username).toLowerCase();
  return Object.prototype.hasOwnProperty.call(BIRTHDAY_ACCOUNTS, key)
    ? BIRTHDAY_ACCOUNTS[key]
    : null;
}

function birthdayLoginResponse(account, token) {
  return { ok: true, token: token, name: account.name };
}

function birthdayChoiceIsValid(choice) {
  return ["del-mar", "hyatt"].indexOf(String(choice)) >= 0;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    BIRTHDAY_ACCOUNTS: BIRTHDAY_ACCOUNTS,
    birthdayAccountFor: birthdayAccountFor,
    birthdayLoginResponse: birthdayLoginResponse,
    birthdayChoiceIsValid: birthdayChoiceIsValid
  };
}
