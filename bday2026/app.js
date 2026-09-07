(function () {
  "use strict";

  var config = window.BIRTHDAY_CONFIG || {};
  var gate = document.getElementById("gate");
  var loginForm = document.getElementById("loginForm");
  var gateMessage = document.getElementById("gateMessage");
  var privateRoot = document.getElementById("privateRoot");
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

  function makeCelebrationBurst(target) {
    var burst = document.createElement("span");
    burst.className = "party-burst";
    ["♡", "✿", "★", "♡", "✦", "✿", "♡", "★"].forEach(function (symbol, index) {
      var particle = document.createElement("i");
      particle.className = "party-particle particle-" + index;
      particle.textContent = symbol;
      burst.appendChild(particle);
    });
    target.appendChild(burst);
    window.setTimeout(function () { burst.remove(); }, 1200);
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
    document.querySelectorAll("[data-unlock]").forEach(function (door) {
      var label = door.querySelector(".countdown");
      var button = door.querySelector(".door-button");
      door.classList.add("unlocked");
      button.disabled = false;
      label.textContent = "Open";
    });
  }

  function initializePrivatePage(payload) {
    var chapterModal = document.getElementById("chapterModal");
    var chapterContent = document.getElementById("chapterContent");

    function renderChapter(chapterId) {
      var chapter = payload.chapters[chapterId];
      if (!chapter) return;
      var body = (chapter.body || []).map(function (paragraph) {
        return '<p class="chapter-body">' + escapeHtml(paragraph) + '</p>';
      }).join("");
      var moments = (chapter.moments || []).map(function (moment) {
        return '<li><time>' + escapeHtml(moment.time) + '</time><span>' + escapeHtml(moment.text) + '</span></li>';
      }).join("");
      chapterContent.innerHTML =
        '<p class="eyebrow">' + escapeHtml(chapter.eyebrow) + '</p>' +
        '<h2 class="chapter-heading" id="chapterTitle">' + escapeHtml(chapter.title) + '</h2>' +
        body +
        (moments ? '<ol class="chapter-moments">' + moments + '</ol>' : '') +
        '<p class="chapter-promise">' + escapeHtml(chapter.promise) + '</p>';
      chapterModal.classList.remove("photo-mode");
      chapterModal.showModal();
      document.body.classList.add("modal-open");
    }

    function renderPhoto(button) {
      var source = button.querySelector("img");
      var caption = button.querySelector("span");
      var figure = document.createElement("figure");
      var image = document.createElement("img");
      var figcaption = document.createElement("figcaption");
      figure.className = "lightbox-photo";
      image.src = source.src;
      image.alt = source.alt;
      figcaption.textContent = caption ? caption.textContent : source.alt;
      figure.appendChild(image);
      figure.appendChild(figcaption);
      chapterContent.replaceChildren(figure);
      chapterModal.classList.add("photo-mode");
      chapterModal.showModal();
      document.body.classList.add("modal-open");
    }

    document.querySelectorAll("[data-open-chapter]").forEach(function (button) {
      button.addEventListener("click", function () {
        var door = button.closest(".door");
        if (door && !door.classList.contains("unlocked")) return;
        renderChapter(button.dataset.openChapter);
      });
    });

    var pickedFlowers = new Set();
    var gardenNote = document.getElementById("gardenNote");
    var gardenCount = document.getElementById("gardenCount");
    var gardenComplete = document.getElementById("gardenComplete");
    document.querySelectorAll("[data-garden-index]").forEach(function (flower) {
      flower.addEventListener("click", function () {
        var index = Number(flower.dataset.gardenIndex);
        var memory = payload.garden && payload.garden[index];
        if (!memory) return;
        pickedFlowers.add(index);
        flower.classList.add("picked");
        flower.setAttribute("aria-pressed", "true");
        document.getElementById("gardenDate").textContent = memory.date;
        document.getElementById("gardenTitle").textContent = memory.title;
        document.getElementById("gardenCopy").textContent = memory.copy;
        gardenCount.textContent = String(pickedFlowers.size);
        gardenComplete.hidden = pickedFlowers.size !== payload.garden.length;
        gardenNote.classList.remove("note-arrived");
        void gardenNote.offsetWidth;
        gardenNote.classList.add("note-arrived");
        makeCelebrationBurst(flower);
      });
    });

    var releasedBalloons = new Set();
    var balloons = document.querySelectorAll(".balloon");
    var balloonMessage = document.getElementById("balloonMessage");
    balloons.forEach(function (balloon, index) {
      balloon.addEventListener("click", function () {
        if (balloon.classList.contains("released")) return;
        releasedBalloons.add(index);
        balloon.classList.add("released");
        balloon.setAttribute("aria-pressed", "true");
        makeCelebrationBurst(balloon);
        var visibleBalloonCount = Array.from(balloons).filter(function (item) {
          return window.getComputedStyle(item).display !== "none";
        }).length;
        if (balloonMessage && releasedBalloons.size >= visibleBalloonCount) {
          window.setTimeout(function () {
            balloonMessage.hidden = false;
            balloonMessage.classList.add("message-arrived");
          }, 700);
        }
      });
    });

    var giftBox = document.getElementById("giftBox");
    var giftNote = document.getElementById("giftNote");
    giftBox.addEventListener("click", function () {
      var opened = giftBox.classList.toggle("opened");
      giftBox.setAttribute("aria-expanded", String(opened));
      giftNote.hidden = !opened;
      if (opened) makeCelebrationBurst(giftBox);
    });

    document.querySelectorAll("[data-photo-open]").forEach(function (button) {
      button.addEventListener("click", function () { renderPhoto(button); });
    });
    var diaryViewport = document.getElementById("diaryViewport");
    document.querySelectorAll("[data-diary-direction]").forEach(function (button) {
      button.addEventListener("click", function () {
        diaryViewport.scrollBy({ left: Number(button.dataset.diaryDirection) * Math.min(window.innerWidth * .75, 720), behavior: "smooth" });
      });
    });

    chapterModal.querySelector(".close-modal").addEventListener("click", function () { chapterModal.close(); });
    chapterModal.addEventListener("close", function () {
      document.body.classList.remove("modal-open");
      chapterModal.classList.remove("photo-mode");
    });
    chapterModal.addEventListener("click", function (event) { if (event.target === chapterModal) chapterModal.close(); });
    observeReveals();
    updateCountdowns();
    window.setInterval(updateCountdowns, 60000);
  }

  function unlock(password) {
    return loadPrivatePayload(password).then(function (privateBundle) {
      privateRoot.innerHTML = privateBundle.payload.html;
      var experience = document.getElementById("experience");
      experience.hidden = false;
      gate.hidden = true;
      document.title = "A birthday world";
      initializePrivatePage(privateBundle.payload);
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
      return unlock(password);
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
