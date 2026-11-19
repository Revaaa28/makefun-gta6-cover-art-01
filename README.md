# NEON COAST — Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Revaaa28/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Revaaa28/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your own photos and a caption into bold, multi-panel
GTA-style cover art — inked poster panels, a big gradient title block with a halftone
band, and PNG export in every size people actually post. Everything is original: no
Rockstar Games logos, artwork, characters or fonts. Your photos are read locally in
the browser and never uploaded anywhere.

## What it does

- **Poster Ink grade** — the default look: each photo is gradient-mapped, lifted,
  posterized into flat ink bands and finished with Sobel edge darkening, so panels
  read as illustrated poster art instead of tinted photos. Six more per-pixel grades
  beside it: Vice Sunset, Neon Nights, Golden Hour, Teal Heat, Noir Ink and
  Pastel Vice — plus film grain and a vignette.
- **Nine-panel cover grid** — the flagship Mosaic 9 layout under a strong halftone
  title block, plus five more layouts: Grid 6 (the classic cover), Hero + strip,
  Duo split, Full bleed + insets, and Tilted snapshots — all with white panel
  borders and black outlines.
- **Four sample photos** — a boulevard portrait, a pier shot, a rooftop at dusk and
  two friends under diner neon — cycled distinctly across the panels, so a cover
  never repeats one photo until the whole library has appeared.
- **Any photo, arranged your way** — load several photos (picker or drag-and-drop),
  spread one photo across every panel or give each panel its own, click a panel
  to select it, drag it on the live preview to reposition, and zoom per panel.
- **Original lettering** — a squeezed, gradient-filled title with a thick black
  outline, a neon script subtitle, a five-star heat meter and a round
  "NEON COAST · EST. 2026" badge. Title, subtitle and heat are all editable.
- **Export all sizes at once** — one click downloads PNGs at 1080×1080, 1080×1350,
  1080×1920 and 1920×1080 (or export a single size), with undo/redo while you work.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network:
the app is plain static files under `app/`.

## Hand it in (make.fun)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the
output folder and writes `dossier.json` with the vendored `vendor/makefun-app.ts`
library, byte-identical to the kit's copy.

## License

MIT — see `LICENSE`.
