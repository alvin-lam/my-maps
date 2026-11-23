/* Color schemes. Loaded in <head> so the saved scheme applies before the page paints.
   "classic" is the original look. "auto" picks a holiday when one is near, otherwise the season. */
(function () {
  "use strict";
  var KEY = "my-maps-scheme";
  var root = document.documentElement;
  var SCHEMES = [
    { id: "classic", label: "Classic", emoji: "🌍", group: "General", colors: ["#2f9e6e", "#e0a320", "#7b4fd6", "#d9534f"] },
    { id: "auto", label: "Match the calendar", emoji: "📅", group: "General", colors: null },
    { id: "spring", label: "Spring", emoji: "🌸", group: "Seasons", colors: ["#3f9e5f", "#e9a23b", "#b07cc6", "#e5738f"] },
    { id: "summer", label: "Summer", emoji: "☀️", group: "Seasons", colors: ["#12a4a0", "#f6b416", "#f0743e", "#e64a6a"] },
    { id: "autumn", label: "Autumn", emoji: "🍂", group: "Seasons", colors: ["#c8681d", "#d9a21b", "#8a3b2a", "#6b7f2a"] },
    { id: "winter", label: "Winter", emoji: "❄️", group: "Seasons", colors: ["#2f7fc4", "#c9a227", "#5b4fb0", "#22a3b5"] },
    { id: "lunar-new-year", label: "Lunar New Year", emoji: "🧧", group: "Holidays", colors: ["#d6262f", "#e0a11b", "#8f1a2a", "#f06b3a"] },
    { id: "pride", label: "Pride", emoji: "🏳️‍🌈", group: "Holidays", colors: ["#e53935", "#fb8c00", "#43a047", "#1e88e5"] },
    { id: "independence-day", label: "Independence Day", emoji: "🎆", group: "Holidays", colors: ["#b22234", "#c9a227", "#3c3b6e", "#2a78c9"] },
    { id: "halloween", label: "Halloween", emoji: "🎃", group: "Holidays", colors: ["#ef7a1a", "#7a3fb0", "#3f9e3a", "#c22f2f"] },
    { id: "christmas", label: "Christmas", emoji: "🎄", group: "Holidays", colors: ["#1f7a3e", "#d4a017", "#8c1d2c", "#d6333d"] }
  ];
  var byId = {}; SCHEMES.forEach(function (s) { byId[s.id] = s; });
  // Lunar New Year moves each year.
  var LUNAR = { 2025: [0, 29], 2026: [1, 17], 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3], 2031: [0, 23], 2032: [1, 11], 2033: [0, 31], 2034: [1, 19], 2035: [1, 8] };

  function forDate(d) {
    var y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    var ln = LUNAR[y];
    if (ln) {
      var diff = (d - new Date(y, ln[0], ln[1])) / 864e5;
      if (diff >= -7 && diff <= 15) return "lunar-new-year";
    }
    if (m === 11 && day <= 26) return "christmas";
    if (m === 9 && day >= 15) return "halloween";
    if ((m === 5 && day >= 28) || (m === 6 && day <= 5)) return "independence-day";
    if (m === 5) return "pride";
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  }
  function saved() { try { var v = localStorage.getItem(KEY); return byId[v] ? v : "classic"; } catch (e) { return "classic"; } }
  function apply(choice) {
    var actual = choice === "auto" ? forDate(new Date()) : choice;
    if (actual === "classic") root.removeAttribute("data-scheme"); else root.setAttribute("data-scheme", actual);
    return actual;
  }
  var current = saved();
  apply(current);

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("scheme-toggle"), menu = document.getElementById("scheme-menu");
    var emoji = document.getElementById("title-emoji");
    if (!btn || !menu) return;
    var lastGroup = null, items = [];
    SCHEMES.forEach(function (s) {
      if (s.group !== lastGroup) {
        var g = document.createElement("div"); g.className = "group"; g.setAttribute("role", "presentation"); g.textContent = s.group; menu.appendChild(g);
        lastGroup = s.group;
      }
      var b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "menuitemradio"); b.dataset.scheme = s.id;
      var e = document.createElement("span"); e.className = "emoji"; e.setAttribute("aria-hidden", "true"); e.textContent = s.emoji; b.appendChild(e);
      var t = document.createElement("span"); t.textContent = s.label; b.appendChild(t);
      if (s.colors) {
        var sw = document.createElement("span"); sw.className = "swatch"; sw.setAttribute("aria-hidden", "true");
        s.colors.forEach(function (c) { var i = document.createElement("i"); i.style.background = c; sw.appendChild(i); });
        b.appendChild(sw);
      }
      b.addEventListener("click", function () { choose(s.id); close(true); });
      menu.appendChild(b); items.push(b);
    });

    function sync() {
      var actual = current === "auto" ? forDate(new Date()) : current;
      items.forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.scheme === current)); });
      if (emoji) emoji.textContent = byId[actual].emoji;
      var label = "Color scheme: " + (current === "auto" ? "Match the calendar (" + byId[actual].label + ")" : byId[current].label);
      btn.setAttribute("aria-label", label); btn.setAttribute("title", label);
      if (window.syncThemeColor) window.syncThemeColor();
    }
    function choose(id) {
      current = id; apply(id);
      try { localStorage.setItem(KEY, id); } catch (e) {}
      sync();
    }
    function open() {
      menu.hidden = false; btn.setAttribute("aria-expanded", "true");
      var sel = items.filter(function (b) { return b.dataset.scheme === current; })[0] || items[0];
      sel.focus();
    }
    function close(focusBtn) { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); if (focusBtn) btn.focus(); }
    btn.addEventListener("click", function (e) { e.stopPropagation(); if (menu.hidden) open(); else close(false); });
    menu.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", function () { if (!menu.hidden) close(false); });
    menu.addEventListener("keydown", function (e) {
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
      else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") close(false);
    });
    sync();
  });
})();
