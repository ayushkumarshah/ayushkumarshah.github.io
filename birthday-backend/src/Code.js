// Private birthday web-app backend. Authentication intentionally follows the
// existing /health Apps Script pattern: password hashes and the API token live
// only in Script Properties; the public frontend receives a token after login.

var BIRTHDAY_SALT = "birthday-app-auth-v1::";
var BIRTHDAY_CHOICE_KEY = "BIRTHDAY_DESTINATION_CHOICE";
var BIRTHDAY_CHOICE_AT_KEY = "BIRTHDAY_DESTINATION_CHOICE_AT";
var BIRTHDAY_PASSWORD_SETUP_KEY = "PASSWORD_SETUP";

function birthdayToken_() {
  return PropertiesService.getScriptProperties().getProperty("API_TOKEN");
}

function birthdayHashPassword_(password) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    BIRTHDAY_SALT + String(password),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (value) {
    return ("0" + (value & 0xff).toString(16)).slice(-2);
  }).join("");
}

// Internal helper. Prefer installBirthdayPassword(), which avoids placing the
// plain password in source code or the Apps Script execution log.
function setBirthdayUser(username, password) {
  var account = birthdayAccountFor(username);
  if (!account) throw new Error("Unknown birthday-site account");
  PropertiesService.getScriptProperties().setProperty(
    "USER_" + String(username).toLowerCase(),
    birthdayHashPassword_(password)
  );
  Logger.log("Birthday password set for " + username);
}

// One-time setup:
// 1. Add PASSWORD_SETUP in Project Settings → Script Properties.
// 2. Run installBirthdayPassword from the editor.
// The plain value is deleted immediately after its hash is stored.
function installBirthdayPassword() {
  var properties = PropertiesService.getScriptProperties();
  var password = properties.getProperty(BIRTHDAY_PASSWORD_SETUP_KEY);
  if (!password) throw new Error("Add PASSWORD_SETUP to Script Properties first");
  setBirthdayUser("saanu", password);
  properties.deleteProperty(BIRTHDAY_PASSWORD_SETUP_KEY);
  Logger.log("Birthday password installed; PASSWORD_SETUP deleted");
}

function birthdayAuthorized_(providedToken) {
  var expectedToken = birthdayToken_();
  return Boolean(expectedToken) && String(providedToken || "") === String(expectedToken);
}

function birthdayJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var parameters = (e && e.parameter) || {};
  if (!birthdayAuthorized_(parameters.token)) {
    return birthdayJson_({ error: "unauthorized" });
  }
  var properties = PropertiesService.getScriptProperties();
  return birthdayJson_({
    ok: true,
    serverTime: new Date().toISOString(),
    choice: properties.getProperty(BIRTHDAY_CHOICE_KEY) || null,
    choiceAt: properties.getProperty(BIRTHDAY_CHOICE_AT_KEY) || null
  });
}

function doPost(e) {
  var payload;
  try {
    payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (error) {
    return birthdayJson_({ ok: false, error: "bad_json" });
  }

  if (payload.action === "login") {
    var username = String(payload.username || "").toLowerCase();
    var account = birthdayAccountFor(username);
    if (account) {
      var storedHash = PropertiesService.getScriptProperties().getProperty("USER_" + username);
      if (storedHash && storedHash === birthdayHashPassword_(String(payload.password || ""))) {
        return birthdayJson_(birthdayLoginResponse(account, birthdayToken_()));
      }
    }
    return birthdayJson_({ ok: false, error: "invalid" });
  }

  if (!birthdayAuthorized_(payload.token)) {
    return birthdayJson_({ ok: false, error: "unauthorized" });
  }

  if (payload.action === "saveBirthdayChoice") {
    if (!birthdayChoiceIsValid(payload.choice)) {
      return birthdayJson_({ ok: false, error: "bad_choice" });
    }
    var properties = PropertiesService.getScriptProperties();
    properties.setProperty(BIRTHDAY_CHOICE_KEY, String(payload.choice));
    properties.setProperty(BIRTHDAY_CHOICE_AT_KEY, new Date().toISOString());
    return birthdayJson_({ ok: true });
  }

  return birthdayJson_({ ok: false, error: "unknown_action" });
}

function verifyBirthdayBackend() {
  var properties = PropertiesService.getScriptProperties();
  Logger.log("API_TOKEN set: " + (birthdayToken_() ? "yes" : "NO"));
  Logger.log("Saanu password set: " + (properties.getProperty("USER_saanu") ? "yes" : "NO"));
  Logger.log("Plain setup password removed: " +
    (properties.getProperty(BIRTHDAY_PASSWORD_SETUP_KEY) ? "NO — remove it" : "yes"));
  Logger.log("Current choice: " + (properties.getProperty(BIRTHDAY_CHOICE_KEY) || "none"));
}
