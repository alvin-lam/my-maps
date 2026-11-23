/* Progressive web app support.
   - Registers the service worker so the map works offline.
   - Shows an install banner suited to the visitor's browser:
       Chrome, Edge and Android get a one-tap Install button.
       iPhone and iPad Safari get Share menu steps.
       Safari on a Mac gets the Add to Dock steps.
   - Waits until the visitor has used the page before asking, and snoozes for
     30 days after "Not now". The footer "Install app" button always works.
   - Offers a Reload button when a new version is ready, and notes when the
     map is saved for offline use or the connection drops. */
(function () {
  "use strict";
  var SNOOZE_KEY = "my-maps-install-snoozed-until";
  var SNOOZE_DAYS = 30;
  var banner = document.getElementById("install-banner");
  var title = document.getElementById("install-title");
  var acceptBtn = document.getElementById("install-accept");
  var instructions = document.getElementById("install-instructions");
  var openBtn = document.getElementById("install-open");
  var toast = document.getElementById("app-toast");
  var deferred = null;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var media = window.matchMedia ? window.matchMedia("(display-mode: standalone)") : null;
  function standalone() { return (media && media.matches) || window.navigator.standalone === true; }

  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isIPad = /iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Edg\//.test(ua);
  var isMacSafari = isSafari && !isIOS && /Macintosh/.test(ua);
  var isInAppBrowser = /FBAN|FBAV|Instagram|Line\/|GSA\//.test(ua);

  // Which install route this browser supports, if any.
  function method() {
    if (deferred) return "prompt";
    if (isIOS && isSafari && !isInAppBrowser) return "ios";
    if (isIOS) return "ios-other";
    if (isMacSafari) return "mac";
    return null;
  }

  var SHARE = '<span class="share-glyph" aria-hidden="true"></span>';
  function fill() {
    var m = method();
    acceptBtn.hidden = m !== "prompt";
    if (m === "prompt") {
      title.textContent = "Install My Maps";
      instructions.textContent = "Open it like an app and use it offline.";
    } else if (m === "ios") {
      title.textContent = "Add My Maps to your Home Screen";
      instructions.innerHTML = "Tap " + SHARE + " Share " + (isIPad ? "at the top of the screen" : "below") +
        ', then "Add to Home Screen".';
    } else if (m === "ios-other") {
      title.textContent = "Add My Maps to your Home Screen";
      instructions.textContent = "Open this page in Safari, then tap Share and \"Add to Home Screen\".";
    } else if (m === "mac") {
      title.textContent = "Add My Maps to your Dock";
      instructions.textContent = "In the menu bar, choose File, then \"Add to Dock\".";
    }
  }

  function setHeight() { document.body.style.setProperty("--install-banner-height", banner.offsetHeight + "px"); }
  function show() {
    if (standalone() || !method()) return;
    fill();
    banner.hidden = false;
    document.body.classList.add("has-install-banner");
    setHeight();
  }
  function hide(snooze) {
    banner.hidden = true;
    document.body.classList.remove("has-install-banner");
    if (snooze) set(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 864e5));
  }
  function snoozed() { return Number(get(SNOOZE_KEY) || 0) > Date.now(); }
  function syncOpenBtn() { if (openBtn) openBtn.hidden = standalone() || !method(); }

  // Ask only after the visitor has spent some time on the page or marked a country.
  var asked = false;
  function maybeAsk() {
    if (asked || snoozed() || standalone()) return;
    asked = true; show();
  }
  setTimeout(maybeAsk, 20000);
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".status-btn")) setTimeout(maybeAsk, 600);
  });

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    syncOpenBtn();
    if (!banner.hidden) fill();
  });
  acceptBtn.addEventListener("click", function () {
    if (!deferred) return;
    var d = deferred; deferred = null;
    d.prompt();
    d.userChoice.then(function (choice) { hide(choice.outcome !== "accepted"); syncOpenBtn(); });
  });
  document.getElementById("install-dismiss").addEventListener("click", function () { hide(true); });
  if (openBtn) openBtn.addEventListener("click", function () {
    if (deferred) acceptBtn.click(); else show();
  });
  window.addEventListener("appinstalled", function () { hide(false); syncOpenBtn(); showToast("My Maps is installed."); });
  if (media && media.addEventListener) media.addEventListener("change", function () { if (standalone()) hide(false); syncOpenBtn(); });
  window.addEventListener("resize", function () { if (!banner.hidden) setHeight(); });
  syncOpenBtn();

  // Small status messages at the bottom of the screen.
  var toastTimer;
  function showToast(text, actionLabel, action) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.innerHTML = "";
    var span = document.createElement("span"); span.textContent = text; toast.appendChild(span);
    if (actionLabel) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-primary"; b.textContent = actionLabel;
      b.addEventListener("click", function () { toast.hidden = true; action(); });
      toast.appendChild(b);
    } else {
      toastTimer = setTimeout(function () { toast.hidden = true; }, 4000);
    }
    toast.hidden = false;
  }
  window.addEventListener("offline", function () { showToast("You're offline. Your map still works, and changes are saved on this device."); });
  window.addEventListener("online", function () { showToast("You're back online."); });

  // Service worker: offline support and update prompts.
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  var reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (reloading) return; reloading = true; location.reload();
  });
  window.addEventListener("load", function () {
    var firstInstall = !navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").then(function (reg) {
      function offerUpdate(worker) {
        showToast("A new version of My Maps is ready.", "Reload", function () { worker.postMessage("skip-waiting"); });
      }
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener("updatefound", function () {
        var worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", function () {
          if (worker.state !== "installed") return;
          if (navigator.serviceWorker.controller) offerUpdate(worker);
          else if (firstInstall) showToast("My Maps is ready to use offline.");
        });
      });
      // Check for a new version when the app comes back to the foreground.
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") reg.update().catch(function () {}); });
    }).catch(function () {});
  });
})();
