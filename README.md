# My Maps

An interactive world map for tracking the countries you have been to. Tap a country or search for it, then mark it with a status. The map colors each country to match.

Live site: [mymaps.alltripsconsidered.com](https://mymaps.alltripsconsidered.com)

## Features

- **Four statuses:** Visited, Planning, Lived and Living.
- **Search:** Find any country by name, with keyboard support.
- **Zoom and pan:** Use the buttons, a mouse wheel or touch gestures.
- **Counts and lists:** See totals for each status and a full list under "My countries".
- **Exports:** Download your list as CSV, JSON or plain text. Download the map as PNG, JPG or SVG.
- **Light and dark themes:** The page follows your device setting, or you can choose one.
- **Installable app:** Install My Maps on phones, tablets and computers. It opens like an app and works offline.

## Disputed areas

Disputed and occupied areas, such as Crimea, the Golan Heights and Abkhazia, are separate entries. Each one shows a note about who administers it and who claims it. Flags and notes follow the position of the United Nations where it has one. Outlines come from Natural Earth, which is in the public domain.

## Privacy

Your selections are saved only in your browser's local storage. Nothing is sent to a server. Clearing your browser data will clear your map.

## Project structure

```
world-map/
├── index.html          Page markup and the early theme script
├── manifest.webmanifest  App name, colors and icons for installing
├── sw.js               Service worker for offline use
├── css/
│   └── styles.css      All page styles and color tokens
├── js/
│   ├── map.js          Map, statuses, search and exports
│   ├── install.js      Install banner, offline and update messages
│   └── back-to-top.js  Back to top button
├── data/
│   └── disputed.js     Disputed and occupied area outlines
├── assets/
│   ├── icon.png        Site icon and app icon
│   └── tabicon.png     Alternate tab icon
├── CNAME               Custom domain for GitHub Pages
└── README.md
```

## Running locally

The site is static, so any local web server works. From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Dependencies

These load from the jsDelivr CDN, so there is no build step:

- [D3](https://d3js.org) 7.9.0 for the map projection and zoom
- [TopoJSON Client](https://github.com/topojson/topojson-client) 3.1.0 for the map shapes
- [World Atlas](https://github.com/topojson/world-atlas) 2.0.2 for the country borders

## Adding a status

Each status appears in a few places. To add one, update all of them:

1. `css/styles.css`: add a color token in the light and dark theme rules, then add the `.dot-*`, `.country.*` and `.status-btn` rules.
2. `index.html`: add a count in the stats bar and a button in the chooser.
3. `js/map.js`: add the status to `STATUSES`, `LABEL` and the `col` color map used by image exports.

## Updating the app

The service worker caches the site for offline use. After you change any file, raise `VERSION` in `sw.js` so installed copies download the update and offer a Reload button.

## Deployment

GitHub Pages serves the site from the `main` branch. The `CNAME` file points it to the custom domain.

## License

© All Trips Considered. All rights reserved.
