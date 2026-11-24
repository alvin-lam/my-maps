# My Maps

An interactive world map for tracking the places you have been. Tap a country or search for it, then mark it with a status. The map colors each place to match.

Live site: [mymaps.alltripsconsidered.com](https://mymaps.alltripsconsidered.com)

## Features

### Marking places

- **Four statuses:** Visited, Planning, Lived and Living.
- **Search:** Find any place by name or by its two- or three-letter country code. Names are spelled out in full, and each shows its flag.
- **Zoom and pan:** Use the buttons, a mouse wheel or touch gestures.
- **Small places:** Islands and microstates too small to see get a dot that can be tapped and takes the status color.
- **Counts and lists:** See totals for each status and a full list under "My countries".

### Places on the map

- **Territories:** Overseas territories are separate from their home country, such as French Guiana, the Canary Islands, the Azores, Svalbard and the Caribbean Netherlands.
- **Tiny places:** Places missing from the map data, such as Gibraltar, Tuvalu and Tokelau, are added as small circles.
- **Disputed areas:** Places such as Crimea, the Golan Heights and Abkhazia are separate entries. Each shows a note about who administers it and who claims it. Flags and notes follow the position of the United Nations where it has one.

### Export, download and share

- **Export:** Save your list as CSV, JSON or TXT.
- **Download:** Save the map as GIF, JPG, PNG or SVG. Each image shows the title, the map, the counts and the site address. During holidays the GIF plays the holiday decoration.
- **Share:** Post a link to Bluesky, Facebook, LinkedIn, Pinterest, Reddit, Threads, WhatsApp or X, or copy it. The message counts the places you have been.

### Appearance

One button opens the Appearance panel.

- **Mode:** System, Light or Dark. System follows the device.
- **Map style:** Flat, Outline (a tinted fill with a bold border) or Vintage (parchment tones).
- **Color scheme:**
  - **Automatic** is the default. It follows the seasons and these holidays: New Year's Eve, Lunar New Year, Valentine's Day, St. Patrick's Day, Earth Day, Pride, Independence Day, Halloween, Diwali, Thanksgiving and Christmas.
  - **Classic:** Classic, Daylight (best in light mode) and Midnight (best in dark mode).
  - **Seasons:** Spring, Summer, Autumn and Winter. Seasons follow the hemisphere of the device time zone.
  - **Holidays:** All the holidays above, plus Holi, Día de los Muertos and Hanukkah, which can only be picked by hand.
- **Holiday decorations:** A short animation plays over the map during holidays, such as falling snow at Christmas or fireworks on New Year's Eve. It can be turned off, and it stays off on devices set to reduce motion.

### App

- **Installable:** Install My Maps on phones, tablets and computers. It opens like an app and works offline.
- **Updates:** When a new version is ready, the app offers a Reload button.

## Language and region

Dates, numbers and A to Z sorting follow the device's language and region settings. Holidays and seasons use the device's local date and time zone. The site shows no distances or other measurements, so there are no units to convert.

## Privacy

Your selections and settings are saved only in your browser's local storage. Nothing is sent to a server. Clearing your browser data will clear your map. The full policy is on the [Privacy page](https://mymaps.alltripsconsidered.com/privacy.html) (`privacy.html`), linked from the footer. Update it before adding anything that collects information, such as analytics.

## Project structure

```
my-maps/
├── index.html            Page markup
├── privacy.html          Privacy page
├── manifest.webmanifest  App name, colors and icons for installing
├── sw.js                 Service worker for offline use
├── css/
│   └── styles.css        Page styles, color schemes and map styles
├── js/
│   ├── appearance.js     Appearance panel, color schemes and holiday decorations
│   ├── map.js            Map, statuses, search, export, download and share
│   ├── install.js        Install banner, offline and update messages
│   └── back-to-top.js    Back to top button
├── data/
│   ├── world.json        Map shapes, built by scripts/build-map.mjs
│   └── places.json       Names, codes, flags and notes for each place
├── scripts/
│   ├── build-map.mjs     Builds the two data files
│   ├── rules.mjs         Territory splits, tiny places and full names
│   ├── source/
│   │   └── disputed.json Disputed and occupied area outlines
│   └── package.json      Build tools
├── assets/
│   ├── icon.png          Site icon
│   ├── icon-192.png      App icon, small
│   ├── icon-512.png      App icon, large
│   ├── icon-maskable-512.png  App icon for Android home screens
│   ├── apple-touch-icon.png   App icon for iPhone and iPad
│   ├── og-image.png      Preview image for links shared on social media
│   └── tabicon.png       Alternate tab icon
├── robots.txt            Search engine crawl rules
├── sitemap.xml           Page list for search engines
├── CNAME                 Custom domain for GitHub Pages
└── README.md
```

## Running locally

The site is static, so any local web server works. From the project folder, run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Dependencies

The site loads these from the jsDelivr CDN:

- [D3](https://d3js.org) 7.9.0 for the map projection and zoom
- [TopoJSON Client](https://github.com/topojson/topojson-client) 3.1.0 for reading the map shapes
- [gifenc](https://github.com/mattdesl/gifenc) 1.0.3 for GIF downloads, loaded only when a GIF is requested

The map data is served from the site itself. Country borders come from [World Atlas](https://github.com/topojson/world-atlas) 2.0.2, and disputed area outlines come from [Natural Earth](https://www.naturalearthdata.com). Both are in the public domain.

## Map data

The browser loads two ready-made files instead of fixing up raw map data on every visit:

- `data/world.json` holds the shapes. Territories are split from their home country, tiny places are added as small circles, and disputed areas are cut out of the countries around them. Borders are simplified to about the detail the map can show, and small places keep every point so they never disappear.
- `data/places.json` holds each place's name, two- and three-letter codes, flag and note.

Each place keeps the same key the site has always saved, such as `840` for the United States or `x-Crimea`, so visitors' maps carry over unchanged.

To change a place, edit `scripts/rules.mjs` or `scripts/source/disputed.json`, then rebuild from the `scripts` folder:

```bash
npm install
```

```bash
npm run build
```

Set `KEEP` to change how much border detail is kept, for example `KEEP=0.5 npm run build`. The default is `0.35`.

## Making changes

### Adding a status

Each status appears in a few places. To add one, update all of them:

1. `css/styles.css`: add a color token in the light and dark theme rules and in each color scheme, then add the `.dot-*`, `.country.*` and `.status-btn` rules.
2. `index.html`: add a count in the stats bar and a button in the chooser.
3. `js/map.js`: add the status to `STATUSES`, `LABEL` and the `col` color map used by image downloads.

### Adding a color scheme

1. `css/styles.css`: add light and dark rules for `data-scheme="your-id"`.
2. `js/appearance.js`: add the scheme to `SCHEMES` and its sea color to the preview list. For a holiday, also add its dates to `forDate`, add it to `HOLIDAYS` and give it a decoration in `DECOR`.

### Releasing an update

The service worker caches the site for offline use. After you change any file, raise `VERSION` in `sw.js` so installed copies download the update and offer a Reload button.

## Search engines

The page has a descriptive title and description, a canonical link, Open Graph and X (Twitter) tags with a preview image, and structured data that describes it as a free web app. `robots.txt` allows crawling and points to `sitemap.xml`. Update `lastmod` in the sitemap after a major change.

## Deployment

GitHub Pages serves the site from the repository's publishing branch. The `CNAME` file points it to the custom domain.

## Roadmap

1. **Import and backup:** Add an Import button that loads an exported JSON file, so visitors can restore their map after clearing their browser or switching devices. Remind visitors to back up after they mark 10 or more places.
2. **Real-device testing:** Confirm on real phones that downloads and sharing work in Safari, Chrome and the installed app, that Add to Home Screen works on iPhone and Android, and that the app opens offline. Check the Diwali dates from 2028 onward against a calendar.
3. **Self-hosted libraries:** Serve D3 and the TopoJSON reader from the site instead of jsDelivr, ideally with only the D3 parts the map uses, so the map draws even when the CDN is slow or blocked.
4. **Accessibility review:** Check color contrast in every scheme, especially holiday schemes in dark mode and the Vintage style. Add a "Skip to search" link so keyboard users do not have to tab through every country, and make sure counts and messages are announced by screen readers.
5. **Repository housekeeping:** Confirm GitHub Pages publishes from `prod`, redirect the old `world.alltripsconsidered.com` address, and update local checkouts to the renamed repository.
6. **Search and growth:** Add a "How it works" and FAQ section with FAQ structured data, a 404 page, shareable map links, links to My Maps from alltripsconsidered.com, and submit the sitemap in Google Search Console and Bing Webmaster Tools.

## License

© All Trips Considered. All rights reserved.
