var CACHE = "health-v2";
var SHELL = [
  "./", "./index.html", "./app.css",
  "./config.js", "./js/schedule.js", "./js/mealprep.js", "./js/api.js", "./js/app.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return; // never cache POST check-offs
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let backend calls hit the network
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {}); }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
