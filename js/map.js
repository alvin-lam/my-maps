(function () {
  "use strict";
  var KEY = "world-map-statuses";
  var STATUSES = ["visited", "planning", "lived", "living"];
  var LABEL = { visited: "Visited", planning: "Planning", lived: "Lived", living: "Living" };
  var data = load();
  var countries = [], byId = {}, selectedId = null;
  // ISO 3166-1 numeric -> alpha-2 + alpha-3. Kosovo uses the widely used user-assigned XK / XKX.
  var ISO = {"292":"GIGIB","798":"TVTUV","772":"TKTKL","074":"BVBVT","581":"UMUMI","162":"CXCXR","166":"CCCCK","254":"GFGUF","312":"GPGLP","474":"MQMTQ","638":"REREU","175":"YTMYT","535":"BQBES","744":"SJSJM","716":"ZWZWE","894":"ZMZMB","887":"YEYEM","704":"VNVNM","862":"VEVEN","336":"VAVAT","548":"VUVUT","860":"UZUZB","858":"UYURY","583":"FMFSM","584":"MHMHL","580":"MPMNP","850":"VIVIR","316":"GUGUM","016":"ASASM","630":"PRPRI","840":"USUSA","239":"GSSGS","086":"IOIOT","654":"SHSHN","612":"PNPCN","660":"AIAIA","238":"FKFLK","136":"KYCYM","060":"BMBMU","092":"VGVGB","796":"TCTCA","500":"MSMSR","832":"JEJEY","831":"GGGGY","833":"IMIMN","826":"GBGBR","784":"AEARE","804":"UAUKR","800":"UGUGA","795":"TMTKM","792":"TRTUR","788":"TNTUN","780":"TTTTO","776":"TOTON","768":"TGTGO","626":"TLTLS","764":"THTHA","834":"TZTZA","762":"TJTJK","158":"TWTWN","760":"SYSYR","756":"CHCHE","752":"SESWE","748":"SZSWZ","740":"SRSUR","728":"SSSSD","729":"SDSDN","144":"LKLKA","724":"ESESP","410":"KRKOR","710":"ZAZAF","706":"SOSOM","090":"SBSLB","703":"SKSVK","705":"SISVN","702":"SGSGP","694":"SLSLE","690":"SCSYC","688":"RSSRB","686":"SNSEN","682":"SASAU","678":"STSTP","674":"SMSMR","882":"WSWSM","670":"VCVCT","662":"LCLCA","659":"KNKNA","646":"RWRWA","643":"RURUS","642":"ROROU","634":"QAQAT","620":"PTPRT","616":"PLPOL","608":"PHPHL","604":"PEPER","600":"PYPRY","598":"PGPNG","591":"PAPAN","585":"PWPLW","586":"PKPAK","512":"OMOMN","578":"NONOR","408":"KPPRK","566":"NGNGA","562":"NENER","558":"NINIC","554":"NZNZL","570":"NUNIU","184":"CKCOK","528":"NLNLD","533":"AWABW","531":"CWCUW","524":"NPNPL","520":"NRNRU","516":"NANAM","508":"MZMOZ","504":"MAMAR","732":"EHESH","499":"MEMNE","496":"MNMNG","498":"MDMDA","492":"MCMCO","484":"MXMEX","480":"MUMUS","478":"MRMRT","470":"MTMLT","466":"MLMLI","462":"MVMDV","458":"MYMYS","454":"MWMWI","450":"MGMDG","807":"MKMKD","442":"LULUX","440":"LTLTU","438":"LILIE","434":"LYLBY","430":"LRLBR","426":"LSLSO","422":"LBLBN","428":"LVLVA","418":"LALAO","417":"KGKGZ","414":"KWKWT","296":"KIKIR","404":"KEKEN","398":"KZKAZ","400":"JOJOR","392":"JPJPN","388":"JMJAM","380":"ITITA","376":"ILISR","275":"PSPSE","372":"IEIRL","368":"IQIRQ","364":"IRIRN","360":"IDIDN","356":"ININD","352":"ISISL","348":"HUHUN","340":"HNHND","332":"HTHTI","328":"GYGUY","624":"GWGNB","324":"GNGIN","320":"GTGTM","308":"GDGRD","300":"GRGRC","288":"GHGHA","276":"DEDEU","268":"GEGEO","270":"GMGMB","266":"GAGAB","250":"FRFRA","666":"PMSPM","876":"WFWLF","663":"MFMAF","652":"BLBLM","258":"PFPYF","540":"NCNCL","260":"TFATF","248":"AXALA","246":"FIFIN","242":"FJFJI","231":"ETETH","233":"EEEST","232":"ERERI","226":"GQGNQ","222":"SVSLV","818":"EGEGY","218":"ECECU","214":"DODOM","212":"DMDMA","262":"DJDJI","304":"GLGRL","234":"FOFRO","208":"DKDNK","203":"CZCZE","196":"CYCYP","192":"CUCUB","191":"HRHRV","384":"CICIV","188":"CRCRI","180":"CDCOD","178":"CGCOG","174":"KMCOM","170":"COCOL","156":"CNCHN","446":"MOMAC","344":"HKHKG","152":"CLCHL","148":"TDTCD","140":"CFCAF","132":"CVCPV","124":"CACAN","120":"CMCMR","116":"KHKHM","104":"MMMMR","108":"BIBDI","854":"BFBFA","100":"BGBGR","096":"BNBRN","076":"BRBRA","072":"BWBWA","070":"BABIH","068":"BOBOL","064":"BTBTN","204":"BJBEN","084":"BZBLZ","056":"BEBEL","112":"BYBLR","052":"BBBRB","050":"BDBGD","048":"BHBHR","044":"BSBHS","031":"AZAZE","040":"ATAUT","036":"AUAUS","334":"HMHMD","574":"NFNFK","051":"AMARM","032":"ARARG","028":"AGATG","024":"AOAGO","020":"ADAND","012":"DZDZA","008":"ALALB","004":"AFAFG","010":"AQATA","534":"SXSXM","x-Kosovo":"XKXKX"};
  // Spell out the abbreviated names used in the map data.
  var FULL = {"Antigua and Barb.":"Antigua and Barbuda","Ashmore and Cartier Is.":"Ashmore and Cartier Islands","Bosnia and Herz.":"Bosnia and Herzegovina","Br. Indian Ocean Ter.":"British Indian Ocean Territory","British Virgin Is.":"British Virgin Islands","Cayman Is.":"Cayman Islands","Central African Rep.":"Central African Republic","Cook Is.":"Cook Islands","Dem. Rep. Congo":"Democratic Republic of the Congo","Dominican Rep.":"Dominican Republic","Eq. Guinea":"Equatorial Guinea","Faeroe Is.":"Faroe Islands","Falkland Is.":"Falkland Islands","Fr. Polynesia":"French Polynesia","Fr. S. Antarctic Lands":"French Southern and Antarctic Lands","Heard I. and McDonald Is.":"Heard Island and McDonald Islands","Indian Ocean Ter.":"Australian Indian Ocean Territories","Marshall Is.":"Marshall Islands","N. Cyprus":"Northern Cyprus","N. Mariana Is.":"Northern Mariana Islands","Pitcairn Is.":"Pitcairn Islands","S. Geo. and the Is.":"South Georgia and the South Sandwich Islands","S. Sudan":"South Sudan","Solomon Is.":"Solomon Islands","St-Barthélemy":"Saint Barthélemy","St-Martin":"Saint Martin","St. Kitts and Nevis":"Saint Kitts and Nevis","St. Pierre and Miquelon":"Saint Pierre and Miquelon","St. Vin. and Gren.":"Saint Vincent and the Grenadines","Turks and Caicos Is.":"Turks and Caicos Islands","U.S. Virgin Is.":"United States Virgin Islands","W. Sahara":"Western Sahara","Wallis and Futuna Is.":"Wallis and Futuna"};
  // Overseas territories that the map data folds into their parent country.
  // Each rule tests a polygon's center [longitude, latitude] and moves matching polygons into their own feature.
  var TERRITORIES = {
    "France": [
      { id: "254", name: "French Guiana", test: function (c) { return c[0] < -50 && c[1] < 10; } },
      { id: "312", name: "Guadeloupe", test: function (c) { return c[0] < -59 && c[1] > 15.5 && c[1] < 17; } },
      { id: "474", name: "Martinique", test: function (c) { return c[0] < -59 && c[1] > 14 && c[1] <= 15.5; } },
      { id: "638", name: "Réunion", test: function (c) { return c[0] > 54 && c[0] < 57; } },
      { id: "175", name: "Mayotte", test: function (c) { return c[0] > 44 && c[0] < 46; } }
    ],
    "Netherlands": [
      { id: "535", name: "Caribbean Netherlands", test: function (c) { return c[0] < -60; } }
    ],
    "Spain": [
      { name: "Canary Islands", flag: "🇮🇨", test: function (c) { return c[0] < -12 && c[1] < 30; } }
    ],
    "Portugal": [
      { name: "Azores", flag: "🇵🇹", test: function (c) { return c[0] < -24; } },
      { name: "Madeira", flag: "🇵🇹", test: function (c) { return c[0] < -15 && c[1] < 34; } }
    ],
    "Indian Ocean Ter.": [
      { id: "162", name: "Christmas Island", test: function (c) { return c[0] > 100; } },
      { id: "166", name: "Cocos (Keeling) Islands", test: function (c) { return c[0] < 100; } }
    ],
    "Norway": [
      { id: "744", name: "Svalbard and Jan Mayen", test: function (c) { return c[1] > 70 && (c[0] < 0 || c[1] > 74); } }
    ]
  };
  function splitTerritories(features) {
    var out = [];
    features.forEach(function (f) {
      var rules = TERRITORIES[f.properties.name];
      if (!rules) { out.push(f); return; }
      var polys = f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [f.geometry.coordinates];
      var parts = rules.map(function () { return []; }), rest = [];
      polys.forEach(function (poly) {
        var c = d3.geoCentroid({ type: "Polygon", coordinates: poly });
        for (var i = 0; i < rules.length; i++) if (rules[i].test(c)) { parts[i].push(poly); return; }
        rest.push(poly);
      });
      if (rest.length) out.push({ type: "Feature", id: f.id, properties: f.properties, geometry: { type: "MultiPolygon", coordinates: rest } });
      rules.forEach(function (r, i) {
        if (parts[i].length) out.push({ type: "Feature", id: r.id, properties: { name: r.name, flag: r.flag }, geometry: { type: "MultiPolygon", coordinates: parts[i] } });
      });
    });
    // Disputed and occupied areas, drawn on top of the country that contains them.
    (window.DISPUTED || []).forEach(function (a) {
      out.push({ type: "Feature", properties: { name: a.name, flag: a.flag, note: a.note }, geometry: a.geometry });
    });
    // Places too small to appear in the map data, drawn as small circles so they can still be marked.
    TINY.forEach(function (t) {
      var circle = d3.geoCircle().center([t.lon, t.lat]).radius(t.r || 0.35)();
      out.push({ type: "Feature", id: t.id, properties: { name: t.name, tiny: true }, geometry: circle });
    });
    return out;
  }
  var TINY = [
    { id: "292", name: "Gibraltar", lon: -5.35, lat: 36.14, r: 0.2 },
    { id: "798", name: "Tuvalu", lon: 179.2, lat: -8.5 },
    { id: "772", name: "Tokelau", lon: -171.85, lat: -9.2 },
    { id: "074", name: "Bouvet Island", lon: 3.4, lat: -54.42 },
    { id: "581", name: "United States Minor Outlying Islands", lon: 166.63, lat: 19.29 }
  ];
  function codes(c) {
    var v = ISO[c.key]; if (!v) return null;
    var a2 = v.slice(0, 2), a3 = v.slice(2);
    var flag = String.fromCodePoint(0x1F1E6 + a2.charCodeAt(0) - 65, 0x1F1E6 + a2.charCodeAt(1) - 65);
    return { a2: a2, a3: a3, flag: flag };
  }
  function fullName(c) { var k = codes(c); var flag = k ? k.flag : c.properties.flag; return c.properties.name + (flag ? " " + flag : ""); }
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

  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json").then(function (r) { return r.json(); }).then(function (topo) {
    var fc = topojson.feature(topo, topo.objects.countries);
    fc.features = fc.features.filter(function (f) { return f.properties.name !== "Antarctica"; });
    fc.features = splitTerritories(fc.features);
    projection.fitExtent([[6, 6], [W - 6, H - 6]], fc);
    fc.features.forEach(function (f, i) {
      // Ashmore and Cartier Islands shares Australia's ISO number, so give it its own key.
      f.key = f.id && f.properties.name !== "Ashmore and Cartier Is." ? String(f.id) : "x-" + f.properties.name;
      if (FULL[f.properties.name]) f.properties.name = FULL[f.properties.name];
      byId[f.key] = f;
    });
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
      return { s: s, names: list.map(fullName), items: list.map(function (c) { var k = codes(c) || {}; return { name: c.properties.name, alpha2: k.a2 || "", alpha3: k.a3 || "", flag: k.flag || c.properties.flag || "" }; }) };
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
    var padTop = 90, padBottom = 70, TH = H + padTop + padBottom;
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

  // Share: links to each network, sorted A to Z. "More options" uses the device share sheet and attaches the map image.
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
  var nativeBtn = document.getElementById("share-native");
  if (!navigator.share) nativeBtn.remove();
  function share(target) {
    var text = shareText(), u = encodeURIComponent(siteUrl), tx = encodeURIComponent(text), both = encodeURIComponent(text + " " + siteUrl);
    var links = {
      bluesky: "https://bsky.app/intent/compose?text=" + both,
      email: "mailto:?subject=" + encodeURIComponent("My Maps") + "&body=" + both,
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
    } else if (target === "native") {
      downloadImage("png", function (blob) {
        var file = new File([blob], "my-maps.png", { type: "image/png" });
        var payload = { title: "My Maps", text: text, url: siteUrl };
        if (navigator.canShare && navigator.canShare({ files: [file] })) payload.files = [file];
        navigator.share(payload).catch(function () {});
      });
    } else if (target === "email") {
      location.href = links.email;
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
