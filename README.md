# My Maps

An interactive world map for tracking the places you have been. Tap a country or search for it, then mark it with a status. The map colors each place to match.

Live site: https://mymaps.alltripsconsidered.com/

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

### Language and region

Dates, numbers and A to Z sorting follow the device's language and region settings. Holidays and seasons use the device's local date and time zone. The site shows no distances or other measurements, so there are no units to convert.

### App

- **Installable:** Install My Maps on phones, tablets and computers. It opens like an app and works offline.
- **Updates:** When a new version is ready, the app offers a Reload button.

## Privacy

Your selections and settings are saved only in your browser's local storage, and they stay in the browser. Nothing is uploaded or sent to a server, so clearing your browser data clears your map. The full policy is in [`docs/privacy.html`](docs/privacy.html), which the site links from its footer.

## Project structure

Everything the site serves lives in `docs/`, which GitHub Pages publishes. Development files stay at the repository root and are not published.

```
docs/index.html                         Page markup
docs/privacy.html                       Privacy page
docs/manifest.webmanifest               App name, colors and icons for installing
docs/sw.js                              Service worker for offline use
docs/css/styles.css                     Page styles, color schemes and map styles
docs/css/privacy.css                    Privacy page styles
docs/js/appearance.js                   Appearance panel, color schemes and holiday decorations
docs/js/map.js                          Map, statuses, search, export, download and share
docs/js/install.js                      Install banner, offline and update messages
docs/js/back-to-top.js                  Back to top button
docs/data/world.json                    Map shapes, built by scripts/build-map.mjs
docs/data/places.json                   Names, codes, flags and notes for each place
docs/assets/icon.png                    Site icon
docs/assets/icon-192.png                App icon, small
docs/assets/icon-512.png                App icon, large
docs/assets/icon-maskable-512.png       App icon for Android home screens
docs/assets/apple-touch-icon.png        App icon for iPhone and iPad
docs/assets/tabicon.png                 Alternate tab icon
docs/assets/og-image.png                Preview image for links shared on social media
docs/assets/fonts/                      Instrument Serif and its license (OFL.txt)
docs/vendor/                            D3, TopoJSON Client and gifenc
docs/vendor/licenses/                   Licenses for the vendored libraries
docs/robots.txt                         Search engine crawl rules
docs/sitemap.xml                        Page list for search engines
docs/CNAME                              Custom domain for GitHub Pages
README.md                               This file
scripts/build-map.mjs                   Builds docs/data/world.json and docs/data/places.json
scripts/rules.mjs                       Territory splits, tiny places and full names
scripts/source/disputed.json            Disputed and occupied area outlines
scripts/package.json                    Build tools for the map data
scripts/package-lock.json               Locked versions of the build tools
```

### Map data

The browser loads two ready-made files instead of fixing up raw map data on every visit:

- `docs/data/world.json` holds the shapes. Territories are split from their home country, tiny places are added as small circles, and disputed areas are cut out of the countries around them. Borders are simplified to about the detail the map can show, and small places keep every point so they never disappear.
- `docs/data/places.json` holds each place's name, two- and three-letter codes, flag and note.

Each place keeps the same key the site has always saved, such as `840` for the United States or `x-Crimea`, so visitors' maps carry over unchanged.

## Run locally

The site loads its map data with `fetch` and registers a service worker, and browsers allow neither from a page opened as a file. Serve `docs/` with any local web server instead. From the repository root, run:

```bash
python3 -m http.server 8000 --directory docs
```

Open http://localhost:8000.

## Making changes

### Updating the map data

To change a place, edit `scripts/rules.mjs` or `scripts/source/disputed.json`. Then rebuild from the `scripts` folder:

```bash
cd scripts
npm install
npm run build
```

The build writes `docs/data/world.json` and `docs/data/places.json`. Set `KEEP` to change how much border detail is kept, for example `KEEP=0.5 npm run build`. The default is `0.35`.

### Adding a status

Each status appears in a few places. To add one, update all of them:

1. `docs/css/styles.css`: add a color token in the light and dark theme rules and in each color scheme, then add the `.dot-*`, `.country.*` and `.status-btn` rules.
2. `docs/index.html`: add a count in the stats bar and a button in the chooser.
3. `docs/js/map.js`: add the status to `STATUSES`, `LABEL` and the `col` color map used by image downloads.

### Adding a color scheme

1. `docs/css/styles.css`: add light and dark rules for `data-scheme="your-id"`.
2. `docs/js/appearance.js`: add the scheme to `SCHEMES` and its sea color to the preview list. For a holiday, also add its dates to `forDate`, add it to `HOLIDAYS` and give it a decoration in `DECOR`.

### Updating a library

Replace the file in `docs/vendor/` with one whose name carries the new version. Update the `<script>` tag or import, and replace the old file name in `SHELL_FILES` in `docs/sw.js`. Update its license in `docs/vendor/licenses/` if it changed.

### Search engines

The page has a descriptive title and description, a canonical link, Open Graph and X (Twitter) tags with a preview image, and structured data that describes it as a free web app. `docs/robots.txt` allows crawling and points to `docs/sitemap.xml`. Update `lastmod` in the sitemap after a major change.

### Privacy policy

Update `docs/privacy.html` before adding anything that collects information, such as analytics.

### Releasing an update

The service worker caches the site for offline use. When any cached file changes, raise `VERSION` in `docs/sw.js`. This changes the cache name (`my-maps-shell-` plus the version), so installed copies download the update and offer a Reload button. When you add a file that should work offline, add it to `SHELL_FILES` in the same file.

## Security

The site follows the hardening in `atc-web-template`:

- **Content Security Policy:** A `<meta>` policy in `docs/index.html` and `docs/privacy.html` lets scripts, styles, fonts, data and the offline worker load only from this site. There is no inline code and no `eval`. Keep the policy the same in both pages. If a feature needs another source or an HTML sink, add it to both pages' policies and to the Cloudflare header below.
- **Trusted Types:** The browser blocks `innerHTML` and similar HTML sinks. Build interface with `textContent`, `createElement` and `replaceChildren`. The only allowed policy, `my-maps-sw`, approves the offline worker's address (`sw.js`) and nothing else.
- **No third-party requests:** The font, libraries and map data are all served from the site itself. The page makes no requests to other services. Share buttons only open the chosen service's link.
- **Checked input:** Saved data that cannot be read as a map is ignored, and saved settings are checked against the known values before use.
- **Offline cache:** The service worker saves only successful, same-site responses, each under its own address.

### Headers to set in Cloudflare

GitHub Pages cannot send custom headers, and a `<meta>` policy cannot set `frame-ancestors`. So the headers are set with a Cloudflare Transform Rule. With the DNS record proxied (orange cloud), add them under **Rules > Transform Rules > Modify Response Header** for `mymaps.alltripsconsidered.com`:

- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types my-maps-sw; upgrade-insecure-requests`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`

Add `preload` to the HSTS header only when every subdomain of alltripsconsidered.com serves HTTPS, and only then submit the domain to hstspreload.org.

## Deployment

GitHub Pages publishes the `/docs` folder of the `prod` branch (**Settings > Pages > Deploy from a branch**). The `docs/CNAME` file sets the custom domain, `mymaps.alltripsconsidered.com`, and Cloudflare provides DNS. `prod` is the default branch. Changes reach it only through an approved pull request, and the site updates a few minutes after a merge. To help search engines find the site, submit `https://mymaps.alltripsconsidered.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Roadmap

- [ ] **Import and backup:** Add an Import button that loads an exported JSON file, so visitors can restore their map after clearing their browser or switching devices. Remind visitors to back up after they mark 10 or more places.
- [ ] **Smaller D3:** D3 is served from the site, but in full. Bundling only the parts the map uses would cut about 200 KB.
- [ ] **Accessibility review:** Check color contrast in every scheme, especially holiday schemes in dark mode and the Vintage style. Add a "Skip to search" link so keyboard users do not have to tab through every country, and make sure counts and messages are announced by screen readers.
- [ ] **Repository housekeeping:** Redirect the old `world.alltripsconsidered.com` address, and update local checkouts to the renamed repository.
- [ ] **Diwali dates:** Check the Diwali dates from 2028 onward against a calendar.
- [ ] **Search and growth:** Add a "How it works" and FAQ section with FAQ structured data, a 404 page, shareable map links and links to My Maps from alltripsconsidered.com. Submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Credits and licenses

- **Font:** [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) for the title, in `docs/assets/fonts/`, under the SIL Open Font License (`docs/assets/fonts/OFL.txt`).
- **Libraries:** These are served from `docs/vendor/`, with their licenses in `docs/vendor/licenses/`:
  - [D3](https://d3js.org) 7.9.0 for the map projection and zoom.
  - [TopoJSON Client](https://github.com/topojson/topojson-client) 3.1.0 for reading the map shapes.
  - [gifenc](https://github.com/mattdesl/gifenc) 1.0.3 for GIF downloads, loaded only when a GIF is requested.
- **Map data:** Country borders come from [World Atlas](https://github.com/topojson/world-atlas) 2.0.2, and disputed area outlines come from [Natural Earth](https://www.naturalearthdata.com). Both are in the public domain.

© 2026 All Trips Considered. All rights reserved.
