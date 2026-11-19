# NEON COAST — Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Revaaa28/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Revaaa28/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns your own photos and a caption into bold, multi-panel
GTA-style cover art — Vice City sunset and neon colour grades, a big gradient title
block, and a one-click PNG export in the sizes people actually post. Everything is
original: no Rockstar Games logos, artwork, characters or fonts. Your photos are
read locally in the browser and never uploaded anywhere.

## What it does

- **Six panel layouts** — Grid 6 (the classic cover), Hero + strip, Mosaic 9,
  Duo split, Full bleed + insets, and Tilted snapshots — with white panel borders
  and black outlines.
- **Any photo, arranged your way** — load several photos (picker or drag-and-drop),
  spread one photo across every panel or give each panel its own, click a panel
  to select it, drag it on the live preview to reposition, and zoom per panel.
- **Six real colour grades**, applied per-pixel on canvas: Vice Sunset
  (gradient-map duotone), Neon Nights, Golden Hour, Teal Heat, Noir Ink
  (posterised ink look) and Pastel Vice — plus film grain, a vignette and a
  halftone title block.
- **Original lettering** — a squeezed, gradient-filled title with a thick black
  outline, a neon script subtitle, a five-star heat meter and a round
  "NEON COAST · EST. 2026" badge. Title, subtitle and heat are all editable.
- **Fast export** — one click renders and downloads a PNG at 1080×1080,
  1080×1350, 1080×1920 or 1920×1080, with undo/redo while you work.

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
