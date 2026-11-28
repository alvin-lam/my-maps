/* Service worker for My Maps.
   The app shell, map libraries, font and map data are all served from this site
   and cached on install so the map opens offline.
   Bump VERSION whenever any app shell file changes so visitors get the update. */
var VERSION = "v53";
var SHELL = "my-maps-shell-" + VERSION;
var RUNTIME = "my-maps-runtime";
var SHELL_FILES = [
  "./",
  "index.html",
  "privacy.html",
  "manifest.webmanifest",
  "css/styles.css",
  "css/privacy.css",
  "js/install.js",
  "js/appearance.js",
  "js/back-to-top.js",
  "js/map.js",
  "vendor/d3-7.9.0.min.js",
  "vendor/topojson-client-3.1.0.min.js",
  "assets/fonts/instrument-serif-v5-latin.woff2",
  "assets/fonts/instrument-serif-v5-latin-ext.woff2",
  "data/world.json",
  "data/places.json",
  "assets/icon.png?v=3",
  "assets/icon-192.png",
  "assets/tabicon-32.png",
  "assets/tabicon-192.png",
  "favicon.ico",
  "assets/icon-512.png",
  "assets/apple-touch-icon.png"
];

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
        // Save each page under its own address, and only good, same-site responses.
        if (res.ok && res.type === "basic") { var copy = res.clone(); caches.open(SHELL).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match("index.html"); });
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
