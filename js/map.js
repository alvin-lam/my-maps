(function () {
  "use strict";
  var KEY = "world-map-statuses";
  var STATUSES = ["visited", "planning", "lived", "living"];
  var LABEL = { visited: "Visited", planning: "Planning", lived: "Lived", living: "Living" };
  var data = load();
  var countries = [], byId = {}, selectedId = null;
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
    countries = fc.features.slice().sort(function (a, b) { return a.properties.name.localeCompare(b.properties.name); });
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
      document.getElementById("count-" + s).textContent = Object.keys(data).filter(function (k) { return data[k] === s && byId[k]; }).length;
    });
    var grid = document.getElementById("lists-grid"); grid.innerHTML = "";
    STATUSES.forEach(function (s) {
      var col = document.createElement("div");
      var h = document.createElement("h3"); h.innerHTML = '<i class="dot dot-' + s + '"></i>'; h.appendChild(document.createTextNode(LABEL[s])); col.appendChild(h);
      var names = countries.filter(function (c) { return data[c.key] === s; }).map(fullName);
      var n = document.createElement("span"); n.className = "lists-count"; n.textContent = names.length; h.appendChild(n);
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
  function saveBlob(blob, name) {
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
      out = "My Countries\n\n" + groups.map(function (g) {
        return LABEL[g.s] + " (" + g.names.length + ")\n" + (g.names.length ? g.names.map(function (n) { return "- " + n; }).join("\n") : "- None");
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
  function downloadImage(fmt, onBlob) {
    if (!pathsSel) return;
    var cs = getComputedStyle(document.documentElement);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    var col = { none: v("--land"), visited: v("--visited"), planning: v("--planning"), lived: v("--lived"), living: v("--living") };
    var padTop = 90, padBottom = 100, TH = H + padTop + padBottom, SITE = "mymaps.alltripsconsidered.com";
    var items = grouped().map(function (g) { return { s: g.s, t: LABEL[g.s] + " " + g.names.length }; });

    if (fmt === "svg") {
      var sp = d3.geoPath(projection), font = "system-ui, -apple-system, sans-serif";
      var o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + TH + '" width="' + W * 2 + '" height="' + TH * 2 + '">',
        '<rect width="100%" height="100%" fill="' + v("--surface") + '"/>',
        '<rect y="' + padTop + '" width="' + W + '" height="' + H + '" fill="' + v("--sea") + '"/>',
        '<text x="' + W / 2 + '" y="42" text-anchor="middle" font-family="Instrument Serif, Georgia, serif" font-size="34" fill="' + v("--brand-link") + '">All Trips Considered</text>',
        '<text x="' + W / 2 + '" y="72" text-anchor="middle" font-family="' + font + '" font-size="20" font-weight="600" fill="' + v("--text") + '">My Maps</text>',
        '<g transform="translate(0,' + padTop + ')" stroke="' + v("--surface") + '" stroke-width="0.5">'];
      countries.forEach(function (c) { o.push('<path fill="' + col[data[c.key] || "none"] + '" d="' + sp(c) + '"><title>' + esc(fullName(c)) + '</title></path>'); });
      markers.forEach(function (m) { o.push('<circle cx="' + m.c[0] + '" cy="' + m.c[1] + '" r="' + MARKER_R + '" fill="' + col[data[m.d.key] || "none"] + '" stroke="' + v("--muted") + '"><title>' + esc(fullName(m.d)) + '</title></circle>'); });
      o.push('</g>');
      var x = W / 2 - 250, y = padTop + H + 42;
      items.forEach(function (it) {
        o.push('<circle cx="' + (x + 6) + '" cy="' + (y - 5) + '" r="6" fill="' + col[it.s] + '"/><text x="' + (x + 20) + '" y="' + y + '" font-family="' + font + '" font-size="16" fill="' + v("--text") + '">' + it.t + '</text>');
        x += 130;
      });
      o.push('<text x="' + W / 2 + '" y="' + (TH - 22) + '" text-anchor="middle" font-family="' + font + '" font-size="14" fill="' + v("--muted") + '">' + SITE + '</text>');
      o.push('</svg>');
      saveBlob(new Blob([o.join("\n")], { type: "image/svg+xml" }), "my-maps.svg");
      return;
    }

    var scale = fmt === "gif" ? 1 : 2, canvas = document.createElement("canvas"); canvas.width = W * scale; canvas.height = TH * scale;
    var ctx = canvas.getContext("2d"); ctx.scale(scale, scale);
    ctx.fillStyle = v("--surface"); ctx.fillRect(0, 0, W, TH);
    ctx.fillStyle = v("--sea"); ctx.fillRect(0, padTop, W, H);
    ctx.textAlign = "center"; ctx.fillStyle = v("--brand-link");
    ctx.font = '400 34px "Instrument Serif", Georgia, serif'; ctx.fillText("All Trips Considered", W / 2, 42);
    ctx.fillStyle = v("--text"); ctx.font = "600 20px system-ui, -apple-system, sans-serif"; ctx.fillText("My Maps", W / 2, 72);
    ctx.save(); ctx.translate(0, padTop);
    var p = d3.geoPath(projection, ctx);
    ctx.strokeStyle = v("--surface"); ctx.lineWidth = 0.5;
    countries.forEach(function (c) { ctx.beginPath(); p(c); ctx.fillStyle = col[data[c.key] || "none"]; ctx.fill(); ctx.stroke(); });
    ctx.strokeStyle = v("--muted");
    markers.forEach(function (m) { ctx.beginPath(); ctx.arc(m.c[0], m.c[1], MARKER_R, 0, Math.PI * 2); ctx.fillStyle = col[data[m.d.key] || "none"]; ctx.fill(); ctx.stroke(); });
    ctx.restore();
    ctx.font = "16px system-ui, -apple-system, sans-serif"; ctx.textAlign = "left";
    var widths = items.map(function (it) { return 22 + ctx.measureText(it.t).width; }), gap = 32;
    var cx = (W - widths.reduce(function (a, b) { return a + b; }, 0) - gap * (items.length - 1)) / 2, cy = padTop + H + 42;
    items.forEach(function (it, i) {
      ctx.fillStyle = col[it.s]; ctx.beginPath(); ctx.arc(cx + 6, cy - 5, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = v("--text"); ctx.fillText(it.t, cx + 20, cy); cx += widths[i] + gap;
    });
    ctx.textAlign = "center"; ctx.fillStyle = v("--muted"); ctx.font = "14px system-ui, -apple-system, sans-serif"; ctx.fillText(SITE, W / 2, TH - 22);
    if (fmt === "gif") { makeGif(canvas, padTop); return; }
    var jpg = fmt === "jpg";
    canvas.toBlob(function (b) { if (onBlob) onBlob(b); else saveBlob(b, "my-maps." + fmt); }, jpg ? "image/jpeg" : "image/png", jpg ? 0.92 : undefined);
  }

  // Animated GIF: the map image with the current holiday decoration playing over the map area.
  // The encoder (gifenc) loads only when someone asks for a GIF.
  var gifBusy = false;
  function gifToast(text) {
    var t = document.getElementById("app-toast"); if (!t) return;
    t.innerHTML = ""; var s = document.createElement("span"); s.textContent = text; t.appendChild(s); t.hidden = !text;
  }
  function makeGif(base, mapTop) {
    if (gifBusy) return; gifBusy = true;
    var dec = window.MyMapsDecor && window.MyMapsDecor.make(W, H);
    gifToast(dec ? "Making your animated GIF…" : "Making your GIF…");
    import("https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js").then(function (g) {
      var fw = base.width, fh = base.height, frame = document.createElement("canvas");
      frame.width = fw; frame.height = fh;
      var ctx = frame.getContext("2d", { willReadFrequently: true }), enc = g.GIFEncoder();
      var FPS = 12, delay = Math.round(1000 / FPS), total = dec ? Math.ceil(dec.duration / delay) : 1, i = 0;
      function addFrame() {
        ctx.drawImage(base, 0, 0);
        if (dec) {
          ctx.save(); ctx.beginPath(); ctx.rect(0, mapTop, W, H); ctx.clip(); ctx.translate(0, mapTop);
          dec.step(ctx, i * delay, delay / 1000);
          ctx.restore();
        }
        var rgba = ctx.getImageData(0, 0, fw, fh).data;
        var palette = g.quantize(rgba, 256, { format: "rgb444" });
        enc.writeFrame(g.applyPalette(rgba, palette, "rgb444"), fw, fh, { palette: palette, delay: delay, repeat: 0 });
      }
      function work() {
        var until = performance.now() + 40;
        while (i < total && performance.now() < until) { addFrame(); i++; }
        if (i < total) { gifToast("Making your animated GIF… " + Math.round(i / total * 100) + "%"); setTimeout(work, 0); return; }
        // Hold the last frame (plain map) so the loop pauses before it starts again.
        if (dec) { ctx.drawImage(base, 0, 0); var rgba = ctx.getImageData(0, 0, fw, fh).data, pal = g.quantize(rgba, 256, { format: "rgb444" }); enc.writeFrame(g.applyPalette(rgba, pal, "rgb444"), fw, fh, { palette: pal, delay: 1500 }); }
        enc.finish();
        saveBlob(new Blob([enc.bytes()], { type: "image/gif" }), "my-maps.gif");
        gifToast(""); gifBusy = false;
      }
      work();
    }).catch(function () { gifToast("Couldn't make the GIF. Check your connection and try again."); gifBusy = false; setTimeout(function () { gifToast(""); }, 4000); });
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

  // Share: links to each network, sorted A to Z, with Copy link last.
  var siteUrl = "https://mymaps.alltripsconsidered.com/";
  function shareText() {
    var n = Object.keys(data).filter(function (k) { return (data[k] === "visited" || data[k] === "lived" || data[k] === "living") && byId[k]; }).length;
    return n ? "I've been to " + n + (n === 1 ? " country" : " countries") + "! Map your travels on My Maps." : "Map the countries you've visited on My Maps.";
  }
  function toast(text) {
    var t = document.getElementById("app-toast"); if (!t) return;
    t.innerHTML = ""; var s = document.createElement("span"); s.textContent = text; t.appendChild(s); t.hidden = false;
    clearTimeout(toast.timer); toast.timer = setTimeout(function () { t.hidden = true; }, 3000);
  }
  function share(target) {
    var text = shareText(), u = encodeURIComponent(siteUrl), tx = encodeURIComponent(text), both = encodeURIComponent(text + " " + siteUrl);
    var links = {
      bluesky: "https://bsky.app/intent/compose?text=" + both,
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + u,
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + u,
      pinterest: "https://pinterest.com/pin/create/button/?url=" + u + "&description=" + tx,
      reddit: "https://www.reddit.com/submit?url=" + u + "&title=" + tx,
      threads: "https://www.threads.net/intent/post?text=" + both,
      whatsapp: "https://wa.me/?text=" + both,
      x: "https://x.com/intent/post?text=" + tx + "&url=" + u
    };
    if (target === "copy") {
      var done = function () { toast("Link copied."); };
      if (navigator.clipboard) navigator.clipboard.writeText(siteUrl).then(done, function () { toast(siteUrl); });
      else toast(siteUrl);
    } else if (links[target]) {
      window.open(links[target], "_blank", "noopener,width=640,height=640");
    }
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
    list.innerHTML = "";
    if (!matches.length) { var li = document.createElement("li"); li.className = "empty"; li.textContent = "No matching country"; list.appendChild(li); }
    matches.forEach(function (c, i) {
      var li = document.createElement("li"); li.id = "opt-" + i; li.setAttribute("role", "option");
      li.innerHTML = '<i class="dot dot-' + (data[c.key] || "none") + '"></i>';
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
