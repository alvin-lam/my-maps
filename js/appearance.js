/* Appearance: light or dark mode and the color scheme, in one panel.
   Loaded in <head> so saved choices apply before the page paints.
   Mode: "system" follows the device; "light" and "dark" override it.
   Scheme: "auto" (the default) picks a holiday when one is near, otherwise the season. */
(function () {
  "use strict";
  var THEME_KEY = "world-map-theme", SCHEME_KEY = "my-maps-scheme", ACK_KEY = "my-maps-holiday-seen";
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var SCHEMES = [{"id": "classic", "label": "Classic", "emoji": "🌍", "group": "General", "colors": ["#2f9e6e", "#e0a320", "#7b4fd6", "#d9534f"]}, {"id": "spring", "label": "Spring", "emoji": "🌸", "group": "Seasons", "colors": ["#3f9e5f", "#e9a23b", "#9b6cc4", "#e5738f"]}, {"id": "summer", "label": "Summer", "emoji": "☀️", "group": "Seasons", "colors": ["#12a4a0", "#f6b416", "#f0743e", "#c2306b"]}, {"id": "autumn", "label": "Autumn", "emoji": "🍂", "group": "Seasons", "colors": ["#c8681d", "#d9a21b", "#7d2f3a", "#4f6d8f"]}, {"id": "winter", "label": "Winter", "emoji": "❄️", "group": "Seasons", "colors": ["#2f7fc4", "#c9a227", "#5b4fb0", "#1a9e8f"]}, {"id": "lunar-new-year", "label": "Lunar New Year", "emoji": "🧧", "group": "Holidays", "colors": ["#d6262f", "#e0a11b", "#1f8a70", "#7b3fa0"]}, {"id": "pride", "label": "Pride", "emoji": "🏳️‍🌈", "group": "Holidays", "colors": ["#e53935", "#fb8c00", "#43a047", "#1e88e5"]}, {"id": "independence-day", "label": "Independence Day", "emoji": "🎆", "group": "Holidays", "colors": ["#b22234", "#c9a227", "#2a2f6e", "#4f9fe0"]}, {"id": "halloween", "label": "Halloween", "emoji": "🎃", "group": "Holidays", "colors": ["#ef7a1a", "#7a3fb0", "#3f9e3a", "#c22f2f"]}, {"id": "christmas", "label": "Christmas", "emoji": "🎄", "group": "Holidays", "colors": ["#1f7a3e", "#d4a017", "#d6333d", "#5b7fa6"]}];
  var byId = {}; SCHEMES.forEach(function (s) { byId[s.id] = s; });
  var HOLIDAYS = { "lunar-new-year": 1, pride: 1, "independence-day": 1, halloween: 1, christmas: 1 };
  // Lunar New Year moves each year: [month index, day].
  var LUNAR = { 2025: [0, 29], 2026: [1, 17], 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3], 2031: [0, 23], 2032: [1, 11], 2033: [0, 31], 2034: [1, 19], 2035: [1, 8] };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  function forDate(d) {
    var y = d.getFullYear(), m = d.getMonth(), day = d.getDate(), ln = LUNAR[y];
    if (ln) { var diff = (d - new Date(y, ln[0], ln[1])) / 864e5; if (diff >= -7 && diff <= 15) return "lunar-new-year"; }
    if (m === 11 && day <= 26) return "christmas";
    if (m === 9 && day >= 15) return "halloween";
    if ((m === 5 && day >= 28) || (m === 6 && day <= 5)) return "independence-day";
    if (m === 5) return "pride";
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  }

  var mode = get(THEME_KEY); if (mode !== "light" && mode !== "dark") mode = "system";
  var scheme = get(SCHEME_KEY); if (scheme !== "auto" && !byId[scheme]) scheme = "auto";
  function resolved() { return scheme === "auto" ? forDate(new Date()) : scheme; }

  function applyMode() { if (mode === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", mode); }
  function applyScheme() { var s = resolved(); if (s === "classic") root.removeAttribute("data-scheme"); else root.setAttribute("data-scheme", s); }
  function syncThemeColor() {
    var c = getComputedStyle(root).getPropertyValue("--bg").trim();
    if (!c) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute("content", c); });
  }
  window.syncThemeColor = syncThemeColor;
  applyMode(); applyScheme();

  // A small stylized map in a scheme's colors, used on each card.
  function preview(s) {
    var c = s.colors;
    var ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 60 34"); svg.setAttribute("aria-hidden", "true");
    var shapes = [
      ["rect", { x: 0, y: 0, width: 60, height: 34, fill: s.seaColor }],
      ["path", { d: "M4 6c5-3 13-3 16 1 2 3-1 6-4 8-2 2-1 5-4 6-3 0-4-3-6-5-2-3-5-7-2-10z", fill: c[0] }],
      ["path", { d: "M14 20c3-1 6 1 6 4s-2 6-4 8c-2 0-3-3-3-6 0-2-1-5 1-6z", fill: c[3] }],
      ["path", { d: "M26 7c3-2 7-1 8 1 1 2-2 4-5 4-2 0-5-2-3-5z", fill: c[2] }],
      ["path", { d: "M27 15c4-1 8 1 8 5 0 4-3 8-5 9-2-1-3-5-4-8 0-2-1-5 1-6z", fill: "#d9dee6" }],
      ["path", { d: "M36 6c6-3 16-3 20 2 1 3-2 6-6 7-4 1-8 0-11-2-3-2-5-5-3-7z", fill: c[1] }],
      ["path", { d: "M48 22c3-1 7 0 7 3s-3 4-6 4-5-1-5-3 2-3 4-4z", fill: "#d9dee6" }]
    ];
    shapes.forEach(function (sh) {
      var el = document.createElementNS(ns, sh[0]);
      for (var a in sh[1]) el.setAttribute(a, sh[1][a]);
      svg.appendChild(el);
    });
    return svg;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("appearance-toggle"), panel = document.getElementById("appearance-panel");
    var grid = document.getElementById("scheme-grid"), emoji = document.getElementById("title-emoji");
    var backdrop = document.getElementById("appearance-backdrop");
    if (!btn || !panel) return;
    // Sea color for previews, read from the stylesheet rules for each scheme.
    SCHEMES.forEach(function (s) { s.seaColor = { classic: "#eaf1fb", spring: "#e6f3f7", summer: "#dff3f8", autumn: "#eef0ee", winter: "#e3edf8", "lunar-new-year": "#f7ece4", pride: "#eef0fb", "independence-day": "#e5ecf8", halloween: "#ece7f1", christmas: "#eaf1ee" }[s.id]; });

    var modeBtns = Array.prototype.slice.call(panel.querySelectorAll(".mode-switch button"));
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () { mode = b.dataset.mode; set(THEME_KEY, mode === "system" ? null : mode); applyMode(); sync(); });
    });

    var cards = [], autoSub;
    function card(id, label, sub, s, cls) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "scheme-card" + (cls ? " " + cls : ""); b.setAttribute("role", "radio"); b.dataset.scheme = id;
      b.appendChild(preview(s));
      var t = document.createElement("span"); t.textContent = label;
      var sp = document.createElement("span"); sp.className = "sub"; sp.textContent = sub; t.appendChild(sp);
      b.appendChild(t);
      b.addEventListener("click", function () { choose(id); });
      grid.appendChild(b); cards.push(b);
      return sp;
    }
    autoSub = card("auto", "📅 Automatic", "", byId[forDate(new Date())], "auto");
    SCHEMES.forEach(function (s) { card(s.id, s.emoji + " " + s.label, "", s); });

    function sync() {
      var r = resolved();
      modeBtns.forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.mode === mode)); });
      cards.forEach(function (c) { c.setAttribute("aria-checked", String(c.dataset.scheme === scheme)); });
      autoSub.textContent = "Today: " + byId[forDate(new Date())].label + ". Changes with the seasons and holidays.";
      if (emoji) emoji.textContent = byId[r].emoji;
      var label = "Appearance: " + (scheme === "auto" ? "Automatic (" + byId[r].label + ")" : byId[r].label) + ", " + (mode === "system" ? "system mode" : mode + " mode");
      btn.setAttribute("aria-label", label); btn.setAttribute("title", label);
      syncThemeColor();
    }
    function choose(id) { scheme = id; set(SCHEME_KEY, id); applyScheme(); sync(); }

    function open() {
      panel.hidden = false; if (backdrop) backdrop.hidden = false; btn.setAttribute("aria-expanded", "true");
      (panel.querySelector('[aria-checked="true"]') || modeBtns[0]).focus();
    }
    function close(focusBtn) { panel.hidden = true; if (backdrop) backdrop.hidden = true; btn.setAttribute("aria-expanded", "false"); if (focusBtn) btn.focus(); }
    btn.addEventListener("click", function (e) { e.stopPropagation(); if (panel.hidden) open(); else close(false); });
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.getElementById("appearance-close").addEventListener("click", function () { close(true); });
    document.addEventListener("click", function () { if (!panel.hidden) close(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(true); });
    // Arrow keys move between options inside each group.
    function arrows(list, cols) {
      list.forEach(function (el, i) {
        el.addEventListener("keydown", function (e) {
          var step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
          if (!step) return;
          e.preventDefault();
          list[Math.min(list.length - 1, Math.max(0, i + step))].focus();
        });
      });
    }
    arrows(modeBtns, 3); arrows(cards, 3);
    if (media && media.addEventListener) media.addEventListener("change", sync);
    sync();

    // When "Automatic" switches to a holiday, say so once and offer to keep it or go back to Classic.
    var r = resolved();
    if (scheme === "auto" && HOLIDAYS[r]) {
      var tag = r + "-" + new Date().getFullYear(), toast = document.getElementById("app-toast");
      if (toast && get(ACK_KEY) !== tag) {
        setTimeout(function () {
          if (!toast.hidden) return;
          toast.innerHTML = "";
          var msg = document.createElement("span"); msg.textContent = byId[r].emoji + " " + byId[r].label + " colors are on."; toast.appendChild(msg);
          [["Keep", false], ["Use Classic", true]].forEach(function (o) {
            var b = document.createElement("button"); b.type = "button"; b.className = o[1] ? "btn btn-ghost" : "btn btn-primary"; b.textContent = o[0];
            b.addEventListener("click", function () { set(ACK_KEY, tag); toast.hidden = true; if (o[1]) choose("classic"); });
            toast.appendChild(b);
          });
          toast.hidden = false;
        }, 1500);
      }
    }
  });
})();
