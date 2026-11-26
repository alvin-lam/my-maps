/* Appearance: light or dark mode and the color scheme, in one panel.
   Loaded in <head> so saved choices apply before the page paints.
   Mode: "system" follows the device; "light" and "dark" override it.
   Scheme: "auto" (the default) picks a holiday when one is near, otherwise the season. */
(function () {
  "use strict";
  var THEME_KEY = "world-map-theme", SCHEME_KEY = "my-maps-scheme", ACK_KEY = "my-maps-holiday-seen";
  var root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var SCHEMES = [{"id": "classic", "label": "Classic", "emoji": "🌍", "group": "Classic", "colors": ["#2f9e6e", "#e0a320", "#7b4fd6", "#d9534f"]}, {"id": "daylight", "label": "Daylight", "emoji": "🌤️", "group": "Classic", "colors": ["#0a9d58", "#f4a100", "#6c3fd1", "#e2334f"]}, {"id": "midnight", "label": "Midnight", "emoji": "🌙", "group": "Classic", "colors": ["#2ee6a6", "#ffc94d", "#b18cff", "#ff6b8b"], "dark": true}, {"id": "spring", "label": "Spring", "emoji": "🌸", "group": "Seasons", "colors": ["#3f9e5f", "#e9a23b", "#9b6cc4", "#e5738f"]}, {"id": "summer", "label": "Summer", "emoji": "☀️", "group": "Seasons", "colors": ["#12a4a0", "#f6b416", "#f0743e", "#c2306b"]}, {"id": "autumn", "label": "Autumn", "emoji": "🍂", "group": "Seasons", "colors": ["#c8681d", "#d9a21b", "#7d2f3a", "#4f6d8f"]}, {"id": "winter", "label": "Winter", "emoji": "❄️", "group": "Seasons", "colors": ["#2f7fc4", "#c9a227", "#5b4fb0", "#1a9e8f"]}, {"id": "lunar-new-year", "label": "Lunar New Year", "emoji": "🧧", "group": "Holidays", "colors": ["#d6262f", "#e0a11b", "#1f8a70", "#7b3fa0"]}, {"id": "valentines-day", "label": "Valentine's Day", "emoji": "💝", "group": "Holidays", "colors": ["#d81b60", "#f4a3b8", "#8e1b3a", "#9c7bd1"]}, {"id": "st-patricks-day", "label": "St. Patrick's Day", "emoji": "☘️", "group": "Holidays", "colors": ["#2e9e4f", "#d4a017", "#0f5a2c", "#e07b24"]}, {"id": "holi", "label": "Holi", "emoji": "🎨", "group": "Holidays", "colors": ["#ec4899", "#facc15", "#22c55e", "#3b82f6"]}, {"id": "earth-day", "label": "Earth Day", "emoji": "🌎", "group": "Holidays", "colors": ["#3f9e4f", "#1f6fb8", "#c69a4a", "#8a5a3c"]}, {"id": "pride", "label": "Pride", "emoji": "🏳️‍🌈", "group": "Holidays", "colors": ["#e53935", "#fb8c00", "#43a047", "#1e88e5"]}, {"id": "independence-day", "label": "Independence Day", "emoji": "🎆", "group": "Holidays", "colors": ["#b22234", "#c9a227", "#2a2f6e", "#4f9fe0"]}, {"id": "halloween", "label": "Halloween", "emoji": "🎃", "group": "Holidays", "colors": ["#ef7a1a", "#7a3fb0", "#3f9e3a", "#c22f2f"]}, {"id": "dia-de-los-muertos", "label": "Día de los Muertos", "emoji": "💀", "group": "Holidays", "colors": ["#f59e0b", "#d81b60", "#14b8a6", "#7c3aed"]}, {"id": "diwali", "label": "Diwali", "emoji": "🪔", "group": "Holidays", "colors": ["#f59e0b", "#ea580c", "#be185d", "#6d28d9"]}, {"id": "thanksgiving", "label": "Thanksgiving", "emoji": "🦃", "group": "Holidays", "colors": ["#d9661f", "#9f1239", "#d4a72c", "#6b4423"]}, {"id": "hanukkah", "label": "Hanukkah", "emoji": "🕎", "group": "Holidays", "colors": ["#2563eb", "#7c8aa5", "#0e2a6b", "#38bdf8"]}, {"id": "christmas", "label": "Christmas", "emoji": "🎄", "group": "Holidays", "colors": ["#1f7a3e", "#d4a017", "#d6333d", "#5b7fa6"]}, {"id": "new-years-eve", "label": "New Year's Eve", "emoji": "🥂", "group": "Holidays", "colors": ["#c9a227", "#1f2a5c", "#6f7d96", "#7b3fa0"]}];
  var byId = {}; SCHEMES.forEach(function (s) { byId[s.id] = s; });
  var HOLIDAYS = { "lunar-new-year": 1, "valentines-day": 1, "st-patricks-day": 1, "earth-day": 1, pride: 1, "independence-day": 1, halloween: 1, diwali: 1, thanksgiving: 1, christmas: 1, "new-years-eve": 1 };
  // Main day of Diwali (Lakshmi Puja) each year: [month index, day]. Holi, Día de los Muertos and Hanukkah are picked by hand only.
  var DIWALI = { 2025: [9, 20], 2026: [10, 8], 2027: [9, 29], 2028: [9, 17], 2029: [10, 5], 2030: [9, 26], 2031: [10, 14], 2032: [10, 2], 2033: [9, 22], 2034: [10, 10], 2035: [9, 30] };
  // Lunar New Year moves each year: [month index, day].
  var LUNAR = { 2025: [0, 29], 2026: [1, 17], 2027: [1, 6], 2028: [0, 26], 2029: [1, 13], 2030: [1, 3], 2031: [0, 23], 2032: [1, 11], 2033: [0, 31], 2034: [1, 19], 2035: [1, 8] };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  // Seasons follow the hemisphere of the device time zone.
  function guessHemi() {
    var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    return /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham|Fiji|Tongatapu|Apia|Noumea|Efate|Pago_Pago|Rarotonga|Tahiti|Norfolk)|^America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|Lima|La_Paz|Punta_Arenas|Campo_Grande|Cuiaba|Porto_Velho|Recife|Bahia|Maceio|Fortaleza|Belem)|^Africa\/(Johannesburg|Maputo|Harare|Lusaka|Windhoek|Gaborone|Maseru|Mbabane|Blantyre|Lubumbashi|Luanda|Dar_es_Salaam|Kigali|Bujumbura)|^Indian\/(Mauritius|Reunion|Antananarivo|Mayotte|Comoro)|^Atlantic\/(Stanley|St_Helena)/.test(tz) ? "south" : "north";
  }
  var hemi = guessHemi();
  function set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

  function near(d, y, md, before, after) {
    if (!md) return false;
    var diff = Math.round((d - new Date(y, md[0], md[1])) / 864e5);
    return diff >= -before && diff <= after;
  }
  function thanksgiving(y) { var first = new Date(y, 10, 1).getDay(); return [10, 1 + ((4 - first + 7) % 7) + 21]; }
  function forDate(d) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    if ((m === 11 && day >= 27) || (m === 0 && day <= 2)) return "new-years-eve";
    if (near(d, y, LUNAR[y], 7, 15)) return "lunar-new-year";
    if (near(d, y, DIWALI[y], 2, 2)) return "diwali";
    if (near(d, y, thanksgiving(y), 3, 3)) return "thanksgiving";
    if (m === 1 && day >= 7 && day <= 14) return "valentines-day";
    if (m === 2 && day >= 10 && day <= 17) return "st-patricks-day";
    if (m === 3 && day >= 15 && day <= 22) return "earth-day";
    if (m === 11 && day <= 26) return "christmas";
    if (m === 9 && day >= 15) return "halloween";
    if ((m === 5 && day >= 28) || (m === 6 && day <= 5)) return "independence-day";
    if (m === 5) return "pride";
    // Seasons flip for the southern hemisphere; holidays stay on their dates.
    if (hemi === "south") m = (m + 6) % 12;
    if (m >= 2 && m <= 4) return "spring";
    if (m >= 5 && m <= 7) return "summer";
    if (m >= 8 && m <= 10) return "autumn";
    return "winter";
  }

  var mode = get(THEME_KEY); if (mode !== "light" && mode !== "dark") mode = "system";
  var mapStyle = get("my-maps-map-style"); if (mapStyle !== "outline" && mapStyle !== "vintage") mapStyle = "flat";
  var decor = get("my-maps-decorations") === "off" ? "off" : "on";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  function applyMapStyle() { if (mapStyle === "flat") root.removeAttribute("data-mapstyle"); else root.setAttribute("data-mapstyle", mapStyle); }
  applyMode(); applyScheme(); applyMapStyle();

  // Holiday decorations: a short, gentle animation over the map when a holiday scheme is on.
  var DECOR = {
    christmas: { type: "fall", items: ["❄️", "❄"] },
    hanukkah: { type: "fall", items: ["✨", "❄"] },
    "new-years-eve": { type: "fireworks" },
    "independence-day": { type: "fireworks" },
    holi: { type: "fireworks" },
    "valentines-day": { type: "rise", items: ["💗", "💕", "❤️"] },
    diwali: { type: "rise", items: ["✨", "🪔"] },
    halloween: { type: "rise", items: ["🦇", "🎃"] },
    "lunar-new-year": { type: "fall", items: ["🧧", "✨"] },
    "st-patricks-day": { type: "fall", items: ["☘️", "🍀"] },
    "earth-day": { type: "fall", items: ["🍃", "🌱"] },
    pride: { type: "fall", items: ["🏳️‍🌈", "✨"] },
    "dia-de-los-muertos": { type: "fall", items: ["🌼", "💀"] },
    thanksgiving: { type: "fall", items: ["🍂", "🍁"] }
  };
  // Builds a decoration for a W x H area. step(ctx, t, dt) draws one frame; t is milliseconds since start.
  // Shared by the live map and the animated GIF download.
  var DURATION = 7000;
  function makeDecor(id, W, H) {
    var d = DECOR[id]; if (!d) return null;
    var cs = getComputedStyle(root), colors = ["--visited", "--planning", "--lived", "--living"].map(function (v) { return cs.getPropertyValue(v).trim(); });
    if (id === "new-years-eve") colors = ["#f5d061", "#e8e8f0", "#c9a227", "#b18cff"];
    if (id === "independence-day") colors = ["#e0303f", "#ffffff", "#3c6fd6", "#e0303f"];
    var parts = [], nextBurst = 0;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    if (d.type !== "fireworks") {
      for (var i = 0; i < 26; i++) parts.push({ x: rnd(0, W), y: d.type === "fall" ? rnd(-H * .5, H * .4) : rnd(H * .6, H * 1.5), s: rnd(14, 24), v: rnd(45, 85), w: rnd(0, 6.28), t: d.items[i % d.items.length] });
    }
    function burst() {
      var x = rnd(W * .15, W * .85), y = rnd(H * .15, H * .5), c = colors[Math.floor(Math.random() * colors.length)];
      for (var k = 0; k < 40; k++) { var a = k / 40 * 6.28, sp = rnd(40, 110); parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, c: c }); }
    }
    return {
      duration: DURATION,
      step: function (ctx, t, dt) {
        var fade = t > DURATION - 1500 ? Math.max(0, (DURATION - t) / 1500) : 1;
        ctx.save();
        if (d.type === "fireworks") {
          if (t < DURATION - 1800 && t > nextBurst) { burst(); nextBurst = t + rnd(450, 900); }
          parts = parts.filter(function (p) { return p.life > 0; });
          parts.forEach(function (p) {
            p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt * .9;
            ctx.globalAlpha = Math.max(0, p.life) * fade; ctx.fillStyle = p.c;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 6.28); ctx.fill();
          });
        } else {
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          parts.forEach(function (p) {
            p.y += (d.type === "fall" ? 1 : -1) * p.v * dt; p.w += dt; p.x += Math.sin(p.w) * 12 * dt;
            ctx.globalAlpha = .85 * fade; ctx.font = p.s + "px system-ui, sans-serif"; ctx.fillText(p.t, p.x, p.y);
          });
        }
        ctx.restore();
      }
    };
  }
  window.MyMapsDecor = { make: function (W, H) { return makeDecor(resolved(), W, H); }, label: function () { return byId[resolved()]; } };

  var decorRun = 0;
  function decorate() {
    var wrap = document.getElementById("map-wrap");
    var old = document.getElementById("decor-canvas"); if (old) old.remove();
    decorRun++;
    if (!wrap || decor === "off" || reduceMotion) return;
    var W = wrap.clientWidth, H = wrap.clientHeight, dec = makeDecor(resolved(), W, H);
    if (!dec) return;
    var run = decorRun, cv = document.createElement("canvas"); cv.id = "decor-canvas"; cv.className = "decor-canvas"; cv.setAttribute("aria-hidden", "true");
    wrap.appendChild(cv);
    var dpr = window.devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    var start = performance.now(), last = start;
    function frame(now) {
      if (run !== decorRun) return;
      var t = now - start, dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.clearRect(0, 0, W, H);
      dec.step(ctx, t, dt);
      if (t < dec.duration) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
  }

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
      ["path", { d: "M27 15c4-1 8 1 8 5 0 4-3 8-5 9-2-1-3-5-4-8 0-2-1-5 1-6z", fill: s.dark ? "#2a3550" : "#d9dee6" }],
      ["path", { d: "M36 6c6-3 16-3 20 2 1 3-2 6-6 7-4 1-8 0-11-2-3-2-5-5-3-7z", fill: c[1] }],
      ["path", { d: "M48 22c3-1 7 0 7 3s-3 4-6 4-5-1-5-3 2-3 4-4z", fill: s.dark ? "#2a3550" : "#d9dee6" }]
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
    SCHEMES.forEach(function (s) { s.seaColor = { classic: "#eaf1fb", daylight: "#e8f2fc", midnight: "#0f1a33", spring: "#e6f3f7", summer: "#dff3f8", autumn: "#eef0ee", winter: "#e3edf8", "lunar-new-year": "#f7ece4", pride: "#eef0fb", "independence-day": "#e5ecf8", halloween: "#ece7f1", christmas: "#eaf1ee", "valentines-day": "#fbe9ef", "st-patricks-day": "#e4f2e6", "holi": "#f2eefb", "earth-day": "#dcecf7", "dia-de-los-muertos": "#efe9f3", "diwali": "#f8ece0", "thanksgiving": "#efebe4", "hanukkah": "#e3ebf8", "new-years-eve": "#e6e9f2" }[s.id]; });

    var modeBtns = Array.prototype.slice.call(panel.querySelectorAll(".mode-switch button[data-mode]"));
    var styleBtns = Array.prototype.slice.call(panel.querySelectorAll("[data-mapstyle]"));
    var decorBtns = Array.prototype.slice.call(panel.querySelectorAll("[data-decor]"));
    styleBtns.forEach(function (b) {
      b.addEventListener("click", function () { mapStyle = b.dataset.mapstyle; set("my-maps-map-style", mapStyle === "flat" ? null : mapStyle); applyMapStyle(); sync(); });
    });
    decorBtns.forEach(function (b) {
      b.addEventListener("click", function () { decor = b.dataset.decor; set("my-maps-decorations", decor === "off" ? "off" : null); sync(); decorate(); });
    });
    if (reduceMotion) { decorBtns.forEach(function (b) { b.disabled = true; }); document.getElementById("decor-note").hidden = false; }
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
    var NOTES = { classic: "The original look", daylight: "Crisp, best in light mode", midnight: "Glowing, best in dark mode" };
    var lastGroup = null;
    SCHEMES.forEach(function (s) {
      if (s.group !== lastGroup) {
        var h = document.createElement("p"); h.className = "grid-label"; h.setAttribute("role", "presentation"); h.textContent = s.group;
        grid.appendChild(h); lastGroup = s.group;
      }
      card(s.id, s.emoji + " " + s.label, NOTES[s.id] || "", s);
    });

    function sync() {
      var r = resolved();
      modeBtns.forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.mode === mode)); });
      styleBtns.forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.mapstyle === mapStyle)); });
      decorBtns.forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.decor === (reduceMotion ? "off" : decor))); });
      cards.forEach(function (c) { c.setAttribute("aria-checked", String(c.dataset.scheme === scheme)); });
      var today = new Date(), dayText = today.toLocaleDateString(undefined, { month: "long", day: "numeric" });
      autoSub.textContent = dayText + ": " + byId[forDate(today)].label + ". Changes with the seasons and holidays.";
      if (emoji) emoji.textContent = byId[r].emoji;
      var label = "Appearance: " + (scheme === "auto" ? "Automatic (" + byId[r].label + ")" : byId[r].label) + ", " + (mode === "system" ? "system mode" : mode + " mode");
      btn.setAttribute("aria-label", label); btn.setAttribute("title", label);
      syncThemeColor();
    }
    function choose(id) { scheme = id; set(SCHEME_KEY, id); applyScheme(); sync(); decorate(); }

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
    arrows(modeBtns, 3); arrows(styleBtns, 3); arrows(decorBtns, 2); arrows(cards, 3);
    // Play the decoration once the map has loaded.
    setTimeout(decorate, 1200);
    if (media && media.addEventListener) media.addEventListener("change", sync);
    sync();

    // When "Automatic" switches to a holiday, say so once and offer to keep it or go back to Classic.
    var r = resolved();
    if (scheme === "auto" && HOLIDAYS[r]) {
      var tag = r + "-" + new Date().getFullYear(), toast = document.getElementById("app-toast");
      if (toast && get(ACK_KEY) !== tag) {
        setTimeout(function () {
          if (!toast.hidden) return;
          toast.replaceChildren();
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
