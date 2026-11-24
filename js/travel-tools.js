/* Travel Tools: mark the link for the site being viewed.
   The matching link gets aria-current="page" and "YOU ARE HERE" in place of its arrow. */
(function () {
  "use strict";
  var host = location.hostname.replace(/^www\./, "");
  document.querySelectorAll(".tt-link").forEach(function (a) {
    var arrow = a.querySelector(".tt-arrow");
    var match = a.hostname.replace(/^www\./, "") === host;
    if (match) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    if (arrow) arrow.textContent = match ? "YOU ARE HERE" : "→";
  });
})();
