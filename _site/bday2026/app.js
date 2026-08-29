(function () {
  "use strict";

  var config = window.BIRTHDAY_CONFIG || {};
  var gate = document.getElementById("gate");
  var loginForm = document.getElementById("loginForm");
  var gateMessage = document.getElementById("gateMessage");
  var privateRoot = document.getElementById("privateRoot");
  var sessionToken = null;
  var serverOffsetMs = 0;
  var objectUrls = [];

  function isPreview() {
    var local = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    return local && new URLSearchParams(window.location.search).get(config.PREVIEW_QUERY || "preview") === "1";
  }

  function accountName() {
    return String.fromCharCode(115, 97, 97, 110, 117);
  }

  function fetchJson(url, options) {
    return fetch(url, options).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  }

  function login(password) {
    if (isPreview()) return Promise.resolve({ ok: true, preview: true });
    if (!config.EXEC_URL) return Promise.resolve({ ok: false, error: "not-configured" });
    return fetchJson(config.EXEC_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "login", username: accountName(), password: password })
    });
  }

  function fetchServerState(token) {
    if (isPreview()) return Promise.resolve({ ok: true, serverTime: new Date().toISOString(), choice: null });
    var separator = config.EXEC_URL.indexOf("?") >= 0 ? "&" : "?";
    return fetchJson(config.EXEC_URL + separator + "token=" + encodeURIComponent(token), { cache: "no-store" });
  }

  function saveChoice(choice) {
    if (isPreview()) return Promise.resolve({ ok: true, preview: true });
    if (!sessionToken) return Promise.resolve({ ok: false, error: "unauthorized" });
    return fetchJson(config.EXEC_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "saveBirthdayChoice", token: sessionToken, choice: choice })
    });
  }

  function bytesFromBase64(value) {
    return Uint8Array.from(atob(value), function (character) { return character.charCodeAt(0); });
  }

  function deriveKey(password, meta) {
    return crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    ).then(function (material) {
      return crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt: bytesFromBase64(meta.salt),
        iterations: meta.iterations,
        hash: "SHA-256"
      }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    });
  }

  function decryptResponse(response, key) {
    if (!response.ok) throw new Error("Private file unavailable");
    return response.arrayBuffer().then(function (value) {
      var bytes = new Uint8Array(value);
      var signature = new TextDecoder().decode(bytes.slice(0, 5));
      if (signature !== "BDAY1" || bytes.length < 34) throw new Error("Invalid private file");
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(5, 17) }, key, bytes.slice(17));
    });
  }

  function decryptUrl(url, key) {
    return fetch(url, { cache: "no-store" }).then(function (response) { return decryptResponse(response, key); });
  }

  function loadPrivatePayload(password) {
    return fetchJson("vault/meta.json", { cache: "no-store" }).then(function (meta) {
      return deriveKey(password, meta).then(function (key) {
        return decryptUrl(meta.content, key).then(function (plaintext) {
          var payload = JSON.parse(new TextDecoder().decode(plaintext));
          return { key: key, payload: payload };
        });
      });
    });
  }

  function loadPrivatePhotos(key, media) {
    var images = Array.from(document.querySelectorAll("[data-vault-photo]"));
    return Promise.all(images.map(function (image) {
      var item = media[image.dataset.vaultPhoto];
      if (!item) throw new Error("Private photo is missing from the vault");
      return decryptUrl(item.path, key).then(function (plaintext) {
        var url = URL.createObjectURL(new Blob([plaintext], { type: item.mime }));
        objectUrls.push(url);
        image.src = url;
        image.removeAttribute("data-vault-photo");
      });
    }));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character];
    });
  }

  function observeReveals() {
    var items = document.querySelectorAll(".reveal:not(.visible)");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function updateCountdowns() {
    var now = Date.now() + serverOffsetMs;
    document.querySelectorAll("[data-unlock]").forEach(function (door) {
      var remaining = new Date(door.dataset.unlock).getTime() - now;
      var label = door.querySelector(".countdown");
      if (remaining <= 0) {
        door.classList.add("unlocked");
        label.textContent = "Open";
        return;
      }
      var days = Math.floor(remaining / 86400000);
      var hours = Math.floor((remaining % 86400000) / 3600000);
      label.textContent = days > 0 ? days + "d " + hours + "h" : hours + "h";
    });
  }

  function markChoice(choice) {
    document.querySelectorAll("[data-choice]").forEach(function (card) {
      card.classList.toggle("selected", card.dataset.choice === choice);
    });
  }

  function initializePrivatePage(payload, initialChoice) {
    var letterModal = document.getElementById("letterModal");
    var confirmModal = document.getElementById("confirmModal");
    var letterContent = document.getElementById("letterContent");

    function renderLetter(choice) {
      var invitation = payload.invitations[choice];
      letterContent.innerHTML =
        '<p class="eyebrow">' + escapeHtml(invitation.eyebrow) + '</p>' +
        '<h2 class="letter-heading">' + escapeHtml(invitation.title) + '</h2>' +
        '<p class="letter-body">' + escapeHtml(invitation.body) + '</p>' +
        '<p class="letter-promise">' + escapeHtml(invitation.promise) + '</p>' +
        '<button class="choose-button" type="button" data-choose="' + escapeHtml(choice) + '">' + escapeHtml(invitation.button) + '</button>';
      letterModal.showModal();
      document.body.classList.add("modal-open");
    }

    document.querySelectorAll("[data-open]").forEach(function (button) {
      button.addEventListener("click", function () { renderLetter(button.dataset.open); });
    });
    letterContent.addEventListener("click", function (event) {
      var button = event.target.closest("[data-choose]");
      if (!button) return;
      var choice = button.dataset.choose;
      var invitation = payload.invitations[choice];
      button.disabled = true;
      saveChoice(choice).then(function (result) {
        if (!result.ok) throw new Error(result.error || "Could not save choice");
        markChoice(choice);
        letterModal.close();
        document.getElementById("confirmationTitle").textContent = invitation.confirmTitle;
        document.getElementById("confirmationCopy").textContent = invitation.confirm;
        confirmModal.showModal();
      }).catch(function () {
        button.disabled = false;
        button.textContent = "Couldn’t save — try once more";
      });
    });
    document.querySelector(".close-modal").addEventListener("click", function () { letterModal.close(); });
    document.getElementById("changeChoice").addEventListener("click", function () { confirmModal.close(); });
    [letterModal, confirmModal].forEach(function (modal) {
      modal.addEventListener("close", function () { document.body.classList.remove("modal-open"); });
      modal.addEventListener("click", function (event) { if (event.target === modal) modal.close(); });
    });
    if (initialChoice && payload.invitations[initialChoice]) markChoice(initialChoice);
    observeReveals();
    updateCountdowns();
    window.setInterval(updateCountdowns, 60000);
  }

  function unlock(password, authResult) {
    sessionToken = authResult.token || null;
    return Promise.all([loadPrivatePayload(password), fetchServerState(sessionToken)]).then(function (results) {
      var privateBundle = results[0];
      var serverState = results[1];
      if (!serverState.ok) throw new Error("The secure clock could not be verified");
      serverOffsetMs = Date.parse(serverState.serverTime) - Date.now();
      privateRoot.innerHTML = privateBundle.payload.html;
      var experience = document.getElementById("experience");
      experience.hidden = false;
      gate.hidden = true;
      document.title = "A birthday world";
      initializePrivatePage(privateBundle.payload, serverState.choice);
      return loadPrivatePhotos(privateBundle.key, privateBundle.payload.media);
    });
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var passwordInput = document.getElementById("password");
    var password = passwordInput.value;
    var button = loginForm.querySelector("button");
    button.disabled = true;
    gateMessage.textContent = "Checking our little secret…";
    login(password).then(function (result) {
      if (!result.ok) throw new Error(result.error || "invalid");
      gateMessage.textContent = "Opening your birthday world…";
      return unlock(password, result);
    }).then(function () {
      passwordInput.value = "";
    }).catch(function (error) {
      var vaultMismatch = /decrypt|operation|JSON|private file/i.test(error.message || "");
      gateMessage.textContent = vaultMismatch
        ? "The private album and password are out of sync. Ask the person who made it to rebuild it."
        : "That wasn’t our word, or the door could not connect. Try once more.";
      passwordInput.select();
    }).finally(function () {
      button.disabled = false;
    });
  });

  window.addEventListener("pagehide", function () {
    objectUrls.forEach(function (url) { URL.revokeObjectURL(url); });
  });
})();
