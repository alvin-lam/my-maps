// Builds the map data the site loads:
//   data/world.json   TopoJSON shapes, one geometry per place, id = the key saved in visitors' browsers
//   data/places.json  { key: { n: name, c2, c3, f: flag, note } }
// Run from this folder:  npm install && npm run build
import { readFileSync, writeFileSync } from "node:fs";
import * as d3 from "d3-geo";
import * as topojsonClient from "topojson-client";
import { topology } from "topojson-server";
import { presimplify, simplify, quantile, sphericalTriangleArea } from "topojson-simplify";
import polygonClipping from "polygon-clipping";
import { ISO, FULL, splitTerritories } from "./rules.mjs";

const require = (p) => JSON.parse(readFileSync(new URL(import.meta.resolve(p))));
const atlas = require("world-atlas/countries-50m.json");

// 1. Start from Natural Earth, drop Antarctica, split territories, add disputed areas and tiny places.
const fc = topojsonClient.feature(atlas, atlas.objects.countries);
let features = splitTerritories(fc.features.filter((f) => f.properties.name !== "Antarctica"));

// 2. Give each place the same key the site has always saved, then its full name.
for (const f of features) {
  f.key = f.id && f.properties.name !== "Ashmore and Cartier Is." ? String(f.id) : "x-" + f.properties.name;
  if (FULL[f.properties.name]) f.properties.name = FULL[f.properties.name];
}

// 3. Cut each disputed area out of whichever places it overlaps, so nothing is drawn twice.
const disputed = features.filter((f) => f.properties.note);
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
// d3 wants clockwise outer rings on the sphere; fix any ring set that came out inverted.
function fixWinding(polys) {
  return polys.map((p) => (d3.geoArea({ type: "Polygon", coordinates: p }) > 2 * Math.PI ? p.map((r) => r.slice().reverse()) : p));
}
for (const f of features) {
  if (f.properties.note || f.properties.tiny) continue;
  const [[x0, y0], [x1, y1]] = d3.geoBounds(f);
  let geom = polysOf(f.geometry), changed = false;
  for (const d of disputed) {
    const [[a0, b0], [a1, b1]] = d3.geoBounds(d);
    if (a1 < x0 || a0 > x1 || b1 < y0 || b0 > y1) continue;
    const before = JSON.stringify(geom);
    geom = polygonClipping.difference(geom, polysOf(d.geometry));
    if (JSON.stringify(geom) !== before) changed = true;
  }
  if (changed) f.geometry = { type: "MultiPolygon", coordinates: fixWinding(geom) };
}

// 4. Places file: names, codes, flags and notes, keyed by the saved key.
const places = {};
for (const f of features) {
  const v = ISO[f.key], p = { n: f.properties.name };
  if (v) {
    p.c2 = v.slice(0, 2); p.c3 = v.slice(2);
    p.f = String.fromCodePoint(0x1f1e6 + p.c2.charCodeAt(0) - 65, 0x1f1e6 + p.c2.charCodeAt(1) - 65);
  } else if (f.properties.flag) p.f = f.properties.flag;
  if (f.properties.note) p.note = f.properties.note;
  if (f.properties.tiny) p.tiny = 1;
  places[f.key] = p;
}

// 5. Shapes file: shared borders, simplified to what the screen can show, then rounded.
//    Small places keep every point so islands and microstates do not collapse.
const SMALL = 2e-4; // steradians, about 8,000 square kilometers
const areaOf = new Map(features.map((f) => [f.key, d3.geoArea(f)]));
const out = { type: "FeatureCollection", features: features.map((f) => ({ type: "Feature", id: f.key, properties: {}, geometry: f.geometry })) };
let topo = topology({ places: out });
topo = presimplify(topo, sphericalTriangleArea);
const keepArc = (i) => { for (const pt of topo.arcs[i < 0 ? ~i : i]) pt[2] = Infinity; };
const walk = (a) => (typeof a === "number" ? keepArc(a) : a.forEach(walk));
for (const g of topo.objects.places.geometries) if (areaOf.get(g.id) < SMALL && g.arcs) walk(g.arcs);
topo = simplify(topo, quantile(topo, Number(process.env.KEEP || 0.35)));
topo = topojsonClient.quantize(topo, 1e5);

// Check: every place still has a shape. The browser fixes ring direction (see rewind in js/map.js).
{
  const g = topojsonClient.feature(topo, topo.objects.places);
  const flat = g.features.filter((f) => { const a = d3.geoArea(f); return !(a > 0) || Math.abs(a - 4 * Math.PI) < 1e-9; }).map((f) => places[f.id].n);
  if (flat.length) console.warn("Places with no area after simplifying:", flat.join(", "));
}
writeFileSync(new URL("../docs/data/world.json", import.meta.url), JSON.stringify(topo));
writeFileSync(new URL("../docs/data/places.json", import.meta.url), JSON.stringify(places));
const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(0) + " KB";
console.log(`${features.length} places, world.json ${kb(JSON.stringify(topo))}, places.json ${kb(JSON.stringify(places))}`);
