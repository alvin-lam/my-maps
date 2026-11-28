// Map rules used to build data/world.json and data/places.json.
// Moved here from js/map.js so the browser no longer does this work on every visit.
import * as d3 from "d3-geo";
import { readFileSync } from "node:fs";
const window = { DISPUTED: JSON.parse(readFileSync(new URL("./source/disputed.json", import.meta.url))) };

// ISO 3166-1 numeric -> alpha-2 + alpha-3. Kosovo uses the widely used user-assigned XK / XKX.
var ISO = {"292":"GIGIB","798":"TVTUV","772":"TKTKL","074":"BVBVT","581":"UMUMI","162":"CXCXR","166":"CCCCK","254":"GFGUF","312":"GPGLP","474":"MQMTQ","638":"REREU","175":"YTMYT","535":"BQBES","744":"SJSJM","716":"ZWZWE","894":"ZMZMB","887":"YEYEM","704":"VNVNM","862":"VEVEN","336":"VAVAT","548":"VUVUT","860":"UZUZB","858":"UYURY","583":"FMFSM","584":"MHMHL","580":"MPMNP","850":"VIVIR","316":"GUGUM","016":"ASASM","630":"PRPRI","840":"USUSA","239":"GSSGS","086":"IOIOT","654":"SHSHN","612":"PNPCN","660":"AIAIA","238":"FKFLK","136":"KYCYM","060":"BMBMU","092":"VGVGB","796":"TCTCA","500":"MSMSR","832":"JEJEY","831":"GGGGY","833":"IMIMN","826":"GBGBR","784":"AEARE","804":"UAUKR","800":"UGUGA","795":"TMTKM","792":"TRTUR","788":"TNTUN","780":"TTTTO","776":"TOTON","768":"TGTGO","626":"TLTLS","764":"THTHA","834":"TZTZA","762":"TJTJK","158":"TWTWN","760":"SYSYR","756":"CHCHE","752":"SESWE","748":"SZSWZ","740":"SRSUR","728":"SSSSD","729":"SDSDN","144":"LKLKA","724":"ESESP","410":"KRKOR","710":"ZAZAF","706":"SOSOM","090":"SBSLB","703":"SKSVK","705":"SISVN","702":"SGSGP","694":"SLSLE","690":"SCSYC","688":"RSSRB","686":"SNSEN","682":"SASAU","678":"STSTP","674":"SMSMR","882":"WSWSM","670":"VCVCT","662":"LCLCA","659":"KNKNA","646":"RWRWA","643":"RURUS","642":"ROROU","634":"QAQAT","620":"PTPRT","616":"PLPOL","608":"PHPHL","604":"PEPER","600":"PYPRY","598":"PGPNG","591":"PAPAN","585":"PWPLW","586":"PKPAK","512":"OMOMN","578":"NONOR","408":"KPPRK","566":"NGNGA","562":"NENER","558":"NINIC","554":"NZNZL","570":"NUNIU","184":"CKCOK","528":"NLNLD","533":"AWABW","531":"CWCUW","524":"NPNPL","520":"NRNRU","516":"NANAM","508":"MZMOZ","504":"MAMAR","732":"EHESH","499":"MEMNE","496":"MNMNG","498":"MDMDA","492":"MCMCO","484":"MXMEX","480":"MUMUS","478":"MRMRT","470":"MTMLT","466":"MLMLI","462":"MVMDV","458":"MYMYS","454":"MWMWI","450":"MGMDG","807":"MKMKD","442":"LULUX","440":"LTLTU","438":"LILIE","434":"LYLBY","430":"LRLBR","426":"LSLSO","422":"LBLBN","428":"LVLVA","418":"LALAO","417":"KGKGZ","414":"KWKWT","296":"KIKIR","404":"KEKEN","398":"KZKAZ","400":"JOJOR","392":"JPJPN","388":"JMJAM","380":"ITITA","376":"ILISR","275":"PSPSE","372":"IEIRL","368":"IQIRQ","364":"IRIRN","360":"IDIDN","356":"ININD","352":"ISISL","348":"HUHUN","340":"HNHND","332":"HTHTI","328":"GYGUY","624":"GWGNB","324":"GNGIN","320":"GTGTM","308":"GDGRD","300":"GRGRC","288":"GHGHA","276":"DEDEU","268":"GEGEO","270":"GMGMB","266":"GAGAB","250":"FRFRA","666":"PMSPM","876":"WFWLF","663":"MFMAF","652":"BLBLM","258":"PFPYF","540":"NCNCL","260":"TFATF","248":"AXALA","246":"FIFIN","242":"FJFJI","231":"ETETH","233":"EEEST","232":"ERERI","226":"GQGNQ","222":"SVSLV","818":"EGEGY","218":"ECECU","214":"DODOM","212":"DMDMA","262":"DJDJI","304":"GLGRL","234":"FOFRO","208":"DKDNK","203":"CZCZE","196":"CYCYP","192":"CUCUB","191":"HRHRV","384":"CICIV","188":"CRCRI","180":"CDCOD","178":"CGCOG","174":"KMCOM","170":"COCOL","156":"CNCHN","446":"MOMAC","344":"HKHKG","152":"CLCHL","148":"TDTCD","140":"CFCAF","132":"CVCPV","124":"CACAN","120":"CMCMR","116":"KHKHM","104":"MMMMR","108":"BIBDI","854":"BFBFA","100":"BGBGR","096":"BNBRN","076":"BRBRA","072":"BWBWA","070":"BABIH","068":"BOBOL","064":"BTBTN","204":"BJBEN","084":"BZBLZ","056":"BEBEL","112":"BYBLR","052":"BBBRB","050":"BDBGD","048":"BHBHR","044":"BSBHS","031":"AZAZE","040":"ATAUT","036":"AUAUS","334":"HMHMD","574":"NFNFK","051":"AMARM","032":"ARARG","028":"AGATG","024":"AOAGO","020":"ADAND","012":"DZDZA","008":"ALALB","004":"AFAFG","010":"AQATA","534":"SXSXM","x-Kosovo":"XKXKX"};
// Spell out the abbreviated names used in the map data.
var FULL = {"Antigua and Barb.":"Antigua and Barbuda","Ashmore and Cartier Is.":"Ashmore and Cartier Islands","Bosnia and Herz.":"Bosnia and Herzegovina","Br. Indian Ocean Ter.":"British Indian Ocean Territory","British Virgin Is.":"British Virgin Islands","Cayman Is.":"Cayman Islands","Central African Rep.":"Central African Republic","Cook Is.":"Cook Islands","Dem. Rep. Congo":"Democratic Republic of the Congo","Dominican Rep.":"Dominican Republic","Eq. Guinea":"Equatorial Guinea","Faeroe Is.":"Faroe Islands","Falkland Is.":"Falkland Islands","Fr. Polynesia":"French Polynesia","Fr. S. Antarctic Lands":"French Southern and Antarctic Lands","Heard I. and McDonald Is.":"Heard Island and McDonald Islands","Indian Ocean Ter.":"Australian Indian Ocean Territories","Macedonia":"North Macedonia","eSwatini":"Eswatini","Turkey":"Türkiye","São Tomé and Principe":"São Tomé and Príncipe","Marshall Is.":"Marshall Islands","N. Cyprus":"Northern Cyprus","N. Mariana Is.":"Northern Mariana Islands","Pitcairn Is.":"Pitcairn Islands","S. Geo. and the Is.":"South Georgia and the South Sandwich Islands","S. Sudan":"South Sudan","Solomon Is.":"Solomon Islands","St-Barthélemy":"Saint Barthélemy","St-Martin":"Saint Martin","St. Kitts and Nevis":"Saint Kitts and Nevis","St. Pierre and Miquelon":"Saint Pierre and Miquelon","St. Vin. and Gren.":"Saint Vincent and the Grenadines","Turks and Caicos Is.":"Turks and Caicos Islands","U.S. Virgin Is.":"United States Virgin Islands","W. Sahara":"Western Sahara","Wallis and Futuna Is.":"Wallis and Futuna"};
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
// Other names people search for, keyed by saved key. Former and common names stay findable after a rename.
var ALIAS = {
  "104": ["Burma"], "132": ["Cape Verde"], "203": ["Czech Republic"], "336": ["Holy See"], "384": ["Ivory Coast"],
  "520": ["Naoero"], "626": ["East Timor"], "748": ["Swaziland"], "792": ["Turkey"], "807": ["Macedonia"]
};

// Notes for places that are disputed but come from the map data rather than scripts/source/disputed.json.
// They follow the position of the United Nations where it has one.
var NOTES = {
  "x-N. Cyprus": "Part of Cyprus; self-declared state recognized only by Türkiye",
  "x-Somaliland": "Part of Somalia; self-declared independent state",
  "x-Siachen Glacier": "Administered by India; claimed by Pakistan",
  "x-Kosovo": "Declared independence from Serbia in 2008; not recognized by Serbia",
  "158": "Self-governing; claimed by China",
  "732": "Non-self-governing territory; mostly administered by Morocco; claimed by the Sahrawi Republic"
};

// Names in the official languages. Most come from Unicode CLDR in scripts/build-map.mjs.
// These places have no CLDR region or no CLDR name, so their local names are listed here,
// in the official languages of the place, or of the country that administers or claims it.
var NATIVE_REGION = { "x-Canary Islands": "IC" };
// Official languages that CLDR lists only as regional. South Africa's constitution names 12, including sign language.
var OFFICIAL_LANGS = { "710": ["zu", "xh", "af", "en", "nso", "tn", "st", "ts", "ss", "ve", "nr"] };
var NATIVE = {
  "260": ["Terres australes et antarctiques françaises"],
  "316": ["Guam", "Guåhån"],
  "334": ["Heard Island and McDonald Islands"],
  "462": ["ދިވެހިރާއްޖެ"],
  "016": ["American Samoa", "Amerika Sāmoa"],
  "074": ["Bouvetøya"],
  "x-Azores": ["Açores"],
  "x-Madeira": ["Madeira"],
  "x-Ashmore and Cartier Is.": ["Ashmore and Cartier Islands"],
  "x-Transnistria": ["Transnistria"],
  "x-Siachen Glacier": ["सियाचिन ग्लेशियर"],
  "x-Ilemi Triangle": ["Ilemi Triangle"],
  "x-Somaliland": ["Soomaaliland", "أرض الصومال"],
  "x-N. Cyprus": ["Kuzey Kıbrıs"],
  "x-Crimea": ["Крим"],
  "x-Donetsk": ["Донецьк"],
  "x-Luhansk": ["Луганськ"],
  "x-Zaporizhzhia": ["Запоріжжя"],
  "x-Kherson": ["Херсон"],
  "x-Golan Heights": ["الجولان"],
  "x-Abkhazia": ["აფხაზეთი"],
  "x-South Ossetia": ["სამხრეთ ოსეთი"],
  "x-Kuril Islands": ["Курильские острова", "千島列島"],
  "x-Arunachal Pradesh": ["अरुणाचल प्रदेश"],
  "x-Jammu and Kashmir": ["जम्मू और कश्मीर"],
  "x-Aksai Chin": ["阿克赛钦"],
  "x-Gilgit-Baltistan": ["گلگت بلتستان"],
  "x-Abyei": ["أبيي"]
};

export { ISO, FULL, ALIAS, NOTES, NATIVE, NATIVE_REGION, OFFICIAL_LANGS, TERRITORIES, TINY, splitTerritories };
