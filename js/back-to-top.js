(function () {
  "use strict";
  var year = document.getElementById("copyright-year");
  if (year) year.textContent = String(new Date().getFullYear());
  var topButton = document.getElementById("back-to-top");
  if (!topButton) return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function toggleTopButton() { topButton.hidden = window.scrollY < 400; }
  window.addEventListener("scroll", toggleTopButton, { passive: true });
  toggleTopButton();
  topButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    document.getElementById("page-title").focus({ preventScroll: true });
  });
})();
