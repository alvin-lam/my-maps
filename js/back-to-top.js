(function () {
  "use strict";
  var topButton = document.getElementById("back-to-top");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function toggleTopButton() { topButton.hidden = window.scrollY < 400; }
  window.addEventListener("scroll", toggleTopButton, { passive: true });
  toggleTopButton();
  topButton.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    document.getElementById("page-title").focus({ preventScroll: true });
  });
  document.getElementById("copyright-year").textContent = String(new Date().getFullYear());
})();
