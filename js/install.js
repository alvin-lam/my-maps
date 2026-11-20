/* Add to Home Screen: iOS Safari gets Share-menu instructions; browsers that
   fire beforeinstallprompt (Chrome/Edge/Android) get an Install button.
   Hidden when already installed or after "Not now". */
(function () {
  "use strict";
  var KEY = "world-map-install-dismissed";
  var banner = document.getElementById("install-banner");
  var acceptBtn = document.getElementById("install-accept");
  var instructions = document.getElementById("install-instructions");
  var deferred = null;

  var standalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
  function dismissed() { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  if (standalone || dismissed()) return;

  function show() {
    banner.hidden = false;
    document.body.classList.add("has-install-banner");
    document.body.style.setProperty("--install-banner-height", banner.offsetHeight + "px");
  }
  function hide(remember) {
    banner.hidden = true;
    document.body.classList.remove("has-install-banner");
    if (remember) { try { localStorage.setItem(KEY, "1"); } catch (e) {} }
  }

  var ua = navigator.userAgent;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if (isIOS && isSafari) show();

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    instructions.textContent = "Open it like an app, straight from your Home Screen.";
    acceptBtn.hidden = false;
    show();
  });
  acceptBtn.addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; hide(true); });
  });
  document.getElementById("install-dismiss").addEventListener("click", function () { hide(true); });
  window.addEventListener("appinstalled", function () { hide(true); });
  window.addEventListener("resize", function () {
    if (!banner.hidden) document.body.style.setProperty("--install-banner-height", banner.offsetHeight + "px");
  });
})();
