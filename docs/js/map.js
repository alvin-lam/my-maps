(function () {
  "use strict";
  var KEY = "world-map-statuses";
  var STATUSES = ["visited", "planning", "lived", "living"];
  var LABEL = { visited: "Visited", planning: "Planning", lived: "Lived", living: "Living" };
  var data = load();
  var countries = [], byId = {}, selectedId = null;
  // A colored status dot. Built with DOM calls (no HTML strings), as the Content Security Policy requires.
  function dot(status) { var i = document.createElement("i"); i.className = "dot dot-" + status; return i; }
  // Numbers, dates and sorting follow the device's language and region settings.
  var fmtNum = function (n) { try { return new Intl.NumberFormat().format(n); } catch (e) { return String(n); } };
  var fmtDate = function (d) { try { return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return d.toDateString(); } };
  var collator = (window.Intl && Intl.Collator) ? new Intl.Collator(undefined, { sensitivity: "base" }) : null;
  var byName = function (a, b) { return collator ? collator.compare(a, b) : a.localeCompare(b); };
  // Place details come from data/places.json, keyed by the same key saved in visitors' browsers.
  // Built by scripts/build-map.mjs, which also splits territories, adds tiny places and cuts out disputed areas.
  function codes(c) { var p = c.properties; return p.c2 ? { a2: p.c2, a3: p.c3, flag: p.f } : null; }
  function fullName(c) { return c.properties.name + (c.properties.f ? " " + c.properties.f : ""); }
  // d3 draws a ring the wrong way round as "the whole globe except this place".
  // Simplifying can flip a part, so check each part on its own and turn back any that flipped.
  function rewind(f) {
    var g = f.geometry; if (!g) return f;
    var fix = function (poly) {
      return d3.geoArea({ type: "Polygon", coordinates: poly }) > 2 * Math.PI ? poly.map(function (r) { return r.slice().reverse(); }) : poly;
    };
    if (g.type === "Polygon") g.coordinates = fix(g.coordinates); else if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map(fix);
    return f;
  }
  var svg = d3.select("#map"), wrap = document.getElementById("map-wrap");
  var g = svg.append("g"), pathsSel, markers = [], MARKER_R = 3;
  var tip = document.createElement("div"); tip.className = "map-tip"; tip.hidden = true; document.body.appendChild(tip);

  function load() { try { var v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }

  var zoom = d3.zoom().scaleExtent([1, 12]).on("zoom", function (e) {
    g.attr("transform", e.transform);
    // Keep marker dots the same size on screen at every zoom level.
    g.selectAll("circle.marker").attr("r", MARKER_R / e.transform.k);
  });
  svg.call(zoom).on("dblclick.zoom", null);
  var W = 960, H = 505;
  svg.attr("viewBox", "0 0 " + W + " " + H).attr("preserveAspectRatio", "xMidYMid meet");
  var projection = d3.geoNaturalEarth1();
  var path = d3.geoPath(projection);

  Promise.all([
    fetch("data/world.json").then(function (r) { return r.json(); }),
    fetch("data/places.json").then(function (r) { return r.json(); })
  ]).then(function (res) {
    var topo = res[0], info = res[1];
    var fc = topojson.feature(topo, topo.objects.places);
    fc.features.forEach(function (f) {
      var p = info[f.id] || { n: f.id };
      f.key = f.id;
      f.properties = { name: p.n, c2: p.c2, c3: p.c3, f: p.f, note: p.note, tiny: p.tiny };
      rewind(f);
      byId[f.key] = f;
    });
    projection.fitExtent([[6, 6], [W - 6, H - 6]], fc);
    countries = fc.features.slice().sort(function (a, b) { return byName(a.properties.name, b.properties.name); });
    g.selectAll("path").data(fc.features).join("path")
      .attr("d", path).attr("tabindex", 0)
      .attr("role", "button").attr("aria-label", function (d) { return d.properties.name; });
    // Places too small to see or tap get a dot on top of them.
    markers = fc.features.filter(function (d) { return path.area(d) < 8; }).map(function (d) { return { d: d, c: path.centroid(d) }; })
      .filter(function (m) { return isFinite(m.c[0]) && isFinite(m.c[1]); });
    g.selectAll("circle.marker").data(markers.map(function (m) { return m.d; })).join("circle")
      .attr("aria-hidden", "true").attr("r", MARKER_R)
      .attr("cx", function (d, i) { return markers[i].c[0]; }).attr("cy", function (d, i) { return markers[i].c[1]; });
    pathsSel = g.selectAll("path, circle")
      .on("click", function (e, d) { select(d.key, false); })
      .on("keydown", function (e, d) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(d.key, false); } })
      .on("mousemove", function (e, d) { tip.textContent = fullName(d) + (data[d.key] ? " · " + LABEL[data[d.key]] : "") + (d.properties.note ? " · " + d.properties.note : ""); tip.hidden = false; tip.style.left = (e.clientX + 12) + "px"; tip.style.top = (e.clientY + 12) + "px"; })
      .on("mouseleave", function () { tip.hidden = true; });
    document.getElementById("map-loading").hidden = true;
    render();
  }).catch(function () { document.getElementById("map-loading").textContent = "Couldn't load the map. Check your connection and refresh."; });

  function render() {
    if (pathsSel) pathsSel.attr("class", function (d) { return "country" + (this.tagName === "circle" ? " marker" : "") + (data[d.key] ? " " + data[d.key] : "") + (d.key === selectedId ? " selected" : ""); });
    STATUSES.forEach(function (s) {
      document.getElementById("count-" + s).textContent = fmtNum(Object.keys(data).filter(function (k) { return data[k] === s && byId[k]; }).length);
    });
    var grid = document.getElementById("lists-grid"); grid.replaceChildren();
    STATUSES.forEach(function (s) {
      var col = document.createElement("div");
      var h = document.createElement("h3"); h.appendChild(dot(s)); h.appendChild(document.createTextNode(LABEL[s])); col.appendChild(h);
      var names = countries.filter(function (c) { return data[c.key] === s; }).map(fullName);
      var n = document.createElement("span"); n.className = "lists-count"; n.textContent = fmtNum(names.length); h.appendChild(n);
      if (!names.length) { var p = document.createElement("p"); p.className = "none"; p.textContent = "None yet"; col.appendChild(p); }
      else { var ul = document.createElement("ul"); names.forEach(function (n) { var li = document.createElement("li"); li.textContent = n; ul.appendChild(li); }); col.appendChild(ul); }
      grid.appendChild(col);
    });
    if (selectedId) {
      document.querySelectorAll(".status-btn").forEach(function (b) { b.setAttribute("aria-checked", String(data[selectedId] === b.dataset.status)); });
      document.getElementById("chooser-clear").disabled = !data[selectedId];
    }
  }

  var chooser = document.getElementById("chooser");
  function select(id, zoomTo) {
    selectedId = id;
    document.getElementById("chooser-name").textContent = fullName(byId[id]);
    var note = document.getElementById("chooser-note");
    note.textContent = byId[id].properties.note || ""; note.hidden = !byId[id].properties.note;
    chooser.hidden = false;
    if (zoomTo) {
      var b = path.bounds(byId[id]), dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1];
      var k = Math.max(1, Math.min(8, 0.5 / Math.max(dx / W, dy / H)));
      var cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
      svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-cx, -cy));
    }
    render();
    chooser.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  function closeChooser() { selectedId = null; chooser.hidden = true; render(); }
  document.getElementById("chooser-close").addEventListener("click", closeChooser);
  document.querySelectorAll(".status-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!selectedId) return;
      if (data[selectedId] === b.dataset.status) delete data[selectedId]; else data[selectedId] = b.dataset.status;
      save(); render();
    });
  });
  document.getElementById("chooser-clear").addEventListener("click", function () { if (selectedId) { delete data[selectedId]; save(); render(); } });
  document.getElementById("reset-all").addEventListener("click", function () {
    if (!Object.keys(data).length || !confirm("Clear all countries from your map?")) return;
    data = {}; save(); render();
  });
  document.getElementById("zoom-in").addEventListener("click", function () { svg.transition().call(zoom.scaleBy, 1.6); });
  document.getElementById("zoom-out").addEventListener("click", function () { svg.transition().call(zoom.scaleBy, 1 / 1.6); });
  document.getElementById("zoom-reset").addEventListener("click", function () { svg.transition().call(zoom.transform, d3.zoomIdentity); });

  // Downloads
  // Some browsers cannot save files, mainly apps' built-in browsers and older iPhones.
  // There, offer the share sheet when possible, and remind the visitor to Add to Home Screen.
  var IN_APP = /FBAN|FBAV|Instagram|Line\/|GSA\/|Snapchat|TikTok|musical_ly|Twitter|LinkedInApp|Pinterest/i.test(navigator.userAgent);
  var CAN_DOWNLOAD = "download" in document.createElement("a") && !IN_APP;
  function cannotDownload(blob, name) {
    var file = window.File ? new File([blob], name, { type: blob.type }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: "My Maps" }).catch(function () {});
    var t = document.getElementById("app-toast"); if (!t) return;
    t.replaceChildren();
    var s = document.createElement("span");
    s.textContent = IN_APP ? "This app's browser can't save files. Open My Maps in your phone's browser and add it to your Home Screen." : "This browser can't save files. Add My Maps to your Home Screen to save your maps and lists.";
    t.appendChild(s);
    if (window.MyMapsInstall && window.MyMapsInstall.available()) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-primary"; b.textContent = "Show me";
      b.addEventListener("click", function () { t.hidden = true; window.MyMapsInstall.show(); });
      t.appendChild(b);
    }
    var x = document.createElement("button"); x.type = "button"; x.className = "btn btn-ghost"; x.textContent = "OK";
    x.addEventListener("click", function () { t.hidden = true; }); t.appendChild(x);
    t.hidden = false;
  }
  function saveBlob(blob, name) {
    if (!CAN_DOWNLOAD) { cannotDownload(blob, name); return; }
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function grouped() {
    return STATUSES.map(function (s) {
      var list = countries.filter(function (c) { return data[c.key] === s; });
      return { s: s, names: list.map(fullName), items: list.map(function (c) { var k = codes(c) || {}; return { name: c.properties.name, alpha2: k.a2 || "", alpha3: k.a3 || "", flag: c.properties.f || "" }; }) };
    });
  }
  function exportList(fmt) {
    var groups = grouped(), out, type;
    if (fmt === "json") {
      var obj = {}; groups.forEach(function (g) { obj[g.s] = g.items; });
      out = JSON.stringify(obj, null, 2); type = "application/json";
    } else if (fmt === "txt") {
      out = "My Countries\n" + fmtDate(new Date()) + "\n\n" + groups.map(function (g) {
        return LABEL[g.s] + " (" + fmtNum(g.names.length) + ")\n" + (g.names.length ? g.names.map(function (n) { return "- " + n; }).join("\n") : "- None");
      }).join("\n\n") + "\n"; type = "text/plain;charset=utf-8";
    } else {
      var rows = [["Country", "Alpha-2", "Alpha-3", "Flag", "Status"]];
      groups.forEach(function (g) { g.items.forEach(function (it) { rows.push([it.name, it.alpha2, it.alpha3, it.flag, LABEL[g.s]]); }); });
      out = "﻿" + rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      type = "text/csv;charset=utf-8";
    }
    saveBlob(new Blob([out], { type: type }), "my-countries." + fmt);
  }

  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  // Holiday video: when decorations are on during a holiday, Share records the image with the
  // decoration playing over the map, using the browser's own recorder. MP4 is used where the
  // browser can make it (Instagram's preferred format), otherwise WebM.
  var videoBusy = false;
  function videoType() {
    if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
    var types = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
    for (var i = 0; i < types.length; i++) if (MediaRecorder.isTypeSupported(types[i])) return types[i];
    return null;
  }
  function recordVideo(L, done, fail) {
    var type = videoType(), m = L.map, dec = window.MyMapsDecor && window.MyMapsDecor.make(W, H);
    if (!type || !dec) { fail(); return; }
    var base = paintCanvas(L, 1), out = document.createElement("canvas");
    out.width = base.width; out.height = base.height;
    var ctx = out.getContext("2d"), stream = out.captureStream(30), chunks = [];
    var rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6e6 });
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = function () { stream.getTracks().forEach(function (t) { t.stop(); }); done(new Blob(chunks, { type: type.split(";")[0] }), type.indexOf("mp4") > -1 ? "mp4" : "webm"); };
    var HOLD = 1200, length = dec.duration + HOLD, start = null, last = 0;
    // The color band along the bottom slides sideways through the four status colors and loops seamlessly.
    var c = L.c, bandY = L.h - L.band, flow = ctx.createLinearGradient(0, 0, L.w, 0);
    ["visited", "planning", "lived", "living", "visited"].forEach(function (k, i) { flow.addColorStop(i / 4, c[k]); });
    function frame(now) {
      if (start === null) { start = last = now; }
      var t = now - start, dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.drawImage(base, 0, 0);
      if (t < dec.duration) {
        ctx.save(); roundRect(ctx, m.x, m.y, m.w, m.h, m.r); ctx.clip(); ctx.translate(m.ox, m.oy); ctx.scale(m.k, m.k);
        dec.step(ctx, t, dt); ctx.restore();
      }
      var shift = (t / 4000 * L.w) % L.w;
      ctx.fillStyle = flow;
      [-shift, L.w - shift].forEach(function (x) { ctx.save(); ctx.translate(x, 0); ctx.fillRect(0, bandY, L.w, L.band); ctx.restore(); });
      var left = Math.ceil((length - t) / 1000);
      if (left > 0) videoToast("Making your video… " + left + "s");
      if (t < length) requestAnimationFrame(frame); else rec.stop();
    }
    rec.start(250);
    requestAnimationFrame(frame);
  }
  function videoToast(text, actions) {
    var t = document.getElementById("app-toast"); if (!t) return;
    t.replaceChildren(); var s = document.createElement("span"); s.textContent = text; t.appendChild(s);
    (actions || []).forEach(function (a) {
      var b = document.createElement("button"); b.type = "button"; b.className = a.primary ? "btn btn-primary" : "btn btn-ghost"; b.textContent = a.label;
      b.addEventListener("click", function () { t.hidden = true; a.run(); }); t.appendChild(b);
    });
    t.hidden = !text;
  }
  // Format menus
  var menus = [];
  function setupMenu(btnId, menuId, run) {
    var btn = document.getElementById(btnId), menu = document.getElementById(menuId), items = menu.querySelectorAll("[role=menuitem]");
    function close(focusBtn) { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); if (focusBtn) btn.focus(); }
    function open() { menus.forEach(function (m) { m(); }); menu.hidden = false; btn.setAttribute("aria-expanded", "true"); items[0].focus(); }
    menus.push(function () { close(false); });
    btn.addEventListener("click", function (e) { e.stopPropagation(); if (menu.hidden) open(); else close(false); });
    items.forEach(function (it, i) {
      it.addEventListener("click", function (e) { e.stopPropagation(); close(true); run(it.dataset.fmt); });
      it.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
        else if (e.key === "Escape") { e.preventDefault(); close(true); }
        else if (e.key === "Tab") close(false);
      });
    });
  }
  setupMenu("export-list", "export-menu", exportList);
  setupMenu("download-image", "image-menu", function (fmt) { downloadImage(fmt); });

  // Share: Instagram-ready images in Instagram's post and Story shapes.
  // On phones the image opens in the share sheet so it can go straight to Instagram; elsewhere it downloads.
  var IG = {
    "ig-square": { w: 1080, h: 1080, name: "square" },
    "ig-portrait": { w: 1080, h: 1350, name: "portrait" },
    "ig-landscape": { w: 1080, h: 566, name: "landscape" },
    "ig-story": { w: 1080, h: 1920, name: "story" }
  };
  function toast(text) {
    var t = document.getElementById("app-toast"); if (!t) return;
    t.replaceChildren(); var s = document.createElement("span"); s.textContent = text; t.appendChild(s); t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(function () { t.hidden = true; }, 3000);
  }
  // Draws a social-ready image: a bold headline with the number of places visited, the map large,
  // the status counts as chips and the site address. Text stays inside each format's safe area
  // (Stories and Reels cover about 250 px at the top and bottom with their own controls).
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function fitFont(ctx, text, weight, size, family, maxW) {
    do { ctx.font = weight + " " + size + "px " + family; size -= 2; } while (ctx.measureText(text).width > maxW && size > 12);
  }
  // Works out where everything goes on a share or download image. Sizes are tuned for a 1080 px wide image.
  var SANS = "system-ui, -apple-system, \"Segoe UI\", sans-serif", SERIF = '"Instrument Serif", Georgia, serif';
  var measureCtx = document.createElement("canvas").getContext("2d");
  function fitFont(text, weight, size, family, maxW) {
    do { measureCtx.font = weight + " " + size + "px " + family; size -= 2; } while (measureCtx.measureText(text).width > maxW && size > 12);
    return measureCtx.font;
  }
  function imageLayout(size) {
    var cs = getComputedStyle(document.documentElement);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    var c = { bg: v("--bg"), sea: v("--sea"), surface: v("--surface"), text: v("--text"), muted: v("--muted"), brand: v("--brand-link"),
      none: v("--land"), visited: v("--visited"), planning: v("--planning"), lived: v("--lived"), living: v("--living") };
    var cw = size.w, ch = size.h, wide = ch < cw * .6, story = ch > cw * 1.6, tall = size.name === "portrait";
    var been = Object.keys(data).filter(function (k) { return (data[k] === "visited" || data[k] === "lived" || data[k] === "living") && byId[k]; }).length;
    var headline = been ? "I've been to " + fmtNum(been) + (been === 1 ? " country" : " countries") : "My travel map";
    var items = grouped().map(function (g) { return { s: g.s, text: LABEL[g.s] + " " + fmtNum(g.names.length) }; });
    // Stories and Reels cover about 250 px at the top and bottom with their own controls.
    var safeTop = story ? 250 : wide ? 36 : 72, safeBottom = story ? 250 : wide ? 32 : 64, side = wide ? 48 : 64, innerW = cw - side * 2;
    var brandH = wide ? 34 : story ? 84 : tall ? 60 : 48, headH = wide ? 58 : story ? 300 : tall ? 120 : 92;
    var chipH = wide ? 44 : story ? 112 : tall ? 88 : 66, chipCols = wide || size.name === "square" ? 4 : 2, chipRows = Math.ceil(items.length / chipCols);
    var chipGap = wide ? 10 : 16, chipsH = chipRows * chipH + (chipRows - 1) * chipGap;
    var urlH = wide ? 26 : story ? 56 : tall ? 44 : 36, gap = wide ? 18 : story ? 64 : tall ? 44 : 30;
    var mapW = innerW, mapH = mapW * H / W, availMap = ch - safeTop - safeBottom - brandH - headH - chipsH - urlH - gap * 4;
    if (mapH > availMap) { mapH = availMap; mapW = mapH * W / H; }
    var total = brandH + headH + gap + mapH + gap + chipsH + gap + urlH, y = safeTop + Math.max(0, (ch - safeTop - safeBottom - total) / 2);
    var L = { w: cw, h: ch, c: c, wide: wide, texts: [], chips: [] };
    L.texts.push({ t: "All Trips Considered", x: cw / 2, y: y + brandH / 2, font: "400 " + Math.round(brandH * .8) + "px " + SERIF, fill: c.brand, anchor: "middle" });
    y += brandH;
    if (story && been) {
      var l1 = "I've been to", l2 = fmtNum(been) + (been === 1 ? " country" : " countries");
      L.texts.push({ t: l1, x: cw / 2, y: y + headH * .22, font: fitFont(l1, 700, 72, SANS, innerW), fill: c.text, anchor: "middle" });
      L.texts.push({ t: l2, x: cw / 2, y: y + headH * .66, font: fitFont(l2, 800, 150, SANS, innerW), fill: c.text, anchor: "middle" });
    } else {
      L.texts.push({ t: headline, x: cw / 2, y: y + headH / 2, font: fitFont(headline, 800, Math.round(headH * (story ? .4 : .72)), SANS, innerW), fill: c.text, anchor: "middle" });
    }
    y += headH + gap;
    var mx = (cw - mapW) / 2, pad = wide ? 8 : 14, k = (mapW - pad * 2) / W;
    L.map = { x: mx, y: y, w: mapW, h: mapH, r: wide ? 14 : 24, k: k, ox: mx + pad, oy: y + (mapH - H * k) / 2, shadow: wide ? 18 : 32, drop: wide ? 6 : 10, dotR: 4.5 * (wide ? 1.2 : 2) };
    y += mapH + gap;
    var chipW = (innerW - chipGap * (chipCols - 1)) / chipCols, fs = Math.round(chipH * .42);
    items.forEach(function (it, i) {
      var x = side + (chipW + chipGap) * (i % chipCols), cy = y + (chipH + chipGap) * Math.floor(i / chipCols);
      measureCtx.font = "700 " + fs + "px " + SANS;
      var dotR = fs * .36, tw = measureCtx.measureText(it.text).width, start = x + chipW / 2 - (tw + dotR * 2 + fs * .45) / 2;
      L.chips.push({ x: x, y: cy, w: chipW, h: chipH, color: c[it.s], dotX: start + dotR, dotR: dotR, text: it.text, tx: start + dotR * 2 + fs * .45, ty: cy + chipH / 2, font: "700 " + fs + "px " + SANS });
    });
    y += chipsH + gap;
    L.texts.push({ t: "mymaps.alltripsconsidered.com", x: cw / 2, y: y + urlH / 2, font: "600 " + Math.round(urlH * .62) + "px " + SANS, fill: c.muted, anchor: "middle" });
    L.band = wide ? 8 : 14;
    return L;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // Paints a layout onto a canvas. scale > 1 gives a sharper image at the same layout.
  function paintCanvas(L, scale) {
    var c = L.c, m = L.map, canvas = document.createElement("canvas");
    canvas.width = Math.round(L.w * scale); canvas.height = Math.round(L.h * scale);
    var ctx = canvas.getContext("2d"); ctx.scale(scale, scale);
    var bg = ctx.createLinearGradient(0, 0, 0, L.h); bg.addColorStop(0, c.bg); bg.addColorStop(1, c.sea);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, L.w, L.h);
    ctx.textBaseline = "middle";
    L.texts.forEach(function (t) { ctx.font = t.font; ctx.fillStyle = t.fill; ctx.textAlign = t.anchor === "middle" ? "center" : "left"; ctx.fillText(t.t, t.x, t.y); });
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = m.shadow; ctx.shadowOffsetY = m.drop;
    roundRect(ctx, m.x, m.y, m.w, m.h, m.r); ctx.fillStyle = c.surface; ctx.fill(); ctx.restore();
    ctx.save(); roundRect(ctx, m.x, m.y, m.w, m.h, m.r); ctx.clip();
    ctx.fillStyle = c.sea; ctx.fillRect(m.x, m.y, m.w, m.h);
    ctx.translate(m.ox, m.oy); ctx.scale(m.k, m.k);
    var p = d3.geoPath(projection, ctx);
    ctx.strokeStyle = c.surface; ctx.lineWidth = .6 / m.k;
    countries.forEach(function (cn) { ctx.beginPath(); p(cn); ctx.fillStyle = c[data[cn.key] || "none"]; ctx.fill(); ctx.stroke(); });
    markers.forEach(function (mk) {
      var st = data[mk.d.key]; if (!st) return;
      ctx.beginPath(); ctx.arc(mk.c[0], mk.c[1], m.dotR / m.k, 0, Math.PI * 2);
      ctx.fillStyle = c[st]; ctx.fill(); ctx.lineWidth = 1.5 / m.k; ctx.strokeStyle = c.surface; ctx.stroke();
    });
    ctx.restore();
    L.chips.forEach(function (ch) {
      roundRect(ctx, ch.x, ch.y, ch.w, ch.h, ch.h / 2); ctx.fillStyle = c.surface; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ch.color; ctx.stroke();
      ctx.beginPath(); ctx.arc(ch.dotX, ch.ty, ch.dotR, 0, Math.PI * 2); ctx.fillStyle = ch.color; ctx.fill();
      ctx.font = ch.font; ctx.fillStyle = c.text; ctx.textAlign = "left"; ctx.fillText(ch.text, ch.tx, ch.ty);
    });
    var band = ctx.createLinearGradient(0, 0, L.w, 0);
    ["visited", "planning", "lived", "living"].forEach(function (s, i) { band.addColorStop(i / 3, c[s]); });
    ctx.fillStyle = band; ctx.fillRect(0, L.h - L.band, L.w, L.band);
    return canvas;
  }
  // The same layout as an SVG file, so it stays sharp at any size.
  function paintSvg(L) {
    var c = L.c, m = L.map, sp = d3.geoPath(projection), o = [];
    function a(t) { return esc(String(t)); }
    function fontAttrs(f) { var mm = /^(\d+) (\d+)px (.*)$/.exec(f); return 'font-weight="' + mm[1] + '" font-size="' + mm[2] + '" font-family="' + a(mm[3]) + '"'; }
    o.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + L.w + ' ' + L.h + '" width="' + L.w * 2 + '" height="' + L.h * 2 + '">');
    o.push('<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.bg + '"/><stop offset="1" stop-color="' + c.sea + '"/></linearGradient>' +
      '<linearGradient id="band"><stop offset="0" stop-color="' + c.visited + '"/><stop offset=".333" stop-color="' + c.planning + '"/><stop offset=".667" stop-color="' + c.lived + '"/><stop offset="1" stop-color="' + c.living + '"/></linearGradient>' +
      '<clipPath id="mapclip"><rect x="' + m.x + '" y="' + m.y + '" width="' + m.w + '" height="' + m.h + '" rx="' + m.r + '"/></clipPath>' +
      '<filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="' + m.drop + '" stdDeviation="' + m.shadow / 2 + '" flood-opacity=".18"/></filter></defs>');
    o.push('<rect width="100%" height="100%" fill="url(#bg)"/>');
    L.texts.forEach(function (t) { o.push('<text x="' + t.x + '" y="' + t.y + '" text-anchor="' + t.anchor + '" dominant-baseline="central" ' + fontAttrs(t.font) + ' fill="' + t.fill + '">' + a(t.t) + '</text>'); });
    o.push('<rect x="' + m.x + '" y="' + m.y + '" width="' + m.w + '" height="' + m.h + '" rx="' + m.r + '" fill="' + c.sea + '" filter="url(#shadow)"/>');
    o.push('<g clip-path="url(#mapclip)"><g transform="translate(' + m.ox + ',' + m.oy + ') scale(' + m.k + ')" stroke="' + c.surface + '" stroke-width="' + (.6 / m.k) + '">');
    countries.forEach(function (cn) { o.push('<path fill="' + c[data[cn.key] || "none"] + '" d="' + sp(cn) + '"><title>' + a(fullName(cn)) + '</title></path>'); });
    markers.forEach(function (mk) { var st = data[mk.d.key]; if (st) o.push('<circle cx="' + mk.c[0] + '" cy="' + mk.c[1] + '" r="' + (m.dotR / m.k) + '" fill="' + c[st] + '" stroke-width="' + (1.5 / m.k) + '"><title>' + a(fullName(mk.d)) + '</title></circle>'); });
    o.push('</g></g>');
    L.chips.forEach(function (ch) {
      o.push('<rect x="' + ch.x + '" y="' + ch.y + '" width="' + ch.w + '" height="' + ch.h + '" rx="' + ch.h / 2 + '" fill="' + c.surface + '" stroke="' + ch.color + '" stroke-width="2"/>');
      o.push('<circle cx="' + ch.dotX + '" cy="' + ch.ty + '" r="' + ch.dotR + '" fill="' + ch.color + '"/>');
      o.push('<text x="' + ch.tx + '" y="' + ch.ty + '" dominant-baseline="central" ' + fontAttrs(ch.font) + ' fill="' + c.text + '">' + a(ch.text) + '</text>');
    });
    o.push('<rect x="0" y="' + (L.h - L.band) + '" width="' + L.w + '" height="' + L.band + '" fill="url(#band)"/>');
    o.push('</svg>');
    return new Blob([o.join("\n")], { type: "image/svg+xml" });
  }
  function renderInstagram(size, done) {
    if (!pathsSel) return;
    // JPEG keeps files small for posting; Instagram converts PNG to JPEG anyway.
    paintCanvas(imageLayout(size), 1).toBlob(done, "image/jpeg", .92);
  }
  // Download uses the same design as Share, in the wide 1.91:1 shape that suits most screens and posts.
  var DOWNLOAD = { w: 1080, h: 566, name: "landscape" };
  function downloadImage(fmt) {
    if (!pathsSel) return;
    var L = imageLayout(DOWNLOAD);
    if (fmt === "svg") { saveBlob(paintSvg(L), "my-maps.svg"); return; }
    var jpg = fmt === "jpg";
    paintCanvas(L, 2).toBlob(function (b) { saveBlob(b, "my-maps." + fmt); }, jpg ? "image/jpeg" : "image/png", jpg ? 0.92 : undefined);
  }
  // Hands a finished file to the share sheet on phones, or downloads it elsewhere.
  function deliver(blob, name, label, mime) {
    var file = window.File ? new File([blob], name, { type: mime }) : null;
    var saved = function () { saveBlob(blob, name); toast("Saved a " + label + " for Instagram."); };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "My Maps" }).catch(function (e) { if (!e || e.name !== "AbortError") saved(); });
    } else saved();
  }
  function shareInstagram(key) {
    var size = IG[key], dims = size.w + " × " + size.h;
    if (window.MyMapsDecor && window.MyMapsDecor.active() && videoType()) {
      if (videoBusy) return; videoBusy = true;
      recordVideo(imageLayout(size), function (blob, ext) {
        videoBusy = false;
        var name = "my-maps-instagram-" + size.name + "." + ext, mime = blob.type;
        // Recording takes a few seconds, so the share sheet needs a fresh tap to open.
        if (window.File && navigator.canShare && navigator.canShare({ files: [new File([blob], name, { type: mime })] })) {
          videoToast("Your " + dims + " video is ready.", [
            { label: "Share", primary: true, run: function () { deliver(blob, name, dims + " video", mime); } },
            { label: "Close", run: function () {} }
          ]);
        } else { videoToast(""); deliver(blob, name, dims + " video", mime); }
      }, function () { videoBusy = false; videoToast(""); shareImage(size); });
      return;
    }
    shareImage(size);
  }
  function shareImage(size) {
    renderInstagram(size, function (blob) {
      deliver(blob, "my-maps-instagram-" + size.name + ".jpg", size.w + " × " + size.h + " image", "image/jpeg");
    });
  }
  function share(target) {
    if (IG[target]) shareInstagram(target);
  }
  setupMenu("share-map", "share-menu", share);
  document.addEventListener("click", function () { menus.forEach(function (m) { m(); }); });

  // Search
  var input = document.getElementById("country-search"), list = document.getElementById("search-results"), active = -1, matches = [];
  function norm(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function showResults() {
    var q = norm(input.value.trim());
    if (!q) { list.hidden = true; input.setAttribute("aria-expanded", "false"); return; }
    matches = countries.filter(function (c) { var k = codes(c); return norm(c.properties.name).indexOf(q) !== -1 || (k && (norm(k.a2) === q || norm(k.a3) === q)); })
      .sort(function (a, b) { return (norm(a.properties.name).indexOf(q) === 0 ? 0 : 1) - (norm(b.properties.name).indexOf(q) === 0 ? 0 : 1); }).slice(0, 8);
    active = matches.length ? 0 : -1;
    list.replaceChildren();
    if (!matches.length) { var li = document.createElement("li"); li.className = "empty"; li.textContent = "No matching country"; list.appendChild(li); }
    matches.forEach(function (c, i) {
      var li = document.createElement("li"); li.id = "opt-" + i; li.setAttribute("role", "option");
      li.appendChild(dot(data[c.key] || "none"));
      li.appendChild(document.createTextNode(fullName(c)));
      li.addEventListener("mousedown", function (e) { e.preventDefault(); pick(i); });
      list.appendChild(li);
    });
    highlight(); list.hidden = false; input.setAttribute("aria-expanded", "true");
  }
  function highlight() {
    Array.prototype.forEach.call(list.children, function (li, i) { li.setAttribute("aria-selected", String(i === active)); });
    if (active >= 0) input.setAttribute("aria-activedescendant", "opt-" + active); else input.removeAttribute("aria-activedescendant");
  }
  function pick(i) { var c = matches[i]; if (!c) return; input.value = ""; list.hidden = true; input.setAttribute("aria-expanded", "false"); select(c.key, true); }
  input.addEventListener("input", showResults);
  input.addEventListener("keydown", function (e) {
    if (list.hidden) return;
    if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(matches.length - 1, active + 1); highlight(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(0, active - 1); highlight(); }
    else if (e.key === "Enter") { e.preventDefault(); pick(active); }
    else if (e.key === "Escape") { list.hidden = true; input.setAttribute("aria-expanded", "false"); }
  });
  input.addEventListener("blur", function () { list.hidden = true; input.setAttribute("aria-expanded", "false"); });
})();
