/* Service worker for My Maps.
   The app shell is cached on install so the map opens offline.
   Map libraries and map data from the CDN are cached the first time they load.
   Bump VERSION whenever any app shell file changes so visitors get the update. */
var VERSION = "v20";
var SHELL = "my-maps-shell-" + VERSION;
var RUNTIME = "my-maps-runtime";
var SHELL_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/styles.css",
  "js/install.js",
  "js/appearance.js",
  "js/back-to-top.js",
  "js/map.js",
  "data/world.json",
  "data/places.json",
  "assets/icon.png?v=3",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/apple-touch-icon.png"
];
var CDN_HOSTS = ["cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(SHELL).then(function (cache) { return cache.addAll(SHELL_FILES); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf("my-maps-shell-") === 0 && k !== SHELL; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// The page asks a waiting worker to take over when the visitor chooses "Reload".
self.addEventListener("message", function (event) {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  // Pages: try the network first so updates show up, then fall back to the cached copy.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(SHELL).then(function (c) { c.put("index.html", copy); });
        return res;
      }).catch(function () { return caches.match("index.html"); })
    );
    return;
  }

  // Versioned CDN files never change, so serve them from the cache once stored.
  if (CDN_HOSTS.indexOf(url.hostname) !== -1) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res.ok || res.type === "opaque") { var copy = res.clone(); caches.open(RUNTIME).then(function (c) { c.put(req, copy); }); }
          return res;
        });
      })
    );
    return;
  }

  // Own files: serve from the cache right away and refresh it in the background.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res.ok) { var copy = res.clone(); caches.open(SHELL).then(function (c) { c.put(req, copy); }); }
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
  }
});
