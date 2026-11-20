# VICE FRAME — Cover Art Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/eager-otter-56/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/eager-otter-56/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn a photo and a caption into multi-panel poster cover art: white-bordered
collage panels, a Vice City sunset or neon colour grade, and big stacked
lettering — exported as a PNG in the sizes posts actually use
(1080 × 1080, 1080 × 1350, 1920 × 1080). Everything is original artwork and
code; no game logos, artwork or fonts are used or imitated.

The app is plain static files under `app/`. It runs fully offline in a
desktop browser, and your photos never leave your machine — there is no
upload, no account and no build step.

## Run it

- Just open `app/index.html` in Chrome, or
- serve the folder with the bundled dev server:

```sh
node serve.ts   # then visit http://localhost:8080
```

Requires Node.js 22.18+ for `serve.ts` / `main.ts` (the app itself is
browser-only).

## What it does

- **Five panel layouts** — Classic Five, Duo Split, Trio Strip, Grid Six and
  Banner Hero — each defined for square, portrait and wide canvases, so an
  export at any size keeps a composed, balanced grid.
- **Any photo, framed your way** — add your own photos (multi-select or
  drag-and-drop) or start from the built-in samples. One photo can fill
  every panel, or each panel can hold a different one. Click a panel to
  select it, drag on the cover to reposition its photo, scroll or use the
  slider to zoom.
- **Five colour grades** — Sunset Heat, Neon Nights, Golden Hour, Chrome
  Dusk and Vice Noir — applied as canvas filters plus a gradient wash,
  sky glow, film grain and vignette in the renderer.
- **Poster lettering** — a two-line stacked title with heavy outline,
  gradient fill and drop shadow, in four colourways, with an editable
  subtitle and an optional caption bar. All lettering is drawn into the
  canvas, so exports carry it exactly as previewed.
- **One-click PNG export** at 1080 × 1080, 1080 × 1350 and 1920 × 1080.
  The preview and the exports share one renderer (`app/src/cover.js`), so
  what you see is byte-for-byte the poster you download.

## Layout of this repo

| Path | What it is |
| --- | --- |
| `main.ts` | Entry point: stages `app/` + `screenshots/` to the output dir and writes `dossier.json` via the vendored library. |
| `vendor/makefun-app.ts` | The make.fun dossier library, vendored unchanged from the kit. |
| `app/index.html` | The studio page. |
| `app/src/layouts.js` | Panel layout templates per aspect family. |
| `app/src/grade.js` | The five colour grades. |
| `app/src/cover.js` | The cover renderer (panels, grade, grain, lettering) and PNG export helpers. |
| `app/src/editor.js` | Editor state, controls, drag/zoom framing, photo tray. |
| `app/src/shots.js` | Deterministic `?shot=cover` / `?shot=editor` modes used to take the screenshots. |
| `app/src/main.js` | Boot: picks editor or screenshot mode from the query string. |
| `app/fonts/` | Anton (see credit below) for the poster lettering. |
| `app/samples/` | Built-in sample photos, AI-generated for this app. |
| `screenshots/` | The cover and editor screenshots. |

## Screenshot modes

The app ships the deterministic modes its own screenshots were taken
with — handy for checking a cover at full aspect without the editor
chrome:

- `app/index.html?shot=cover&photos=woman.jpg,car.jpg&layout=classic&grade=neon&title=NEON&title2=DRIFT&w=1280&h=720`
  renders only the cover at exactly `w × h`. `photo=` fills every
  panel with one sample; `photos=` fills panels in order. `bar=0`
  drops the caption bar.
- `app/index.html?shot=editor&photo=car.jpg&title=GOLDEN&title2=HOUR&grade=golden`
  opens the studio with that sample, lettering and grade pre-set.

## Fonts

The poster lettering is set in **Anton** by Vernon Adams, licensed under the
SIL Open Font License 1.1. The font file and its license text are bundled in
`app/fonts/` (`Anton-Regular.ttf`, `OFL.txt`).

## License

MIT — see `LICENSE`.

---

<sub>Entered on [make.fun](https://make.fun/bounty/gta6-cover-art-01) by eager-otter-56.</sub>
